import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PendingApprovals } from "@/features/admin/components/PendingApprovals"
import { OrdersPanel } from "@/features/admin/components/OrdersPanel"
import { ProductsPanel } from "@/features/admin/components/ProductsPanel"
import { UsersPanel } from "@/features/admin/components/UsersPanel"
import { ChatsPanel } from "@/features/admin/components/ChatsPanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppShell } from "@/components/layouts/AppShell"

export default function AdminDashboard() {
  return (
    <AppShell title="Admin">
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white shadow-2xl">
          <CardContent className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                Painel administrativo
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">Gestão comercial e operacional</h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
                  Acompanhe pedidos, libere pagamentos, anexe boletos, configure dados PIX e mantenha o fluxo
                  comercial sincronizado com o portal do cliente.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur lg:min-w-[300px]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">Operação</div>
              <div className="mt-2 text-xl font-semibold text-white">Pedidos, cadastros e catálogo</div>
              <div className="mt-2 text-sm text-slate-200">
                Libere etapas de pagamento, controle expedição e mantenha clientes atualizados em tempo real.
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pedidos" className="space-y-4">
          <TabsList className="grid h-auto grid-cols-2 gap-2 rounded-3xl bg-transparent p-0 xl:grid-cols-5">
            <TabsTrigger value="pedidos" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 data-[state=active]:border-blue-900 data-[state=active]:bg-blue-950 data-[state=active]:text-white">
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="chats" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 data-[state=active]:border-blue-900 data-[state=active]:bg-blue-950 data-[state=active]:text-white">
              Chats
            </TabsTrigger>
            <TabsTrigger value="cadastros" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 data-[state=active]:border-blue-900 data-[state=active]:bg-blue-950 data-[state=active]:text-white">
              Cadastros pendentes
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 data-[state=active]:border-blue-900 data-[state=active]:bg-blue-950 data-[state=active]:text-white">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="produtos" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 data-[state=active]:border-blue-900 data-[state=active]:bg-blue-950 data-[state=active]:text-white">
              Produtos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos">
            <OrdersPanel />
          </TabsContent>

          <TabsContent value="chats">
            <ChatsPanel />
          </TabsContent>

          <TabsContent value="cadastros">
            <PendingApprovals />
          </TabsContent>

          <TabsContent value="usuarios">
            <UsersPanel />
          </TabsContent>

          <TabsContent value="produtos">
            <ProductsPanel />
          </TabsContent>
        </Tabs>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Resumo operacional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Pedidos: atualizar status, liberar pagamento e informar NF/rastreio.</p>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Cadastros: aprovar clientes, vincular gerente comercial e controlar bloqueios.</p>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Produtos: manter catálogo, preços e disponibilidade alinhados ao portal do cliente.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
