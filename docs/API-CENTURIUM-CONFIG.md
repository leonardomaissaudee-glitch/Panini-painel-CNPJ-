# Configuração API CenturionPay

## 📋 Status da Integração

### ✅ O que está funcionando:
- **Backend server.js** configurado com endpoints:
  - `POST /api/checkout/pix` - Gerar pagamento PIX
  - `GET /api/checkout/pix/:transactionId/status` - Verificar status PIX
  - `POST /api/checkout/credit-card` - Processar cartão de crédito
- **Frontend** conectado ao backend via `centuriumService`
- **Logs detalhados** para debug
- **Tratamento de erros** melhorado

### ⚠️ Pontos de Atenção:

#### 1. URL da API ✅
A URL está configurada corretamente como:
```
https://api.centurionpay.com.br/functions/v1
```

✅ **URL CONFIRMADA** de acordo com a documentação oficial da CenturionPay.

**Para ambiente de testes (sandbox)**:
```env
CENTURION_API_URL=https://sandbox.centurionpay.com.br/functions/v1
```

Para alterar entre produção e sandbox, edite no arquivo `.env`:
```env
CENTURION_API_URL=https://api.centurionpay.com.br/functions/v1
```

#### 2. Credenciais Necessárias
No arquivo `.env`, verifique se estão configuradas:
```env
VITE_CENTURION_API_KEY=sk_live_...
VITE_CENTURION_MERCHANT_ID=...
```

**Como obter:**
- Acesse seu painel CenturionPay
- Entre em "Configurações" ou "API"
- Copie as credenciais de produção ou sandbox

#### 3. Formato do Payload
O servidor envia dados no formato:
```json
{
  "amount": 10000,  // em centavos
  "currency": "BRL",
  "paymentMethod": "pix" ou "credit_card",
  "customer": {
    "name": "Nome do Cliente",
    "email": "email@exemplo.com",
    "phoneNumber": "11999999999",
    "document": {
      "number": "12345678900",
      "type": "CPF"
    },
    "address": { ... }
  },
  "card": { ... },  // apenas para cartão
  "items": [ ... ]
}
```

⚠️ **Este formato pode precisar de ajustes** de acordo com a documentação oficial da CenturionPay.

## 🔧 Como Testar

### 1. Verificar se o servidor está rodando:
```bash
# O servidor já inicia automaticamente
# Veja os logs para confirmar
```

Você verá:
```
🚀 Server running on http://localhost:3001
✅ CenturionPay API Key configured: Yes (sk_live_...)
✅ Merchant ID configured: Yes (8c9fa2f0...)
🌐 API URL: https://api.centurionpay.com.br/v1
```

### 2. Testar PIX localmente:
```bash
curl -X POST http://localhost:3001/api/checkout/pix \
  -H "Content-Type: application/json" \
  -d '{
    "total": 100.00,
    "customer": {
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "phone": "11999999999",
      "cpf": "12345678900",
      "address": {
        "street": "Rua Teste",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "cep": "01000000"
      }
    },
    "items": [{"id": "1", "name": "Produto Teste", "price": 100, "quantity": 1}]
  }'
```

### 3. Verificar resposta da API:
Os logs do servidor mostrarão:
- **Payload enviado** para a CenturionPay
- **Resposta recebida** da API
- **Erros** (se houver)

## 🚨 Possíveis Erros e Soluções

### Erro: 401 Unauthorized
**Causa:** Credenciais inválidas
**Solução:**
- Verifique se `VITE_CENTURION_API_KEY` e `VITE_CENTURION_MERCHANT_ID` estão corretos
- Confirme se está usando credenciais de produção (não sandbox)

### Erro: 404 Not Found
**Causa:** URL da API incorreta
**Solução:**
- Verifique a URL correta na documentação da CenturionPay
- Altere `CENTURION_API_URL` no `.env`

### Erro: 400 Bad Request
**Causa:** Formato do payload incorreto
**Solução:**
- Verifique os logs do servidor para ver o payload enviado
- Compare com a documentação oficial da API
- Ajuste o formato em `server.js` se necessário

### Erro: PIX não foi gerado
**Causa:** API não retornou dados de PIX
**Solução:**
- Verifique se a resposta da API tem o campo `pix.qrcode`
- Pode ser necessário ajustar o mapeamento da resposta

### Erro: CORS
**Causa:** Requisição bloqueada pelo navegador
**Solução:**
- O servidor já está configurado com CORS habilitado
- Se persistir, verifique configuração do Vite

## 📞 Suporte CenturionPay

Se os erros persistirem, entre em contato:
- **Email:** sac@centurionpay.com.br
- **WhatsApp:** (64) 99310-3295
- **Site:** https://centurionpay.com.br/contato/

Pergunte sobre:
1. URL correta da API para produção
2. Formato do payload para PIX e Cartão
3. Campos obrigatórios/opcionais
4. Documentação técnica da API

## 🔍 Debug

Para ver logs detalhados:
1. Abra o terminal do servidor
2. Faça uma compra de teste
3. Verifique:
   - Payload enviado
   - Resposta da API
   - Erros retornados

Exemplo de log:
```
Enviando para CenturionPay: { ... }
Resposta CenturionPay: { ... }
PIX gerado com sucesso! Transaction ID: abc123
```

## 📝 Próximos Passos

1. ✅ Servidor configurado com endpoints PIX e Cartão
2. ⏳ **Testar com credenciais reais**
3. ⏳ **Validar formato do payload** com a documentação
4. ⏳ **Ajustar URL da API** se necessário
5. ⏳ **Implementar webhook** para confirmação automática de pagamentos
