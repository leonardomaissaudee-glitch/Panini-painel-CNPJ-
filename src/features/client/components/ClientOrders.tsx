import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { OrderRow } from "@/features/admin/services/adminService"
import { fetchMyOrders } from "@/features/client/services/clientService"
import { getOrderStatusLabel } from "@/shared/constants/orderStatus"
import { StatusBadge } from "@/components/StatusBadge"

const orderTimeline = [
  "aguardando_aprovacao",
  "aguardando_pagamento",
  "pedido_pago",
  "em_expedicao",
  "nota_fiscal_emitida",
  "localizador_disponivel",
  "pedido_entregue",
] as const

export function ClientOrders({
  email,
  onRefreshReady,
}: {
  email: string | undefined
  onRefreshReady?: (refresh: () => Promise<void>) => void
}) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)
  const estimatedDeliveryLabel = getEstimatedDeliveryLabel()

  const load = async () => {
    if (!email) return

    setLoading(true)
    try {
      const rows = await fetchMyOrders(email)
      setOrders(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar pedidos", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [email])

  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(load)
    }
  }, [onRefreshReady, email])

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Meus pedidos</CardTitle>
          <p className="text-sm text-muted-foreground">Acompanhe cada fase comercial e logística do seu pedido.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-semibold text-slate-950">Pedido {order.id.slice(0, 8).toUpperCase()}</div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="text-sm text-muted-foreground">
                  Criado em {order.created_at ? new Date(order.created_at).toLocaleString("pt-BR") : "-"}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Total" value={`R$ ${Number(order.total || 0).toFixed(2)}`} />
                <Metric label="NF" value={order.invoice_number || "Aguardando"} />
                <Metric label="Localizador" value={order.tracking_code || "Aguardando"} />
                <Metric label="Previsão de entrega" value={estimatedDeliveryLabel} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo</div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>Pagamento: {order.payment_method || "A definir com o gerente"}</p>
                  <p>Status financeiro: {order.payment_status || "pending"}</p>
                  <p>Status atual: {getOrderStatusLabel(order.status)}</p>
                  <p>Previsão de entrega: {estimatedDeliveryLabel}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">Linha do pedido</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {orderTimeline.map((step) => {
                    const isActive = step === normalizeOrderStatus(order.status)
                    const isReached = hasReached(step, normalizeOrderStatus(order.status))

                    return (
                      <div
                        key={step}
                        className={[
                          "rounded-2xl border p-3 text-sm transition",
                          isActive
                            ? "border-blue-900 bg-blue-950 text-white"
                            : isReached
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-slate-50 text-slate-500",
                        ].join(" ")}
                      >
                        {getOrderStatusLabel(step)}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {normalizeOrderStatus(order.status) === "aguardando_pagamento" && (
              <PaymentInfoCard order={order} />
            )}
          </div>
        ))}

        {orders.length === 0 && !loading && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
            Nenhum pedido encontrado. Finalize seu primeiro pedido pelo carrinho para começar a acompanhar o fluxo.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function PaymentInfoCard({ order }: { order: OrderRow }) {
  const copyText = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(successMessage)
    } catch {
      toast.error("Não foi possível copiar o conteúdo.")
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Informações para pagamento</div>
      <div className="mt-3 space-y-3 text-sm text-slate-800">
        {order.payment_method === "pix" && (
          <>
            <p>{order.payment_instructions || "Seu gerente comercial informou os dados PIX para pagamento deste pedido."}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {order.payment_pix_bank_name && <PaymentField label="Banco" value={order.payment_pix_bank_name} />}
              {order.payment_pix_beneficiary && <PaymentField label="Beneficiário" value={order.payment_pix_beneficiary} />}
              {order.payment_pix_key && <PaymentField label="Chave PIX" value={order.payment_pix_key} />}
              {order.payment_pix_amount && <PaymentField label="Valor" value={order.payment_pix_amount} />}
              {order.payment_pix_agency && <PaymentField label="Agência" value={order.payment_pix_agency} />}
              {order.payment_pix_account && <PaymentField label="Conta" value={order.payment_pix_account} />}
            </div>
            {order.payment_copy_paste && (
              <div className="rounded-2xl border border-amber-200 bg-white p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">PIX copia e cola</div>
                <div className="mt-2 break-all text-xs text-slate-700">{order.payment_copy_paste}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => copyText(order.payment_copy_paste || "", "Código PIX copiado")}
                >
                  Copiar código PIX
                </Button>
              </div>
            )}
            {order.payment_pix_qr_code && (
              <div className="rounded-2xl border border-amber-200 bg-white p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">QR Code / Referência PIX</div>
                {isUrl(order.payment_pix_qr_code) ? (
                  <a href={order.payment_pix_qr_code} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-blue-700 underline">
                    Abrir QR Code
                  </a>
                ) : (
                  <div className="mt-2 break-all text-xs text-slate-700">{order.payment_pix_qr_code}</div>
                )}
              </div>
            )}
          </>
        )}

        {order.payment_method === "boleto" && (
          <>
            <p>{order.payment_instructions || "Seu boleto foi liberado. Use a linha digitável ou abra o PDF anexado."}</p>
            {order.payment_boleto_line && (
              <div className="rounded-2xl border border-amber-200 bg-white p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Linha digitável</div>
                <div className="mt-2 break-all text-xs text-slate-700">{order.payment_boleto_line}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => copyText(order.payment_boleto_line || "", "Linha digitável copiada")}
                >
                  Copiar linha digitável
                </Button>
              </div>
            )}
            {order.payment_boleto_pdf_url && (
              <Button asChild variant="outline" size="sm">
                <a href={order.payment_boleto_pdf_url} target="_blank" rel="noreferrer" download>
                  Abrir boleto em PDF
                </a>
              </Button>
            )}
          </>
        )}

        {order.payment_method === "credit_card" && (
          <>
            <p>{order.payment_instructions || "Seu gerente comercial liberou um link para pagamento em cartão."}</p>
            {order.payment_link_url && (
              <Button asChild variant="outline" size="sm">
                <a href={order.payment_link_url} target="_blank" rel="noreferrer">
                  Abrir link de pagamento
                </a>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PaymentField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm text-slate-800">{value}</div>
    </div>
  )
}

function getEstimatedDeliveryLabel() {
  const estimatedDate = new Date()
  estimatedDate.setHours(0, 0, 0, 0)
  estimatedDate.setDate(estimatedDate.getDate() + 15)

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
  }).format(estimatedDate)
}

function normalizeOrderStatus(status?: string | null) {
  if (status === "novo_pedido") return "aguardando_aprovacao"
  if (status === "pago") return "pedido_pago"
  if (status === "enviado") return "em_expedicao"
  if (status === "nota_fiscal") return "nota_fiscal_emitida"
  if (status === "rastreio") return "localizador_disponivel"
  return (status || "aguardando_aprovacao") as (typeof orderTimeline)[number]
}

function hasReached(target: (typeof orderTimeline)[number], current: (typeof orderTimeline)[number]) {
  return orderTimeline.indexOf(current) >= orderTimeline.indexOf(target)
}

function isUrl(value?: string | null) {
  if (!value) return false
  return /^https?:\/\//i.test(value)
}
