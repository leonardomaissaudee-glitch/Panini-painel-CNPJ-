import { useEffect, useMemo, useState } from "react"
import { Copy, Link2, Search } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchAccountManagers, type AccountManagerDirectoryRow } from "@/features/admin/services/adminService"
import { buildManagerReferralLink } from "@/shared/utils/managerReferral"
import { StatusBadge } from "@/components/StatusBadge"

export function ManagerLinksPanel() {
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [managers, setManagers] = useState<AccountManagerDirectoryRow[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      try {
        const rows = await fetchAccountManagers()
        if (active) {
          setManagers(rows)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível carregar os links dos gerentes."
        toast.error("Erro ao carregar links", { description: message })
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return managers
    return managers.filter((manager) =>
      [manager.full_name, manager.email, manager.referral_code]
        .map((value) => (value || "").toString().toLowerCase())
        .some((value) => value.includes(term))
    )
  }, [managers, search])

  const handleCopy = async (manager: AccountManagerDirectoryRow) => {
    const link = buildManagerReferralLink(manager.referral_code)
    if (!link) {
      toast.error("Gerente sem código disponível.")
      return
    }

    try {
      await navigator.clipboard.writeText(link)
      toast.success("Link copiado")
    } catch {
      toast.error("Não foi possível copiar o link.")
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Links de Gerentes</CardTitle>
          <p className="text-sm text-muted-foreground">Copie e compartilhe o link exclusivo de cadastro de cada gerente.</p>
        </div>
        <div className="relative w-full lg:w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, e-mail ou código"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.map((manager) => {
          const link = buildManagerReferralLink(manager.referral_code)
          return (
            <div key={manager.auth_user_id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 xl:grid-cols-[1fr_140px_1.4fr_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-950">{manager.full_name}</div>
                  <div className="truncate text-sm text-slate-500">{manager.email}</div>
                  <div className="mt-2">
                    <StatusBadge status={manager.status_cadastro} />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Código</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{manager.referral_code || "-"}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Link de cadastro</div>
                  <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <Link2 className="h-4 w-4 shrink-0 text-blue-900" />
                    <span className="truncate">{link || "Código indisponível"}</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => handleCopy(manager)} disabled={!link}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
            Nenhum gerente encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
