import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Minus, Plus, Shield, ShoppingBag, ShoppingCart, Trash2, Truck } from 'lucide-react';

type DiscountTier = {
  name: 'Classic' | 'Standard' | 'Premium';
  percentage: number;
};

type PaymentMethod = 'PIX' | 'Boleto';

const MIN_ORDER_TOTAL = 800;
const WHATSAPP_PHONE = '5528992771327';

// CART DISCOUNT TIERS
const getDiscountTier = (subtotal: number): DiscountTier | null => {
  if (subtotal >= 5000) return { name: 'Premium', percentage: 20 };
  if (subtotal >= 2000) return { name: 'Standard', percentage: 12 };
  if (subtotal >= 800) return { name: 'Classic', percentage: 5 };
  return null;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const getDiscountDetails = (subtotal: number) => {
  const tier = getDiscountTier(subtotal);
  const discountValue = tier ? roundMoney(subtotal * (tier.percentage / 100)) : 0;
  const totalAfterTier = roundMoney(subtotal - discountValue);

  return { tier, discountValue, totalAfterTier };
};

export default function Cart() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');

  const formatPrice = (price: number) =>
    price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const subtotal = roundMoney(cart.total);
  const { tier: discountTier, discountValue, totalAfterTier } = getDiscountDetails(subtotal);
  const pixDiscountValue = paymentMethod === 'PIX' ? roundMoney(totalAfterTier * 0.05) : 0;
  const finalTotal = roundMoney(totalAfterTier - pixDiscountValue);

  const discountLabel = discountTier
    ? `Desconto (${discountTier.name} ${discountTier.percentage}%)`
    : 'Desconto';

  const handleFinishPurchase = () => {
    if (cart.items.length === 0) {
      alert('Seu carrinho está vazio. Adicione produtos para enviar o pedido.');
      return;
    }

    // WHATSAPP MIN ORDER CHECK
    if (subtotal < MIN_ORDER_TOTAL) {
      alert('O pedido mínimo para compra no atacado é de R$ 800,00. Adicione mais produtos para finalizar.');
      return;
    }

    if (!paymentMethod) {
      alert('Selecione a forma de pagamento (PIX ou Boleto) antes de enviar o pedido.');
      return;
    }

    const messageTier = getDiscountTier(subtotal);
    const messageTierDiscount = messageTier
      ? roundMoney(subtotal * (messageTier.percentage / 100))
      : 0;
    const messageTotalAfterTier = roundMoney(subtotal - messageTierDiscount);
    const messagePixDiscount = paymentMethod === 'PIX' ? roundMoney(messageTotalAfterTier * 0.05) : 0;
    const messageFinalTotal = roundMoney(messageTotalAfterTier - messagePixDiscount);
    const tierLabel = messageTier ? `${messageTier.name} ${messageTier.percentage}%` : 'Sem desconto';
    const separator = ' — ';

    const lines = cart.items.map((item, index) => {
      const itemSubtotal = roundMoney(item.product.price * item.quantity);
      return `${index + 1}) ${item.product.name}${separator}Ref: ${item.product.reference}${separator}Qtde: ${item.quantity}${separator}Unit: ${formatPrice(item.product.price)}${separator}Sub: ${formatPrice(itemSubtotal)}`;
    });

    const message =
      `Pedido:\n\n${lines.join('\n')}\n\n` +
      `Subtotal: ${formatPrice(subtotal)}\n` +
      `Desconto (${tierLabel}): - ${formatPrice(messageTierDiscount)}\n` +
      `Desconto adicional PIX (5%): ${paymentMethod === 'PIX' ? `- ${formatPrice(messagePixDiscount)}` : formatPrice(0)}\n` +
      `Total: ${formatPrice(messageFinalTotal)}\n` +
      `Forma de pagamento: ${paymentMethod}`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;

    window.open(url, '_blank');
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-32 w-32 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Adicione produtos incríveis da Copa do Mundo 2026 ao seu carrinho.
            </p>
            <Link to="/">
              <Button size="lg" className="px-8" style={{ backgroundColor: '#22C55E', color: '#fff' }}>
                Ver Produtos
                <ShoppingCart className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Meu Carrinho</h1>
            <p className="text-muted-foreground">
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'} no carrinho
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              Continuar Comprando
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item.product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex gap-4 md:gap-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-white flex-shrink-0 border">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-base md:text-lg mb-1 line-clamp-2">
                            {item.product.name}
                          </h3>
                          <Badge variant="outline" className="mb-2">
                            {item.product.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-destructive hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-8 w-8"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-lg font-bold min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="h-8 w-8"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Subtotal do item</p>
                          <p className="text-xl md:text-2xl font-bold" style={{ color: '#22C55E' }}>
                            {formatPrice(roundMoney(item.product.price * item.quantity))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20 border-2" style={{ borderColor: '#22C55E' }}>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold">Resumo do Pedido</h2>
                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">Frete</span>
                    </div>
                    <span className="font-bold" style={{ color: '#22C55E' }}>Grátis</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{discountLabel}</span>
                    <span className="font-semibold">
                      {discountValue > 0 ? `- ${formatPrice(discountValue)}` : formatPrice(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Desconto adicional PIX (5%)</span>
                    <span className="font-semibold">
                      {pixDiscountValue > 0 ? `- ${formatPrice(pixDiscountValue)}` : formatPrice(0)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold" style={{ color: '#22C55E' }}>
                    {formatPrice(finalTotal)}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Forma de pagamento</p>
                  <label className="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment-method"
                      checked={paymentMethod === 'PIX'}
                      onChange={() => setPaymentMethod('PIX')}
                    />
                    <span>PIX (5% adicional)</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment-method"
                      checked={paymentMethod === 'Boleto'}
                      onChange={() => setPaymentMethod('Boleto')}
                    />
                    <span>Boleto</span>
                  </label>
                </div>

                {subtotal < MIN_ORDER_TOTAL && (
                  <p className="text-xs text-muted-foreground text-center">
                    Pedido mínimo no atacado: {formatPrice(MIN_ORDER_TOTAL)}.
                  </p>
                )}

                <Button
                  size="lg"
                  className="w-full h-12 text-base font-bold"
                  style={{ backgroundColor: '#22C55E', color: '#fff' }}
                  onClick={handleFinishPurchase}
                >
                  Enviar pedido
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="pt-4 space-y-2 text-center text-sm text-muted-foreground">
                  <p className="flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4" />
                    Compra 100% Segura
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Truck className="h-4 w-4" />
                    Entrega Grátis para todo Brasil
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
