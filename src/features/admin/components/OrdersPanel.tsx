import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp, Eye, PackagePlus, Receipt, RefreshCw, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { products } from "@/data/products"
import {
  deleteOrder,
  fetchGifts,
  fetchOrders,
  fetchManagedOrders,
  saveOrder,
  uploadOrderPaymentPdf,
  type GiftCatalogRow,
  type GiftItemRow,
  type OrderItemRow,
  type OrderRow,
  type OrderStatus,
} from "@/features/admin/services/adminService"
import { ORDER_STATUS_OPTIONS } from "@/shared/constants/orderStatus"
import { getDefaultEstimatedDeliveryDate, resolveOrderEstimatedDeliveryDate, toDateInputValue } from "@/shared/utils/orderDelivery"
import { calculateAutomaticOrderPricing } from "@/shared/utils/orderPricing"

type StatusTab =
  | "todos"
  | "pendente"
  | "aguardando_pagamento"
  | "pago"
  | "em_analise"
  | "em_processamento"
  | "enviado"
  | "finalizado"
  | "cancelado"

type DiscountType = "none" | "percent" | "value"
type BonusType = "none" | "value" | "item"
type PaymentMethod = "pix" | "boleto" | "credit_card"

type EditableOrderItem = {
  id: string
  productId: string
  name: string
  category?: string | null
  reference?: string | null
  quantity: number
  price: number
}

type EditableGiftItem = {
  gift_id: string
  quantity: number
}

type OrderDraft = {
  status: OrderStatus
  payment_method: PaymentMethod
  items: EditableOrderItem[]
  estimated_delivery_date: string
  invoice_number: string
  tracking_code: string
  payment_instructions: string
  payment_copy_paste: string
  payment_link_url: string
  payment_boleto_line: string
  payment_pix_bank_name: string
  payment_pix_key: string
  payment_pix_beneficiary: string
  payment_pix_agency: string
  payment_pix_account: string
  payment_pix_amount: string
  payment_pix_qr_code: string
  automatic_discount_amount: string
  automatic_discount_overridden: boolean
  admin_discount_type: DiscountType
  admin_discount_value: string
  admin_bonus_type: BonusType
  admin_bonus_value: string
  admin_bonus_product_id: string
  admin_bonus_quantity: number
  gift_items: EditableGiftItem[]
}

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendente" },
  { value: "aguardando_pagamento", label: "Aguardando pagamento" },
  { value: "pago", label: "Pago" },
  { value: "em_analise", label: "Em analise" },
  { value: "em_processamento", label: "Em processamento" },
  { value: "enviado", label: "Enviado" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
]

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "credit_card", label: "Cartao" },
]

const productMap = new Map(products.map((product) => [product.id, product]))

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0))
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
}

function formatOrderCode(orderId: string) {
  return `Pedido ${orderId.slice(0, 8).toUpperCase()}`
}

function formatPaymentMethod(value?: string | null) {
  if (value === "pix") return "PIX"
  if (value === "boleto") return "Boleto"
  if (value === "credit_card") return "Cartao"
  return value || "-"
}

function normalizeOrderStatus(status?: string | null): OrderStatus {
  if (status === "novo_pedido") return "aguardando_aprovacao"
  if (status === "pago") return "pedido_pago"
  if (status === "enviado") return "em_expedicao"
  if (status === "nota_fiscal") return "nota_fiscal_emitida"
  if (status === "rastreio") return "localizador_disponivel"
  return (status as OrderStatus) || "aguardando_aprovacao"
}

function getStatusTab(status?: string | null): StatusTab {
  const normalized = normalizeOrderStatus(status)
  if (normalized === "aguardando_aprovacao") return "pendente"
  if (normalized === "aguardando_pagamento") return "aguardando_pagamento"
  if (normalized === "aguardando_verificacao_financeira") return "em_analise"
  if (normalized === "pedido_pago") return "pago"
  if (normalized === "em_expedicao" || normalized === "nota_fiscal_emitida") return "em_processamento"
  if (normalized === "localizador_disponivel" || normalized === "pedido_com_transportadora" || normalized === "pedido_em_rota") return "enviado"
  if (normalized === "pedido_entregue") return "finalizado"
  if (normalized === "cancelado") return "cancelado"
  return "todos"
}

function isImageResource(url?: string | null) {
  return Boolean(url && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url))
}

function parseNumber(value: string) {
  const normalized = Number(String(value).replace(",", "."))
  return Number.isFinite(normalized) ? normalized : 0
}

