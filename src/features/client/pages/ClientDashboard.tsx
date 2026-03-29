import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { AppShell } from "@/components/layouts/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientSidebar } from "@/features/client/components/ClientSidebar"
import { ClientCatalog } from "@/features/client/components/ClientCatalog"
import { ClientInfo } from "@/features/client/components/ClientInfo"
import { ClientOrders } from "@/features/client/components/ClientOrders"
import { ClientProfile } from "@/features/client/components/ClientProfile"
import { ClientSupport } from "@/features/client/components/ClientSupport"
import { ClientCart } from "@/features/client/components/ClientCart"
import { useAuth } from "@/features/auth/context/AuthContext"
import { findResellerProfileByCurrentUser, type ResellerProfile } from "@/lib/auth"
import { formatPhone } from "@/lib/masks"
import { DEFAULT_MANAGER_WHATSAPP } from "@/shared/constants/accountManagers"

type ClientSection = "catalogo" | "pedidos" | "informacoes" | "perfil" | "gerente" | "carrinho"

const allowedTabs: ClientSection[] = ["catalogo", "pedidos", "informacoes", "perfil", "gerente", "carrinho"]

export default function ClientDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [resellerProfile, setResellerProfile] = useState<ResellerProfile | null>(null)
  const [refreshOrders, setRefreshOrders] = useState<(() => Promise<void>) | null>(null)
  const { user } = useAuth()
  const section = useMemo<ClientSection>(() => {
    const currentTab = new URLSearchParams(location.search).get("tab")
    return allowedTabs.includes(currentTab as ClientSection) ? (currentTab as ClientSection) : "catalogo"
  }, [location.search])

  useEffect(() => {
    findResellerProfileByCurrentUser().then(setResellerProfile).catch(() => setResellerProfile(null))
  }, [])

  const managerWhatsapp = resellerProfile?.account_manager_whatsapp || DEFAULT_MANAGER_WHATSAPP
  const managerName = resellerProfile?.account_manager_name || "Gerente comercial"
  const displayManagerPhone = formatPhone(managerWhatsapp.replace(/\D/g, "").slice(-11))

  const changeSection = (next: ClientSection) => {
    const params = new URLSearchParams(location.search)
    params.set("tab", next)
    navigate({ pathname: "/app", search: `?${params.toString()}` }, { replace: false })
  }

  return (
    <AppShell title="Portal do Cliente">
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white shadow-2xl">
          <CardContent className="grid grid-cols-[minmax(0,1fr)_150px] gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:gap-5 sm:p-6 md:p-8">
            <div className="min-w-0 space-y-3">
              <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                Cliente aprovado
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold leading-tight sm:text-3xl md:text-4xl">{resellerProfile?.razao_social || "Portal do Cliente"}</h1>
                <p className="text-xs leading-5 text-slate-200 sm:hidden">
                  Catálogo liberado e acompanhamento direto com seu gerente comercial.
                </p>
                <p className="hidden max-w-2xl text-sm leading-6 text-slate-200 md:text-base sm:block">
                  Seu cadastro foi aprovado. Use o catálogo para montar pedidos, acompanhe cada etapa comercial e fale
                  diretamente com seu gerente de contas.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-3 backdrop-blur sm:min-w-[220px]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">Gerente</div>
              <div className="mt-2 line-clamp-2 text-sm font-semibold leading-tight text-white sm:text-xl">{managerName}</div>
              <div className="mt-1 text-xs text-slate-200 sm:text-sm">{displayManagerPhone}</div>
              <Button
                variant="secondary"
                className="mt-3 h-auto w-full rounded-full px-3 py-2 text-sm leading-tight"
                onClick={() =>
                  window.open(
                    `https://wa.me/${managerWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Olá, ${managerName}. Sou ${resellerProfile?.razao_social || "cliente"} e preciso de atendimento comercial.`
                    )}`,
                    "_blank"
                  )
                }
              >
                Falar com gerente
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
          <ClientSidebar active={section} onChange={(next) => changeSection(next as ClientSection)} />

          <div key={section} className="min-w-0 space-y-4">
            {section === "catalogo" && <ClientCatalog />}
            {section === "pedidos" && (
              <ClientOrders email={user?.email} onRefreshReady={(refresh) => setRefreshOrders(() => refresh)} />
            )}
            {section === "informacoes" && <ClientInfo managerName={managerName} />}
            {section === "perfil" && <ClientProfile profile={resellerProfile} />}
            {section === "gerente" && <ClientSupport profile={resellerProfile} />}
            {section === "carrinho" && (
              <ClientCart
                profile={resellerProfile}
                onOrderCreated={() => {
                  refreshOrders?.()
                  changeSection("pedidos")
                }}
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
