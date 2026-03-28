import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import type { Profile, UserRole } from "@/shared/types/auth"
import { approveProfile, fetchPendingProfiles, rejectProfile } from "@/features/admin/services/adminService"

export function PendingApprovals() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Profile[]>([])
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchPendingProfiles()
      setData(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar pendências", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (id: string, role: UserRole) => {
    try {
      await approveProfile(id, role)
      toast.success("Aprovado")
      load()
    } catch (e: any) {
      toast.error("Erro ao aprovar", { description: e.message })
    }
  }

  const handleReject = async (id: string) => {
    const reason = rejectReason[id] || "Reprovado manualmente"
    try {
      await rejectProfile(id, reason)
      toast.success("Reprovado")
      load()
    } catch (e: any) {
      toast.error("Erro ao reprovar", { description: e.message })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastros pendentes</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email (auth)</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.full_name || "-"}</TableCell>
                <TableCell>{row.auth_user_id || "-"}</TableCell>
                <TableCell>{row.documento || "-"}</TableCell>
                <TableCell className="space-y-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleApprove(row.id, "client")}>
                      Aprovar como Client
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleApprove(row.id, "seller")}>
                      Aprovar como Seller
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleApprove(row.id, "admin")}>
                      Aprovar como Admin
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Motivo reprovação"
                      value={rejectReason[row.id] || ""}
                      onChange={(e) => setRejectReason({ ...rejectReason, [row.id]: e.target.value })}
                    />
                    <Button size="sm" variant="destructive" onClick={() => handleReject(row.id)}>
                      Reprovar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum cadastro pendente
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