function createEmptyItem(): EditableOrderItem {
  const product = products[0]
  return {
    id: crypto.randomUUID(),
    productId: product?.id || "",
    name: product?.name || "Produto",
    category: product?.category || "",
    reference: product?.reference || "",
    quantity: Math.max(1, product?.wholesaleMin || 1),
    price: Number(product?.price || 0),
  }
}

function createEmptyGift(): EditableGiftItem {
  return {
    gift_id: "",
    quantity: 1,
  }
}

function toEditableItem(item: OrderItemRow): EditableOrderItem {
  const matchedProduct = productMap.get(item.id)
  return {
    id: item.id || crypto.randomUUID(),
    productId: matchedProduct?.id || item.id || "",
    name: matchedProduct?.name || item.name,
    category: matchedProduct?.category || item.category || "",
    reference: matchedProduct?.reference || item.reference || "",
    quantity: Math.max(1, Number(item.quantity || 1)),
    price: Number(item.price || 0),
  }
}

function buildDraft(order: OrderRow): OrderDraft {
  const derivedSubtotal =
    Array.isArray(order.items) && order.items.length > 0
      ? Number(order.items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0).toFixed(2))
      : Number(order.subtotal || 0)
  const automaticDefault = calculateAutomaticOrderPricing(derivedSubtotal, order.payment_method).automaticDiscount
  const storedAutomaticDiscount = Number(order.automatic_discount_amount ?? automaticDefault)
  const automaticDiscountAmount = Number.isFinite(storedAutomaticDiscount) ? storedAutomaticDiscount : automaticDefault
  return {
    status: normalizeOrderStatus(order.status),
    payment_method: (order.payment_method as PaymentMethod) || "pix",
    items: Array.isArray(order.items) && order.items.length > 0 ? order.items.map(toEditableItem) : [createEmptyItem()],
    estimated_delivery_date: toDateInputValue(
      resolveOrderEstimatedDeliveryDate({
        estimatedDeliveryDate: order.estimated_delivery_date,
        createdAt: order.created_at,
      }) ?? getDefaultEstimatedDeliveryDate(order.created_at)
    ),
    invoice_number: order.invoice_number || "",
    tracking_code: order.tracking_code || "",
    payment_instructions: order.payment_instructions || "",
    payment_copy_paste: order.payment_copy_paste || "",
    payment_link_url: order.payment_link_url || "",
    payment_boleto_line: order.payment_boleto_line || "",
    payment_pix_bank_name: order.payment_pix_bank_name || "",
    payment_pix_key: order.payment_pix_key || "",
    payment_pix_beneficiary: order.payment_pix_beneficiary || "",
    payment_pix_agency: order.payment_pix_agency || "",
    payment_pix_account: order.payment_pix_account || "",
    payment_pix_amount: order.payment_pix_amount || "",
    payment_pix_qr_code: order.payment_pix_qr_code || "",
    automatic_discount_amount: String(automaticDiscountAmount),
    automatic_discount_overridden: Math.abs(automaticDiscountAmount - automaticDefault) > 0.01,
    admin_discount_type: order.admin_discount_type || "none",
    admin_discount_value: order.admin_discount_value ? String(order.admin_discount_value) : "",
    admin_bonus_type: order.admin_bonus_type || "none",
    admin_bonus_value: order.admin_bonus_value ? String(order.admin_bonus_value) : "",
    admin_bonus_product_id: order.admin_bonus_product_id || "",
    admin_bonus_quantity: Math.max(1, Number(order.admin_bonus_quantity || 1)),
    gift_items:
      Array.isArray(order.gift_items) && order.gift_items.length
        ? order.gift_items.map((item) => ({
            gift_id: item.gift_id,
            quantity: Math.max(1, Number(item.quantity || 1)),
          }))
        : [],
  }
}

function syncAutomaticDiscountDraft(draft: OrderDraft) {
  if (draft.automatic_discount_overridden) return draft
  const originalSubtotal = Number(draft.items.reduce((sum, item) => sum + Math.max(1, item.quantity) * Math.max(0, item.price), 0).toFixed(2))
  const automaticDefault = calculateAutomaticOrderPricing(originalSubtotal, draft.payment_method).automaticDiscount
  return {
    ...draft,
    automatic_discount_amount: String(automaticDefault),
  }
}

