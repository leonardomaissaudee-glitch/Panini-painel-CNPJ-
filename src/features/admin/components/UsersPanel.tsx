import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ACCOUNT_MANAGERS, type AccountManagerName } from "@/shared/constants/accountManagers"
import { approveProfile, fetchAllUsers, rejectProfile, type ResellerApprovalRow } from "@/features/admin/services/adminService"
import { StatusBadge } from "@/components/StatusBadge"

export function UsersPanel() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<ResellerApprovalRow[]>([])
  const [search, setSearch] = useState("")
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [managerByUser, setManagerByUser] = useState<Record<string, AccountManagerName>>({})

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchAllUsers()
      setUsers(rows)
      setManagerByUser((current) => {
        const next = { ...current }
        rows.forEach((row, index) => {
          if (!next[row.id]) {
            next[row.id] = (row.account_manager_name as AccountManagerName) ?? ACCOUNT_MANAGERS[index % ACCOUNT_MANAGERS.length].name
          }
        })
        return next
      })
    } catch (e: any) {
      toast.error("Erro ao carregar usuários", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return users

    return users.filter((user) =>
      [
        user.razao_social,
        user.nome_fantasia,
        user.nome_responsavel,
        user.email,
        user.cnpj,
        user.status_cadastro,
        user.account_manager_name,
      ]
        .map((value) => (value || "").toString().toLowerCase())
        .some((value) => value.includes(term))
    )
  }, [users, search])

  const handleApprove = async (id: string) => {
    try {
      await approveProfile(id, managerByUser[id] ?? ACCOUNT_MANAGERS[0].name)
      toast.success("Cliente aprovado", { description: "Gerente comercial atribuído com sucesso." })
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
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Revendedores cadastrados</CardTitle>
          <p className="text-sm text-muted-foreground">Gerencie aprovação, gerente de contas e status dos clientes.</p>
        </div>
        <Input
          placeholder="Buscar por empresa, responsável, e-mail ou CNPJ"
          className="w-full md:w-96"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gerente</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-semibold">{user.razao_social}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                  <div>{user.nome_responsavel}</div>
                  <div className="text-xs text-muted-foreground">
                    {[user.cidade, user.estado].filter(Boolean).join(" - ")}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{user.cnpj}</TableCell>
                <TableCell>
                  <StatusBadge status={user.status_cadastro} />
                </TableCell>
                <TableCell>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={managerByUser[user.id] ?? ACCOUNT_MANAGERS[0].name}
                    onChange={(event) =>
                      setManagerByUser((current) => ({
                        ...current,
                        [user.id]: event.target.value as AccountManagerName,
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
                <TableCell className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleApprove(user.id)} disabled={loading}>
                      Aprovar cliente
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Input
                      placeholder="Motivo da reprovação"
                      value={rejectReason[user.id] || ""}
                      onChange={(e) => setRejectReason({ ...rejectReason, [user.id]: e.target.value })}
                      className="md:w-72"
                    />
                    <Button size="sm" variant="destructive" onClick={() => handleReject(user.id)} disabled={loading}>
                      Reprovar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum revendedor encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
