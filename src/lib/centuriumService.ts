// Serviço de Pagamento - Centurium via Backend

interface CreatePixPaymentData {
  amount: number;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
    address: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      cep: string;
    };
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface PixPaymentResponse {
  transaction_id: string;
  qr_code: string;
  pix_code: string;
  amount: number;
  expires_at: string;
}

interface CreateCreditCardPaymentData {
  amount: number;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
    address: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      cep: string;
    };
  };
  card: {
    number: string;
    holder_name: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
  };
  installments?: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface CreditCardPaymentResponse {
  transaction_id: string;
  status: 'approved' | 'pending' | 'declined';
  amount: number;
  installments: number;
  authorization_code?: string;
  message?: string;
}

class CenturiumService {
  private backendUrl: string;

  constructor() {
    // Usa a URL do backend configurada ou localhost
    this.backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Cria um pagamento PIX via backend
   */
  async createPixPayment(data: CreatePixPaymentData): Promise<PixPaymentResponse> {
    const response = await fetch(`${this.backendUrl}/api/checkout/pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: data.items,
        customer: data.customer,
        total: data.amount,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao processar pagamento' }));
      throw new Error(error.message || 'Erro ao gerar PIX');
    }

    return response.json();
  }

  /**
   * Consulta o status de um pagamento PIX
   */
  async getPixPaymentStatus(transactionId: string): Promise<{ status: string; paid_at?: string }> {
    const response = await fetch(`${this.backendUrl}/api/checkout/pix/${transactionId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar status do pagamento');
    }

    return response.json();
  }

  /**
   * Cria um pagamento com cartão de crédito via backend
   */
  async createCreditCardPayment(data: CreateCreditCardPaymentData): Promise<CreditCardPaymentResponse> {
    const response = await fetch(`${this.backendUrl}/api/checkout/credit-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: data.items,
        customer: data.customer,
        card: data.card,
        total: data.amount,
        installments: data.installments || 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao processar pagamento' }));
      throw new Error(error.message || 'Erro ao processar pagamento com cartão');
    }

    return response.json();
  }
}

// Exporta instância única
export const centuriumService = new CenturiumService();

// Exporta tipos
export type {
  CreatePixPaymentData,
  PixPaymentResponse,
  CreateCreditCardPaymentData,
  CreditCardPaymentResponse,
};
