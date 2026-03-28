import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientSidebar } from "@/features/client/components/ClientSidebar"
import { ClientCatalog } from "@/features/client/components/ClientCatalog"
import { ClientOrders } from "@/features/client/components/ClientOrders"
import { ClientProfile } from "@/features/client/components/ClientProfile"
import { ClientSupport } from "@/features/client/components/ClientSupport"
import { ClientCart } from "@/features/client/components/ClientCart"
import { useAuth } from "@/features/auth/context/AuthContext"
import { AppShell } from "@/components/layouts/AppShell"

export default function ClientDashboard() {
  const [section, setSection] = useState<string>("catalogo")
  const { profile, user } = useAuth()

  return (
    <AppShell
      title="Cliente"
      nav={[
        { label: "Catálogo", to: "/app" },
        { label: "Meus pedidos", to: "/app" },
        { label: "Perfil", to: "/app" },
        { label: "Atendimento", to: "/app" },
        { label: "Carrinho", to: "/app" },
      ]}
    >
      <div className="flex flex-col md:flex-row gap-4">
        <ClientSidebar active={section} onChange={setSection} />

        <div className="flex-1 space-y-4">
          {section === "catalogo" && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Catálogo</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientCatalog />
              </CardContent>
            </Card>
          )}

          {section === "pedidos" && <ClientOrders email={user?.email} />}

          {section === "perfil" && <ClientProfile profile={profile ?? null} />}

          {section === "atendimento" && <ClientSupport conversationId={null} />}

          {section === "carrinho" && <ClientCart />}
        </div>
      </div>
    </AppShell>
  )
}
