import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/StatusBadge"
import {
  fetchAccountManagers,
  fetchAllClients,
  deleteUserRecord,
  fetchManagedClients,
  saveClient,
  type AccountManagerDirectoryRow,
  type ClientAdminRow,
  type UpdateClientInput,
} from "@/features/admin/services/adminService"
import { toast } from "sonner"

type ClientDraft = Partial<UpdateClientInput>
type AllClientsPanelProps = {
  mode?: "admin" | "manager"
  managerUserId?: string
  title?: string
  description?: string
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Reprovado" },
  { value: "blocked", label: "Bloqueado" },
] as const

export function AllClientsPanel({
  mode = "admin",
  managerUserId,
  title = "Todos os clientes",
  description = "Busque, filtre e edite todos os dados cadastrais dos clientes empresariais.",
}: AllClientsPanelProps) {
  const [clients, setClients] = useState<ClientAdminRow[]>([])
  const [managers, setManagers] = useState<AccountManagerDirectoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [managerFilter, setManagerFilter] = useState("todos")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [drafts, setDrafts] = useState<Record<string, ClientDraft>>({})
  const managerMap = useMemo(() => new Map(managers.map((manager) => [manager.auth_user_id, manager])), [managers])

  const load = async () => {
    setLoading(true)
    try {
      const [data, managerRows] = await Promise.all([
        mode === "manager" && managerUserId ? fetchManagedClients(managerUserId) : fetchAllClients(),
        fetchAccountManagers(),
      ])
      setClients(data)
      setManagers(managerRows)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível carregar os clientes."
      toast.error("Erro ao carregar clientes", { description: message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return clients.filter((client) => {
      const matchesStatus = statusFilter === "todos" || client.status_cadastro === statusFilter
      const matchesManager =
        mode === "manager" ||
        managerFilter === "todos" ||
        (managerFilter === "sem-gerente"
          ? !client.account_manager_user_id && !client.account_manager_email
          : client.account_manager_user_id === managerFilter)
      const matchesSearch =
        !term ||
        [client.razao_social, client.nome_responsavel, client.email, client.cnpj, client.telefone, client.cidade, client.estado]
          .map((value) => (value || "").toString().toLowerCase())
          .some((value) => value.includes(term))
      return matchesStatus && matchesManager && matchesSearch
    })
  }, [clients, search, statusFilter, managerFilter, mode])

  const getDraft = (client: ClientAdminRow): UpdateClientInput => ({
    resellerId: client.id,
    razao_social: drafts[client.id]?.razao_social ?? client.razao_social,
    nome_fantasia: drafts[client.id]?.nome_fantasia ?? client.nome_fantasia ?? "",
    cnpj: drafts[client.id]?.cnpj ?? client.cnpj,
    email: drafts[client.id]?.email ?? client.email,
    password: drafts[client.id]?.password ?? "",
    telefone: drafts[client.id]?.telefone ?? client.telefone,
    whatsapp: drafts[client.id]?.whatsapp ?? client.whatsapp ?? "",
    cep: drafts[client.id]?.cep ?? client.cep ?? "",
    endereco: drafts[client.id]?.endereco ?? client.endereco ?? "",
    numero: drafts[client.id]?.numero ?? client.numero ?? "",
    complemento: drafts[client.id]?.complemento ?? client.complemento ?? "",
    bairro: drafts[client.id]?.bairro ?? client.bairro ?? "",
    cidade: drafts[client.id]?.cidade ?? client.cidade ?? "",
    estado: drafts[client.id]?.estado ?? client.estado ?? "",
    observacoes: drafts[client.id]?.observacoes ?? client.observacoes ?? "",
    status_cadastro: drafts[client.id]?.status_cadastro ?? client.status_cadastro,
    motivo_reprovacao: drafts[client.id]?.motivo_reprovacao ?? client.motivo_reprovacao ?? "",
    user_type: drafts[client.id]?.user_type ?? client.user_type ?? "cliente",
    notes: drafts[client.id]?.notes ?? client.notes ?? "",
    nome_responsavel: drafts[client.id]?.nome_responsavel ?? client.nome_responsavel,
    account_manager_user_id: drafts[client.id]?.account_manager_user_id ?? client.account_manager_user_id ?? "",
    account_manager_name: drafts[client.id]?.account_manager_name ?? client.account_manager_name ?? "",
    account_manager_email: drafts[client.id]?.account_manager_email ?? client.account_manager_email ?? "",
    account_manager_whatsapp: drafts[client.id]?.account_manager_whatsapp ?? client.account_manager_whatsapp ?? "",
  })

  const updateDraft = (clientId: string, patch: Partial<UpdateClientInput>) => {
    setDrafts((current) => ({
      ...current,
      [clientId]: {
        ...current[clientId],
        ...patch,
      },
    }))
  }

  const applyManagerSelection = (clientId: string, managerUserId: string) => {
    const manager = managerMap.get(managerUserId)
    updateDraft(clientId, {
      account_manager_user_id: manager?.auth_user_id || null,
      account_manager_name: manager?.full_name || null,
      account_manager_email: manager?.email || null,
      account_manager_whatsapp: manager?.whatsapp || manager?.telefone || null,
    })
  }

  const handleSave = async (client: ClientAdminRow) => {
    const draft = getDraft(client)
    if (!draft.account_manager_user_id) {
      toast.error("Selecione um gerente responsável.")
      return
    }
    try {
      setSavingId(client.id)
      await saveClient(draft)
      toast.success("Cliente atualizado")
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o cliente."
      toast.error("Erro ao salvar cliente", { description: message })
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (client: ClientAdminRow) => {
    const confirmed = window.confirm(`Excluir o cliente ${client.razao_social}? O registro deixará de constar no sistema.`)
    if (!confirmed) return

    try {
      setDeletingId(client.id)
      await deleteUserRecord({
        userId: client.user_id || client.profile_id || client.id,
        reseller_id: client.id,
        email: client.email || null,
        user_type: client.user_type || "cliente",
      })
      toast.success("Cliente excluído")
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível excluir o cliente."
      toast.error("Erro ao excluir cliente", { description: message })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_180px] lg:w-[720px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, CNPJ, e-mail, cidade ou telefone"
          />
          {mode === "admin" ? (
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={managerFilter}
              onChange={(event) => setManagerFilter(event.target.value)}
            >
              <option value="todos">Todos os gerentes</option>
              <option value="sem-gerente">Sem gerente</option>
              {managers.map((manager) => (
                <option key={manager.auth_user_id} value={manager.auth_user_id}>
                  {manager.full_name}
                </option>
              ))}
            </select>
          ) : null}
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="todos">Todos os status</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.map((client) => {
          const isExpanded = Boolean(expanded[client.id])
          const draft = getDraft(client)
          return (
            <div key={client.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-3 p-4 md:grid-cols-[1.1fr_0.9fr_0.9fr_1fr_0.8fr_auto] md:items-center">
                <Cell label="Nome / Razão social" value={client.razao_social} strong />
                <Cell label="CNPJ / CPF" value={client.cnpj} />
                <Cell label="Telefone" value={client.whatsapp || client.telefone} />
                <Cell label="E-mail" value={client.email} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</div>
                  <div className="mt-1"><StatusBadge status={client.status_cadastro} /></div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setExpanded((current) => ({ ...current, [client.id]: !current[client.id] }))}>
                    {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {isExpanded ? "Menos" : "Mais"}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 p-4">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Razão social">
                        <Input value={draft.razao_social} onChange={(event) => updateDraft(client.id, { razao_social: event.target.value })} />
                      </Field>
                      <Field label="Nome do responsável">
                        <Input value={draft.nome_responsavel || ""} onChange={(event) => updateDraft(client.id, { nome_responsavel: event.target.value })} />
                      </Field>
                      <Field label="Nome fantasia">
                        <Input value={draft.nome_fantasia || ""} onChange={(event) => updateDraft(client.id, { nome_fantasia: event.target.value })} />
                      </Field>
                      <Field label="CNPJ / CPF">
                        <Input value={draft.cnpj} onChange={(event) => updateDraft(client.id, { cnpj: event.target.value })} />
                      </Field>
                      <Field label="E-mail">
                        <Input value={draft.email} onChange={(event) => updateDraft(client.id, { email: event.target.value })} />
                      </Field>
                      <Field label="Nova senha">
                        <Input
                          type="password"
                          placeholder="Deixe em branco para manter"
                          value={draft.password || ""}
                          onChange={(event) => updateDraft(client.id, { password: event.target.value })}
                        />
                      </Field>
                      <Field label="Telefone">
                        <Input value={draft.telefone} onChange={(event) => updateDraft(client.id, { telefone: event.target.value })} />
                      </Field>
                      <Field label="WhatsApp">
                        <Input value={draft.whatsapp || ""} onChange={(event) => updateDraft(client.id, { whatsapp: event.target.value })} />
                      </Field>
                      <Field label="CEP">
                        <Input value={draft.cep} onChange={(event) => updateDraft(client.id, { cep: event.target.value })} />
                      </Field>
                      <Field label="Estado">
                        <Input value={draft.estado} onChange={(event) => updateDraft(client.id, { estado: event.target.value })} />
                      </Field>
                      <Field label="Cidade">
                        <Input value={draft.cidade} onChange={(event) => updateDraft(client.id, { cidade: event.target.value })} />
                      </Field>
                      <Field label="Bairro">
                        <Input value={draft.bairro} onChange={(event) => updateDraft(client.id, { bairro: event.target.value })} />
                      </Field>
                      <Field label="Endereço">
                        <Input value={draft.endereco} onChange={(event) => updateDraft(client.id, { endereco: event.target.value })} />
                      </Field>
                      <Field label="Número">
                        <Input value={draft.numero} onChange={(event) => updateDraft(client.id, { numero: event.target.value })} />
                      </Field>
                      <Field label="Complemento">
                        <Input value={draft.complemento || ""} onChange={(event) => updateDraft(client.id, { complemento: event.target.value })} />
                      </Field>
                      <Field label="Tipo de usuário">
                        <Input value={draft.user_type || "cliente"} onChange={(event) => updateDraft(client.id, { user_type: event.target.value })} />
                      </Field>
                      <Field label="Status">
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={draft.status_cadastro}
                          onChange={(event) => updateDraft(client.id, { status_cadastro: event.target.value as UpdateUserInput["status_cadastro"] })}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Gerente de conta">
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={draft.account_manager_user_id || ""}
                          onChange={(event) => applyManagerSelection(client.id, event.target.value)}
                          disabled={mode === "manager"}
                        >
                          <option value="">Selecione um gerente</option>
                          {managers.map((manager) => (
                            <option key={manager.auth_user_id} value={manager.auth_user_id}>
                              {manager.full_name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="grid gap-4">
                      <Field label="Motivo / observação de status">
                        <Textarea rows={4} value={draft.motivo_reprovacao || ""} onChange={(event) => updateDraft(client.id, { motivo_reprovacao: event.target.value })} />
                      </Field>
                      <Field label="Observações do cliente">
                        <Textarea rows={4} value={draft.observacoes || ""} onChange={(event) => updateDraft(client.id, { observacoes: event.target.value })} />
                      </Field>
                      <Field label="Observações internas">
                        <Textarea rows={4} value={draft.notes || ""} onChange={(event) => updateDraft(client.id, { notes: event.target.value })} />
                      </Field>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Nome do gerente">
                          <Input value={draft.account_manager_name || ""} readOnly />
                        </Field>
                        <Field label="WhatsApp do gerente">
                          <Input value={draft.account_manager_whatsapp || ""} readOnly />
                        </Field>
                      </div>
                       <div className="flex flex-wrap justify-end gap-2">
                         {mode === "admin" ? (
                           <Button variant="destructive" onClick={() => handleDelete(client)} disabled={deletingId === client.id || savingId === client.id}>
                             <Trash2 className="mr-2 h-4 w-4" />
                             {deletingId === client.id ? "Excluindo..." : "Excluir"}
                           </Button>
                         ) : null}
                         <Button onClick={() => handleSave(client)} disabled={savingId === client.id || deletingId === client.id}>
                           <Save className="mr-2 h-4 w-4" />
                           {savingId === client.id ? "Salvando..." : "Salvar cliente"}
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
            Nenhum cliente encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</Label>
      {children}
    </div>
  )
}

function Cell({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={strong ? "truncate text-sm font-semibold text-slate-950" : "truncate text-sm text-slate-700"}>{value}</div>
    </div>
  )
}

