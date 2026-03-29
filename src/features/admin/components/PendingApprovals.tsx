import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ACCOUNT_MANAGERS, type AccountManagerName } from "@/shared/constants/accountManagers"
import { approveProfile, fetchPendingProfiles, rejectProfile, type ResellerApprovalRow } from "@/features/admin/services/adminService"
import { StatusBadge } from "@/components/StatusBadge"

export function PendingApprovals() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ResellerApprovalRow[]>([])
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [managerByUser, setManagerByUser] = useState<Record<string, AccountManagerName>>({})

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchPendingProfiles()
      setData(rows)
      setManagerByUser((current) => {
        const next = { ...current }
        rows.forEach((row, index) => {
          if (!next[row.id]) {
            next[row.id] = ACCOUNT_MANAGERS[index % ACCOUNT_MANAGERS.length].name
          }
        })
        return next
      })
    } catch (e: any) {
      toast.error("Erro ao carregar pendências", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await approveProfile(id, managerByUser[id] ?? ACCOUNT_MANAGERS[0].name)
      toast.success("Cadastro aprovado", { description: "Cliente liberado com gerente de contas atribuído." })
      load()
    } catch (e: any) {
      toast.error("Erro ao aprovar", { description: e.message })
    }
  }

  const handleReject = async (id: string) => {
    const reason = rejectReason[id] || "Cadastro reprovado pela equipe comercial."
    try {
      await rejectProfile(id, reason)
      toast.success("Cadastro reprovado")
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
              <TableHead>Empresa</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Gerente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-semibold">{row.razao_social}</div>
                  <div className="text-xs text-muted-foreground">{row.email}</div>
                </TableCell>
                <TableCell>
                  <div>{row.nome_responsavel}</div>
                  <div className="text-xs text-muted-foreground">{row.telefone}</div>
                </TableCell>
                <TableCell className="font-mono text-xs">{row.cnpj}</TableCell>
                <TableCell>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={managerByUser[row.id] ?? ACCOUNT_MANAGERS[0].name}
                    onChange={(event) =>
                      setManagerByUser((current) => ({
                        ...current,
                        [row.id]: event.target.value as AccountManagerName,
                      }))
                    }
                  >
                    {ACCOUNT_MANAGERS.map((manager) => (
                      <option key={manager.name} value={manager.name}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status_cadastro} />
                </TableCell>
                <TableCell className="space-y-2">
                  <Button size="sm" onClick={() => handleApprove(row.id)} disabled={loading}>
                    Aprovar cliente
                  </Button>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <Input
                      placeholder="Motivo da reprovação"
                      value={rejectReason[row.id] || ""}
                      onChange={(e) => setRejectReason({ ...rejectReason, [row.id]: e.target.value })}
                    />
                    <Button size="sm" variant="destructive" onClick={() => handleReject(row.id)} disabled={loading}>
                      Reprovar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
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
