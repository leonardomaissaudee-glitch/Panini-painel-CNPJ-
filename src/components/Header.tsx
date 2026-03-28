import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/features/auth/context/AuthContext';

export function Header() {
  const location = useLocation();
  const { profile } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  const isHome = location.pathname === '/';
  const showCart = !!profile && profile.role === 'client';

  const menuItems = [
    { label: 'Sobre', href: '#sobre' },
    { label: 'Como funciona', href: '#processo' },
    { label: 'Produtos', href: '#produtos' },
    { label: 'Planos', href: '#planos' },
    { label: 'Logística', href: '#logistica' },
    { label: 'Pagamento', href: '#pagamento' },
    { label: 'Mercado', href: '#mercado' },
    { label: 'Dicas', href: '#dicas' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="https://pub-c0bfb119504542e0b2e6ebc8f6b3b1df.r2.dev/user-uploads/user_38XNRHxmsUPTGvoK09TMInYrBxw/09cf08fa-d355-4e36-811b-7f54f9f72f94.png"
            alt="Panini Logo"
            className="h-10 w-auto"
          />
        </Link>

        {isHome && (
          <nav className="hidden lg:flex items-center gap-2">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              <LogIn className="h-4 w-4 mr-1" /> Entrar
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="hidden sm:inline-flex">
              <UserPlus className="h-4 w-4 mr-1" /> Cadastrar
            </Button>
          </Link>
          <ThemeToggle />
          {showCart && (
            <Link to="/cart">
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
