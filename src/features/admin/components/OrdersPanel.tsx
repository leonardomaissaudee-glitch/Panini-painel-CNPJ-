import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { updateOrderStatus, fetchOrders, type OrderRow, type OrderStatus } from "@/features/admin/services/adminService"

const statusOptions: { label: string; value: OrderStatus }[] = [
  { label: "Novo pedido", value: "novo_pedido" },
  { label: "Pago", value: "pago" },
  { label: "Enviado", value: "enviado" },
  { label: "Nota fiscal emitida", value: "nota_fiscal" },
  { label: "Rastreamento", value: "rastreio" },
]

export function OrdersPanel() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Record<string, Partial<OrderRow>>>({})

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchOrders()
      setOrders(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar pedidos", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpdate = async (id: string) => {
    const state = editing[id]
    if (!state?.status) {
      toast.error("Defina um status")
      return
    }
    try {
      await updateOrderStatus(id, state.status as OrderStatus, {
        invoice_number: state.invoice_number,
        tracking_code: state.tracking_code,
      })
      toast.success("Pedido atualizado")
      setEditing((prev) => ({ ...prev, [id]: {} }))
      load()
    } catch (e: any) {
      toast.error("Erro ao atualizar", { description: e.message })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>NF</TableHead>
              <TableHead>Rastreamento</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-semibold">{order.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                  <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                </TableCell>
                <TableCell>R$ {order.subtotal?.toFixed(2)}</TableCell>
                <TableCell className="font-bold">R$ {order.total?.toFixed(2)}</TableCell>
                <TableCell>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background text-sm"
                    value={editing[order.id]?.status || order.status || "novo_pedido"}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [order.id]: { ...prev[order.id], status: e.target.value as OrderStatus },
                      }))
                    }
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <div className="text-xs">Método: {order.payment_method || "-"}</div>
                  <div className="text-xs">Status: {order.payment_status || "-"}</div>
                  <div className="text-xs">ID: {order.payment_id || "-"}</div>
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="NF-e"
                    value={editing[order.id]?.invoice_number ?? order.invoice_number ?? ""}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [order.id]: { ...prev[order.id], invoice_number: e.target.value },
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Código de rastreio"
                    value={editing[order.id]?.tracking_code ?? order.tracking_code ?? ""}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [order.id]: { ...prev[order.id], tracking_code: e.target.value },
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => handleUpdate(order.id)} disabled={loading}>
                    Salvar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhum pedido
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
