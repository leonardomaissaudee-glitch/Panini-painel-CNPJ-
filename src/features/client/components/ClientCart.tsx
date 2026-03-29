import { useMemo, useState } from "react"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/contexts/CartContext"
import type { ResellerProfile } from "@/lib/auth"
import { calculateCartPricing, createClientOrder, type ClientPaymentMethod, getDiscountTier } from "@/features/client/services/clientService"

const MIN_ORDER_TOTAL = 800

export function ClientCart({
  profile,
  onOrderCreated,
}: {
  profile: ResellerProfile | null
  onOrderCreated?: () => void
}) {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<ClientPaymentMethod>("pix")

  const subtotal = useMemo(() => Number(cart.total.toFixed(2)), [cart.total])
  const pricing = useMemo(() => calculateCartPricing(subtotal, paymentMethod), [subtotal, paymentMethod])
  const tier = getDiscountTier(subtotal)

  const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })

  const handleFinishOrder = async () => {
    if (!profile) {
      toast.error("Não foi possível identificar seu perfil empresarial.")
      return
    }

    if (!cart.items.length) {
      toast.error("Seu carrinho está vazio.")
      return
    }

    if (subtotal < MIN_ORDER_TOTAL) {
      toast.error(`O pedido mínimo para revenda é de ${formatPrice(MIN_ORDER_TOTAL)}.`)
      return
    }

    setSubmitting(true)
    try {
      await createClientOrder({ profile, cart, paymentMethod })
      clearCart()
      toast.success("Pedido enviado", {
        description: "Seu pedido foi registrado e já aparece em Meus pedidos com status de aprovação comercial.",
      })
      onOrderCreated?.()
    } catch (error: any) {
      toast.error("Não foi possível concluir o pedido", { description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <ShoppingCart className="h-8 w-8 text-slate-600" />
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-slate-950">Seu carrinho está vazio</div>
            <p className="text-sm text-muted-foreground">Adicione produtos no catálogo para montar seu próximo pedido.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-4">
        {cart.items.map((item) => (
          <Card key={item.product.id} className="border-slate-200 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
              <div className="h-24 w-full rounded-2xl border bg-white sm:w-24">
                <img src={item.product.image} alt={item.product.name} className="h-full w-full object-contain p-2" />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-semibold text-slate-950">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Ref. {item.product.reference} • {item.product.category}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-rose-600 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="min-w-10 text-center text-lg font-semibold">{item.quantity}</div>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Subtotal</div>
                    <div className="text-lg font-bold text-slate-950">
                      {formatPrice(Number((item.product.price * item.quantity).toFixed(2)))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Resumo do pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            O pedido entra como <strong>aguardando aprovação</strong>. Seu gerente comercial libera a etapa de pagamento e segue com a expedição.
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plano aplicado</span>
              <span className="font-semibold">{tier ? `${tier.name} (${tier.percentage}%)` : "Ainda sem plano"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Desconto do plano</span>
              <span className="font-semibold">- {formatPrice(pricing.planDiscount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Desconto adicional PIX</span>
              <span className="font-semibold">- {formatPrice(pricing.pixDiscount)}</span>
            </div>
          </div>

          <Separator />

          <div className="rounded-2xl bg-blue-950 p-4 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Total estimado</div>
            <div className="mt-2 text-3xl font-bold">{formatPrice(pricing.total)}</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">Preferência de pagamento</div>
            <div className="grid gap-2">
              {[
                { value: "pix", label: "PIX", hint: "5% de desconto adicional" },
                { value: "boleto", label: "Boleto", hint: "primeiro pedido à vista, liberado pelo gerente" },
                { value: "credit_card", label: "Cartão", hint: "parcelamento validado com o gerente" },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value as ClientPaymentMethod)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left transition",
                    paymentMethod === method.value
                      ? "border-blue-900 bg-blue-50 text-blue-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50",
                  ].join(" ")}
                >
                  <div className="font-semibold">{method.label}</div>
                  <div className="text-xs text-muted-foreground">{method.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {subtotal < MIN_ORDER_TOTAL && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              O pedido mínimo para compra no atacado é de {formatPrice(MIN_ORDER_TOTAL)}.
            </div>
          )}

          {paymentMethod === "boleto" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              O boleto é registrado no pedido e liberado pelo gerente comercial após a aprovação.
            </div>
          )}

          <Button
            className="h-12 w-full rounded-full bg-amber-400 text-slate-950 hover:bg-amber-300"
            disabled={submitting || subtotal < MIN_ORDER_TOTAL}
            onClick={handleFinishOrder}
          >
            {submitting ? "Enviando pedido..." : "Finalizar pedido"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