function calculateDraftTotals(draft: OrderDraft) {
  const originalSubtotal = Number(draft.items.reduce((sum, item) => sum + Math.max(1, item.quantity) * Math.max(0, item.price), 0).toFixed(2))
  const automaticPricing = calculateAutomaticOrderPricing(originalSubtotal, draft.payment_method)
  const automaticDiscountAmount = Number(
    Math.min(originalSubtotal, Math.max(0, parseNumber(draft.automatic_discount_amount || String(automaticPricing.automaticDiscount)))).toFixed(2)
  )
  let manualDiscountAmount = 0
  const discountValue = parseNumber(draft.admin_discount_value)
  const subtotalAfterAutomatic = Math.max(0, originalSubtotal - automaticDiscountAmount)
  if (draft.admin_discount_type === "percent") manualDiscountAmount = Number((subtotalAfterAutomatic * (discountValue / 100)).toFixed(2))
  else if (draft.admin_discount_type === "value") manualDiscountAmount = Number(Math.min(subtotalAfterAutomatic, discountValue).toFixed(2))

  let bonusAmount = 0
  const bonusValue = parseNumber(draft.admin_bonus_value)
  let bonusProductName = ""
  if (draft.admin_bonus_type === "value") {
    bonusAmount = Number(Math.min(Math.max(0, subtotalAfterAutomatic - manualDiscountAmount), bonusValue).toFixed(2))
  }
  else if (draft.admin_bonus_type === "item") {
    const bonusProduct = productMap.get(draft.admin_bonus_product_id)
    bonusProductName = bonusProduct?.name || ""
    bonusAmount = Number((Math.max(0, bonusProduct?.price || 0) * Math.max(1, draft.admin_bonus_quantity)).toFixed(2))
  }

  const total = Number(Math.max(0, originalSubtotal - automaticDiscountAmount - manualDiscountAmount - bonusAmount).toFixed(2))
  return {
    originalSubtotal,
    planDiscountAmount: automaticPricing.planDiscount,
    pixDiscountAmount: automaticPricing.pixDiscount,
    automaticDefaultAmount: automaticPricing.automaticDiscount,
    automaticDiscountAmount,
    manualDiscountAmount,
    bonusAmount,
    total,
    items: draft.items.map((item) => ({
      id: item.productId || item.id,
      name: item.name,
      category: item.category || null,
      reference: item.reference || null,
      quantity: Math.max(1, item.quantity),
      price: Number(item.price.toFixed(2)),
      subtotal: Number((Math.max(1, item.quantity) * Math.max(0, item.price)).toFixed(2)),
    })),
    bonusProductName,
    discountTier: automaticPricing.tier,
  }
}

function getOrderSearchText(order: OrderRow) {
  return [order.id, order.customer_name, order.customer_email, order.customer_phone, order.customer_cpf].filter(Boolean).join(" ").toLowerCase()
}

