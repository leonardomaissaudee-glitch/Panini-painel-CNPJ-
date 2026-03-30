import { Search, BellDot, MessageCircleMore } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatChatDate, formatChatTime, formatRelativeLastSeen } from "@/features/chat/utils"
import type { ChatConversationListItem, ChatListFilter, ChatViewerRole } from "@/features/chat/types"

export function ChatConversationList({
  conversations,
  activeId,
  onSelect,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  loading,
  viewerRole = "admin",
  showSearch = true,
}: {
  conversations: ChatConversationListItem[]
  activeId?: string | null
  onSelect: (conversationId: string) => void
  search: string
  onSearchChange: (value: string) => void
  filter?: ChatListFilter
  onFilterChange?: (value: ChatListFilter) => void
  loading?: boolean
  viewerRole?: ChatViewerRole
  showSearch?: boolean
}) {
  return (
    <div className="flex h-full min-h-[560px] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="text-sm font-semibold text-slate-950">Conversas</div>
        {showSearch && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por nome, e-mail, pedido..."
              className="border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        )}
        {onFilterChange && (
          <div className="mt-3 flex flex-wrap gap-2">
            {([
              ["all", "Todos"],
              ["unread", "Não lidos"],
              ["pending", "Pendentes"],
              ["active", "Em atendimento"],
              ["closed", "Finalizados"],
            ] as const).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => onFilterChange(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {conversations.map((conversation) => {
            const unreadCount =
              viewerRole === "admin" ? conversation.unread_admin_count : conversation.unread_customer_count

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={[
                  "w-full rounded-2xl border p-4 text-left transition",
                  activeId === conversation.id
                    ? "border-blue-900 bg-blue-950 text-white shadow-lg"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{conversation.customer_name}</div>
                    <div className={`mt-1 truncate text-xs ${activeId === conversation.id ? "text-slate-200" : "text-slate-500"}`}>
                      {conversation.subject}
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                      <BellDot className="h-3.5 w-3.5" />
                      {unreadCount}
                    </div>
                  )}
                </div>

                <div className={`mt-3 text-xs ${activeId === conversation.id ? "text-slate-300" : "text-slate-500"}`}>
                  {conversation.last_message_preview || "Conversa iniciada"}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <StatusPill status={conversation.status} />
                  <span className={activeId === conversation.id ? "text-slate-300" : "text-slate-500"}>
                    {conversation.last_message_at
                      ? `${formatChatDate(conversation.last_message_at)} · ${formatChatTime(conversation.last_message_at)}`
                      : formatRelativeLastSeen(conversation.created_at)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <span className={activeId === conversation.id ? "text-emerald-200" : conversation.customer_online ? "text-emerald-600" : "text-slate-500"}>
                    Cliente {conversation.customer_online ? "online" : "offline"}
                  </span>
                  <span className={activeId === conversation.id ? "text-amber-200" : conversation.staff_online ? "text-amber-700" : "text-slate-500"}>
                    Gerente {conversation.staff_online ? "online" : "offline"}
                  </span>
                </div>
              </button>
            )
          })}

          {!conversations.length && !loading && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <MessageCircleMore className="mx-auto h-6 w-6 text-slate-400" />
              <div className="mt-3 text-sm font-medium text-slate-900">Nenhuma conversa encontrada</div>
              <div className="mt-1 text-sm text-slate-500">As conversas iniciadas aparecerão aqui em tempo real.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status?: string | null }) {
  const label = status === "active" ? "Em atendimento" : status === "closed" ? "Finalizado" : "Aguardando"
  const className =
    status === "active"
      ? "bg-blue-100 text-blue-800"
      : status === "closed"
        ? "bg-slate-100 text-slate-700"
        : "bg-amber-100 text-amber-800"

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{label}</span>
}
