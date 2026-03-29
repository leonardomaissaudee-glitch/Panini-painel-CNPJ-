import { useState } from 'react';
import { Product } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  // DETAILS TOGGLE
  const [showDetails, setShowDetails] = useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleAddToCart = () => {
    addToCart(product);
    toast.success('Produto adicionado!', {
      description: product.name,
    });
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/app?tab=carrinho');
  };

  return (
    <Card className="min-w-0 h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-white">
          {/* CARD UI UPDATE */}
          <div className="absolute left-2 top-2 z-10 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            Disponível
          </div>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-2 md:p-4 transition-transform duration-300 hover:scale-105"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 md:p-3 space-y-2">
        <h3 className="min-h-[3rem] break-words font-bold text-[11px] leading-5 md:min-h-[2.5rem] md:text-base">
          {product.name}
        </h3>
        <div className="space-y-1 text-[11px] md:text-xs text-muted-foreground">
          <p className="font-medium">Ref: {product.reference}</p>
          <p>Atacado: mínimo {product.wholesaleMin} un.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-primary hover:opacity-80"
          onClick={() => setShowDetails((prev) => !prev)}
        >
          <Plus className="h-3 w-3" />
          {showDetails ? '- Detalhes' : '+ Detalhes'}
        </button>
        {showDetails && (
          <p className="text-[11px] md:text-xs leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-1.5 md:gap-2 p-2 md:p-3 pt-0">
        <div className="w-full space-y-2">
          <span className="text-lg md:text-2xl font-bold" style={{ color: '#22C55E' }}>
            {formatPrice(product.price)}
          </span>
          <div className="flex flex-wrap gap-1">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              5% OFF no carrinho
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              12% OFF no carrinho
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              20% OFF no carrinho
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:flex-row">
          <Button
            onClick={handleAddToCart}
            className="h-8 w-full sm:flex-[2] md:h-9"
            size="sm"
            disabled={product.stock === 0}
            style={{ backgroundColor: '#22C55E', color: '#fff' }}
          >
            <ShoppingCart className="mr-1 h-3 w-3 md:h-4 md:w-4" />
            <span className="text-xs font-bold">Adicionar</span>
          </Button>
          <Button
            onClick={handleBuyNow}
            variant="outline"
            className="h-8 w-full sm:flex-1 md:h-9"
            size="sm"
            disabled={product.stock === 0}
          >
            <span className="text-xs font-bold">
              {product.stock === 0 ? 'Esgotado' : 'Comprar'}
            </span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
