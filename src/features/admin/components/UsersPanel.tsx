import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { Profile, UserRole } from "@/shared/types/auth"
import { approveProfile, fetchAllUsers, rejectProfile } from "@/features/admin/services/adminService"

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "secondary",
  pending: "outline",
  rejected: "destructive",
  blocked: "destructive",
}

export function UsersPanel() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Profile[]>([])
  const [search, setSearch] = useState("")
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    try {
      const rows = await fetchAllUsers()
      setUsers(rows)
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
    return users.filter((u) =>
      [u.full_name, u.auth_user_id, u.documento, u.role, u.status_cadastro]
        .map((v) => (v || "").toString().toLowerCase())
        .some((v) => v.includes(term))
    )
  }, [users, search])

  const handleApprove = async (id: string, role: UserRole) => {
    try {
      await approveProfile(id, role)
      toast.success("Usuário aprovado", { description: `Role definida como ${role}` })
      load()
    } catch (e: any) {
      toast.error("Erro ao aprovar", { description: e.message })
    }
  }

  const handleReject = async (id: string) => {
    const reason = rejectReason[id] || "Reprovado manualmente"
    try {
      await rejectProfile(id, reason)
      toast.success("Usuário reprovado")
      load()
    } catch (e: any) {
      toast.error("Erro ao reprovar", { description: e.message })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Usuários cadastrados</CardTitle>
          <p className="text-sm text-muted-foreground">Visualize, aprove ou reprovar contas.</p>
        </div>
        <Input
          placeholder="Buscar por nome, email ou documento"
          className="w-full md:w-80"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email (auth)</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name || "-"}</TableCell>
                <TableCell className="font-mono text-xs">{user.auth_user_id || "-"}</TableCell>
                <TableCell>{user.documento || "-"}</TableCell>
                <TableCell>
                  <Badge variant={statusColor[user.status_cadastro] ?? "outline"}>
                    {user.status_cadastro}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(user.id, "client")}
                      disabled={loading}
                    >
                      Aprovar client
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(user.id, "seller")}
                      disabled={loading}
                    >
                      Aprovar seller
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(user.id, "admin")}
                      disabled={loading}
                    >
                      Aprovar admin
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Input
                      placeholder="Motivo reprovação"
                      value={rejectReason[user.id] || ""}
                      onChange={(e) => setRejectReason({ ...rejectReason, [user.id]: e.target.value })}
                      className="md:w-64"
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
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
