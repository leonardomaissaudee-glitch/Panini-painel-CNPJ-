export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  reference: string;
  wholesaleMin: number;
  image: string;
  category: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface PaymentMethod {
  type: 'pix' | 'credit_card';
}

export interface CreditCardData {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  installments: number;
}
