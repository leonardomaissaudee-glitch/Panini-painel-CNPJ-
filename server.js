import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Carrega variáveis de ambiente do .env
import { config } from 'dotenv';
config();

// Configurações da CenturionPay (somente backend, sem prefixo VITE_)
const CENTURION_API_KEY = process.env.CENTURION_API_KEY || '';
const CENTURION_MERCHANT_ID = process.env.CENTURION_MERCHANT_ID || '';
// URL da API - CORRIGIDA de acordo com a documentação oficial
const CENTURION_API_URL = process.env.CENTURION_API_URL || 'https://api.centurionpay.com.br/functions/v1';

// Criar autenticação Basic Auth
const getAuthHeader = () => {
  const credentials = `${CENTURION_API_KEY}:${CENTURION_MERCHANT_ID}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

// Endpoint para criar transação PIX
app.post('/api/checkout/pix', async (req, res) => {
  try {
    const { items, customer, total } = req.body;

    const payload = {
      amount: Math.round(total * 100), // Valor em centavos
      currency: 'BRL',
      paymentMethod: 'pix',
      customer: {
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phone.replace(/\D/g, ''),
        document: {
          number: customer.cpf.replace(/\D/g, ''),
          type: 'CPF'
        },
        address: {
          street: customer.address.street,
          streetNumber: customer.address.number,
          complement: customer.address.complement || '',
          zipCode: customer.address.cep.replace(/\D/g, ''),
          neighborhood: customer.address.neighborhood,
          city: customer.address.city,
          state: customer.address.state,
          country: 'BR'
        },
      },
      items: [
        {
          id: '1',
          title: 'Kit de Iniciante',
          unitPrice: Math.round(total * 100),
          quantity: 1,
          tangible: true
        }
      ],
      capture: true,
      async: false,
    };

    console.log('Enviando para CenturionPay:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${CENTURION_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Resposta CenturionPay:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ Erro na API CenturionPay:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });

      return res.status(response.status).json({
        error: true,
        message: data.message || data.error?.message || 'Erro ao processar pagamento',
        details: data,
        apiStatus: response.status,
      });
    }

    // Adaptar resposta para o formato esperado pelo frontend
    const pixData = data.pix;

    if (!pixData || !pixData.qrcode) {
      console.error('PIX não foi gerado. Resposta completa:', JSON.stringify(data, null, 2));
      return res.status(400).json({
        error: true,
        message: data.refusedReason?.description || 'PIX não foi gerado pela API. Verifique os dados enviados.',
        details: data,
      });
    }

    // Gerar imagem QR Code a partir do código PIX
    let qrCodeImage = '';
    try {
      qrCodeImage = await QRCode.toDataURL(pixData.qrcode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (qrError) {
      console.error('Erro ao gerar QR Code:', qrError);
      qrCodeImage = ''; // Continua sem a imagem se der erro
    }

    const pixResponse = {
      transaction_id: data.id,
      qr_code: qrCodeImage, // Imagem base64 do QR Code
      pix_code: pixData.qrcode, // Código copia e cola
      amount: total,
      expires_at: pixData.expirationDate || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    console.log('PIX gerado com sucesso! Transaction ID:', data.id);
    res.json(pixResponse);
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({
      error: true,
      message: 'Erro interno ao processar pagamento',
      details: error.message,
    });
  }
});

// Endpoint para verificar status do pagamento
app.get('/api/checkout/pix/:transactionId/status', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const response = await fetch(`${CENTURION_API_URL}/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: true,
        message: 'Erro ao verificar status',
        details: data,
      });
    }

    // Mapear status
    const statusMap = {
      'pending': 'pending',
      'processing': 'pending',
      'paid': 'paid',
      'approved': 'paid',
      'expired': 'expired',
      'cancelled': 'cancelled',
      'failed': 'cancelled',
    };

    res.json({
      status: statusMap[data.status] || 'pending',
      paid_at: data.paid_at,
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      error: true,
      message: 'Erro ao verificar status',
      details: error.message,
    });
  }
});

// Endpoint para criar transação com Cartão de Crédito
app.post('/api/checkout/credit-card', async (req, res) => {
  try {
    const { items, customer, card, total, installments = 1 } = req.body;

    // Validar dados do cartão
    if (!card || !card.number || !card.holder_name || !card.cvv || !card.expiry_month || !card.expiry_year) {
      return res.status(400).json({
        error: true,
        message: 'Dados do cartão incompletos',
      });
    }

    const payload = {
      amount: Math.round(total * 100), // Valor em centavos
      currency: 'BRL',
      paymentMethod: 'credit_card',
      card: {
        number: card.number.replace(/\s/g, ''),
        holderName: card.holder_name,
        expiryMonth: card.expiry_month,
        expiryYear: card.expiry_year,
        cvv: card.cvv,
      },
      customer: {
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phone.replace(/\D/g, ''),
        document: {
          number: customer.cpf.replace(/\D/g, ''),
          type: 'CPF'
        },
        address: {
          street: customer.address.street,
          streetNumber: customer.address.number,
          complement: customer.address.complement || '',
          zipCode: customer.address.cep.replace(/\D/g, ''),
          neighborhood: customer.address.neighborhood,
          city: customer.address.city,
          state: customer.address.state,
          country: 'BR'
        },
      },
      installments: installments,
      items: [
        {
          id: '1',
          title: items[0]?.name || 'Produto',
          unitPrice: Math.round(total * 100),
          quantity: 1,
          tangible: true
        }
      ],
      capture: true,
      async: false,
    };

    console.log('Enviando para CenturionPay (Cartão):', JSON.stringify(payload, null, 2));

    const response = await fetch(`${CENTURION_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Resposta CenturionPay (Cartão):', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({
        error: true,
        message: data.message || 'Erro ao processar pagamento',
        details: data,
      });
    }

    // Mapear status da resposta
    const statusMap = {
      'approved': 'approved',
      'pending': 'pending',
      'declined': 'declined',
      'failed': 'declined',
      'processing': 'pending',
    };

    const cardResponse = {
      transaction_id: data.id,
      status: statusMap[data.status] || 'pending',
      amount: total,
      installments: installments,
      authorization_code: data.authorizationCode,
      message: data.refusedReason?.description || data.message,
    };

    console.log('Cartão processado! Transaction ID:', data.id, 'Status:', cardResponse.status);
    res.json(cardResponse);
  } catch (error) {
    console.error('Erro ao processar pagamento com cartão:', error);
    res.status(500).json({
      error: true,
      message: 'Erro interno ao processar pagamento',
      details: error.message,
    });
  }
});

// Servir o frontend em PRODUÇÃO (build do Vite em /dist)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST_DIR));

  // SPA fallback (não intercepta rotas /api e /health)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    return res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ CenturionPay API Key configured: ${CENTURION_API_KEY ? 'Yes (' + CENTURION_API_KEY.substring(0, 10) + '...)' : '❌ No'}`);
  console.log(`✅ Merchant ID configured: ${CENTURION_MERCHANT_ID ? 'Yes (' + CENTURION_MERCHANT_ID.substring(0, 8) + '...)' : '❌ No'}`);
  console.log(`🌐 API URL: ${CENTURION_API_URL}`);

  // Aviso se credenciais não configuradas
  if (!CENTURION_API_KEY || !CENTURION_MERCHANT_ID) {
    console.warn('\n⚠️  ATENÇÃO: Credenciais da CenturionPay não configuradas!');
    console.warn('Configure CENTURION_API_KEY e CENTURION_MERCHANT_ID no arquivo .env\n');
  }
});
