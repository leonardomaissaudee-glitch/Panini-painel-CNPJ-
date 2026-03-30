import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fetchGifts, upsertGift, deleteGift, type GiftCatalogRow } from "@/features/admin/services/adminService"

type GiftDraft = Partial<GiftCatalogRow>

const EMPTY_GIFT: GiftDraft = {
  name: "",
  description: "",
  reference: "",
  quantity_available: 0,
  is_active: true,
  image_url: "",
  notes: "",
}

export function GiftsPanel() {
  const [gifts, setGifts] = useState<GiftCatalogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<GiftDraft>(EMPTY_GIFT)
  const [drafts, setDrafts] = useState<Record<string, GiftDraft>>({})

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchGifts()
      setGifts(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível carregar os brindes."
      toast.error("Erro ao carregar brindes", { description: message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return gifts
    return gifts.filter((gift) =>
      [gift.name, gift.reference, gift.description, gift.notes]
        .map((value) => (value || "").toString().toLowerCase())
        .some((value) => value.includes(term))
    )
  }, [gifts, search])

  const getDraft = (gift: GiftCatalogRow): GiftDraft => ({
    id: gift.id,
    name: drafts[gift.id]?.name ?? gift.name,
    description: drafts[gift.id]?.description ?? gift.description ?? "",
    reference: drafts[gift.id]?.reference ?? gift.reference ?? "",
    quantity_available: drafts[gift.id]?.quantity_available ?? gift.quantity_available ?? 0,
    is_active: drafts[gift.id]?.is_active ?? gift.is_active,
    image_url: drafts[gift.id]?.image_url ?? gift.image_url ?? "",
    notes: drafts[gift.id]?.notes ?? gift.notes ?? "",
  })

  const updateDraft = (giftId: string, patch: GiftDraft) => {
    setDrafts((current) => ({
      ...current,
      [giftId]: {
        ...current[giftId],
        ...patch,
      },
    }))
  }

  const saveGift = async (draft: GiftDraft, reset = false) => {
    if (!draft.name?.trim()) {
      toast.error("Informe o nome do brinde.")
      return
    }

    try {
      setSavingId(draft.id || "new")
      await upsertGift({
        id: draft.id,
        name: draft.name.trim(),
        description: draft.description || null,
        reference: draft.reference || null,
        quantity_available: Number(draft.quantity_available || 0),
        is_active: draft.is_active ?? true,
        image_url: draft.image_url || null,
        notes: draft.notes || null,
      })
      toast.success(draft.id ? "Brinde atualizado" : "Brinde cadastrado")
      if (reset) setForm(EMPTY_GIFT)
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o brinde."
      toast.error("Erro ao salvar brinde", { description: message })
    } finally {
      setSavingId(null)
    }
  }

  const removeGift = async (giftId: string) => {
    const confirmed = window.confirm("Excluir este brinde?")
    if (!confirmed) return

    try {
      setSavingId(giftId)
      await deleteGift(giftId)
      toast.success("Brinde excluído")
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível excluir o brinde."
      toast.error("Erro ao excluir brinde", { description: message })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Cadastrar brinde</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Nome">
            <Input value={form.name || ""} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </Field>
          <Field label="Código / referência">
            <Input value={form.reference || ""} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} />
          </Field>
          <Field label="Quantidade disponível">
            <Input type="number" min={0} value={form.quantity_available || 0} onChange={(event) => setForm((current) => ({ ...current, quantity_available: Number(event.target.value || 0) }))} />
          </Field>
          <Field label="Status">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.is_active ? "ativo" : "inativo"} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.value === "ativo" }))}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </Field>
          <div className="md:col-span-2 xl:col-span-4">
            <Field label="Descrição">
              <Textarea rows={3} value={form.description || ""} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </Field>
          </div>
          <Field label="Imagem (URL)">
            <Input value={form.image_url || ""} onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))} />
          </Field>
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Observação interna">
              <Textarea rows={3} value={form.notes || ""} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
            </Field>
          </div>
          <div className="md:col-span-2 xl:col-span-4 flex justify-end">
            <Button onClick={() => void saveGift(form, true)} disabled={savingId === "new"}>
              <Plus className="mr-2 h-4 w-4" />
              {savingId === "new" ? "Salvando..." : "Cadastrar brinde"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Brindes cadastrados</CardTitle>
            <p className="text-sm text-muted-foreground">Ative, edite e controle o catálogo de brindes disponível para os pedidos.</p>
          </div>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, código ou descrição" className="w-full md:max-w-sm" />
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((gift) => {
            const isExpanded = Boolean(expanded[gift.id])
            const draft = getDraft(gift)
            return (
              <div key={gift.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-3 p-4 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_auto] md:items-center">
                  <div>
                    <div className="font-semibold text-slate-950">{gift.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{gift.reference || "Sem referência"}</div>
                  </div>
                  <SummaryCell label="Disponível" value={String(gift.quantity_available ?? 0)} />
                  <SummaryCell label="Status" value={gift.is_active ? "Ativo" : "Inativo"} />
                  <SummaryCell label="Criado em" value={gift.created_at ? new Date(gift.created_at).toLocaleDateString("pt-BR") : "-"} />
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setExpanded((current) => ({ ...current, [gift.id]: !current[gift.id] }))}>
                      {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                      {isExpanded ? "Fechar" : "Editar"}
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-200 p-4">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Nome">
                          <Input value={draft.name || ""} onChange={(event) => updateDraft(gift.id, { name: event.target.value })} />
                        </Field>
                        <Field label="Código / referência">
                          <Input value={draft.reference || ""} onChange={(event) => updateDraft(gift.id, { reference: event.target.value })} />
                        </Field>
                        <Field label="Quantidade disponível">
                          <Input type="number" min={0} value={draft.quantity_available || 0} onChange={(event) => updateDraft(gift.id, { quantity_available: Number(event.target.value || 0) })} />
                        </Field>
                        <Field label="Status">
                          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.is_active ? "ativo" : "inativo"} onChange={(event) => updateDraft(gift.id, { is_active: event.target.value === "ativo" })}>
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                          </select>
                        </Field>
                        <div className="md:col-span-2">
                          <Field label="Imagem (URL)">
                            <Input value={draft.image_url || ""} onChange={(event) => updateDraft(gift.id, { image_url: event.target.value })} />
                          </Field>
                        </div>
                      </div>
                      <div className="grid gap-4">
                        <Field label="Descrição">
                          <Textarea rows={4} value={draft.description || ""} onChange={(event) => updateDraft(gift.id, { description: event.target.value })} />
                        </Field>
                        <Field label="Observação interna">
                          <Textarea rows={4} value={draft.notes || ""} onChange={(event) => updateDraft(gift.id, { notes: event.target.value })} />
                        </Field>
                        <div className="flex flex-wrap justify-end gap-3">
                          <Button variant="destructive" onClick={() => void removeGift(gift.id)} disabled={savingId === gift.id}>
                            <Trash2 className="mr-2 h-4 w-4" />Excluir
                          </Button>
                          <Button onClick={() => void saveGift(draft)} disabled={savingId === gift.id}>
                            <Save className="mr-2 h-4 w-4" />Salvar
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
              Nenhum brinde encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</Label>
      {children}
    </div>
  )
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}
