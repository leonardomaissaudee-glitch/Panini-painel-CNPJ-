import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchAbandonedCarts, recoverCart, type CartAbandoned } from "@/features/seller/services/sellerService"
import { toast } from "sonner"

export function AbandonedCartsPanel() {
  const [carts, setCarts] = useState<CartAbandoned[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchAbandonedCarts()
      setCarts(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar carrinhos", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleRecover = async (id: string) => {
    try {
      await recoverCart(id)
      toast.success("Carrinho marcado como recuperado")
      load()
    } catch (e: any) {
      toast.error("Erro ao atualizar", { description: e.message })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrinhos abandonados</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-xs">{c.id}</TableCell>
                <TableCell>{c.status}</TableCell>
                <TableCell>{c.created_at?.slice(0, 19) || "-"}</TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => handleRecover(c.id)}>
                    Recuperar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {carts.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum carrinho abandonado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
