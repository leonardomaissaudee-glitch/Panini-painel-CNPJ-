# Monitoramento de acessos

## Supabase

Execute o SQL:

- `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\supabase\sql\access_monitoring.sql`

## Netlify

Cadastre as variáveis:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Função

- Endpoint: `/.netlify/functions/track-access`
- Arquivo: `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\netlify\functions\track-access.mjs`

## Teste local

1. Execute o SQL no Supabase.
2. Configure as envs.
3. Rode `netlify dev` para testar function + SPA no mesmo host.
4. Navegue pelo site e depois abra o admin > Monitoramento.

## Teste em produção

1. Faça deploy na Netlify.
2. Acesse páginas públicas e áreas protegidas.
3. Abra `Admin > Monitoramento`.
4. Verifique cards, gráficos, online now e tabela de logs.

## Online now

- Cada navegador recebe um `session_id` persistido em `localStorage`.
- O front envia `pageview` ao trocar de rota.
- O front envia `heartbeat` a cada 60 segundos enquanto a aba estiver visível.
- O dashboard considera online quem teve `last_seen` nos últimos 2 minutos.
