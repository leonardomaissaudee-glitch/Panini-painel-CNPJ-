import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PendingApprovals } from "@/features/admin/components/PendingApprovals"
import { OrdersPanel } from "@/features/admin/components/OrdersPanel"
import { ProductsPanel } from "@/features/admin/components/ProductsPanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppShell } from "@/components/layouts/AppShell"

export default function AdminDashboard() {
  return (
    <AppShell
      title="Admin"
      nav={[
        { label: "Painel", to: "/admin" },
        { label: "Pedidos", to: "/admin" },
        { label: "Cadastros", to: "/admin" },
        { label: "Produtos", to: "/admin" },
      ]}
    >
      <Tabs defaultValue="pedidos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="cadastros">Cadastros pendentes</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos">
          <OrdersPanel />
        </TabsContent>

        <TabsContent value="cadastros">
          <PendingApprovals />
        </TabsContent>

        <TabsContent value="produtos">
          <ProductsPanel />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Pedidos: atualizar status (novo, pago, enviado, NF, rastreio).</p>
          <p>Cadastros: aprovar/reprovar com motivo e atribuir role.</p>
          <p>Produtos: CRUD integrado à tabela products.</p>
        </CardContent>
      </Card>
    </AppShell>
  )
}
