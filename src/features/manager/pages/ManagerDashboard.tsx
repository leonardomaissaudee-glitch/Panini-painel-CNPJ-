import { Outlet } from "react-router-dom"
import { AppShell } from "@/components/layouts/AppShell"

const managerNav = [
  { label: "Resumo", to: "/gerente/resumo" },
  { label: "Clientes", to: "/gerente/clientes" },
  { label: "Pedidos", to: "/gerente/pedidos" },
  { label: "Chats", to: "/gerente/chats" },
]

export default function ManagerDashboard() {
  return (
    <AppShell title="Carteira do gerente" nav={managerNav}>
      <Outlet />
    </AppShell>
  )
}
