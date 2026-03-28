import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Kit } from '@/data/kits';

interface KitCardProps {
  kit: Kit;
}

export function KitCard({ kit }: KitCardProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    addToCart({
      id: kit.id,
      name: kit.name,
      price: kit.price,
      reference: `KIT-${kit.id.toUpperCase()}`,
      wholesaleMin: 10,
      image: kit.image,
      description: '',
      category: 'Kit',
      stock: 999,
    });
    toast.success('Kit adicionado ao carrinho!', {
      description: kit.name,
    });
  };

  const handleBuyNow = () => {
    addToCart({
      id: kit.id,
      name: kit.name,
      price: kit.price,
      reference: `KIT-${kit.id.toUpperCase()}`,
      wholesaleMin: 10,
      image: kit.image,
      description: '',
      category: 'Kit',
      stock: 999,
    });
    navigate('/cart');
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-2" style={{ borderColor: '#22C55E' }}>
      <CardContent className="p-3 md:p-4">
        <div className="flex gap-3 md:gap-4">
          <div className="w-24 md:w-32 flex-shrink-0 bg-white flex items-center justify-center p-2 rounded-lg relative border">
            <img
              src={kit.image}
              alt={kit.name}
              className="w-full h-full object-contain"
            />
            {kit.discount && (
              <Badge
                className="absolute -top-2 -right-2 text-xs font-bold"
                style={{ backgroundColor: '#22C55E', color: '#fff' }}
              >
                {kit.discount}
              </Badge>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              {kit.badge && (
                <Badge
                  className="mb-1 font-bold text-xs"
                  style={{
                    backgroundColor: kit.badge === 'MELHOR CUSTO' ? '#FF6B35' : '#DC2626',
                    color: '#fff'
                  }}
                >
                  {kit.badge}
                </Badge>
              )}
              <h3 className="text-sm md:text-xl font-bold mb-1">{kit.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{kit.description}</p>

              <div className="flex items-end gap-2 mb-2">
                {kit.originalPrice && (
                  <p className="text-xs text-muted-foreground line-through">
                    R$ {kit.originalPrice.toFixed(2)}
                  </p>
                )}
                <p className="text-lg md:text-2xl font-bold" style={{ color: '#22C55E' }}>
                  R$ {kit.price.toFixed(2)}
                </p>
              </div>

              <ul className="flex flex-wrap gap-1 mb-2">
                {kit.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-1 text-xs bg-muted px-1.5 py-0.5 rounded">
                    <Check className="h-3 w-3 shrink-0" style={{ color: '#22C55E' }} />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              {kit.savings && (
                <p className="text-xs font-semibold mb-2" style={{ color: '#22C55E' }}>
                  {kit.savings}
                </p>
              )}
            </div>

            <div className="flex gap-1.5 md:gap-2">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1 h-8 md:h-10"
                size="sm"
              >
                <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
              <Button
                onClick={handleBuyNow}
                className="flex-[2] h-8 md:h-10"
                size="sm"
                style={{ backgroundColor: '#22C55E', color: '#fff' }}
              >
                <span className="text-xs md:text-sm font-bold">Comprar</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
