import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormField as Field } from '@/components/FormField'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PixPayment } from '@/components/PixPayment'
import {
  Check,
  CreditCard as CreditCardIcon,
  MapPin,
  User,
  ShieldCheck,
  Package,
  Truck,
  QrCode,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { centuriumService } from '@/lib/centuriumService'
import { getSupabase } from '@/lib/supabase'

type Step = 1 | 2 | 3 | 4
type ShippingMethod = 'free' | 'sedex'
type PaymentMethod = 'pix' | 'credit_card'

interface PixData {
  transaction_id: string
  qr_code: string
  pix_code: string
  amount: number
  expires_at: string
}

export default function CheckoutNew() {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('free')
  const [isProcessing, setIsProcessing] = useState(false)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Dados do formulário
  const [formData, setFormData] = useState({
    // Etapa 1
    name: '',
    email: '',
    phone: '',
    cpf: '',
    // Etapa 2
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  })

  const [creditCardData, setCreditCardData] = useState({
    number: '',
    holder_name: '',
    expiry_month: '',
    expiry_year: '',
    cvv: ''
  })

  const [installments, setInstallments] = useState(1)

  const steps = [
    { number: 1, title: 'Dados Pessoais', icon: User },
    { number: 2, title: 'Endereço', icon: MapPin },
    { number: 3, title: 'Pagamento', icon: CreditCardIcon }
  ]

  const SEDEX_PRICE = 19.90

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const getShippingPrice = () => {
    return shippingMethod === 'sedex' ? SEDEX_PRICE : 0
  }

  const getFinalTotal = () => {
    return cart.total + getShippingPrice()
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCardChange = (field: string, value: string) => {
    setCreditCardData(prev => ({ ...prev, [field]: value }))
  }

  const searchCEP = async () => {
    if (formData.cep.replace(/\D/g, '').length === 8) {
      try {
        const cep = formData.cep.replace(/\D/g, '')
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          }))
          toast.success('CEP encontrado!')
        } else {
          toast.error('CEP não encontrado')
        }
      } catch (error) {
        toast.error('Erro ao buscar CEP')
      }
    }
  }

  const handleNext = () => {
    // Validações por etapa
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.cpf) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }
    }

    if (currentStep === 2) {
      if (!formData.cep || !formData.street || !formData.number || !formData.neighborhood || !formData.city || !formData.state) {
        toast.error('Preencha todos os campos de endereço')
        return
      }
    }

    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const handleFinish = async () => {
    setIsProcessing(true)

    try {
      const total = getFinalTotal()

      // Prepara dados do cliente para o pedido
      // Em produção, esses dados seriam enviados ao backend/gateway de pagamento
      console.log('Dados do pedido:', {
        customer: {
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: formData.phone.replace(/\D/g, ''),
        },
        billing: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement || undefined,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          postal_code: formData.cep.replace(/\D/g, ''),
        },
        order: {
          id: `ORDER_${Date.now()}`,
          items: cart.items.map(item => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
          total,
        }
      })

      if (paymentMethod === 'pix') {
        // Cria pagamento PIX real via backend
        const pixResponse = await centuriumService.createPixPayment({
          amount: total,
          customer: {
            name: formData.name,
            email: formData.email,
            cpf: formData.cpf,
            phone: formData.phone,
            address: {
              street: formData.street,
              number: formData.number,
              complement: formData.complement,
              neighborhood: formData.neighborhood,
              city: formData.city,
              state: formData.state,
              cep: formData.cep,
            },
          },
          items: cart.items.map(item => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
        })

        // Salva pedido no banco de dados
        const { error: dbError } = await getSupabase().from('orders').insert({
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          customer_cpf: formData.cpf,
          shipping_street: formData.street,
          shipping_number: formData.number,
          shipping_complement: formData.complement || null,
          shipping_neighborhood: formData.neighborhood,
          shipping_city: formData.city,
          shipping_state: formData.state,
          shipping_postal_code: formData.cep,
          items: cart.items.map(item => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
          subtotal: cart.total,
          shipping_cost: getShippingPrice(),
          total: total,
          payment_method: 'pix',
          payment_id: pixResponse.transaction_id,
          payment_status: 'pending',
          shipping_method: shippingMethod,
        })

        if (dbError) {
          console.error('Erro ao salvar pedido:', dbError)
          // Não bloqueia o fluxo se o banco falhar
        }

        // Define dados do PIX para exibir
        setPixData(pixResponse)

        setCurrentStep(4)
        toast.success('PIX gerado com sucesso!')
      } else {
        // Pagamento com cartão de crédito
        if (!creditCardData.number || !creditCardData.holder_name || !creditCardData.cvv) {
          toast.error('Preencha todos os dados do cartão')
          setIsProcessing(false)
          return
        }

        // Validação básica do cartão
        if (creditCardData.number.replace(/\s/g, '').length < 13) {
          toast.error('Número do cartão inválido')
          setIsProcessing(false)
          return
        }

        if (creditCardData.cvv.length < 3) {
          toast.error('CVV inválido')
          setIsProcessing(false)
          return
        }

        if (!creditCardData.expiry_month || !creditCardData.expiry_year) {
          toast.error('Preencha a data de validade do cartão')
          setIsProcessing(false)
          return
        }

        // Processa pagamento com cartão via Centurium
        const cardResponse = await centuriumService.createCreditCardPayment({
          amount: total,
          customer: {
            name: formData.name,
            email: formData.email,
            cpf: formData.cpf,
            phone: formData.phone,
            address: {
              street: formData.street,
              number: formData.number,
              complement: formData.complement,
              neighborhood: formData.neighborhood,
              city: formData.city,
              state: formData.state,
              cep: formData.cep,
            },
          },
          card: {
            number: creditCardData.number.replace(/\s/g, ''),
            holder_name: creditCardData.holder_name,
            expiry_month: creditCardData.expiry_month,
            expiry_year: creditCardData.expiry_year,
            cvv: creditCardData.cvv,
          },
          installments: installments,
          items: cart.items.map(item => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
        })

        // Salva pedido no banco de dados
        const { error: dbError } = await getSupabase().from('orders').insert({
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          customer_cpf: formData.cpf,
          shipping_street: formData.street,
          shipping_number: formData.number,
          shipping_complement: formData.complement || null,
          shipping_neighborhood: formData.neighborhood,
          shipping_city: formData.city,
          shipping_state: formData.state,
          shipping_postal_code: formData.cep,
          items: cart.items.map(item => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
          subtotal: cart.total,
          shipping_cost: getShippingPrice(),
          total: total,
          payment_method: 'credit_card',
          payment_id: cardResponse.transaction_id,
          payment_status: cardResponse.status === 'approved' ? 'paid' : cardResponse.status,
          shipping_method: shippingMethod,
        })

        if (dbError) {
          console.error('Erro ao salvar pedido:', dbError)
        }

        if (cardResponse.status === 'approved') {
          setPaymentSuccess(true)
          setCurrentStep(4)
          clearCart()
          toast.success('Pagamento aprovado!')
          setTimeout(() => navigate('/'), 3000)
        } else if (cardResponse.status === 'declined') {
          toast.error(cardResponse.message || 'Pagamento recusado. Verifique os dados do cartão.')
          setIsProcessing(false)
          return
        } else {
          toast.error('Pagamento em análise. Você receberá um email com o resultado.')
          setIsProcessing(false)
        }
      }
    } catch (error: any) {
      console.error('Erro no pagamento:', error)
      toast.error(error.message || 'Erro ao processar pagamento. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Verifica se tem itens no carrinho
  if (cart.items.length === 0) {
    navigate('/')
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Progress Steps */}
      <div className="bg-card border-b">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = currentStep > step.number
              const isCurrent = currentStep === step.number

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`
                        w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                        transition-all duration-300 font-semibold text-sm sm:text-base
                        ${isCompleted ? 'bg-gray-400 text-white' : ''}
                        ${isCurrent ? 'bg-gray-400 text-white ring-4 ring-gray-400/20' : ''}
                        ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                      `}
                    >
                      {isCompleted ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className={`
                      h-1 flex-1 mx-2 rounded transition-all duration-300
                      ${currentStep > step.number ? 'bg-gray-400' : 'bg-muted'}
                    `} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="border-gray-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentStep === 1 && (
                    <>
                      <User className="w-5 h-5" />
                      Dados Pessoais
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <MapPin className="w-5 h-5" />
                      Endereço de Entrega
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <CreditCardIcon className="w-5 h-5" />
                      Forma de Pagamento
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Step 1: Personal Data */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <Field label="Nome Completo" required>
                      <Input
                        placeholder="Seu nome completo"
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Email" required>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) => handleFormChange('email', e.target.value)}
                        />
                      </Field>
                      <Field label="Telefone" required>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={(e) => handleFormChange('phone', e.target.value)}
                        />
                      </Field>
                    </div>

                    <Field label="CPF" required>
                      <Input
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => handleFormChange('cpf', e.target.value)}
                        maxLength={14}
                      />
                    </Field>
                  </div>
                )}

                {/* Step 2: Address */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="CEP" required>
                        <Input
                          placeholder="00000-000"
                          value={formData.cep}
                          onChange={(e) => handleFormChange('cep', e.target.value)}
                          onBlur={searchCEP}
                          maxLength={9}
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Rua" required>
                          <Input
                            placeholder="Nome da rua"
                            value={formData.street}
                            onChange={(e) => handleFormChange('street', e.target.value)}
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Número" required>
                        <Input
                          placeholder="123"
                          value={formData.number}
                          onChange={(e) => handleFormChange('number', e.target.value)}
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Complemento">
                          <Input
                            placeholder="Apto, bloco, etc"
                            value={formData.complement}
                            onChange={(e) => handleFormChange('complement', e.target.value)}
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Bairro" required>
                        <Input
                          placeholder="Seu bairro"
                          value={formData.neighborhood}
                          onChange={(e) => handleFormChange('neighborhood', e.target.value)}
                        />
                      </Field>
                      <Field label="Cidade" required>
                        <Input
                          placeholder="Sua cidade"
                          value={formData.city}
                          onChange={(e) => handleFormChange('city', e.target.value)}
                        />
                      </Field>
                      <Field label="Estado" required>
                        <Input
                          placeholder="SP"
                          value={formData.state}
                          onChange={(e) => handleFormChange('state', e.target.value)}
                          maxLength={2}
                        />
                      </Field>
                    </div>

                    {/* Shipping Options - Show after address is filled */}
                    {formData.cep && formData.street && formData.city && (
                      <div className="space-y-3 pt-4">
                        <Label className="text-base">Escolha o frete</Label>
                        <RadioGroup value={shippingMethod} onValueChange={(value: string) => setShippingMethod(value as ShippingMethod)}>
                          <div className="space-y-3">
                            {/* Free Shipping Option */}
                            <label
                              htmlFor="free"
                              className={`
                                flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer
                                transition-all hover:border-black/50
                                ${shippingMethod === 'free' ? 'border-black bg-black/5' : 'border-gray-300'}
                              `}
                            >
                              <div className="flex items-center gap-4">
                                <RadioGroupItem value="free" id="free" />
                                <div className="flex items-center gap-2">
                                  <Truck className="w-5 h-5" />
                                  <div>
                                    <div className="font-semibold flex items-center gap-2">
                                      Frete Grátis
                                      <Badge variant="secondary" style={{ backgroundColor: '#22C55E', color: '#fff' }}>
                                        GRÁTIS
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Entrega em até 7 dias úteis
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold" style={{ color: '#22C55E' }}>R$ 0,00</div>
                              </div>
                            </label>

                            {/* Sedex Option */}
                            <label
                              htmlFor="sedex"
                              className={`
                                flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer
                                transition-all hover:border-black/50
                                ${shippingMethod === 'sedex' ? 'border-black bg-black/5' : 'border-gray-300'}
                              `}
                            >
                              <div className="flex items-center gap-4">
                                <RadioGroupItem value="sedex" id="sedex" />
                                <div className="flex items-center gap-2">
                                  <Package className="w-5 h-5" />
                                  <div>
                                    <div className="font-semibold">Sedex</div>
                                    <div className="text-sm text-muted-foreground">
                                      Entrega em até 4 dias úteis
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatPrice(SEDEX_PRICE)}</div>
                              </div>
                            </label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base mb-3 block">Escolha como deseja pagar</Label>
                      <RadioGroup value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value as PaymentMethod)}>
                        <div className="space-y-3">
                          {/* PIX Option */}
                          <label
                            htmlFor="pix"
                            className={`
                              flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer
                              transition-all hover:border-black/50
                              ${paymentMethod === 'pix' ? 'border-black bg-black/5' : 'border-gray-300'}
                            `}
                          >
                            <div className="flex items-center gap-4">
                              <RadioGroupItem value="pix" id="pix" />
                              <div className="flex items-center gap-2">
                                <QrCode className="w-5 h-5" />
                                <div>
                                  <div className="font-semibold flex items-center gap-2">
                                    PIX
                                    <Badge variant="secondary" style={{ backgroundColor: '#22C55E', color: '#fff' }}>
                                      RECOMENDADO
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Aprovação Instantânea
                                  </div>
                                </div>
                              </div>
                            </div>
                            {paymentMethod === 'pix' && (
                              <Check className="w-5 h-5 text-black" />
                            )}
                          </label>

                          {/* Credit Card Option */}
                          <label
                            htmlFor="credit_card"
                            className={`
                              flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer
                              transition-all hover:border-black/50
                              ${paymentMethod === 'credit_card' ? 'border-black bg-black/5' : 'border-gray-300'}
                            `}
                          >
                            <div className="flex items-center gap-4">
                              <RadioGroupItem value="credit_card" id="credit_card" />
                              <div className="flex items-center gap-2">
                                <CreditCardIcon className="w-5 h-5" />
                                <div>
                                  <div className="font-semibold">Cartão de Crédito</div>
                                  <div className="text-sm text-muted-foreground">
                                    Parcele em até 3x com juros
                                  </div>
                                </div>
                              </div>
                            </div>
                            {paymentMethod === 'credit_card' && (
                              <Check className="w-5 h-5 text-black" />
                            )}
                          </label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Credit Card Form */}
                    {paymentMethod === 'credit_card' && (
                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base">Dados do Cartão</Label>

                        <Field label="Número do Cartão" required>
                          <Input
                            placeholder="0000 0000 0000 0000"
                            value={creditCardData.number}
                            onChange={(e) => handleCardChange('number', e.target.value)}
                            maxLength={19}
                          />
                        </Field>

                        <Field label="Nome no Cartão" required>
                          <Input
                            placeholder="Nome como está no cartão"
                            value={creditCardData.holder_name}
                            onChange={(e) => handleCardChange('holder_name', e.target.value)}
                          />
                        </Field>

                        <div className="grid grid-cols-3 gap-4">
                          <Field label="Mês" required>
                            <Input
                              placeholder="MM"
                              value={creditCardData.expiry_month}
                              onChange={(e) => handleCardChange('expiry_month', e.target.value)}
                              maxLength={2}
                            />
                          </Field>
                          <Field label="Ano" required>
                            <Input
                              placeholder="AA"
                              value={creditCardData.expiry_year}
                              onChange={(e) => handleCardChange('expiry_year', e.target.value)}
                              maxLength={2}
                            />
                          </Field>
                          <Field label="CVV" required>
                            <Input
                              placeholder="000"
                              value={creditCardData.cvv}
                              onChange={(e) => handleCardChange('cvv', e.target.value)}
                              maxLength={4}
                            />
                          </Field>
                        </div>

                        <Field label="Parcelamento" required>
                          <select
                            value={installments}
                            onChange={(e) => setInstallments(Number(e.target.value))}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value={1}>1x de {formatPrice(getFinalTotal())} sem juros</option>
                            <option value={2}>2x de {formatPrice(getFinalTotal() / 2)} sem juros</option>
                            <option value={3}>3x de {formatPrice(getFinalTotal() / 3)} com juros</option>
                            <option value={4}>4x de {formatPrice((getFinalTotal() * 1.05) / 4)} com juros</option>
                            <option value={5}>5x de {formatPrice((getFinalTotal() * 1.08) / 5)} com juros</option>
                            <option value={6}>6x de {formatPrice((getFinalTotal() * 1.10) / 6)} com juros</option>
                          </select>
                        </Field>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: PIX or Success */}
                {currentStep === 4 && pixData && (
                  <div className="space-y-4">
                    <PixPayment
                      qrCode={pixData.qr_code}
                      pixCode={pixData.pix_code}
                      amount={pixData.amount}
                      transactionId={pixData.transaction_id}
                      expiresAt={pixData.expires_at}
                      onPaymentConfirmed={() => {
                        setPaymentSuccess(true)
                        clearCart()
                        toast.success('Pagamento confirmado!')
                        setTimeout(() => navigate('/'), 2000)
                      }}
                    />
                  </div>
                )}

                {currentStep === 4 && paymentSuccess && !pixData && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Pagamento Aprovado!</h3>
                    <p className="text-muted-foreground">Seu pedido foi confirmado com sucesso.</p>
                  </div>
                )}

                {/* Action Buttons */}
                {currentStep < 4 && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    {currentStep > 1 && (
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        className="w-full sm:w-[180px] border-gray-300"
                        disabled={isProcessing}
                      >
                        Voltar
                      </Button>
                    )}

                    {currentStep < 3 ? (
                      <Button
                        onClick={handleNext}
                        className="w-full sm:flex-1 text-white"
                        style={{ backgroundColor: '#22C55E' }}
                      >
                        Continuar
                      </Button>
                    ) : (
                      <>
                        {paymentMethod === 'pix' ? (
                          <Button
                            onClick={handleFinish}
                            className="w-full sm:flex-1 text-white text-lg py-6"
                            style={{ backgroundColor: '#22C55E' }}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Gerando PIX...
                              </>
                            ) : (
                              'Gerar PIX'
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={handleFinish}
                            className="w-full sm:flex-1 text-white text-lg py-6"
                            style={{ backgroundColor: '#22C55E' }}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              'Finalizar Pagamento'
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    Total a pagar: <span className="font-bold text-lg text-foreground">{formatPrice(getFinalTotal())}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-gray-300">
              <CardHeader className="bg-gray-400 text-white rounded-t-lg">
                <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Products List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2">{item.product.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Quantidade: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold mt-1">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">
                      {formatPrice(cart.total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    {shippingMethod === 'free' ? (
                      <span className="font-semibold" style={{ color: '#22C55E' }}>Grátis</span>
                    ) : (
                      <span className="font-semibold">{formatPrice(SEDEX_PRICE)}</span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: '#22C55E' }}>
                        {formatPrice(getFinalTotal())}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ou 3x de {formatPrice(getFinalTotal() / 3)} com juros
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Trust Badges */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <span>Compra 100% Segura</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="w-4 h-4 text-accent" />
                    <span>Produto Original</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="w-4 h-4 text-accent" />
                    <span>Entrega Garantida</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
