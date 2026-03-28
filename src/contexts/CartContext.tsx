import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product, Cart } from '@/types';
import { toast } from 'sonner';

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Cart['items']>(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        return parsed.items || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Calcula o total sempre que os itens mudarem
  const total = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [items]);

  // Cart completo
  const cart = useMemo(() => ({ items, total }), [items, total]);

  // Salva no localStorage sempre que o cart mudar
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error('Quantidade indisponível em estoque');
          return prevItems;
        }
        toast.success(`${product.name} atualizado no carrinho`);
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      if (quantity > product.stock) {
        toast.error('Quantidade indisponível em estoque');
        return prevItems;
      }

      toast.success(`${product.name} adicionado ao carrinho`);
      return [...prevItems, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    toast.success('Produto removido do carrinho');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prevItems) => {
      const item = prevItems.find((item) => item.product.id === productId);
      if (item && quantity > item.product.stock) {
        toast.error('Quantidade indisponível em estoque');
        return prevItems;
      }

      return prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setItems([]);
    toast.success('Carrinho limpo');
  };

  const getCartCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
