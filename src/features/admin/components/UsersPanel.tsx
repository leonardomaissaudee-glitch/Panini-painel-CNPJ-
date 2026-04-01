import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/context/AuthContext"
import {
  createManualUser,
  deleteUserRecord,
  fetchAccountManagers,
  fetchAdminUsers,
  saveUser,
  type AccountManagerDirectoryRow,
  type AdminUserRow,
  type CreateManualUserInput,
  type UpdateUserInput,
} from "@/features/admin/services/adminService"
import { StatusBadge } from "@/components/StatusBadge"

const USER_TYPE_OPTIONS = [
  { value: "cliente", label: "Cliente" },
  { value: "vendedor", label: "Vendedor" },
  { value: "gerente", label: "Gerente" },
  { value: "atendente", label: "Atendente" },
  { value: "admin", label: "Admin" },
] as const

const STATUS_OPTIONS = [
  { value: "approved", label: "Aprovado" },
  { value: "pending", label: "Pendente" },
  { value: "rejected", label: "Reprovado" },
  { value: "blocked", label: "Bloqueado" },
] as const

const INITIAL_FORM: CreateManualUserInput = {
  full_name: "",
  email: "",
  password: "",
  telefone: "",
  documento: "",
  tipo_documento: "cpf",
  user_type: "vendedor",
  status_cadastro: "approved",
  company_name: "",
  notes: "",
  razao_social: "",
  nome_fantasia: "",
  nome_responsavel: "",
  segmento: "",
  faixa_investimento: "",
  canal_revenda: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
}

