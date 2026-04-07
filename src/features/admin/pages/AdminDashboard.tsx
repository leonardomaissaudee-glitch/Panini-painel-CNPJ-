import { Outlet } from "react-router-dom"
import { AppShell } from "@/components/layouts/AppShell"
const adminNav = [
  { label: "Dashboard", to: "/admin/resumo" },
  { label: "Pedidos", to: "/admin/pedidos" },
  { label: "Chats", to: "/admin/chats" },
  { label: "Monitoramento", to: "/admin/monitoramento" },
  { label: "Cadastros pendentes", to: "/admin/cadastros-pendentes" },
  { label: "Usuários", to: "/admin/usuarios" },
  { label: "Clientes aprovados", to: "/admin/clientes-aprovados" },
  { label: "Todos os clientes", to: "/admin/todos-clientes" },
  { label: "Brindes", to: "/admin/brindes" },
]

export default function AdminDashboard() {
  return (
    <AppShell title="Painel administrativo" nav={adminNav}>
      <Outlet />
    </AppShell>
  )
}
