import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { LogOut, PackageCheck, ShoppingBag, UserRound } from "lucide-react"
import { AppShell } from "@/components/layouts/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientSidebar } from "@/features/client/components/ClientSidebar"
import { ClientCatalog } from "@/features/client/components/ClientCatalog"
import { ClientOrders } from "@/features/client/components/ClientOrders"
import { ClientProfile } from "@/features/client/components/ClientProfile"
import { ClientSupport } from "@/features/client/components/ClientSupport"
import { ClientCart } from "@/features/client/components/ClientCart"
import { useAuth } from "@/features/auth/context/AuthContext"
import { findResellerProfileByCurrentUser, type ResellerProfile } from "@/lib/auth"
import { formatPhone } from "@/lib/masks"
import { DEFAULT_MANAGER_WHATSAPP } from "@/shared/constants/accountManagers"

type ClientSection = "catalogo" | "pedidos" | "perfil" | "gerente" | "carrinho"

const allowedTabs: ClientSection[] = ["catalogo", "pedidos", "perfil", "gerente", "carrinho"]

export default function ClientDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get("tab")
  const [section, setSection] = useState<ClientSection>(
    allowedTabs.includes(initialTab as ClientSection) ? (initialTab as ClientSection) : "catalogo"
  )
  const [resellerProfile, setResellerProfile] = useState<ResellerProfile | null>(null)
  const [refreshOrders, setRefreshOrders] = useState<(() => Promise<void>) | null>(null)
  const { user, signOut } = useAuth()

  useEffect(() => {
    findResellerProfileByCurrentUser().then(setResellerProfile).catch(() => setResellerProfile(null))
  }, [])

  useEffect(() => {
    const nextTab = searchParams.get("tab")
    if (allowedTabs.includes(nextTab as ClientSection) && nextTab !== section) {
      setSection(nextTab as ClientSection)
    }
  }, [searchParams, section])

  const managerWhatsapp = resellerProfile?.account_manager_whatsapp || DEFAULT_MANAGER_WHATSAPP
  const managerName = resellerProfile?.account_manager_name || "Gerente comercial"
  const displayManagerPhone = formatPhone(managerWhatsapp.replace(/\D/g, "").slice(-11))

  const summaryCards = useMemo(
    () => [
      {
        icon: ShoppingBag,
        title: "Canal ativo",
        description: "Catálogo completo liberado para pedidos corporativos.",
      },
      {
        icon: PackageCheck,
        title: "Pedidos monitorados",
        description: "Atualização de aprovação, pagamento, expedição e nota fiscal no mesmo painel.",
      },
      {
        icon: UserRound,
        title: "Gerente dedicado",
        description: `${managerName} acompanha seu atendimento comercial.`,
      },
    ],
    [managerName]
  )

  const changeSection = (next: string) => {
    setSection(next as ClientSection)
    setSearchParams({ tab: next })
  }

  return (
    <AppShell
      title="Portal do Cliente"
      actions={
        <Button variant="outline" size="sm" onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      }
    >
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white shadow-2xl">
          <CardContent className="grid gap-6 p-6 md:p-8 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="space-y-4">
              <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                Cliente aprovado
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold md:text-4xl">{resellerProfile?.razao_social || "Portal do Cliente"}</h1>
                <p className="max-w-2xl text-sm text-slate-200 md:text-base">
                  Seu cadastro foi aprovado. Use o catálogo para montar pedidos, acompanhe cada etapa comercial e fale
                  diretamente com seu gerente de contas.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">Gerente comercial</div>
              <div className="mt-2 text-xl font-semibold text-white">{managerName}</div>
              <div className="mt-1 text-sm text-slate-200">{displayManagerPhone}</div>
              <Button
                variant="secondary"
                className="mt-4 rounded-full"
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

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="border-slate-200 shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <Icon className="h-5 w-5 text-blue-700" />
                  <div className="font-semibold text-slate-950">{item.title}</div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
          <ClientSidebar active={section} onChange={changeSection} />

          <div className="min-w-0 space-y-4">
            {section === "catalogo" && <ClientCatalog />}
            {section === "pedidos" && (
              <ClientOrders email={user?.email} onRefreshReady={(refresh) => setRefreshOrders(() => refresh)} />
            )}
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
