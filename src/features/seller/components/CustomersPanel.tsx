import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchClients } from "@/features/seller/services/sellerService"
import type { Profile } from "@/shared/types/auth"
import { toast } from "sonner"

export function CustomersPanel() {
  const [customers, setCustomers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchClients()
      setCustomers(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar clientes", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.full_name || "-"}</TableCell>
                <TableCell>{c.documento || "-"}</TableCell>
                <TableCell>{c.telefone || "-"}</TableCell>
                <TableCell>{c.tipo_documento || "-"}</TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum cliente aprovado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
