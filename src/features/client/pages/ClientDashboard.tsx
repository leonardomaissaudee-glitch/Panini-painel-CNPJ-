import { useEffect, useState } from "react"
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
  const currentTab = new URLSearchParams(location.search).get("tab")
  const section: ClientSection = allowedTabs.includes(currentTab as ClientSection)
    ? (currentTab as ClientSection)
    : "catalogo"

  useEffect(() => {
    findResellerProfileByCurrentUser().then(setResellerProfile).catch(() => setResellerProfile(null))
  }, [])

  const managerWhatsapp = resellerProfile?.account_manager_whatsapp || DEFAULT_MANAGER_WHATSAPP
  const managerName = resellerProfile?.account_manager_name || "Gerente comercial"
  const displayManagerPhone = formatPhone(managerWhatsapp.replace(/\D/g, "").slice(-11))

  const changeSection = (next: ClientSection) => navigate(`/app?tab=${next}`)

  return (
    <AppShell title="Portal do Cliente">
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white shadow-2xl">
          <CardContent className="grid gap-6 p-5 sm:p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                Cliente aprovado
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">{resellerProfile?.razao_social || "Portal do Cliente"}</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
                  Seu cadastro foi aprovado. Use o catálogo para montar pedidos, acompanhe cada etapa comercial e fale
                  diretamente com seu gerente de contas.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur lg:min-w-[280px]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">Gerente comercial</div>
              <div className="mt-2 text-xl font-semibold text-white">{managerName}</div>
              <div className="mt-1 text-sm text-slate-200">{displayManagerPhone}</div>
              <Button
                variant="secondary"
                className="mt-4 w-full rounded-full sm:w-auto"
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
          <ClientSidebar active={section} />

          <div className="min-w-0 space-y-4">
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
