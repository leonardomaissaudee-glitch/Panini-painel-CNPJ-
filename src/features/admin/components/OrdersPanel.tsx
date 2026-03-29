import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp, CreditCard, QrCode, ReceiptText, RefreshCw, Upload, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/StatusBadge"
import {
  fetchOrders,
  updateOrderStatus,
  uploadOrderPaymentPdf,
  type OrderRow,
  type OrderStatus,
} from "@/features/admin/services/adminService"
import { ORDER_STATUS_OPTIONS, getOrderStatusLabel } from "@/shared/constants/orderStatus"

type OrderDraft = Partial<OrderRow> & {
  payment_boleto_pdf_file?: File | null
}

const validStatuses = new Set<OrderStatus>(ORDER_STATUS_OPTIONS.map((option) => option.value))

function normalizeAdminOrderStatus(status?: string | null): OrderStatus {
  if (!status) return "aguardando_aprovacao"

  const legacyMap: Partial<Record<OrderStatus, OrderStatus>> = {
    novo_pedido: "aguardando_aprovacao",
    pago: "pedido_pago",
    enviado: "em_expedicao",
    nota_fiscal: "nota_fiscal_emitida",
    rastreio: "localizador_disponivel",
  }

  const mapped = legacyMap[status as OrderStatus]
  if (mapped) return mapped
  if (validStatuses.has(status as OrderStatus)) return status as OrderStatus
  return "aguardando_aprovacao"
}

function getPaymentMethodLabel(method?: string | null) {
  if (method === "pix") return "PIX"
  if (method === "boleto") return "Boleto"
  if (method === "credit_card") return "Cartão"
  return "A definir"
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    const parts = [Reflect.get(error, "message"), Reflect.get(error, "details"), Reflect.get(error, "hint")]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    if (parts.length > 0) return parts.join(" | ")
  }
  return "Não foi possível concluir a operação."
}

function mergeOrderDraft(order: OrderRow, draft?: OrderDraft) {
  return {
    status: normalizeAdminOrderStatus(draft?.status ?? order.status),
    invoice_number: draft?.invoice_number ?? order.invoice_number ?? "",
    tracking_code: draft?.tracking_code ?? order.tracking_code ?? "",
    payment_instructions: draft?.payment_instructions ?? order.payment_instructions ?? "",
    payment_copy_paste: draft?.payment_copy_paste ?? order.payment_copy_paste ?? "",
    payment_link_url: draft?.payment_link_url ?? order.payment_link_url ?? "",
    payment_boleto_line: draft?.payment_boleto_line ?? order.payment_boleto_line ?? "",
    payment_boleto_pdf_url: draft?.payment_boleto_pdf_url ?? order.payment_boleto_pdf_url ?? "",
    payment_pix_bank_name: draft?.payment_pix_bank_name ?? order.payment_pix_bank_name ?? "",
    payment_pix_key: draft?.payment_pix_key ?? order.payment_pix_key ?? "",
    payment_pix_beneficiary: draft?.payment_pix_beneficiary ?? order.payment_pix_beneficiary ?? "",
    payment_pix_agency: draft?.payment_pix_agency ?? order.payment_pix_agency ?? "",
    payment_pix_account: draft?.payment_pix_account ?? order.payment_pix_account ?? "",
    payment_pix_amount: draft?.payment_pix_amount ?? order.payment_pix_amount ?? "",
    payment_pix_qr_code: draft?.payment_pix_qr_code ?? order.payment_pix_qr_code ?? "",
    payment_boleto_pdf_file: draft?.payment_boleto_pdf_file ?? null,
  }
}

function getDefaultPaymentInstructions(order: OrderRow, merged: ReturnType<typeof mergeOrderDraft>) {
  if (merged.payment_instructions?.trim()) return merged.payment_instructions
  if (order.payment_method === "boleto") return "Explique como o cliente deve usar o boleto e qual etapa vem depois do pagamento."
  if (order.payment_method === "pix") return "Descreva como o cliente deve efetuar o PIX e como confirmar o pagamento."
  if (order.payment_method === "credit_card") return "Explique como o cliente deve acessar o link e concluir o pagamento por cartão."
  return ""
}