export function UsersPanel() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [managers, setManagers] = useState<AccountManagerDirectoryRow[]>([])
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<CreateManualUserInput>(INITIAL_FORM)
  const [drafts, setDrafts] = useState<Record<string, Partial<UpdateUserInput>>>({})
  const { user: sessionUser, profile: sessionProfile } = useAuth()
  const isClientCreation = form.user_type === "cliente"

  const load = async () => {
    setLoading(true)
    try {
      const [data, managerRows] = await Promise.all([fetchAdminUsers(), fetchAccountManagers()])
      setUsers(data)
      setManagers(managerRows)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível carregar os usuários."
      toast.error("Erro ao carregar usuários", { description: message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (form.user_type === "cliente" && form.tipo_documento !== "cnpj") {
      setForm((current) => ({ ...current, tipo_documento: "cnpj" }))
    }
  }, [form.user_type, form.tipo_documento])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter((user) =>
      [
        user.full_name,
        user.razao_social,
        user.company_name,
        user.email,
        user.documento,
        user.telefone,
        user.role,
        user.user_type,
        user.nome_fantasia,
      ]
        .map((value) => (value || "").toString().toLowerCase())
        .some((value) => value.includes(term))
    )
  }, [users, search])

  const managerMap = useMemo(() => new Map(managers.map((manager) => [manager.auth_user_id, manager])), [managers])

  const getDraft = (user: AdminUserRow): UpdateUserInput => ({
    userId: user.auth_user_id || user.id,
    reseller_id: user.reseller_id || null,
    full_name: drafts[user.id]?.full_name ?? user.full_name ?? user.company_name ?? "",
    email: drafts[user.id]?.email ?? user.email ?? "",
    password: drafts[user.id]?.password ?? "",
    telefone: drafts[user.id]?.telefone ?? user.telefone ?? "",
    documento: drafts[user.id]?.documento ?? user.documento ?? "",
    tipo_documento: drafts[user.id]?.tipo_documento ?? user.tipo_documento ?? (user.user_type === "cliente" ? "cnpj" : "cpf"),
    user_type: (drafts[user.id]?.user_type as UpdateUserInput["user_type"]) ?? ((user.user_type as UpdateUserInput["user_type"]) || "vendedor"),
    status_cadastro: (drafts[user.id]?.status_cadastro as UpdateUserInput["status_cadastro"]) ?? user.status_cadastro,
    company_name: drafts[user.id]?.company_name ?? user.company_name ?? "",
    notes: drafts[user.id]?.notes ?? user.notes ?? "",
    razao_social: drafts[user.id]?.razao_social ?? user.razao_social ?? user.company_name ?? "",
    nome_fantasia: drafts[user.id]?.nome_fantasia ?? user.nome_fantasia ?? "",
    nome_responsavel: drafts[user.id]?.nome_responsavel ?? user.nome_responsavel ?? "",
    segmento: drafts[user.id]?.segmento ?? user.segmento ?? "",
    faixa_investimento: drafts[user.id]?.faixa_investimento ?? user.faixa_investimento ?? "",
    canal_revenda: drafts[user.id]?.canal_revenda ?? user.canal_revenda ?? "",
    cep: drafts[user.id]?.cep ?? user.cep ?? "",
    endereco: drafts[user.id]?.endereco ?? (typeof user.endereco === "string" ? user.endereco : user.endereco?.endereco) ?? "",
    numero: drafts[user.id]?.numero ?? user.numero ?? "",
    complemento: drafts[user.id]?.complemento ?? user.complemento ?? "",
    bairro: drafts[user.id]?.bairro ?? user.bairro ?? "",
    cidade: drafts[user.id]?.cidade ?? user.cidade ?? "",
    estado: drafts[user.id]?.estado ?? user.estado ?? "",
    observacoes: drafts[user.id]?.observacoes ?? user.observacoes ?? "",
    motivo_reprovacao: drafts[user.id]?.motivo_reprovacao ?? user.motivo_reprovacao ?? "",
    account_manager_user_id: drafts[user.id]?.account_manager_user_id ?? user.account_manager_user_id ?? "",
    account_manager_name: drafts[user.id]?.account_manager_name ?? user.account_manager_name ?? "",
    account_manager_email: drafts[user.id]?.account_manager_email ?? user.account_manager_email ?? "",
    account_manager_whatsapp: drafts[user.id]?.account_manager_whatsapp ?? user.account_manager_whatsapp ?? "",
  })

  const getUserDisplayName = (user: AdminUserRow) => {
    const isCurrentUser =
      Boolean(sessionUser?.id) &&
      (user.auth_user_id === sessionUser?.id || user.email?.toLowerCase() === sessionUser?.email?.toLowerCase())

    if (isCurrentUser) {
      const currentName =
        sessionProfile?.full_name ||
        (typeof sessionUser?.user_metadata?.full_name === "string" ? sessionUser.user_metadata.full_name.trim() : "") ||
        null

      if (currentName) return currentName
    }

    return user.full_name || user.razao_social || user.company_name || "Usuário sem nome"
  }

  const updateDraft = (userId: string, patch: Partial<UpdateUserInput>) => {
    setDrafts((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        ...patch,
      },
    }))
  }

  const applyManagerSelectionToCreateForm = (managerUserId: string) => {
    const manager = managerMap.get(managerUserId)
    setForm((current) => ({
      ...current,
      account_manager_user_id: manager?.auth_user_id || null,
      account_manager_name: manager?.full_name || null,
      account_manager_email: manager?.email || null,
      account_manager_whatsapp: manager?.whatsapp || manager?.telefone || null,
    }))
  }

  const applyManagerSelectionToDraft = (userId: string, managerUserId: string) => {
    const manager = managerMap.get(managerUserId)
    updateDraft(userId, {
      account_manager_user_id: manager?.auth_user_id || null,
      account_manager_name: manager?.full_name || null,
      account_manager_email: manager?.email || null,
      account_manager_whatsapp: manager?.whatsapp || manager?.telefone || null,
    })
  }

  const handleCreate = async () => {
    if (form.user_type === "cliente" && !form.account_manager_user_id) {
      toast.error("Selecione o gerente responsável do cliente.")
      return
    }

    try {
      setSaving(true)
      await createManualUser(form)
      toast.success("Usuário criado", { description: "A conta foi criada e vinculada ao Supabase Auth." })
      setForm(INITIAL_FORM)
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar o usuário."
      toast.error("Erro ao criar usuário", { description: message })
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (user: AdminUserRow) => {
    const draft = getDraft(user)

    if (draft.user_type === "cliente" && !draft.razao_social) {
      toast.error("Informe a razão social do cliente.")
      return
    }

    if (!draft.full_name && draft.user_type !== "cliente") {
      toast.error("Informe o nome do usuário.")
      return
    }

    if (draft.user_type === "cliente" && !draft.account_manager_user_id) {
      toast.error("Selecione o gerente responsável do cliente.")
      return
    }

    try {
      setSavingUserId(user.id)
      await saveUser({
        ...draft,
        full_name: draft.user_type === "cliente" ? draft.razao_social || draft.full_name : draft.full_name,
        tipo_documento: draft.user_type === "cliente" ? "cnpj" : draft.tipo_documento,
      })
      toast.success("Usuário atualizado")
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o usuário."
      toast.error("Erro ao salvar usuário", { description: message })
    } finally {
      setSavingUserId(null)
    }
  }

  const handleDelete = async (user: AdminUserRow) => {
    const displayName = getUserDisplayName(user)
    const confirmed = window.confirm(`Excluir ${displayName}? O registro deixará de constar no sistema.`)
    if (!confirmed) return

    try {
      setDeletingUserId(user.id)
      await deleteUserRecord({
        userId: user.auth_user_id || user.id,
        reseller_id: user.reseller_id || null,
        email: user.email || null,
        user_type: user.user_type || user.role,
      })
      toast.success("Registro excluído")
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível excluir o registro."
      toast.error("Erro ao excluir", { description: message })
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Criar usuário manualmente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Nome completo">
            <Input value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
          </Field>
          <Field label="Empresa">
            <Input value={form.company_name || ""} onChange={(event) => setForm((current) => ({ ...current, company_name: event.target.value }))} />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </Field>
          <Field label="Senha inicial">
            <Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </Field>
          <Field label="Telefone">
            <Input value={form.telefone || ""} onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))} />
          </Field>
          <Field label="Tipo de usuário">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.user_type}
              onChange={(event) => setForm((current) => ({ ...current, user_type: event.target.value as CreateManualUserInput["user_type"] }))}
            >
              {USER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status inicial">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.status_cadastro}
              onChange={(event) => setForm((current) => ({ ...current, status_cadastro: event.target.value as CreateManualUserInput["status_cadastro"] }))}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo de documento">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.tipo_documento || "cpf"}
              onChange={(event) => setForm((current) => ({ ...current, tipo_documento: event.target.value as "cpf" | "cnpj" }))}
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
            </select>
          </Field>
          <Field label="Documento">
            <Input value={form.documento || ""} onChange={(event) => setForm((current) => ({ ...current, documento: event.target.value }))} />
          </Field>
          <div className="md:col-span-2 xl:col-span-4">
            <Field label="Observações internas">
              <Textarea rows={3} value={form.notes || ""} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
            </Field>
          </div>
          {isClientCreation && (
            <div className="md:col-span-2 xl:col-span-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 text-sm font-semibold text-slate-900">Dados obrigatórios do cliente</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Razão social">
                  <Input value={form.razao_social || ""} onChange={(event) => setForm((current) => ({ ...current, razao_social: event.target.value }))} />
                </Field>
                <Field label="Responsável">
                  <Input value={form.nome_responsavel || form.full_name || ""} onChange={(event) => setForm((current) => ({ ...current, nome_responsavel: event.target.value }))} />
                </Field>
                <Field label="Nome fantasia">
                  <Input value={form.nome_fantasia || ""} onChange={(event) => setForm((current) => ({ ...current, nome_fantasia: event.target.value }))} />
                </Field>
                <Field label="Segmento">
                  <Input value={form.segmento || ""} onChange={(event) => setForm((current) => ({ ...current, segmento: event.target.value }))} />
                </Field>
                <Field label="Canal de revenda">
                  <Input value={form.canal_revenda || ""} onChange={(event) => setForm((current) => ({ ...current, canal_revenda: event.target.value }))} />
                </Field>
                <Field label="Faixa de investimento">
                  <Input value={form.faixa_investimento || ""} onChange={(event) => setForm((current) => ({ ...current, faixa_investimento: event.target.value }))} />
                </Field>
                <Field label="CEP">
                  <Input value={form.cep || ""} onChange={(event) => setForm((current) => ({ ...current, cep: event.target.value }))} />
                </Field>
                <Field label="Endereço">
                  <Input value={form.endereco || ""} onChange={(event) => setForm((current) => ({ ...current, endereco: event.target.value }))} />
                </Field>
                <Field label="Número">
                  <Input value={form.numero || ""} onChange={(event) => setForm((current) => ({ ...current, numero: event.target.value }))} />
                </Field>
                <Field label="Complemento">
                  <Input value={form.complemento || ""} onChange={(event) => setForm((current) => ({ ...current, complemento: event.target.value }))} />
                </Field>
                <Field label="Bairro">
                  <Input value={form.bairro || ""} onChange={(event) => setForm((current) => ({ ...current, bairro: event.target.value }))} />
                </Field>
                <Field label="Cidade">
                  <Input value={form.cidade || ""} onChange={(event) => setForm((current) => ({ ...current, cidade: event.target.value }))} />
                </Field>
                <Field label="Estado">
                  <Input value={form.estado || ""} onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value }))} />
                </Field>
                <Field label="Gerente de conta">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.account_manager_user_id || ""}
                    onChange={(event) => applyManagerSelectionToCreateForm(event.target.value)}
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
            </div>
          )}
          <div className="md:col-span-2 xl:col-span-4 flex justify-end">
            <Button onClick={handleCreate} disabled={saving}>
              <Plus className="mr-2 h-4 w-4" />
              {saving ? "Criando..." : "Criar usuário"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Usuários cadastrados</CardTitle>
            <p className="text-sm text-muted-foreground">Edite manualmente clientes, admins, gerentes, vendedores e atendentes.</p>
          </div>
          <Input
            placeholder="Buscar por nome, empresa, e-mail, documento ou telefone"
            className="w-full md:max-w-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((user) => {
            const isExpanded = Boolean(expanded[user.id])
            const draft = getDraft(user)
            const isClient = draft.user_type === "cliente"
            const label = user.user_type || user.role
            return (
              <div key={user.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_0.9fr_0.9fr_auto] md:items-center">
                  <div>
                    <div className="font-semibold text-slate-950">{getUserDisplayName(user)}</div>
                    <div className="mt-1 text-sm text-slate-500">{user.email || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tipo</div>
                    <div className="text-sm font-medium text-slate-900 capitalize">{label}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Documento</div>
                    <div className="text-sm text-slate-700">{user.documento || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</div>
                    <div className="mt-1"><StatusBadge status={user.status_cadastro} /></div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setExpanded((current) => ({ ...current, [user.id]: !current[user.id] }))}>
                      {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                      {isExpanded ? "Fechar" : "Editar"}
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-200 p-4">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="grid gap-4 md:grid-cols-2">
                        {!isClient && (
                          <Field label="Nome completo">
                            <Input value={draft.full_name} onChange={(event) => updateDraft(user.id, { full_name: event.target.value })} />
                          </Field>
                        )}
                        <Field label={isClient ? "Razão social" : "Empresa"}>
                          <Input
                            value={isClient ? draft.razao_social || "" : draft.company_name || ""}
                            onChange={(event) =>
                              updateDraft(user.id, isClient ? { razao_social: event.target.value } : { company_name: event.target.value })
                            }
                          />
                        </Field>
                        {isClient && (
                          <Field label="Responsável">
                            <Input value={draft.nome_responsavel || ""} onChange={(event) => updateDraft(user.id, { nome_responsavel: event.target.value })} />
                          </Field>
                        )}
                        <Field label="E-mail">
                          <Input type="email" value={draft.email} onChange={(event) => updateDraft(user.id, { email: event.target.value })} />
                        </Field>
                        <Field label="Nova senha">
                          <Input
                            type="password"
                            placeholder="Deixe em branco para manter"
                            value={draft.password || ""}
                            onChange={(event) => updateDraft(user.id, { password: event.target.value })}
                          />
                        </Field>
                        <Field label="Telefone">
                          <Input value={draft.telefone || ""} onChange={(event) => updateDraft(user.id, { telefone: event.target.value })} />
                        </Field>
                        <Field label="Tipo de usuário">
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={draft.user_type}
                            onChange={(event) => updateDraft(user.id, { user_type: event.target.value as UpdateUserInput["user_type"] })}
                          >
                            {USER_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Status">
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={draft.status_cadastro}
                            onChange={(event) => updateDraft(user.id, { status_cadastro: event.target.value as UpdateUserInput["status_cadastro"] })}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Tipo de documento">
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={draft.tipo_documento || (isClient ? "cnpj" : "cpf")}
                            onChange={(event) => updateDraft(user.id, { tipo_documento: event.target.value as "cpf" | "cnpj" })}
                            disabled={isClient}
                          >
                            <option value="cpf">CPF</option>
                            <option value="cnpj">CNPJ</option>
                          </select>
                        </Field>
                        <Field label="Documento">
                          <Input value={draft.documento || ""} onChange={(event) => updateDraft(user.id, { documento: event.target.value })} />
                        </Field>
                        <Field label="CEP">
                          <Input value={draft.cep || ""} onChange={(event) => updateDraft(user.id, { cep: event.target.value })} />
                        </Field>
                        <Field label="Endereço">
                          <Input value={draft.endereco || ""} onChange={(event) => updateDraft(user.id, { endereco: event.target.value })} />
                        </Field>
                        <Field label="Número">
                          <Input value={draft.numero || ""} onChange={(event) => updateDraft(user.id, { numero: event.target.value })} />
                        </Field>
                        <Field label="Complemento">
                          <Input value={draft.complemento || ""} onChange={(event) => updateDraft(user.id, { complemento: event.target.value })} />
                        </Field>
                        <Field label="Bairro">
                          <Input value={draft.bairro || ""} onChange={(event) => updateDraft(user.id, { bairro: event.target.value })} />
                        </Field>
                        <Field label="Cidade">
                          <Input value={draft.cidade || ""} onChange={(event) => updateDraft(user.id, { cidade: event.target.value })} />
                        </Field>
                        <Field label="Estado">
                          <Input value={draft.estado || ""} onChange={(event) => updateDraft(user.id, { estado: event.target.value })} />
                        </Field>
                        {isClient && (
                          <>
                            <Field label="Nome fantasia">
                              <Input value={draft.nome_fantasia || ""} onChange={(event) => updateDraft(user.id, { nome_fantasia: event.target.value })} />
                            </Field>
                            <Field label="Segmento">
                              <Input value={draft.segmento || ""} onChange={(event) => updateDraft(user.id, { segmento: event.target.value })} />
                            </Field>
                            <Field label="Faixa de investimento">
                              <Input value={draft.faixa_investimento || ""} onChange={(event) => updateDraft(user.id, { faixa_investimento: event.target.value })} />
                            </Field>
                            <Field label="Canal de revenda">
                              <Input value={draft.canal_revenda || ""} onChange={(event) => updateDraft(user.id, { canal_revenda: event.target.value })} />
                            </Field>
                          </>
                        )}
                      </div>

                      <div className="grid gap-4">
                        {isClient ? (
                          <Field label="Observações do cliente">
                            <Textarea rows={4} value={draft.observacoes || ""} onChange={(event) => updateDraft(user.id, { observacoes: event.target.value })} />
                          </Field>
                        ) : null}
                        {isClient ? (
                          <Field label="Gerente de conta">
                            <select
                              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                              value={draft.account_manager_user_id || ""}
                              onChange={(event) => applyManagerSelectionToDraft(user.id, event.target.value)}
                            >
                              <option value="">Selecione um gerente</option>
                              {managers.map((manager) => (
                                <option key={manager.auth_user_id} value={manager.auth_user_id}>
                                  {manager.full_name}
                                </option>
                              ))}
                            </select>
                          </Field>
                        ) : null}
                        <Field label="Observações internas">
                          <Textarea rows={4} value={draft.notes || ""} onChange={(event) => updateDraft(user.id, { notes: event.target.value })} />
                        </Field>
                        <Field label="Motivo / status">
                          <Textarea rows={4} value={draft.motivo_reprovacao || ""} onChange={(event) => updateDraft(user.id, { motivo_reprovacao: event.target.value })} />
                        </Field>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Nome do gerente">
                            <Input value={draft.account_manager_name || ""} readOnly />
                          </Field>
                          <Field label="WhatsApp do gerente">
                            <Input value={draft.account_manager_whatsapp || ""} readOnly />
                          </Field>
                        </div>
                        <div className="flex justify-end">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="destructive" onClick={() => handleDelete(user)} disabled={deletingUserId === user.id || savingUserId === user.id}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deletingUserId === user.id ? "Excluindo..." : "Excluir"}
                            </Button>
                            <Button onClick={() => handleSave(user)} disabled={savingUserId === user.id || deletingUserId === user.id}>
                              <Save className="mr-2 h-4 w-4" />
                              {savingUserId === user.id ? "Salvando..." : "Salvar usuário"}
                            </Button>
                          </div>
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
              Nenhum usuário encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
