# Chat ao vivo - configuração e validação

## Onde está no projeto

- Cliente logado: `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\src\features\client\pages\ClientSupportPage.tsx`
- Atendimento público: `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\src\pages\Atendimento.tsx`
- Central admin/seller: `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\src\features\admin\components\ChatsPanel.tsx`
- Serviço realtime/upload: `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\src\features\chat\services\chatService.ts`
- Hooks realtime: `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\src\features\chat\hooks\useChatConversationList.ts`, `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\src\features\chat\hooks\useChatThread.ts`, `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\src\features\chat\hooks\useChatPresence.ts`

## SQL do Supabase

Execute este arquivo no SQL Editor do projeto Supabase:

- `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\supabase\sql\chat_system.sql`

Também deixei a migration equivalente em:

- `C:\Users\NovoPC\Documents\panini - 28-03\panini-28-03\panini-painel\Panini-painel-CNPJ-\supabase\migrations\20260329113000_create_chat_system.sql`

Esse SQL cria:

- `public.chat_conversations`
- `public.chat_participants`
- `public.chat_messages`
- `public.chat_presence`
- RPCs:
  - `chat_start_or_reuse_conversation`
  - `chat_mark_conversation_read`
  - `chat_update_conversation_status`
  - `chat_assign_conversation`
- bucket `chat-attachments`
- policies RLS e policies do Storage
- publication do Realtime

## Configuração manual no Supabase

### 1. Habilitar login anônimo

No painel do Supabase:

- `Authentication`
- `Providers`
- habilite `Anonymous Sign-Ins`

Sem isso, o atendimento público não consegue iniciar conversa para visitante.

### 2. Verificar Storage

Depois de rodar o SQL, confirme que existe o bucket:

- `chat-attachments`

Ele deve estar privado. Os arquivos são entregues por signed URL.

### 3. Realtime

O SQL já adiciona as tabelas na publication `supabase_realtime`.

Se quiser validar no banco:

```sql
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename like 'chat_%';
```

## Configuração na Netlify

Não há novas variáveis obrigatórias além das já usadas pelo projeto:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Depois de atualizar o código:

1. faça deploy/redeploy na Netlify
2. force refresh no navegador

## Como testar localmente

```bash
npm run type-check
npm run build
npm run dev
```

### Fluxo cliente logado

1. faça login como cliente
2. abra `Falar com gerente`
3. se não houver conversa aberta, preencha o formulário inicial
4. envie texto, imagem, PDF e áudio
5. atualize a página e confirme que a conversa continua disponível

### Fluxo visitante

1. abra `/atendimento`
2. preencha nome, telefone, motivo e mensagem inicial
3. confirme criação da conversa
4. valide que a sessão anônima permanece ativa no navegador

### Fluxo admin

1. faça login em `/loginadmin`
2. abra a aba `Chats`
3. confirme que novas conversas aparecem
4. clique em uma conversa e responda
5. altere status para `Em atendimento` ou `Finalizado`

## Como validar realtime

### Cliente -> Admin

1. abra o chat do cliente em um navegador
2. abra a central de chats do admin em outro
3. envie mensagem no cliente
4. a conversa deve subir no topo da lista do admin sem reload
5. o contador de não lidas do admin deve aumentar

### Admin -> Cliente

1. responda pelo painel admin
2. a mensagem deve aparecer no cliente sem recarregar
3. o status da conversa deve refletir a atualização

## Como validar online/offline

1. abra cliente e admin em paralelo
2. confira o selo `Online` no cabeçalho do chat
3. feche uma aba ou perca foco por alguns segundos
4. valide `offline / last seen`

## Como validar anexos

### Imagem

- enviar no chat
- validar preview no composer
- validar miniatura na conversa

### PDF / arquivo

- enviar no chat
- validar link para abrir/baixar

### Áudio

- gravar via botão de áudio
- finalizar
- validar preview antes do envio
- validar player no histórico

## Como validar segurança

### Cliente

- deve ver apenas conversas cujo `customer_user_id = auth.uid()`

### Admin/Seller

- deve ver todas as conversas autorizadas via `profiles.role in ('admin', 'seller')`

### Storage

- bucket privado
- acesso por signed URL
- select/insert/update/delete protegidos por policy

## Observações de operação

- O atendimento reutiliza a conversa aberta do mesmo cliente se existir uma `pending` ou `active`.
- Conversa fechada pode ser reaberta.
- Mensagens ficam persistidas no banco.
- Presença é atualizada via `chat_presence` + canal Realtime.
