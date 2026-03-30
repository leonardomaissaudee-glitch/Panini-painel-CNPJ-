import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createManualUser, fetchAdminUsers, type AdminUserRow, type CreateManualUserInput } from "@/features/admin/services/adminService"
import { StatusBadge } from "@/components/StatusBadge"

const USER_TYPE_OPTIONS = [
  { value: "cliente", label: "Cliente" },
  { value: "vendedor", label: "Vendedor" },
  { value: "gerente", label: "Gerente" },
  { value: "atendente", label: "Atendente" },
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
  notes: "",
  razao_social: "",
  nome_fantasia: "",
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<CreateManualUserInput>(INITIAL_FORM)
  const isClientCreation = form.user_type === "cliente"

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchAdminUsers()
      setUsers(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível carregar os usuários."
      toast.error("Erro ao carregar usuários", { description: message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
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
      [user.full_name, user.email, user.documento, user.telefone, user.role, (user as AdminUserRow).user_type]
        .map((value) => (value || "").toString().toLowerCase())
        .some((value) => value.includes(term))
    )
  }, [users, search])

  const handleCreate = async () => {
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
            <>
              <div className="md:col-span-2 xl:col-span-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 text-sm font-semibold text-slate-900">Dados obrigatórios do cliente</div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Razão social">
                    <Input value={form.razao_social || ""} onChange={(event) => setForm((current) => ({ ...current, razao_social: event.target.value }))} />
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
                </div>
              </div>
            </>
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
            <p className="text-sm text-muted-foreground">Contas internas e perfis auxiliares criados pelo administrativo.</p>
          </div>
          <Input
            placeholder="Buscar por nome, e-mail, documento ou telefone"
            className="w-full md:max-w-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((user) => {
            const isExpanded = Boolean(expanded[user.id])
            const label = (user as AdminUserRow).user_type || user.role
            return (
              <div key={user.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-3 p-4 md:grid-cols-[1.3fr_1fr_0.9fr_0.9fr_auto] md:items-center">
                  <div>
                    <div className="font-semibold text-slate-950">{user.full_name || "Usuário sem nome"}</div>
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
                      {isExpanded ? "Menos" : "Mais"}
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-200 p-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoField label="Role técnico" value={user.role} />
                    <InfoField label="Telefone" value={user.telefone || "-"} />
                    <InfoField label="Tipo documento" value={user.tipo_documento || "-"} />
                    <InfoField label="Observações" value={(user as AdminUserRow).notes || "-"} />
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

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

