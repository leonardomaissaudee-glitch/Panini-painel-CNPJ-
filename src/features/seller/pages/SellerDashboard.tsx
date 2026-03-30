import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/context/AuthContext"
import { CustomersPanel } from "@/features/seller/components/CustomersPanel"
import { SellerOrdersPanel } from "@/features/seller/components/SellerOrdersPanel"
import { ChatsPanel } from "@/features/admin/components/ChatsPanel"
import { AbandonedCartsPanel } from "@/features/seller/components/AbandonedCartsPanel"
import { AppShell } from "@/components/layouts/AppShell"

export default function SellerDashboard() {
  const { profile } = useAuth()
  const sellerId = profile?.id

  return (
    <AppShell
      title="Seller"
      nav={[
        { label: "Pedidos", to: "/seller" },
        { label: "Clientes", to: "/seller" },
        { label: "Chat", to: "/seller" },
        { label: "Carrinhos", to: "/seller" },
      ]}
    >
      <Tabs defaultValue="pedidos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="carrinhos">Carrinho abandonado</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos">
          <SellerOrdersPanel sellerId={sellerId} />
        </TabsContent>

        <TabsContent value="clientes">
          <CustomersPanel />
        </TabsContent>

        <TabsContent value="chat">
          <ChatsPanel />
        </TabsContent>

        <TabsContent value="carrinhos">
          <AbandonedCartsPanel />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Pedidos: listar, atualizar status, NF e rastreio; criar pedido manual.</p>
          <p>Clientes: lista de clientes aprovados.</p>
          <p>Chat: responder conversas (tabela conversations/messages).</p>
          <p>Carrinho abandonado: listar e marcar recuperado.</p>
          <p>WhatsApp: botão em pedidos envia mensagem pronta ao cliente.</p>
        </CardContent>
      </Card>
    </AppShell>
  )
}
