import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/StatusBadge"
import { fetchApprovedClients, type ClientAdminRow } from "@/features/admin/services/adminService"
import { toast } from "sonner"

export function ApprovedClientsPanel() {
  const [clients, setClients] = useState<ClientAdminRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchApprovedClients()
      setClients(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível carregar os clientes aprovados."
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
    if (!term) return clients
    return clients.filter((client) =>
      [client.razao_social, client.nome_responsavel, client.email, client.cnpj, client.telefone]
        .map((value) => (value || "").toString().toLowerCase())
        .some((value) => value.includes(term))
    )
  }, [clients, search])

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Clientes aprovados</CardTitle>
          <p className="text-sm text-muted-foreground">Somente clientes liberados para acessar o portal e operar pedidos.</p>
        </div>
        <Input
          className="w-full md:max-w-sm"
          placeholder="Buscar por razão social, e-mail, CNPJ ou telefone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.map((client) => {
          const isExpanded = Boolean(expanded[client.id])
          return (
            <div key={client.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_0.9fr_0.9fr_0.8fr_auto] md:items-center">
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
                <div className="border-t border-slate-200 p-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <InfoField label="Responsável" value={client.nome_responsavel} />
                  <InfoField label="Cidade / Estado" value={[client.cidade, client.estado].filter(Boolean).join(" / ") || "-"} />
                  <InfoField label="Gerente" value={client.account_manager_name || "-"} />
                  <InfoField label="WhatsApp do gerente" value={client.account_manager_whatsapp || "-"} />
                  <InfoField label="Segmento" value={client.segmento || "-"} />
                  <InfoField label="Investimento" value={client.faixa_investimento || "-"} />
                  <InfoField label="Observações" value={client.observacoes || "-"} />
                  <InfoField label="Status cadastral" value={client.status_cadastro} />
                </div>
              )}
            </div>
          )
        })}

        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
            Nenhum cliente aprovado encontrado.
          </div>
        )}
      </CardContent>
    </Card>
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

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}
