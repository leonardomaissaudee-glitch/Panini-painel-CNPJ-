import type { ReactNode } from "react"
import { Circle, Wifi, WifiOff } from "lucide-react"
import type { ChatConversation } from "@/features/chat/types"
import { formatRelativeLastSeen } from "@/features/chat/utils"

export function ChatHeader({
  title,
  subtitle,
  online,
  connectionState,
  action,
}: {
  title: string
  subtitle: string
  online: boolean
  connectionState?: "connecting" | "connected" | "closed" | "error"
  action?: ReactNode
}) {
  const connectionLabel =
    connectionState === "connected"
      ? "Tempo real ativo"
      : connectionState === "error"
        ? "Conexão instável"
        : connectionState === "closed"
          ? "Desconectado"
          : "Conectando..."

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="text-lg font-semibold text-slate-950">{title}</div>
        <div className="text-sm text-slate-500">{subtitle}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className={[
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
            online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          <Circle className={online ? "h-3 w-3 fill-current" : "h-3 w-3"} />
          {online ? "Online" : "Offline"}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {connectionState === "connected" ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connectionLabel}
        </div>
        {action}
      </div>
    </div>
  )
}

export function ChatConversationMeta({
  conversation,
  statusLabel,
  customerOnline,
  staffOnline,
  customerLastSeen,
  managerLabel,
}: {
  conversation: ChatConversation
  statusLabel: string
  customerOnline?: boolean
  staffOnline?: boolean
  customerLastSeen?: string | null
  managerLabel?: string
}) {
  return (
    <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
      <MetaPill label="Status" value={statusLabel} />
      <MetaPill label="Motivo" value={conversation.subject} />
      <MetaPill label="Cliente" value={customerOnline ? "Online" : customerLastSeen ? `Offline · ${formatRelativeLastSeen(customerLastSeen)}` : "Offline"} />
      <MetaPill label={managerLabel || "Gerente"} value={staffOnline ? "Online" : "Offline"} />
    </div>
  )
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}