export function OrdersPanel() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [editing, setEditing] = useState<Record<string, OrderDraft>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchOrders()
      setOrders(rows)
    } catch (error) {
      toast.error("Erro ao carregar pedidos", {
        description: getErrorMessage(error),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const orderedRows = useMemo(() => orders, [orders])

  const updateDraft = (orderId: string, patch: Partial<OrderDraft>) => {
    setEditing((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        ...patch,
      },
    }))
  }

  const toggleRow = (orderId: string) => {
    setExpanded((current) => ({
      ...current,
      [orderId]: !current[orderId],
    }))
  }

  const handlePdfChange = (orderId: string, file: File | null) => {
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Arquivo inválido", {
        description: "Envie um PDF válido para o boleto.",
      })
      return
    }

    updateDraft(orderId, { payment_boleto_pdf_file: file })
  }

  const validatePaymentData = (order: OrderRow, merged: ReturnType<typeof mergeOrderDraft>) => {
    if (merged.status !== "aguardando_pagamento") return

    if (order.payment_method === "boleto") {
      const hasLine = Boolean(merged.payment_boleto_line.trim())
      const hasPdf = Boolean(merged.payment_boleto_pdf_url || merged.payment_boleto_pdf_file)
      if (!hasLine && !hasPdf) {
        throw new Error("Preencha a linha digitável ou anexe o PDF do boleto antes de salvar.")
      }
    }

    if (order.payment_method === "pix") {
      const hasPixData =
        Boolean(merged.payment_pix_key.trim()) ||
        Boolean(merged.payment_copy_paste.trim()) ||
        Boolean(merged.payment_pix_qr_code.trim()) ||
        Boolean(merged.payment_instructions.trim())

      if (!hasPixData) {
        throw new Error("Preencha ao menos uma informação de pagamento PIX antes de salvar.")
      }
    }

    if (order.payment_method === "credit_card") {
      const hasCardData = Boolean(merged.payment_link_url.trim()) || Boolean(merged.payment_instructions.trim())
      if (!hasCardData) {
        throw new Error("Informe o link de pagamento ou as orientações do cartão antes de salvar.")
      }
    }
  }

  const handleUpdate = async (orderId: string) => {
    const order = orders.find((item) => item.id === orderId)
    if (!order) {
      toast.error("Pedido não encontrado", {
        description: "Atualize a lista e tente novamente.",
      })
      return
    }

    const merged = mergeOrderDraft(order, editing[orderId])

    try {
      validatePaymentData(order, merged)
      setSavingId(orderId)

      let boletoPdfUrl = merged.payment_boleto_pdf_url
      if (merged.payment_boleto_pdf_file) {
        boletoPdfUrl = await uploadOrderPaymentPdf(orderId, merged.payment_boleto_pdf_file)
      }

      await updateOrderStatus(orderId, merged.status, {
        invoice_number: merged.invoice_number || null,
        tracking_code: merged.tracking_code || null,
        payment_instructions: getDefaultPaymentInstructions(order, merged) || null,
        payment_copy_paste: merged.payment_copy_paste || null,
        payment_link_url: merged.payment_link_url || null,
        payment_boleto_line: merged.payment_boleto_line || null,
        payment_boleto_pdf_url: boletoPdfUrl || null,
        payment_pix_bank_name: merged.payment_pix_bank_name || null,
        payment_pix_key: merged.payment_pix_key || null,
        payment_pix_beneficiary: merged.payment_pix_beneficiary || null,
        payment_pix_agency: merged.payment_pix_agency || null,
        payment_pix_account: merged.payment_pix_account || null,
        payment_pix_amount: merged.payment_pix_amount || null,
        payment_pix_qr_code: merged.payment_pix_qr_code || null,
      })

      toast.success("Pedido atualizado", {
        description: "As informações do pedido foram salvas.",
      })

      setEditing((current) => {
        const next = { ...current }
        delete next[orderId]
        return next
      })

      await load()
    } catch (error) {
      toast.error("Erro ao atualizar", {
        description: getErrorMessage(error),
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Pedidos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cada pedido aparece em uma linha. Abra o detalhe para editar pagamento, status, NF e rastreio.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {orderedRows.map((order) => {
          const merged = mergeOrderDraft(order, editing[order.id])
          const isExpanded = Boolean(expanded[order.id])
          const isSaving = savingId === order.id
          const methodLabel = getPaymentMethodLabel(order.payment_method)
          const statusLabel = getOrderStatusLabel(normalizeAdminOrderStatus(merged.status))

          return (
            <div key={order.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 p-4 md:grid md:grid-cols-[1.1fr_1.1fr_0.7fr_0.8fr_0.9fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-950">Pedido {order.id.slice(0, 8).toUpperCase()}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {order.created_at ? new Date(order.created_at).toLocaleString("pt-BR") : "-"}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cliente</div>
                  <div className="truncate text-sm font-medium text-slate-900">{order.customer_name}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Valor</div>
                  <div className="text-sm font-semibold text-slate-950">R$ {Number(order.total || 0).toFixed(2)}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pagamento</div>
                  <div className="text-sm text-slate-700">{methodLabel}</div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</div>
                  <div className="mt-1">
                    <StatusBadge status={normalizeAdminOrderStatus(merged.status)} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => toggleRow(order.id)}>
                    {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {isExpanded ? "Fechar" : "Abrir"}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 px-4 pb-4 pt-4">
                  <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
                    <PaymentEditor
                      order={order}
                      merged={merged}
                      onChange={(patch) => updateDraft(order.id, patch)}
                      onPdfChange={(file) => handlePdfChange(order.id, file)}
                    />

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">Status e documentos</div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <FieldBox label="Status do pedido">
                            <select
                              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                              value={normalizeAdminOrderStatus(merged.status)}
                              onChange={(event) => updateDraft(order.id, { status: event.target.value as OrderStatus })}
                            >
                              {ORDER_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </FieldBox>

                          <FieldBox label="Status visível">
                            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                              {statusLabel}
                            </div>
                          </FieldBox>

                          <FieldBox label="Nota fiscal">
                            <Input
                              placeholder="Número da NF"
                              value={merged.invoice_number}
                              onChange={(event) => updateDraft(order.id, { invoice_number: event.target.value })}
                            />
                          </FieldBox>

                          <FieldBox label="Rastreamento">
                            <Input
                              placeholder="Código de rastreio"
                              value={merged.tracking_code}
                              onChange={(event) => updateDraft(order.id, { tracking_code: event.target.value })}
                            />
                          </FieldBox>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">Resumo operacional</div>
                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                          <p>Cliente ID: {order.cliente_id || "-"}</p>
                          <p>Status financeiro: {order.payment_status || "pending"}</p>
                          <p>E-mail: {order.customer_email}</p>
                          <p>Telefone: {order.customer_phone}</p>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button onClick={() => handleUpdate(order.id)} disabled={isSaving}>
                            {isSaving ? "Salvando..." : "Salvar"}
                          </Button>
                          {order.customer_phone && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                const phone = order.customer_phone.replace(/\D/g, "")
                                const text = encodeURIComponent(
                                  `Olá, ${order.customer_name}. Seu pedido ${order.id.slice(0, 8).toUpperCase()} foi atualizado.`
                                )
                                window.open(`https://wa.me/${phone}?text=${text}`, "_blank")
                              }}
                            >
                              Notificar no WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {!loading && orderedRows.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
            Nenhum pedido encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PaymentEditor({
  order,
  merged,
  onChange,
  onPdfChange,
}: {
  order: OrderRow
  merged: ReturnType<typeof mergeOrderDraft>
  onChange: (patch: Partial<OrderDraft>) => void
  onPdfChange: (file: File | null) => void
}) {
  if (order.payment_method === "boleto") {
    return (
      <SectionCard icon={<ReceiptText className="h-4 w-4 text-amber-600" />} title="Dados do boleto">
        <FieldBox label="Linha digitável">
          <Textarea
            rows={3}
            placeholder="Cole a linha digitável do boleto"
            value={merged.payment_boleto_line}
            onChange={(event) => onChange({ payment_boleto_line: event.target.value })}
          />
        </FieldBox>

        <FieldBox label="Orientações ao cliente">
          <Textarea
            rows={5}
            placeholder="Explique como o cliente deve usar o boleto e qual etapa vem depois do pagamento."
            value={merged.payment_instructions}
            onChange={(event) => onChange({ payment_instructions: event.target.value })}
          />
        </FieldBox>

        <FieldBox label="PDF do boleto">
          <div className="space-y-3">
            <Input type="file" accept="application/pdf" onChange={(event) => onPdfChange(event.target.files?.[0] ?? null)} />
            {merged.payment_boleto_pdf_file && (
              <div className="text-xs text-slate-500">Arquivo selecionado: {merged.payment_boleto_pdf_file.name}</div>
            )}
            {merged.payment_boleto_pdf_url && (
              <Button asChild variant="outline" size="sm">
                <a href={merged.payment_boleto_pdf_url} target="_blank" rel="noreferrer">
                  <Upload className="mr-2 h-4 w-4" />
                  Abrir PDF atual
                </a>
              </Button>
            )}
          </div>
        </FieldBox>
      </SectionCard>
    )
  }

  if (order.payment_method === "pix") {
    return (
      <SectionCard icon={<QrCode className="h-4 w-4 text-blue-700" />} title="Dados PIX">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldBox label="Orientações">
            <Textarea
              rows={6}
              placeholder="Descreva como o cliente deve efetuar o PIX."
              value={merged.payment_instructions}
              onChange={(event) => onChange({ payment_instructions: event.target.value })}
            />
          </FieldBox>

          <div className="grid gap-4">
            <FieldBox label="PIX copia e cola">
              <Textarea
                rows={4}
                placeholder="Cole o código PIX copia e cola"
                value={merged.payment_copy_paste}
                onChange={(event) => onChange({ payment_copy_paste: event.target.value })}
              />
            </FieldBox>

            <FieldBox label="QR code / link do QR code">
              <Input
                placeholder="Link do QR code ou referência"
                value={merged.payment_pix_qr_code}
                onChange={(event) => onChange({ payment_pix_qr_code: event.target.value })}
              />
            </FieldBox>
          </div>

          <FieldBox label="Banco">
            <Input
              placeholder="Nome do banco"
              value={merged.payment_pix_bank_name}
              onChange={(event) => onChange({ payment_pix_bank_name: event.target.value })}
            />
          </FieldBox>

          <FieldBox label="Beneficiário">
            <Input
              placeholder="Nome do beneficiário"
              value={merged.payment_pix_beneficiary}
              onChange={(event) => onChange({ payment_pix_beneficiary: event.target.value })}
            />
          </FieldBox>

          <FieldBox label="Chave PIX">
            <Input
              placeholder="Chave aleatória / CNPJ / e-mail / telefone"
              value={merged.payment_pix_key}
              onChange={(event) => onChange({ payment_pix_key: event.target.value })}
            />
          </FieldBox>

          <FieldBox label="Valor">
            <Input
              placeholder="Ex.: R$ 5.170,28"
              value={merged.payment_pix_amount}
              onChange={(event) => onChange({ payment_pix_amount: event.target.value })}
            />
          </FieldBox>

          <FieldBox label="Agência">
            <Input
              placeholder="Agência"
              value={merged.payment_pix_agency}
              onChange={(event) => onChange({ payment_pix_agency: event.target.value })}
            />
          </FieldBox>

          <FieldBox label="Conta">
            <Input
              placeholder="Conta"
              value={merged.payment_pix_account}
              onChange={(event) => onChange({ payment_pix_account: event.target.value })}
            />
          </FieldBox>
        </div>
      </SectionCard>
    )
  }

  if (order.payment_method === "credit_card") {
    return (
      <SectionCard icon={<CreditCard className="h-4 w-4 text-blue-700" />} title="Pagamento por cartão">
        <FieldBox label="Link de pagamento">
          <Input
            placeholder="Cole o link de pagamento"
            value={merged.payment_link_url}
            onChange={(event) => onChange({ payment_link_url: event.target.value })}
          />
        </FieldBox>

        <FieldBox label="Orientações ao cliente">
          <Textarea
            rows={5}
            placeholder="Descreva prazo, parcelamento ou instruções adicionais."
            value={merged.payment_instructions}
            onChange={(event) => onChange({ payment_instructions: event.target.value })}
          />
        </FieldBox>
      </SectionCard>
    )
  }

  return (
    <SectionCard icon={<Wallet className="h-4 w-4 text-blue-700" />} title="Informações de pagamento">
      <FieldBox label="Orientações gerais">
        <Textarea
          rows={5}
          placeholder="Informe como o pagamento deve ser tratado para este pedido."
          value={merged.payment_instructions}
          onChange={(event) => onChange({ payment_instructions: event.target.value })}
        />
      </FieldBox>
    </SectionCard>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        {icon}
        {title}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  )
}

function FieldBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</Label>
      {children}
    </div>
  )
}
