import { useEffect, useMemo, useState } from "react"
import { Building2, ClipboardList, MessageCircleMore, PackageCheck, PackageSearch } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchManagerPortfolioSummary, type ManagerPortfolioSummary } from "@/features/admin/services/adminService"
import { fetchManagerChatConversations } from "@/features/chat/services/chatService"
import { toast } from "sonner"

const emptySummary: ManagerPortfolioSummary = {
  total_clients: 0,
  approved_clients: 0,
  pending_clients: 0,
  orders_in_progress: 0,
  orders_completed: 0,
  pending_chats: 0,
}

export function ManagerOverviewPanel({
  managerUserId,
  managerEmail,
}: {
  managerUserId: string
  managerEmail?: string | null
}) {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ManagerPortfolioSummary>(emptySummary)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      try {
        const [portfolio, conversations] = await Promise.all([
          fetchManagerPortfolioSummary(managerUserId, managerEmail),
          fetchManagerChatConversations("", "all"),
        ])

        if (!active) return

        setSummary({
          ...portfolio,
          pending_chats: conversations.filter(
            (conversation) => conversation.status === "pending" || conversation.unread_admin_count > 0
          ).length,
        })
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "Não foi possível carregar o resumo da carteira."
        toast.error("Erro ao carregar resumo", { description: message })
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [managerEmail, managerUserId])

  const cards = useMemo(
    () => [
      {
        title: "Clientes da carteira",
        value: summary.total_clients,
        detail: `${summary.approved_clients} aprovados`,
        icon: Building2,
      },
      {
        title: "Cadastros pendentes",
        value: summary.pending_clients,
        detail: "Aguardando análise do admin",
        icon: ClipboardList,
      },
      {
        title: "Pedidos em andamento",
        value: summary.orders_in_progress,
        detail: `${summary.orders_completed} finalizados`,
        icon: PackageSearch,
      },
      {
        title: "Chats pendentes",
        value: summary.pending_chats,
        detail: "Conversas com resposta pendente",
        icon: MessageCircleMore,
      },
    ],
    [summary]
  )

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Resumo da carteira</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Você vê apenas clientes, pedidos e chats vinculados à sua carteira. Aprovação de cadastro, criação de usuários e monitoramento continuam exclusivos do administrador.
        </div>
      </CardContent>
    </Card>
  )
}
