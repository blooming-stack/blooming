# Blooming — GitHub Pages

Pacote preparado para hospedar o Blooming no GitHub Pages.

## Estrutura

- `index.html` — aplicativo Blooming
- `404.html` — fallback para rotas do aplicativo
- `.nojekyll` — desativa processamento Jekyll
- `robots.txt` — solicita que robôs não rastreiem/indexem o site

## Publicação

1. Crie um repositório no GitHub.
2. Envie os arquivos desta pasta para a raiz do repositório.
3. No GitHub, abra **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha a branch `main` e a pasta `/ (root)`.
6. Salve e aguarde a publicação.

O site ficará em uma URL parecida com:
`https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

## Não listado

O pacote inclui `noindex` e `robots.txt` para evitar indexação por mecanismos de busca.
Isso não é autenticação: qualquer pessoa que possuir o link poderá acessar.

## Supabase

O Blooming continua usando o Supabase configurado no próprio aplicativo. GitHub Pages hospeda os arquivos; os dados compartilhados continuam no Supabase.
