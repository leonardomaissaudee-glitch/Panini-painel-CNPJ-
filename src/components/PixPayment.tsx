import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, QrCode, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PixPaymentProps {
  qrCode: string; // Base64 ou URL da imagem
  pixCode: string; // Código copia e cola
  amount: number;
  transactionId: string;
  expiresAt: string;
  onPaymentConfirmed?: () => void;
}

export function PixPayment({
  qrCode,
  pixCode,
  amount,
  transactionId,
  expiresAt,
  onPaymentConfirmed: _onPaymentConfirmed,
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setIsExpired(true);
        setTimeLeft('Expirado');
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success('Código PIX copiado!', {
        description: 'Cole no app do seu banco para pagar',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Erro ao copiar código');
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2" style={{ borderColor: isExpired ? '#EF4444' : '#22C55E' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isExpired ? '#FEE2E2' : '#DCFCE7' }}
              >
                {isExpired ? (
                  <Clock className="h-6 w-6 text-red-600" />
                ) : (
                  <QrCode className="h-6 w-6" style={{ color: '#22C55E' }} />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">Pagamento PIX</h3>
                <p className="text-sm text-muted-foreground">
                  {isExpired ? 'Código expirado' : 'Escaneie o QR Code ou copie o código'}
                </p>
              </div>
            </div>
            {!isExpired && (
              <Badge className="text-sm font-bold" style={{ backgroundColor: '#22C55E', color: '#fff' }}>
                <Clock className="h-3 w-3 mr-1" />
                {timeLeft}
              </Badge>
            )}
          </div>

          {!isExpired && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="p-4 bg-white rounded-lg border-2 mb-4" style={{ borderColor: '#22C55E' }}>
                  {qrCode.startsWith('data:image') || qrCode.startsWith('http') ? (
                    <img
                      src={qrCode}
                      alt="QR Code PIX"
                      className="w-64 h-64 object-contain"
                    />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center bg-muted">
                      <QrCode className="h-32 w-32 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold" style={{ color: '#22C55E' }}>
                  {formatPrice(amount)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    CÓDIGO PIX COPIA E COLA
                  </p>
                  <p className="text-sm font-mono break-all mb-3">
                    {pixCode}
                  </p>
                  <Button
                    onClick={handleCopyCode}
                    className="w-full"
                    style={{ backgroundColor: '#22C55E', color: '#fff' }}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Código PIX
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    Como pagar com PIX
                  </h4>
                  <ol className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">1.</span>
                      Abra o app do seu banco
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">2.</span>
                      Escolha pagar com PIX QR Code ou Copia e Cola
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">3.</span>
                      Escaneie o código ou cole o código copiado
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">4.</span>
                      Confirme o pagamento
                    </li>
                  </ol>
                </div>
              </div>
            </>
          )}

          {isExpired && (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground mb-4">
                O código PIX expirou. Gere um novo código para continuar.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Gerar Novo Código
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>ID da Transação: {transactionId}</p>
        <p className="mt-2">
          Após o pagamento, você receberá a confirmação por email e seu pedido será processado
          automaticamente.
        </p>
      </div>
    </div>
  );
}
