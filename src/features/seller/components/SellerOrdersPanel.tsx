import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  createManualOrder,
  fetchSellerOrders,
  updateSellerOrder,
  type SellerOrder,
} from "@/features/seller/services/sellerService"
import type { OrderStatus } from "@/shared/constants/orderStatus"
import { ORDER_STATUS_OPTIONS } from "@/shared/constants/orderStatus"

export function SellerOrdersPanel({ sellerId }: { sellerId?: string }) {
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [editing, setEditing] = useState<Record<string, Partial<SellerOrder>>>({})
  const [loading, setLoading] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_cpf: "",
    items: "[]",
    subtotal: 0,
    total: 0,
    shipping_street: "",
    shipping_number: "",
    shipping_neighborhood: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
  })

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchSellerOrders(sellerId)
      setOrders(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar pedidos", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [sellerId])

  const handleUpdate = async (id: string) => {
    const data = editing[id]
    if (!data?.status) {
      toast.error("Defina um status")
      return
    }
    try {
      await updateSellerOrder(id, {
        status: data.status as OrderStatus,
        invoice_number: data.invoice_number,
        tracking_code: data.tracking_code,
        seller_id: sellerId ?? null,
      })
      toast.success("Atualizado")
      setEditing((prev) => ({ ...prev, [id]: {} }))
      load()
    } catch (e: any) {
      toast.error("Erro ao atualizar", { description: e.message })
    }
  }

  const handleManual = async () => {
    try {
      const items = JSON.parse(manual.items || "[]")
      await createManualOrder({
        customer_name: manual.customer_name,
        customer_email: manual.customer_email,
        customer_phone: manual.customer_phone,
        customer_cpf: manual.customer_cpf,
        subtotal: Number(manual.subtotal),
        total: Number(manual.total),
        items,
        payment_method: "pix",
        seller_id: sellerId ?? null,
        shipping: {
          street: manual.shipping_street,
          number: manual.shipping_number,
          neighborhood: manual.shipping_neighborhood,
          city: manual.shipping_city,
          state: manual.shipping_state,
          postal_code: manual.shipping_postal_code,
        },
      })
      toast.success("Pedido criado")
      setManual({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        customer_cpf: "",
        items: "[]",
        subtotal: 0,
        total: 0,
        shipping_street: "",
        shipping_number: "",
        shipping_neighborhood: "",
        shipping_city: "",
        shipping_state: "",
        shipping_postal_code: "",
      })
      setShowManual(false)
      load()
    } catch (e: any) {
      toast.error("Erro ao criar pedido", { description: e.message })
    }
  }

  const whatsappMessage = (order: SellerOrder) =>
    `Olá ${order.customer_name}, seu pedido ${order.id} está em ${order.status || "análise"}. Obrigado pela compra!`

  const openWhatsApp = (order: SellerOrder) => {
    const phone = order.customer_phone?.replace(/\D/g, "")
    const msg = encodeURIComponent(whatsappMessage(order))
    const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`
    window.open(url, "_blank")
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle>Pedidos</CardTitle>
        <Button variant="outline" onClick={() => setShowManual((v) => !v)}>
          {showManual ? "Fechar criação manual" : "Criar pedido manual"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {showManual && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border rounded-lg p-4">
            <Input placeholder="Nome" value={manual.customer_name} onChange={(e) => setManual((m) => ({ ...m, customer_name: e.target.value }))} />
            <Input placeholder="Email" value={manual.customer_email} onChange={(e) => setManual((m) => ({ ...m, customer_email: e.target.value }))} />
            <Input placeholder="Telefone" value={manual.customer_phone} onChange={(e) => setManual((m) => ({ ...m, customer_phone: e.target.value }))} />
            <Input placeholder="CPF/CNPJ" value={manual.customer_cpf} onChange={(e) => setManual((m) => ({ ...m, customer_cpf: e.target.value }))} />
            <Input placeholder="Subtotal" type="number" value={manual.subtotal} onChange={(e) => setManual((m) => ({ ...m, subtotal: Number(e.target.value) }))} />
            <Input placeholder="Total" type="number" value={manual.total} onChange={(e) => setManual((m) => ({ ...m, total: Number(e.target.value) }))} />
            <Input placeholder="Rua" value={manual.shipping_street} onChange={(e) => setManual((m) => ({ ...m, shipping_street: e.target.value }))} />
            <Input placeholder="Número" value={manual.shipping_number} onChange={(e) => setManual((m) => ({ ...m, shipping_number: e.target.value }))} />
            <Input placeholder="Bairro" value={manual.shipping_neighborhood} onChange={(e) => setManual((m) => ({ ...m, shipping_neighborhood: e.target.value }))} />
            <Input placeholder="Cidade" value={manual.shipping_city} onChange={(e) => setManual((m) => ({ ...m, shipping_city: e.target.value }))} />
            <Input placeholder="UF" value={manual.shipping_state} onChange={(e) => setManual((m) => ({ ...m, shipping_state: e.target.value }))} />
            <Input placeholder="CEP" value={manual.shipping_postal_code} onChange={(e) => setManual((m) => ({ ...m, shipping_postal_code: e.target.value }))} />
            <div className="md:col-span-3 space-y-2">
              <Textarea
                placeholder='Items em JSON, ex: [{"id":"1","name":"Produto","quantity":1,"price":100}]'
                value={manual.items}
                onChange={(e) => setManual((m) => ({ ...m, items: e.target.value }))}
              />
              <Button onClick={handleManual}>Salvar pedido manual</Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>NF</TableHead>
                <TableHead>Rastreio</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="font-semibold">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                  </TableCell>
                  <TableCell className="font-bold">R$ {o.total?.toFixed(2)}</TableCell>
                  <TableCell>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background text-sm"
                      value={editing[o.id]?.status || o.status || "aguardando_aprovacao"}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [o.id]: { ...prev[o.id], status: e.target.value as OrderStatus },
                        }))
                      }
                    >
                      {ORDER_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">Método: {o.payment_method || "-"}</div>
                    <div className="text-xs">Status: {o.payment_status || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="NF"
                      value={editing[o.id]?.invoice_number ?? o.invoice_number ?? ""}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [o.id]: { ...prev[o.id], invoice_number: e.target.value },
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Rastreio"
                      value={editing[o.id]?.tracking_code ?? o.tracking_code ?? ""}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [o.id]: { ...prev[o.id], tracking_code: e.target.value },
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell className="space-y-2">
                    <Button size="sm" onClick={() => handleUpdate(o.id)}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openWhatsApp(o)}>
                      WhatsApp
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum pedido
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
