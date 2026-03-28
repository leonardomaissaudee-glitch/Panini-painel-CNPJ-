import { BadgeCheck, Building2, ShieldCheck, Truck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <BadgeCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Distribuidor Oficial</h3>
            <p className="text-xs text-muted-foreground">Produtos 100% originais e lacrados de fábrica.</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Envio para Todo o Brasil</h3>
            <p className="text-xs text-muted-foreground">Operação com rastreamento e despacho rápido.</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Condições Exclusivas no Atacado</h3>
            <p className="text-xs text-muted-foreground">Descontos progressivos conforme volume.</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Compra Empresarial Segura</h3>
            <p className="text-xs text-muted-foreground">Venda exclusiva para CNPJ ativo.</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src="https://pub-c0bfb119504542e0b2e6ebc8f6b3b1df.r2.dev/user-uploads/user_38XNRHxmsUPTGvoK09TMInYrBxw/09cf08fa-d355-4e36-811b-7f54f9f72f94.png"
                alt="Panini Logo"
                className="h-8 w-auto"
              />
              <span className="text-sm font-semibold">FIFA WORLD CUP 2026™</span>
            </div>

            <div className="text-center md:text-right">
              <p className="text-xs text-muted-foreground">© 2026 Panini. Todos os direitos reservados.</p>
              <p className="text-xs text-muted-foreground mt-1">Produto Oficial FIFA World Cup 2026™</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Compra 100% Segura • Dados Protegidos • Produto Original
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
