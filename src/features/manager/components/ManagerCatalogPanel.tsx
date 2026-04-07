import { useEffect, useMemo, useState } from "react"
import { Building2, Minus, Plus, Search, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { products } from "@/data/products"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createScopedOrder, fetchManagedClients, type ClientAdminRow, type OrderItemRow } from "@/features/admin/services/adminService"
import { calculateAutomaticOrderPricing } from "@/shared/utils/orderPricing"
import type { Product } from "@/types"

type ManagerCatalogPanelProps = {
  managerUserId: string
  managerEmail?: string | null
}

type SelectedItem = {
  product: Product
  quantity: number
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function ManagerCatalogPanel({ managerUserId, managerEmail }: ManagerCatalogPanelProps) {
  const [clients, setClients] = useState<ClientAdminRow[]>([])
  const [selectedClientId, setSelectedClientId] = useState("")
  const [items, setItems] = useState<SelectedItem[]>([])
  const [search, setSearch] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "boleto" | "credit_card">("pix")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      try {
        const rows = await fetchManagedClients(managerUserId, managerEmail)
        if (!active) return
        setClients(rows.filter((row) => row.status_cadastro === "approved"))
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "Não foi possível carregar os clientes da carteira."
        toast.error("Erro ao carregar clientes", { description: message })
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [managerEmail, managerUserId])

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  )

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((product) =>
      [product.name, product.reference, product.category]
        .map((value) => value.toLowerCase())
        .some((value) => value.includes(term))
    )
  }, [search])

  const subtotal = useMemo(
    () => Number(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)),
    [items]
  )

  const pricing = useMemo(
    () => calculateAutomaticOrderPricing(subtotal, paymentMethod),
    [paymentMethod, subtotal]
  )

  const orderItems = useMemo<OrderItemRow[]>(
    () =>
      items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        category: item.product.category,
        reference: item.product.reference,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: Number((item.product.price * item.quantity).toFixed(2)),
      })),
    [items]
  )

  const addProduct = (product: Product) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.product.id === product.id)
      if (existing) {
        return current.map((entry) =>
          entry.product.id === product.id
            ? { ...entry, quantity: entry.quantity + product.wholesaleMin }
            : entry
        )
      }

      return [...current, { product, quantity: product.wholesaleMin }]
    })
  }

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((entry) => entry.product.id !== productId))
      return
    }

    setItems((current) =>
      current.map((entry) =>
        entry.product.id === productId ? { ...entry, quantity } : entry
      )
    )
  }

  const handleCreateOrder = async () => {
    if (!selectedClient) {
      toast.error("Selecione um cliente da sua carteira.")
      return
    }

    if (!orderItems.length) {
      toast.error("Adicione pelo menos um produto ao pedido.")
      return
    }

    try {
      setSubmitting(true)
      await createScopedOrder({
        resellerId: selectedClient.id,
        payment_method: paymentMethod,
        items: orderItems,
      })
      toast.success("Pedido criado para o cliente selecionado.")
      setItems([])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar o pedido."
      toast.error("Erro ao criar pedido", { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-900" />
            <CardTitle>Catálogo da carteira</CardTitle>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_220px]">
            <div className="space-y-2">
              <Label>Cliente da carteira</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={selectedClientId}
                onChange={(event) => setSelectedClientId(event.target.value)}
                disabled={loading}
              >
                <option value="">Selecione o cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.razao_social} - {client.cnpj}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pagamento</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as "pix" | "boleto" | "credit_card")}
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="credit_card">Cartão</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Busca rápida</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome, ref. ou categoria"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        {selectedClient ? (
          <CardContent>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Building2 className="h-4 w-4 text-blue-900" />
                {selectedClient.razao_social}
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <div>CNPJ: {selectedClient.cnpj || "-"}</div>
                <div>Telefone: {selectedClient.whatsapp || selectedClient.telefone || "-"}</div>
                <div>Cidade: {[selectedClient.cidade, selectedClient.estado].filter(Boolean).join(" / ") || "-"}</div>
              </div>
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain p-3" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{product.category}</div>
                  <div className="line-clamp-3 text-sm font-semibold text-slate-950">{product.name}</div>
                  <div className="text-xs text-slate-500">Ref. {product.reference}</div>
                  <div className="text-base font-bold text-slate-950">{formatMoney(product.price)}</div>
                  <div className="text-xs text-slate-500">Pedido mínimo: {product.wholesaleMin}</div>
                  <Button className="w-full" onClick={() => addProduct(product)} disabled={!selectedClient}>
                    Adicionar ao pedido
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Pedido manual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Selecione um cliente da carteira e adicione produtos do catálogo.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="rounded-3xl border border-slate-200 bg-white p-3">
                    <div className="text-sm font-semibold text-slate-950">{item.product.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.product.reference}</div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) => updateItemQuantity(item.product.id, Number(event.target.value) || 1)}
                          className="h-8 w-20 text-center"
                        />
                        <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm font-semibold text-slate-950">{formatMoney(item.product.price * item.quantity)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
              <SummaryRow label="Desconto automático" value={`- ${formatMoney(pricing.automaticDiscount)}`} />
              <SummaryRow label="Total final" value={formatMoney(pricing.total)} strong />
            </div>

            <Button className="w-full" onClick={handleCreateOrder} disabled={submitting || !selectedClient || items.length === 0}>
              {submitting ? "Salvando pedido..." : "Criar pedido para o cliente"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-bold text-slate-950" : "font-semibold text-slate-800"}>{value}</span>
    </div>
  )
}
