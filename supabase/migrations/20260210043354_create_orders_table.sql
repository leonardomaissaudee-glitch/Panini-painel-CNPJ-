-- Tabela de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados do Cliente
  cliente_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,

  -- Endereço de Entrega
  shipping_street TEXT NOT NULL,
  shipping_number TEXT NOT NULL,
  shipping_complement TEXT,
  shipping_neighborhood TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,

  -- Dados do Pedido
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Dados do Pagamento
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'boleto')),
  payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'paid', 'refused', 'failed', 'expired')),

  -- Dados de Frete
  shipping_method TEXT NOT NULL DEFAULT 'free' CHECK (shipping_method IN ('free', 'sedex')),

  -- Fluxo Comercial
  status TEXT NOT NULL DEFAULT 'novo_pedido',
  invoice_number TEXT,
  tracking_code TEXT,
  seller_id UUID,
  account_manager_name TEXT,
  account_manager_whatsapp TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Índices para consultas rápidas
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Comentários
COMMENT ON TABLE orders IS 'Tabela de pedidos da loja';
COMMENT ON COLUMN orders.items IS 'Array JSON com os produtos do pedido';
COMMENT ON COLUMN orders.payment_id IS 'ID da transação na Centurium';
