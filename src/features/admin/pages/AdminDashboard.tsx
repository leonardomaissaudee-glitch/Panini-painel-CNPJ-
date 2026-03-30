import { Outlet } from "react-router-dom"
import { AppShell } from "@/components/layouts/AppShell"
import { Card, CardContent } from "@/components/ui/card"

const adminNav = [
  { label: "Pedidos", to: "/admin/pedidos" },
  { label: "Chats", to: "/admin/chats" },
  { label: "Monitoramento", to: "/admin/monitoramento" },
  { label: "Cadastros pendentes", to: "/admin/cadastros-pendentes" },
  { label: "Usuários", to: "/admin/usuarios" },
  { label: "Clientes aprovados", to: "/admin/clientes-aprovados" },
  { label: "Todos os clientes", to: "/admin/todos-clientes" },
]

export default function AdminDashboard() {
  return (
    <AppShell title="Painel administrativo" nav={adminNav}>
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
                  Administre pedidos, acompanhe acessos, responda chats e mantenha clientes aprovados e ativos sem depender
                  de ajustes manuais no Supabase.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur lg:min-w-[320px]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">Operação</div>
              <div className="mt-2 text-xl font-semibold text-white">Pedidos, clientes e atendimento</div>
              <div className="mt-2 text-sm text-slate-200">
                Sidebar responsiva com módulos administrativos independentes e navegação estável em desktop e mobile.
              </div>
            </div>
          </CardContent>
        </Card>

        <Outlet />
      </div>
    </AppShell>
  )
}
