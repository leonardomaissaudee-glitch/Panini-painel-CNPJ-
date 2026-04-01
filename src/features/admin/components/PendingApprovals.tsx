import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  approveProfile,
  deleteUserRecord,
  fetchAccountManagers,
  fetchPendingProfiles,
  rejectProfile,
  type AccountManagerDirectoryRow,
  type ResellerApprovalRow,
} from "@/features/admin/services/adminService"
import { StatusBadge } from "@/components/StatusBadge"

export function PendingApprovals() {
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [rows, setRows] = useState<ResellerApprovalRow[]>([])
  const [managers, setManagers] = useState<AccountManagerDirectoryRow[]>([])
  const [search, setSearch] = useState("")
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [managerByUser, setManagerByUser] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const load = async () => {
    setLoading(true)
    try {
      const [data, managerRows] = await Promise.all([fetchPendingProfiles(), fetchAccountManagers()])
      setRows(data)
      setManagers(managerRows)
      setManagerByUser((current) => {
        const next = { ...current }
        data.forEach((row, index) => {
          if (!next[row.id]) {
            next[row.id] = row.account_manager_user_id || managerRows[index % Math.max(managerRows.length, 1)]?.auth_user_id || ""
          }
        })
        return next
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível carregar os cadastros pendentes."
      toast.error("Erro ao carregar pendências", { description: message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) =>
      [row.razao_social, row.nome_fantasia, row.nome_responsavel, row.email, row.telefone, row.cnpj]
        .map((value) => (value || "").toString().toLowerCase())
        .some((value) => value.includes(term))
    )
  }, [rows, search])

  const handleApprove = async (id: string) => {
    const row = rows.find((item) => item.id === id)
    if (!row) {
      toast.error("Erro ao aprovar", { description: "Cliente não encontrado na lista local." })
      return
    }
    const managerId = managerByUser[id]
    const manager = managers.find((item) => item.auth_user_id === managerId)
    if (!manager) {
      toast.error("Erro ao aprovar", { description: "Selecione um gerente responsável antes de aprovar." })
      return
    }
    try {
      setSavingId(id)
      await approveProfile(row, manager)
      toast.success("Cadastro aprovado", { description: "Cliente liberado com gerente atribuído." })
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível aprovar o cadastro."
      toast.error("Erro ao aprovar", { description: message })
    } finally {
      setSavingId(null)
    }
  }

  const handleReject = async (id: string) => {
    const row = rows.find((item) => item.id === id)
    if (!row) {
      toast.error("Erro ao reprovar", { description: "Cliente não encontrado na lista local." })
      return
    }
    const reason = rejectReason[id]?.trim() || "Cadastro reprovado pela equipe comercial."
    if (!reason) {
      toast.error("Erro ao reprovar", { description: "Informe o motivo da reprovação." })
      return
    }
    try {
      setSavingId(id)
      await rejectProfile(row, reason)
      toast.success("Cadastro reprovado")
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível reprovar o cadastro."
      toast.error("Erro ao reprovar", { description: message })
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    const row = rows.find((item) => item.id === id)
    if (!row) {
      toast.error("Erro ao excluir", { description: "Cadastro não encontrado na lista local." })
      return
    }

    const confirmed = window.confirm(`Excluir o cadastro de ${row.razao_social}? O registro deixará de constar no sistema.`)
    if (!confirmed) return

    try {
      setSavingId(id)
      await deleteUserRecord({
        userId: row.user_id,
        reseller_id: row.id,
        email: row.email || null,
        user_type: "cliente",
      })
      toast.success("Cadastro excluído")
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível excluir o cadastro."
      toast.error("Erro ao excluir", { description: message })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Cadastros pendentes</CardTitle>
          <p className="text-sm text-muted-foreground">Visualize os dados, defina o gerente e aprove ou reprove sem ação manual no Supabase.</p>
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por empresa, responsável, e-mail ou CNPJ"
          className="w-full md:max-w-sm"
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.map((row) => {
          const isExpanded = Boolean(expanded[row.id])
          const isSaving = savingId === row.id
          return (
            <div key={row.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-3 p-4 md:grid-cols-[1.3fr_1fr_0.8fr_0.9fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-950">{row.razao_social}</div>
                  <div className="mt-1 text-sm text-slate-500">{row.email}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Responsável</div>
                  <div className="truncate text-sm font-medium text-slate-900">{row.nome_responsavel}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">CNPJ</div>
                  <div className="text-sm text-slate-700">{row.cnpj}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</div>
                  <div className="mt-1"><StatusBadge status={row.status_cadastro} /></div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setExpanded((current) => ({ ...current, [row.id]: !current[row.id] }))}>
                    {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {isExpanded ? "Menos" : "Mais"}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 p-4">
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoField label="Razão social" value={row.razao_social} />
                      <InfoField label="Nome fantasia" value={row.nome_fantasia || "-"} />
                      <InfoField label="Telefone" value={row.telefone} />
                      <InfoField label="Cidade / Estado" value={[row.cidade, row.estado].filter(Boolean).join(" / ") || "-"} />
                      <InfoField label="Segmento" value={row.segmento || "-"} />
                      <InfoField label="Faixa de investimento" value={row.faixa_investimento || "-"} />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Gerente responsável</div>
                        <select
                          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={managerByUser[row.id] ?? ""}
                          onChange={(event) =>
                            setManagerByUser((current) => ({
                              ...current,
                              [row.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Selecione um gerente</option>
                          {managers.map((manager) => (
                            <option key={manager.auth_user_id} value={manager.auth_user_id}>
                              {manager.full_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Motivo da reprovação</div>
                        <Input
                          className="mt-2"
                          placeholder="Explique o motivo, se necessário"
                          value={rejectReason[row.id] || ""}
                          onChange={(event) => setRejectReason((current) => ({ ...current, [row.id]: event.target.value }))}
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button onClick={() => handleApprove(row.id)} disabled={isSaving}>
                          {isSaving ? "Processando..." : "Aprovar"}
                        </Button>
                        <Button variant="destructive" onClick={() => handleReject(row.id)} disabled={isSaving}>
                          Reprovar
                        </Button>
                        <Button variant="outline" onClick={() => handleDelete(row.id)} disabled={isSaving}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir cadastro
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
            Nenhum cadastro pendente encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}
