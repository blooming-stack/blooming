import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase server configuration is incomplete.');
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function randomCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

function normalizeName(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function validChannel(value: unknown) {
  return value === 'email' || value === 'sms' || value === 'whatsapp';
}

async function sendCode(channel: string, destination: string, code: string) {
  // Provider adapters are intentionally explicit. This function never returns
  // the recovery code to the browser and never pretends delivery succeeded.
  if (channel === 'email') {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('RECOVERY_FROM_EMAIL');
    if (!apiKey || !from) return { ok: false, reason: 'email_provider_not_configured' };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [destination],
        subject: 'Seu código de recuperação do Blooming',
        text: `Seu código temporário do Blooming é ${code}. Ele expira em 10 minutos. Se você não solicitou isso, ignore esta mensagem.`,
      }),
    });

    if (!response.ok) return { ok: false, reason: 'email_provider_error' };
    return { ok: true };
  }

  return { ok: false, reason: `${channel}_provider_not_configured` };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  try {
    const body = await request.json();
    const action = String(body?.action ?? '');

    if (action === 'start') {
      const name = normalizeName(body?.name);
      const channel = body?.channel;
      if (!name || !validChannel(channel)) {
        return json(400, { ok: false, error: 'invalid_request' });
      }

      const access = await db
        .from('blooming_access')
        .select('id,display_name,recovery_email,recovery_phone,recovery_enabled')
        .eq('name_key', name)
        .maybeSingle();

      // Keep account existence private.
      if (access.error || !access.data || !access.data.recovery_enabled) {
        return json(200, { ok: true, message: 'Se os dados forem válidos, enviaremos um código.' });
      }

      const destination = channel === 'email'
        ? access.data.recovery_email
        : access.data.recovery_phone;

      if (!destination) {
        return json(200, { ok: true, message: 'Se os dados forem válidos, enviaremos um código.' });
      }

      const since = new Date(Date.now() - 60_000).toISOString();
      const recent = await db
        .from('blooming_recovery_codes')
        .select('id')
        .eq('access_id', access.data.id)
        .gte('created_at', since)
        .is('used_at', null)
        .limit(1);

      if (recent.data?.length) {
        return json(429, { ok: false, error: 'recovery_cooldown' });
      }

      const code = randomCode();
      const codeHash = await sha256(code);
      const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

      const inserted = await db.from('blooming_recovery_codes').insert({
        access_id: access.data.id,
        code_hash: codeHash,
        channel,
        expires_at: expiresAt,
      });

      if (inserted.error) return json(500, { ok: false, error: 'recovery_storage_error' });

      const sent = await sendCode(channel, destination, code);
      if (!sent.ok) {
        await db
          .from('blooming_recovery_codes')
          .delete()
          .eq('access_id', access.data.id)
          .eq('code_hash', codeHash);
        return json(503, { ok: false, error: sent.reason });
      }

      return json(200, { ok: true, message: 'Código enviado. Ele expira em 10 minutos.' });
    }

    if (action === 'reset') {
      const name = normalizeName(body?.name);
      const code = String(body?.code ?? '').trim();
      const newCode = String(body?.newCode ?? '');
      if (!name || !/^\d{6}$/.test(code) || newCode.length < 4 || newCode.length > 32) {
        return json(400, { ok: false, error: 'invalid_request' });
      }

      const access = await db
        .from('blooming_access')
        .select('id')
        .eq('name_key', name)
        .maybeSingle();

      if (access.error || !access.data) return json(400, { ok: false, error: 'invalid_recovery' });

      const suppliedHash = await sha256(code);
      const recovery = await db
        .from('blooming_recovery_codes')
        .select('id,code_hash,expires_at')
        .eq('access_id', access.data.id)
        .eq('code_hash', suppliedHash)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recovery.error || !recovery.data) {
        return json(400, { ok: false, error: 'invalid_or_expired_code' });
      }

      const newHash = await sha256(newCode);
      const updated = await db
        .from('blooming_access')
        .update({ code_hash: newHash })
        .eq('id', access.data.id);

      if (updated.error) return json(500, { ok: false, error: 'reset_failed' });

      await db
        .from('blooming_recovery_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('access_id', access.data.id)
        .is('used_at', null);

      return json(200, { ok: true, message: 'Código de acesso alterado com sucesso.' });
    }

    return json(400, { ok: false, error: 'unknown_action' });
  } catch {
    return json(500, { ok: false, error: 'server_error' });
  }
});
