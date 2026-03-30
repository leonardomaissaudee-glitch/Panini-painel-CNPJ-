import type { ReactNode } from "react"
import { Circle, Clock3, MessageSquareText, UserRound, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <MetaPill icon={<Clock3 className="h-3.5 w-3.5" />} value={statusLabel} />
      <MetaPill icon={<MessageSquareText className="h-3.5 w-3.5" />} value={conversation.subject} />
      <MetaPill
        icon={<UserRound className="h-3.5 w-3.5" />}
        value={customerOnline ? "Cliente online" : customerLastSeen ? `Cliente ${formatRelativeLastSeen(customerLastSeen)}` : "Cliente offline"}
      />
      <MetaPill
        icon={<UserRound className="h-3.5 w-3.5" />}
        value={staffOnline ? `${managerLabel || "Gerente"} online` : `${managerLabel || "Gerente"} offline`}
      />
    </div>
  )
}

export function ChatStatusBar({
  online,
  connectionState,
  children,
}: {
  online: boolean
  connectionState?: "connecting" | "connected" | "closed" | "error"
  children?: ReactNode
}) {
  const onlineLabel = online ? "Online" : "Offline"
  const connectionLabel =
    connectionState === "connected"
      ? "Tempo real ativo"
      : connectionState === "error"
        ? "Conexão instável"
        : connectionState === "closed"
          ? "Desconectado"
          : "Conectando"

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <IconStatusButton
        icon={<Circle className={online ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"} />}
        label={onlineLabel}
        tone={online ? "text-emerald-600" : "text-slate-500"}
      />
      <IconStatusButton
        icon={connectionState === "connected" ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        label={connectionLabel}
        tone={connectionState === "connected" ? "text-blue-600" : "text-slate-500"}
      />
      {children}
    </div>
  )
}

function MetaPill({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
      <span className="shrink-0 text-slate-500">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  )
}

function IconStatusButton({
  icon,
  label,
  tone,
}: {
  icon: ReactNode
  label: string
  tone?: string
}) {
  return (
    <Button type="button" variant="outline" size="icon-sm" className={tone} title={label} aria-label={label}>
      {icon}
    </Button>
  )
}
