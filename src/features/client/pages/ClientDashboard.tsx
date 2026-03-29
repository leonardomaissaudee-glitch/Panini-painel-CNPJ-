import { useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom"
import { AppShell } from "@/components/layouts/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientSidebar } from "@/features/client/components/ClientSidebar"
import { useAuth } from "@/features/auth/context/AuthContext"
import { findResellerProfileByCurrentUser, type ResellerProfile } from "@/lib/auth"
import { formatPhone } from "@/lib/masks"
import { DEFAULT_MANAGER_WHATSAPP } from "@/shared/constants/accountManagers"

type ClientSection = "catalogo" | "pedidos" | "informacoes" | "perfil" | "gerente" | "carrinho"

const allowedTabs: ClientSection[] = ["catalogo", "pedidos", "informacoes", "perfil", "gerente", "carrinho"]

export type ClientDashboardContext = {
  resellerProfile: ResellerProfile | null
  userEmail?: string
}

export function useClientDashboardContext() {
  return useOutletContext<ClientDashboardContext>()
}

export default function ClientDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const { tab } = useParams()
  const [resellerProfile, setResellerProfile] = useState<ResellerProfile | null>(null)
  const { user } = useAuth()
  const section = useMemo<ClientSection | null>(() => {
    return allowedTabs.includes(tab as ClientSection) ? (tab as ClientSection) : null
  }, [tab])

  useEffect(() => {
    const queryTab = new URLSearchParams(location.search).get("tab")

    if (location.pathname === "/app") {
      const nextTab = allowedTabs.includes(queryTab as ClientSection) ? (queryTab as ClientSection) : "catalogo"
      navigate(`/app/${nextTab}`, { replace: true })
      return
    }

    if (queryTab && allowedTabs.includes(queryTab as ClientSection)) {
      navigate(`/app/${queryTab}`, { replace: true })
      return
    }

    if (tab && !allowedTabs.includes(tab as ClientSection)) {
      navigate("/app/catalogo", { replace: true })
    }
  }, [location.pathname, location.search, navigate, tab])

  useEffect(() => {
    findResellerProfileByCurrentUser().then(setResellerProfile).catch(() => setResellerProfile(null))
  }, [])

  const managerWhatsapp = resellerProfile?.account_manager_whatsapp || DEFAULT_MANAGER_WHATSAPP
  const managerName = resellerProfile?.account_manager_name || "Gerente comercial"
  const displayManagerPhone = formatPhone(managerWhatsapp.replace(/\D/g, "").slice(-11))
  const assignedManagerName = resellerProfile?.account_manager_name ?? null
  const assignedManagerPhone = resellerProfile?.account_manager_whatsapp
    ? formatPhone(resellerProfile.account_manager_whatsapp.replace(/\D/g, "").slice(-11))
    : null

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
                className="mt-3 h-10 w-full justify-center rounded-full bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 sm:text-sm"
                onClick={() =>
                  window.open(
                    `https://wa.me/${managerWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Olá, ${managerName}. Sou ${resellerProfile?.razao_social || "cliente"} e preciso de atendimento comercial.`
                    )}`,
                    "_blank"
                  )
                }
              >
                Enviar mensagem
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
          <ClientSidebar active={section ?? "catalogo"} />

          <div key={location.pathname} className="min-w-0 space-y-4">
            <Outlet
              context={{
                resellerProfile,
                userEmail: user?.email,
              }}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
