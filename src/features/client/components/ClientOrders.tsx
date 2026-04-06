import { type ReactNode, useEffect, useMemo, useState } from "react"
import { BellDot, ChevronDown, ChevronUp, FileText, Link as LinkIcon, Upload } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchMyOrders, submitClientPaymentReceipt, uploadClientPaymentReceipt } from "@/features/client/services/clientService"
import type { OrderRow } from "@/features/admin/services/adminService"
import { getOrderStatusLabel } from "@/shared/constants/orderStatus"
import { StatusBadge } from "@/components/StatusBadge"
import { calculateAutomaticOrderPricing } from "@/shared/utils/orderPricing"

const orderTimeline = [
  "aguardando_aprovacao",
  "aguardando_pagamento",
  "aguardando_verificacao_financeira",
  "pedido_pago",
  "em_expedicao",
  "nota_fiscal_emitida",
  "localizador_disponivel",
  "pedido_entregue",
] as const

type OrderTimelineStatus = (typeof orderTimeline)[number]

type ReceiptDraft = {
  file: File | null
  uploading: boolean
}

export function ClientOrders({
  email,
  onRefreshReady,
}: {
  email: string | undefined
  onRefreshReady?: (refresh: () => Promise<void>) => void
}) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [summaryExpanded, setSummaryExpanded] = useState<Record<string, boolean>>({})
  const [receiptDrafts, setReceiptDrafts] = useState<Record<string, ReceiptDraft>>({})
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

  const ordersById = useMemo(() => Object.fromEntries(orders.map((order) => [order.id, order])), [orders])

  const updateReceiptDraft = (orderId: string, patch: Partial<ReceiptDraft>) => {
    setReceiptDrafts((current) => ({
      ...current,
      [orderId]: {
        file: current[orderId]?.file ?? null,
        uploading: current[orderId]?.uploading ?? false,
        ...patch,
      },
    }))
  }

  const handleConfirmPayment = async (orderId: string) => {
    const order = ordersById[orderId]
    const draft = receiptDrafts[orderId]

    if (!order) return

    if (!draft?.file && !order.payment_receipt_url) {
      toast.error("Insira o comprovante.")
      return
    }

    try {
      updateReceiptDraft(orderId, { uploading: true })
      let receiptUrl = order.payment_receipt_url || ""
      let receiptName = order.payment_receipt_name || ""

      if (draft?.file) {
        receiptUrl = await uploadClientPaymentReceipt(orderId, draft.file)
        receiptName = draft.file.name
      }

      await submitClientPaymentReceipt({
        orderId,
        receiptUrl,
        receiptName,
      })

      toast.success("Comprovante enviado", {
        description: "Seu pedido agora está aguardando verificação do time financeiro.",
      })

      setReceiptDrafts((current) => ({
        ...current,
        [orderId]: {
          file: null,
          uploading: false,
        },
      }))

      await load()
      setExpandedId(orderId)
    } catch (e: any) {
      toast.error("Erro ao enviar comprovante", { description: e.message })
      updateReceiptDraft(orderId, { uploading: false })
    }
  }

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
      <CardContent className="space-y-3">
        {orders.map((order) => {
          const normalizedStatus = normalizeOrderStatus(order.status)
          const isExpanded = expandedId === order.id
          const draft = receiptDrafts[order.id]
          const hasInvoiceLink = isUrl(order.invoice_number)
          const hasTrackingLink = isUrl(order.tracking_code)
          const automaticPricing = calculateAutomaticOrderPricing(Number(order.subtotal || 0), order.payment_method)
          const automaticDiscountAmount = Number(order.automatic_discount_amount ?? automaticPricing.automaticDiscount)
          const manualDiscountAmount = Number(order.admin_discount_amount || 0)
          const bonusAmount = Number(order.admin_bonus_amount || 0)
          const finalTotal = Number(
            Math.max(0, Number(order.subtotal || 0) - automaticDiscountAmount - manualDiscountAmount - bonusAmount).toFixed(2)
          )

          return (
            <div key={order.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-3 p-4 md:grid-cols-[1fr_1.2fr_0.8fr_0.9fr_0.9fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-slate-950">Pedido {order.id.slice(0, 8).toUpperCase()}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {order.created_at ? new Date(order.created_at).toLocaleString("pt-BR") : "-"}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cliente</div>
                  <div className="truncate text-sm font-medium text-slate-900">{order.customer_name}</div>
                </div>

                <Metric label="Valor" value={formatMoney(finalTotal)} />
                <Metric label="Pagamento" value={getPaymentMethodLabel(order.payment_method)} />

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</div>
                  <StatusBadge status={normalizedStatus} />
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setExpandedId((current) => (current === order.id ? null : order.id))}>
                    {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {isExpanded ? "Fechar" : "Abrir"}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-4 border-t border-slate-200 px-4 pb-4 pt-4">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">Linha do pedido</div>
                      <div className="mt-4">
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
                          {orderTimeline.map((step) => {
                            const isActive = step === normalizedStatus
                            const isReached = hasReached(step, normalizedStatus)

                            return (
                              <div
                                key={step}
                                className={[
                                  "rounded-2xl border px-3 py-3 text-sm transition",
                                  isActive
                                    ? "border-blue-900 bg-blue-950 text-white"
                                    : isReached
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                      : "border-slate-200 bg-slate-50 text-slate-500",
                                ].join(" ")}
                              >
                                {getCompactOrderStatusLabel(step)}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <Metric
                          label="Nota fiscal"
                          value={hasInvoiceLink ? "Disponível" : order.invoice_number || "Aguardando"}
                          icon={hasInvoiceLink ? <BellDot className="h-4 w-4 text-amber-500" /> : undefined}
                          action={
                            hasInvoiceLink ? (
                              <a href={order.invoice_number!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline">
                                <FileText className="h-4 w-4" />
                                Abrir nota fiscal
                              </a>
                            ) : undefined
                          }
                        />
                        <Metric
                          label="Localizador"
                          value={hasTrackingLink ? "Disponível" : order.tracking_code || "Aguardando"}
                          icon={hasTrackingLink ? <BellDot className="h-4 w-4 text-amber-500" /> : undefined}
                          action={
                            hasTrackingLink ? (
                              <a href={order.tracking_code!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline">
                                <LinkIcon className="h-4 w-4" />
                                Abrir localizador
                              </a>
                            ) : undefined
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo do pedido</div>
                        <div className="mt-2 space-y-1 text-sm text-slate-700">
                          <p>Status atual: {getOrderStatusLabel(normalizedStatus)}</p>
                          <p>Forma de pagamento: {getPaymentMethodLabel(order.payment_method)}</p>
                          <p>Previsão de entrega: {estimatedDeliveryLabel}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSummaryExpanded((current) => ({
                            ...current,
                            [order.id]: !current[order.id],
                          }))
                        }
                      >
                        {summaryExpanded[order.id] ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Fechar resumo
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Expandir resumo
                          </>
                        )}
                      </Button>
                    </div>

                    {summaryExpanded[order.id] && (
                      <div className="mt-4 space-y-3">
                        {(order.items ?? []).map((item, index) => {
                          const quantity = Number((item.quantity as number) || 0)
                          const subtotal = Number((item.subtotal as number) || 0)
                          return (
                            <div key={`${order.id}-item-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="text-sm font-semibold text-slate-900">{String(item.name ?? "Produto")}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                Ref. {String(item.reference ?? "-")} · Qtde: {quantity}
                              </div>
                              <div className="mt-2 text-sm font-medium text-slate-800">Subtotal: R$ {subtotal.toFixed(2)}</div>
                            </div>
                          )
                        })}

                        {(automaticDiscountAmount > 0 || manualDiscountAmount > 0) && (
                          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3">
                            <div className="text-sm font-semibold text-blue-950">Descontos aplicados</div>
                            <div className="mt-3 space-y-2 text-xs text-blue-900">
                              {automaticPricing.planDiscount > 0 && automaticDiscountAmount === automaticPricing.automaticDiscount ? (
                                <div className="flex items-center justify-between gap-3">
                                  <span>Desconto do plano{automaticPricing.tier ? ` (${automaticPricing.tier.name} ${automaticPricing.tier.percentage}%)` : ""}</span>
                                  <span className="font-semibold">- {formatMoney(automaticPricing.planDiscount)}</span>
                                </div>
                              ) : null}
                              {automaticPricing.pixDiscount > 0 && automaticDiscountAmount === automaticPricing.automaticDiscount ? (
                                <div className="flex items-center justify-between gap-3">
                                  <span>Desconto adicional PIX</span>
                                  <span className="font-semibold">- {formatMoney(automaticPricing.pixDiscount)}</span>
                                </div>
                              ) : null}
                              {automaticDiscountAmount > 0 && automaticDiscountAmount !== automaticPricing.automaticDiscount ? (
                                <div className="flex items-center justify-between gap-3">
                                  <span>Desconto automático ajustado</span>
                                  <span className="font-semibold">- {formatMoney(automaticDiscountAmount)}</span>
                                </div>
                              ) : null}
                              {manualDiscountAmount > 0 ? (
                                <div className="flex items-center justify-between gap-3">
                                  <span>Desconto manual do pedido</span>
                                  <span className="font-semibold">- {formatMoney(manualDiscountAmount)}</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {order.admin_bonus_type === "value" && Number(order.admin_bonus_amount || 0) > 0 ? (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                            <div className="text-sm font-semibold text-emerald-900">Bonificação financeira</div>
                            <div className="mt-1 text-xs text-emerald-800">
                              Crédito aplicado ao pedido: R$ {Number(order.admin_bonus_amount || 0).toFixed(2)}
                            </div>
                          </div>
                        ) : null}

                        {order.admin_bonus_type === "item" && order.admin_bonus_product_name ? (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                            <div className="text-sm font-semibold text-emerald-900">Bonificação em produto</div>
                            <div className="mt-1 text-xs text-emerald-800">
                              {order.admin_bonus_product_name} · Qtde: {Number(order.admin_bonus_quantity || 1)}
                            </div>
                          </div>
                        ) : null}

                        {Array.isArray(order.gift_items) && order.gift_items.length ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                            <div className="text-sm font-semibold text-amber-900">Brindes adicionados</div>
                            <div className="mt-3 space-y-2">
                              {order.gift_items.map((gift, index) => (
                                <div key={`${order.id}-gift-${index}`} className="rounded-2xl border border-amber-200 bg-white p-3">
                                  <div className="text-sm font-semibold text-slate-900">{gift.name}</div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    Qtde: {gift.quantity}
                                    {gift.reference ? ` · Ref. ${gift.reference}` : ""}
                                  </div>
                                  {gift.description ? <div className="mt-2 text-xs text-slate-600">{gift.description}</div> : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="text-sm font-semibold text-slate-900">Resumo financeiro</div>
                          <div className="mt-3 space-y-2 text-xs text-slate-600">
                            <div className="flex items-center justify-between gap-3">
                              <span>Subtotal original</span>
                              <span className="font-semibold text-slate-900">{formatMoney(Number(order.subtotal || 0))}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Total final</span>
                              <span className="font-semibold text-slate-900">{formatMoney(finalTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {normalizedStatus === "aguardando_pagamento" && (
                    <PaymentInfoCard
                      order={order}
                      draft={draft}
                      onReceiptSelect={(file) => updateReceiptDraft(order.id, { file })}
                      onConfirm={() => handleConfirmPayment(order.id)}
                    />
                  )}

                  {normalizedStatus === "aguardando_verificacao_financeira" && (
                    <InfoMessage>
                      Seu comprovante foi recebido. O pedido está aguardando verificação do time financeiro.
                    </InfoMessage>
                  )}

                  {hasReached("pedido_pago", normalizedStatus) && normalizedStatus !== "aguardando_pagamento" && normalizedStatus !== "aguardando_verificacao_financeira" && (
                    <InfoMessage>
                      Seu pedido foi pago e está sendo expedido. Em breve novas atualizações serão exibidas aqui.
                    </InfoMessage>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {orders.length === 0 && !loading && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
            Nenhum pedido encontrado. Finalize seu primeiro pedido pelo carrinho para começar a acompanhar o fluxo.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PaymentInfoCard({
  order,
  draft,
  onReceiptSelect,
  onConfirm,
}: {
  order: OrderRow
  draft?: ReceiptDraft
  onReceiptSelect: (file: File | null) => void
  onConfirm: () => void
}) {
  const copyText = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(successMessage)
    } catch {
      toast.error("Não foi possível copiar o conteúdo.")
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Informações de pagamento</div>
      <div className="mt-3 space-y-4 text-sm text-slate-800">
        {order.payment_method === "pix" && (
          <>
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
                <Button variant="outline" size="sm" className="mt-3" onClick={() => copyText(order.payment_copy_paste || "", "Código PIX copiado")}>
                  Copiar código PIX
                </Button>
              </div>
            )}

            {order.payment_pix_qr_code && (
              <div className="rounded-2xl border border-amber-200 bg-white p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">QR code / referência PIX</div>
                {isUrl(order.payment_pix_qr_code) ? (
                  <a href={order.payment_pix_qr_code} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline">
                    <LinkIcon className="h-4 w-4" />
                    Abrir QR code
                  </a>
                ) : (
                  <div className="mt-2 break-all text-xs text-slate-700">{order.payment_pix_qr_code}</div>
                )}
              </div>
            )}
          </>
        )}

        {order.payment_method === "boleto" && (
          <div className="rounded-2xl border border-amber-200 bg-white p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Boleto</div>
            <div className="mt-2 break-all text-xs text-slate-700">{order.payment_boleto_line || "Linha digitável não informada."}</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {order.payment_boleto_line && (
                <Button variant="outline" size="sm" onClick={() => copyText(order.payment_boleto_line || "", "Linha digitável copiada")}>
                  Copiar linha digitável
                </Button>
              )}
              {order.payment_boleto_pdf_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={order.payment_boleto_pdf_url} target="_blank" rel="noreferrer" download>
                    Baixar boleto em PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {order.payment_method === "credit_card" && order.payment_link_url && (
          <Button asChild variant="outline" size="sm">
            <a href={order.payment_link_url} target="_blank" rel="noreferrer">
              Abrir link de pagamento
            </a>
          </Button>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Comprovante de pagamento</div>
          <div className="mt-3 space-y-3">
            <Input
              type="file"
              accept="application/pdf,image/*"
              onChange={(event) => onReceiptSelect(event.target.files?.[0] ?? null)}
            />
            {draft?.file && <div className="text-xs text-slate-500">Arquivo selecionado: {draft.file.name}</div>}
            <Button onClick={onConfirm} disabled={draft?.uploading}>
              <Upload className="mr-2 h-4 w-4" />
              {draft?.uploading ? "Enviando..." : "Já efetuei o pagamento"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  icon,
  action,
}: {
  label: string
  value: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
      {action && <div className="mt-2">{action}</div>}
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

function InfoMessage({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      {children}
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0))
}

function normalizeOrderStatus(status?: string | null): OrderTimelineStatus {
  if (status === "novo_pedido") return "aguardando_aprovacao"
  if (status === "pago") return "pedido_pago"
  if (status === "enviado") return "em_expedicao"
  if (status === "nota_fiscal") return "nota_fiscal_emitida"
  if (status === "rastreio") return "localizador_disponivel"
  return (status || "aguardando_aprovacao") as OrderTimelineStatus
}

function hasReached(target: OrderTimelineStatus, current: OrderTimelineStatus) {
  return orderTimeline.indexOf(current) >= orderTimeline.indexOf(target)
}

function isUrl(value?: string | null) {
  if (!value) return false
  return /^https?:\/\//i.test(value)
}

function getPaymentMethodLabel(method?: string | null) {
  if (method === "pix") return "PIX"
  if (method === "boleto") return "Boleto"
  if (method === "credit_card") return "Cartão"
  return "A definir"
}

function getCompactOrderStatusLabel(status: OrderTimelineStatus) {
  const labels: Record<OrderTimelineStatus, string> = {
    aguardando_aprovacao: "Pedido feito",
    aguardando_pagamento: "Aguard. pagto",
    aguardando_verificacao_financeira: "Verif. fin.",
    pedido_pago: "Pago",
    em_expedicao: "Expedição",
    nota_fiscal_emitida: "NF emitida",
    localizador_disponivel: "Localizador",
    pedido_entregue: "Entregue",
  }

  return labels[status]
}
