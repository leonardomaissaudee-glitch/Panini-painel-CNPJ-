import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import type { OrderRow } from "@/features/admin/services/adminService"
import { fetchMyOrders } from "@/features/client/services/clientService"

export function ClientOrders({ email }: { email: string | undefined }) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus pedidos</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>NF</TableHead>
              <TableHead>Rastreio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="text-xs">{o.id}</TableCell>
                <TableCell className="font-bold">R$ {o.total?.toFixed(2)}</TableCell>
                <TableCell>{o.status || "-"}</TableCell>
                <TableCell>
                  <div className="text-xs">Método: {o.payment_method || "-"}</div>
                  <div className="text-xs">Status: {o.payment_status || "-"}</div>
                </TableCell>
                <TableCell>{o.invoice_number || "-"}</TableCell>
                <TableCell>{o.tracking_code || "-"}</TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