export function OrdersPanel({
  mode = "admin",
  managerUserId,
  managerEmail,
}: {
  mode?: "admin" | "manager"
  managerUserId?: string
  managerEmail?: string | null
}) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [gifts, setGifts] = useState<GiftCatalogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<StatusTab>("todos")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [drafts, setDrafts] = useState<Record<string, OrderDraft>>({})
  const [boletoFiles, setBoletoFiles] = useState<Record<string, File | null>>({})
  const giftMap = useMemo(() => new Map(gifts.map((gift) => [gift.id, gift])), [gifts])

  const load = async (loadMode: "initial" | "refresh" = "initial") => {
    if (loadMode === "initial") setLoading(true)
    else setRefreshing(true)

    try {
      const [data, giftRows] = await Promise.all([
        mode === "manager" && managerUserId ? fetchManagedOrders(managerUserId, managerEmail) : fetchOrders(),
        fetchGifts(),
      ])
      setOrders(data)
      setGifts(giftRows.filter((gift) => gift.is_active))
      setDrafts((current) => {
        const next = { ...current }
        data.forEach((order) => {
          if (!next[order.id]) next[order.id] = buildDraft(order)
        })
        Object.keys(next).forEach((orderId) => {
          if (!data.some((order) => order.id === orderId)) delete next[orderId]
        })
        return next
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel carregar os pedidos."
      toast.error("Erro ao carregar pedidos", { description: message })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [managerEmail, managerUserId, mode])

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesTab = activeTab === "todos" || getStatusTab(order.status) === activeTab
      const matchesSearch = !term || getOrderSearchText(order).includes(term)
      return matchesTab && matchesSearch
    })
  }, [orders, search, activeTab])

  const updateDraft = (orderId: string, updater: (current: OrderDraft) => OrderDraft) => {
    setDrafts((current) => {
      const order = orders.find((row) => row.id === orderId)
      if (!order) return current
      return { ...current, [orderId]: syncAutomaticDiscountDraft(updater(current[orderId] ?? buildDraft(order))) }
    })
  }

  const setField = <K extends keyof OrderDraft>(orderId: string, key: K, value: OrderDraft[K]) => {
    updateDraft(orderId, (current) => {
      if (key === "automatic_discount_amount") {
        return {
          ...current,
          automatic_discount_amount: String(value ?? ""),
          automatic_discount_overridden: true,
        }
      }

      if (key === "automatic_discount_overridden") {
        return {
          ...current,
          automatic_discount_overridden: Boolean(value),
        }
      }

      return { ...current, [key]: value }
    })
  }

  const resetAutomaticDiscount = (orderId: string) => {
    updateDraft(orderId, (current) => ({
      ...current,
      automatic_discount_overridden: false,
    }))
  }

  const updateItem = (orderId: string, itemId: string, updater: (item: EditableOrderItem) => EditableOrderItem) => {
    updateDraft(orderId, (current) => ({ ...current, items: current.items.map((item) => (item.id === itemId ? updater(item) : item)) }))
  }

  const changeItemProduct = (orderId: string, itemId: string, productId: string) => {
    const product = productMap.get(productId)
    if (!product) return
    updateItem(orderId, itemId, (item) => ({
      ...item,
      productId: product.id,
      name: product.name,
      category: product.category,
      reference: product.reference,
      price: Number(product.price || 0),
      quantity: Math.max(1, item.quantity || product.wholesaleMin || 1),
    }))
  }

  const addItem = (orderId: string) => updateDraft(orderId, (current) => ({ ...current, items: [...current.items, createEmptyItem()] }))
  const removeItem = (orderId: string, itemId: string) => updateDraft(orderId, (current) => ({ ...current, items: current.items.length > 1 ? current.items.filter((item) => item.id !== itemId) : current.items }))
  const addGift = (orderId: string) => updateDraft(orderId, (current) => ({ ...current, gift_items: [...current.gift_items, createEmptyGift()] }))
  const removeGift = (orderId: string, indexToRemove: number) =>
    updateDraft(orderId, (current) => ({ ...current, gift_items: current.gift_items.filter((_, index) => index !== indexToRemove) }))
  const updateGift = (orderId: string, index: number, patch: Partial<EditableGiftItem>) =>
    updateDraft(orderId, (current) => ({
      ...current,
      gift_items: current.gift_items.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item)),
    }))

  const handleSave = async (order: OrderRow) => {
    const draft = drafts[order.id] ?? buildDraft(order)
    const totals = calculateDraftTotals(draft)
    const giftItems: GiftItemRow[] = draft.gift_items
      .filter((item) => item.gift_id)
      .map((item) => {
        const gift = giftMap.get(item.gift_id)
        return {
          gift_id: item.gift_id,
          name: gift?.name || "Brinde",
          quantity: Math.max(1, item.quantity),
          description: gift?.description || null,
          reference: gift?.reference || null,
          image_url: gift?.image_url || null,
          notes: gift?.notes || null,
        }
      })

    try {
      setSavingId(order.id)
      let boletoPdfUrl = order.payment_boleto_pdf_url || null
      const boletoFile = boletoFiles[order.id]
      if (boletoFile) boletoPdfUrl = await uploadOrderPaymentPdf(order.id, boletoFile)

      const updated = await saveOrder({
        orderId: order.id,
        status: draft.status,
        payment_method: draft.payment_method,
        items: totals.items,
        estimated_delivery_date: draft.estimated_delivery_date || null,
        invoice_number: draft.invoice_number || null,
        tracking_code: draft.tracking_code || null,
        payment_instructions: draft.payment_instructions || null,
        payment_copy_paste: draft.payment_copy_paste || null,
        payment_link_url: draft.payment_link_url || null,
        payment_boleto_line: draft.payment_boleto_line || null,
        payment_boleto_pdf_url: boletoPdfUrl,
        payment_pix_bank_name: draft.payment_pix_bank_name || null,
        payment_pix_key: draft.payment_pix_key || null,
        payment_pix_beneficiary: draft.payment_pix_beneficiary || null,
        payment_pix_agency: draft.payment_pix_agency || null,
        payment_pix_account: draft.payment_pix_account || null,
        payment_pix_amount: draft.payment_pix_amount || null,
        payment_pix_qr_code: draft.payment_pix_qr_code || null,
        automatic_discount_amount: totals.automaticDiscountAmount,
        admin_discount_type: draft.admin_discount_type === "none" ? null : draft.admin_discount_type,
        admin_discount_value: draft.admin_discount_type === "none" ? null : parseNumber(draft.admin_discount_value),
        admin_discount_amount: totals.manualDiscountAmount,
        admin_bonus_type: draft.admin_bonus_type === "none" ? null : draft.admin_bonus_type,
        admin_bonus_value: draft.admin_bonus_type === "value" ? parseNumber(draft.admin_bonus_value) : null,
        admin_bonus_amount: totals.bonusAmount,
        admin_bonus_product_id: draft.admin_bonus_type === "item" ? draft.admin_bonus_product_id || null : null,
        admin_bonus_product_name: draft.admin_bonus_type === "item" ? totals.bonusProductName || null : null,
        admin_bonus_quantity: draft.admin_bonus_type === "item" ? Math.max(1, draft.admin_bonus_quantity) : null,
        gift_items: giftItems,
      })

      setOrders((current) => current.map((row) => (row.id === order.id ? updated : row)))
      setDrafts((current) => ({ ...current, [order.id]: buildDraft(updated) }))
      setBoletoFiles((current) => ({ ...current, [order.id]: null }))
      toast.success("Pedido atualizado")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel salvar o pedido."
      toast.error("Erro ao salvar pedido", { description: message })
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (order: OrderRow) => {
    const confirmed = window.confirm(`Excluir ${formatOrderCode(order.id)}? O pedido nao aparecera mais para admin nem cliente.`)
    if (!confirmed) return

    try {
      setDeletingId(order.id)
      await deleteOrder(order.id)
      setOrders((current) => current.filter((item) => item.id !== order.id))
      setDrafts((current) => {
        const next = { ...current }
        delete next[order.id]
        return next
      })
      setBoletoFiles((current) => {
        const next = { ...current }
        delete next[order.id]
        return next
      })
      toast.success("Pedido excluido")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel excluir o pedido."
      toast.error("Erro ao excluir", { description: message })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>{mode === "manager" ? "Pedidos da carteira" : "Pedidos"}</CardTitle>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por codigo, cliente, e-mail, telefone ou documento"
              className="w-full sm:min-w-[320px]"
            />
            <Button variant="outline" onClick={() => load("refresh")} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              variant={activeTab === tab.value ? "default" : "outline"}
              className="shrink-0 rounded-full"
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
            Carregando pedidos...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
            Nenhum pedido encontrado para os filtros selecionados.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const draft = drafts[order.id] ?? buildDraft(order)
            const totals = calculateDraftTotals(draft)
            const isExpanded = Boolean(expanded[order.id])
            const isSaving = savingId === order.id
            const isDeleting = deletingId === order.id
            const boletoFile = boletoFiles[order.id]
            const receiptIsImage = isImageResource(order.payment_receipt_url)

            return (
              <div key={order.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-3 p-4 xl:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-950">{formatOrderCode(order.id)}</div>
                    <div className="mt-1 text-sm text-slate-500">{formatDate(order.created_at)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Cliente</div>
                    <div className="truncate text-sm font-medium text-slate-900">{order.customer_name}</div>
                    <div className="truncate text-xs text-slate-500">{order.customer_email}</div>
                  </div>
                  <SummaryChip label="Valor" value={formatMoney(totals.total)} />
                  <SummaryChip label="Pagamento" value={formatPaymentMethod(order.payment_method)} />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Status</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={normalizeOrderStatus(order.status)} />
                      {order.payment_receipt_url ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                          <Receipt className="h-3.5 w-3.5" />
                          Comprovante
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setExpanded((current) => ({ ...current, [order.id]: !current[order.id] }))}>
                      {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                      {isExpanded ? "Fechar" : "Abrir"}
                    </Button>
                  </div>
                </div>
                {isExpanded ? (
                  <div className="border-t border-slate-200 p-4 md:p-5">
                    <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
                      <div className="space-y-5">
                        <SectionCard title="Itens do pedido" action={<Button variant="outline" size="sm" onClick={() => addItem(order.id)}><PackagePlus className="mr-2 h-4 w-4" />Adicionar item</Button>}>
                          <div className="space-y-3">
                            {draft.items.map((item) => (
                              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_0.7fr_0.8fr_auto] md:items-end">
                                  <DraftField label="Produto">
                                    <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={item.productId} onChange={(event) => changeItemProduct(order.id, item.id, event.target.value)}>
                                      {products.map((product) => (
                                        <option key={product.id} value={product.id}>{product.name}</option>
                                      ))}
                                    </select>
                                  </DraftField>
                                  <DraftField label="Referencia"><Input value={item.reference || "-"} readOnly /></DraftField>
                                  <DraftField label="Quantidade">
                                    <Input type="number" min={1} value={item.quantity} onChange={(event) => updateItem(order.id, item.id, (current) => ({ ...current, quantity: Math.max(1, Number(event.target.value || 1)) }))} />
                                  </DraftField>
                                  <DraftField label="Preco un.">
                                    <Input type="number" min={0} step="0.01" value={item.price} onChange={(event) => updateItem(order.id, item.id, (current) => ({ ...current, price: Math.max(0, Number(event.target.value || 0)) }))} />
                                  </DraftField>
                                  <Button variant="outline" size="sm" onClick={() => removeItem(order.id, item.id)} disabled={draft.items.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">Subtotal do item: {formatMoney(item.quantity * item.price)}</div>
                              </div>
                            ))}
                          </div>
                        </SectionCard>
                        <SectionCard title="Desconto e bonificacao">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                              <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Desconto automatico do carrinho</Label>
                              <div className="space-y-3 text-sm text-slate-700">
                                <div className="flex items-center justify-between">
                                  <span>Plano</span>
                                  <span className="font-semibold">
                                    {totals.discountTier ? `${totals.discountTier.name} (${totals.discountTier.percentage}%)` : "Sem desconto"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Desconto do plano</span>
                                  <span className="font-semibold">{formatMoney(totals.planDiscountAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Desconto PIX</span>
                                  <span className="font-semibold">{formatMoney(totals.pixDiscountAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-blue-200 pt-2">
                                  <span>Padrão do carrinho</span>
                                  <span className="font-semibold text-slate-950">{formatMoney(totals.automaticDefaultAmount)}</span>
                                </div>
                                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                                  <DraftField label="Desconto automático editável">
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={draft.automatic_discount_amount}
                                      onChange={(event) => setField(order.id, "automatic_discount_amount", event.target.value)}
                                      placeholder="Ex: 250"
                                    />
                                  </DraftField>
                                  <Button type="button" variant="outline" size="sm" onClick={() => resetAutomaticDiscount(order.id)}>
                                    Usar padrão
                                  </Button>
                                </div>
                                <div className="text-sm text-slate-600">
                                  Em uso: <span className="font-semibold text-slate-950">{formatMoney(totals.automaticDiscountAmount)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Desconto manual</Label>
                              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.admin_discount_type} onChange={(event) => setField(order.id, "admin_discount_type", event.target.value as DiscountType)}>
                                <option value="none">Sem desconto</option>
                                <option value="percent">Percentual (%)</option>
                                <option value="value">Valor fixo</option>
                              </select>
                              {draft.admin_discount_type !== "none" ? <Input type="number" min={0} step="0.01" value={draft.admin_discount_value} onChange={(event) => setField(order.id, "admin_discount_value", event.target.value)} placeholder={draft.admin_discount_type === "percent" ? "Ex: 10" : "Ex: 150"} /> : null}
                              <div className="text-sm text-slate-600">Desconto calculado: <span className="font-semibold text-slate-950">{formatMoney(totals.manualDiscountAmount)}</span></div>
                            </div>
                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Bonificacao</Label>
                              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.admin_bonus_type} onChange={(event) => setField(order.id, "admin_bonus_type", event.target.value as BonusType)}>
                                <option value="none">Sem bonificacao</option>
                                <option value="value">Valor bonificado</option>
                                <option value="item">Item gratis</option>
                              </select>
                              {draft.admin_bonus_type === "value" ? <Input type="number" min={0} step="0.01" value={draft.admin_bonus_value} onChange={(event) => setField(order.id, "admin_bonus_value", event.target.value)} placeholder="Ex: 200" /> : null}
                              {draft.admin_bonus_type === "item" ? (
                                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.admin_bonus_product_id} onChange={(event) => setField(order.id, "admin_bonus_product_id", event.target.value)}>
                                    <option value="">Selecione o item gratis</option>
                                    {products.map((product) => (<option key={product.id} value={product.id}>{product.name}</option>))}
                                  </select>
                                  <Input type="number" min={1} value={draft.admin_bonus_quantity} onChange={(event) => setField(order.id, "admin_bonus_quantity", Math.max(1, Number(event.target.value || 1)))} />
                                </div>
                              ) : null}
                              <div className="text-sm text-slate-600">Bonificacao calculada: <span className="font-semibold text-slate-950">{formatMoney(totals.bonusAmount)}</span></div>
                            </div>
                          </div>
                        </SectionCard>
                        <SectionCard title="Brindes do pedido" action={<Button variant="outline" size="sm" onClick={() => addGift(order.id)}><PackagePlus className="mr-2 h-4 w-4" />Adicionar brinde</Button>}>
                          {draft.gift_items.length ? (
                            <div className="space-y-3">
                              {draft.gift_items.map((giftItem, index) => (
                                <div key={`${order.id}-gift-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <div className="grid gap-3 md:grid-cols-[1fr_120px_auto] md:items-end">
                                    <DraftField label="Brinde">
                                      <select
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        value={giftItem.gift_id}
                                        onChange={(event) => updateGift(order.id, index, { gift_id: event.target.value })}
                                      >
                                        <option value="">Selecione um brinde</option>
                                        {gifts.map((gift) => (
                                          <option key={gift.id} value={gift.id}>{gift.name}</option>
                                        ))}
                                      </select>
                                    </DraftField>
                                    <DraftField label="Quantidade">
                                      <Input
                                        type="number"
                                        min={1}
                                        value={giftItem.quantity}
                                        onChange={(event) => updateGift(order.id, index, { quantity: Math.max(1, Number(event.target.value || 1)) })}
                                      />
                                    </DraftField>
                                    <Button variant="outline" size="sm" onClick={() => removeGift(order.id, index)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {giftItem.gift_id && giftMap.get(giftItem.gift_id) ? (
                                    <div className="mt-2 text-xs text-slate-500">
                                      {giftMap.get(giftItem.gift_id)?.reference || "Brinde cadastrado"} · Estoque: {giftMap.get(giftItem.gift_id)?.quantity_available ?? 0}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-muted-foreground">
                              Nenhum brinde vinculado a este pedido.
                            </div>
                          )}
                        </SectionCard>
                        <SectionCard title="Resumo financeiro">
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            <MetricCard label="Valor original" value={formatMoney(totals.originalSubtotal)} />
                            <MetricCard label="Desc. automatico" value={formatMoney(totals.automaticDiscountAmount)} />
                            <MetricCard label="Desc. manual" value={formatMoney(totals.manualDiscountAmount)} />
                            <MetricCard label="Bonificacao" value={formatMoney(totals.bonusAmount)} />
                            <MetricCard label="Total final" value={formatMoney(totals.total)} highlight />
                          </div>
                        </SectionCard>
                      </div>
                      <div className="space-y-5">
                        <SectionCard title="Status e entrega">
                          <div className="grid gap-3">
                            <DraftField label="Status do pedido">
                              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.status} onChange={(event) => setField(order.id, "status", event.target.value as OrderStatus)}>
                                {ORDER_STATUS_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                              </select>
                            </DraftField>
                            <DraftField label="Metodo de pagamento">
                              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.payment_method} onChange={(event) => setField(order.id, "payment_method", event.target.value as PaymentMethod)}>
                                {PAYMENT_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                              </select>
                            </DraftField>
                            <DraftField label="Previsao de entrega">
                              <Input type="date" value={draft.estimated_delivery_date} onChange={(event) => setField(order.id, "estimated_delivery_date", event.target.value)} />
                            </DraftField>
                            <DraftField label="Nota fiscal"><Input value={draft.invoice_number} onChange={(event) => setField(order.id, "invoice_number", event.target.value)} /></DraftField>
                            <DraftField label="Rastreamento / localizador"><Input value={draft.tracking_code} onChange={(event) => setField(order.id, "tracking_code", event.target.value)} /></DraftField>
                          </div>
                        </SectionCard>
                        <SectionCard title="Comprovante do cliente">
                          {order.payment_receipt_url ? (
                            <div className="space-y-3">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                <div className="font-medium text-slate-950">{order.payment_receipt_name || "Comprovante enviado"}</div>
                                <div className="mt-1 text-xs text-slate-500">Enviado em {formatDate(order.payment_receipt_uploaded_at)}</div>
                              </div>
                              {receiptIsImage ? <img src={order.payment_receipt_url || ""} alt="Comprovante" className="max-h-56 w-full rounded-2xl border border-slate-200 object-cover" /> : null}
                              <Button variant="outline" onClick={() => window.open(order.payment_receipt_url || "", "_blank", "noopener,noreferrer")}><Eye className="mr-2 h-4 w-4" />Visualizar comprovante</Button>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-muted-foreground">Nenhum comprovante enviado pelo cliente.</div>
                          )}
                        </SectionCard>
                        {draft.payment_method === "pix" ? (
                          <SectionCard title="Dados PIX">
                            <div className="grid gap-3">
                              <DraftField label="Orientacoes"><Textarea value={draft.payment_instructions} onChange={(event) => setField(order.id, "payment_instructions", event.target.value)} rows={4} /></DraftField>
                              <DraftField label="Banco"><Input value={draft.payment_pix_bank_name} onChange={(event) => setField(order.id, "payment_pix_bank_name", event.target.value)} /></DraftField>
                              <DraftField label="Beneficiario"><Input value={draft.payment_pix_beneficiary} onChange={(event) => setField(order.id, "payment_pix_beneficiary", event.target.value)} /></DraftField>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <DraftField label="Agencia"><Input value={draft.payment_pix_agency} onChange={(event) => setField(order.id, "payment_pix_agency", event.target.value)} /></DraftField>
                                <DraftField label="Conta"><Input value={draft.payment_pix_account} onChange={(event) => setField(order.id, "payment_pix_account", event.target.value)} /></DraftField>
                              </div>
                              <DraftField label="Chave PIX"><Input value={draft.payment_pix_key} onChange={(event) => setField(order.id, "payment_pix_key", event.target.value)} /></DraftField>
                              <DraftField label="Valor"><Input value={draft.payment_pix_amount} onChange={(event) => setField(order.id, "payment_pix_amount", event.target.value)} placeholder={formatMoney(totals.total)} /></DraftField>
                              <DraftField label="PIX copia e cola"><Textarea value={draft.payment_copy_paste} onChange={(event) => setField(order.id, "payment_copy_paste", event.target.value)} rows={3} /></DraftField>
                              <DraftField label="PIX por QR code / referencia"><Textarea value={draft.payment_pix_qr_code} onChange={(event) => setField(order.id, "payment_pix_qr_code", event.target.value)} rows={3} /></DraftField>
                            </div>
                          </SectionCard>
                        ) : null}
                        {draft.payment_method === "boleto" ? (
                          <SectionCard title="Dados do boleto">
                            <div className="grid gap-3">
                              <DraftField label="Linha digitavel"><Textarea value={draft.payment_boleto_line} onChange={(event) => setField(order.id, "payment_boleto_line", event.target.value)} rows={3} /></DraftField>
                              <DraftField label="Orientacoes ao cliente"><Textarea value={draft.payment_instructions} onChange={(event) => setField(order.id, "payment_instructions", event.target.value)} rows={4} /></DraftField>
                              <DraftField label="PDF do boleto"><Input type="file" accept="application/pdf" onChange={(event) => setBoletoFiles((current) => ({ ...current, [order.id]: event.target.files?.[0] || null }))} /></DraftField>
                              {boletoFile ? <div className="text-xs text-slate-500">Arquivo selecionado: {boletoFile.name}</div> : null}
                              {order.payment_boleto_pdf_url ? <Button variant="outline" onClick={() => window.open(order.payment_boleto_pdf_url || "", "_blank", "noopener,noreferrer")}><Eye className="mr-2 h-4 w-4" />Abrir boleto atual</Button> : null}
                            </div>
                          </SectionCard>
                        ) : null}
                        {draft.payment_method === "credit_card" ? (
                          <SectionCard title="Dados do cartao">
                            <div className="grid gap-3">
                              <DraftField label="Link de pagamento"><Input value={draft.payment_link_url} onChange={(event) => setField(order.id, "payment_link_url", event.target.value)} /></DraftField>
                              <DraftField label="Orientacoes ao cliente"><Textarea value={draft.payment_instructions} onChange={(event) => setField(order.id, "payment_instructions", event.target.value)} rows={4} /></DraftField>
                            </div>
                          </SectionCard>
                        ) : null}
                        <div className="flex flex-wrap justify-end gap-3">
                          {mode === "admin" ? (
                            <Button variant="destructive" onClick={() => handleDelete(order)} disabled={isDeleting || isSaving}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              {isDeleting ? "Excluindo..." : "Excluir pedido"}
                            </Button>
                          ) : null}
                          <Button onClick={() => handleSave(order)} disabled={isSaving || isDeleting}><Save className="mr-2 h-4 w-4" />{isSaving ? "Salvando..." : "Salvar pedido"}</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function SectionCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-950">{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

function DraftField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</Label>
      {children}
    </div>
  )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function MetricCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-2xl border border-blue-200 bg-blue-50 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-slate-950">{value}</div>
    </div>
  )
}


