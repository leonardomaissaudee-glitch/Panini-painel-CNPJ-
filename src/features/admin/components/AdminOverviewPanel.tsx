import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Building2, ClipboardList, LayoutDashboard, MessageCircleMore, PackageSearch, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  fetchAccountManagers,
  fetchAllClients,
  fetchOrders,
  fetchPendingProfiles,
} from "@/features/admin/services/adminService"
import { fetchAdminChatConversations } from "@/features/chat/services/chatService"
import { toast } from "sonner"

interface AdminOverviewSummary {
  totalClients: number
  pendingProfiles: number
  activeOrders: number
  completedOrders: number
  pendingChats: number
  managers: number
}

const emptySummary: AdminOverviewSummary = {
  totalClients: 0,
  pendingProfiles: 0,
  activeOrders: 0,
  completedOrders: 0,
  pendingChats: 0,
  managers: 0,
}

const quickLinks = [
  { label: "Pedidos", to: "/admin/pedidos" },
  { label: "Chats", to: "/admin/chats" },
  { label: "Cadastros", to: "/admin/cadastros-pendentes" },
  { label: "Usuários", to: "/admin/usuarios" },
]

export function AdminOverviewPanel() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AdminOverviewSummary>(emptySummary)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)

      try {
        const [clients, approvals, orders, chats, managers] = await Promise.all([
          fetchAllClients(),
          fetchPendingProfiles(),
          fetchOrders(),
          fetchAdminChatConversations("", "all"),
          fetchAccountManagers(),
        ])

        if (!active) return

        setSummary({
          totalClients: clients.length,
          pendingProfiles: approvals.length,
          activeOrders: orders.filter((order) => order.status !== "pedido_entregue" && order.status !== "cancelado").length,
          completedOrders: orders.filter((order) => order.status === "pedido_entregue").length,
          pendingChats: chats.filter((conversation) => conversation.status !== "closed" || conversation.unread_admin_count > 0).length,
          managers: managers.filter((manager) => manager.status_cadastro === "approved").length,
        })
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "Não foi possível carregar o dashboard administrativo."
        toast.error("Erro ao carregar dashboard", { description: message })
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const cards = useMemo(
    () => [
      {
        title: "Clientes",
        value: summary.totalClients,
        detail: "Base total cadastrada",
        icon: Building2,
      },
      {
        title: "Cadastros pendentes",
        value: summary.pendingProfiles,
        detail: "Aguardando aprovação",
        icon: ClipboardList,
      },
      {
        title: "Pedidos em andamento",
        value: summary.activeOrders,
        detail: `${summary.completedOrders} finalizados`,
        icon: PackageSearch,
      },
      {
        title: "Chats ativos",
        value: summary.pendingChats,
        detail: "Conversas abertas no atendimento",
        icon: MessageCircleMore,
      },
      {
        title: "Gerentes ativos",
        value: summary.managers,
        detail: "Disponíveis para carteira",
        icon: Users,
      },
    ],
    [summary]
  )

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <LayoutDashboard className="h-4 w-4 text-blue-900" />
          Dashboard
        </div>
        <CardTitle>Visão geral administrativa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.title}</div>
                  <Icon className="h-4 w-4 text-blue-900" />
                </div>
                <div className="mt-4 text-3xl font-bold text-slate-950">{loading ? "--" : card.value}</div>
                <div className="mt-2 text-sm text-slate-500">{card.detail}</div>
              </div>
            )
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
