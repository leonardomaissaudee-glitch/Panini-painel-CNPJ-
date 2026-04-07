import { useEffect, useMemo, useState } from "react"
import { BellDot, CheckCircle2, MessageCircleMore, RotateCcw, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatComposer } from "@/features/chat/components/ChatComposer"
import { ChatConversationList } from "@/features/chat/components/ChatConversationList"
import { ChatConversationMeta, ChatStatusBar } from "@/features/chat/components/ChatHeader"
import { ChatMessageList } from "@/features/chat/components/ChatMessageList"
import { useChatConversationList } from "@/features/chat/hooks/useChatConversationList"
import { useChatPresence } from "@/features/chat/hooks/useChatPresence"
import { useChatThread } from "@/features/chat/hooks/useChatThread"
import {
  assignConversation,
  fetchConversationParticipants,
  sendConversationMessage,
  updateConversationStatus,
} from "@/features/chat/services/chatService"
import type { ChatConversation, ChatListFilter } from "@/features/chat/types"
import { useAuth } from "@/features/auth/context/AuthContext"

function isMeaningfulName(value?: string | null) {
  return Boolean(value && value.trim() && !value.includes("@"))
}

function formatEmailDisplayName(email?: string | null) {
  if (!email) return null
  const localPart = email.split("@")[0]?.trim()
  if (!localPart) return null

  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function ChatsPanel({
  mode = "admin",
}: {
  mode?: "admin" | "manager"
}) {
  const { user, profile } = useAuth()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<ChatListFilter>("all")
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [participantsInfo, setParticipantsInfo] = useState<Record<string, string>>({})

  const { conversations, loading, connectionState, reload } = useChatConversationList({
    role: mode === "manager" ? "manager" : "admin",
    search,
    filter,
    onIncomingConversation: () => playNotificationSound(),
  })

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0] ?? null,
    [activeConversationId, conversations]
  )

  const { messages, loading: threadLoading, connectionState: threadConnectionState, reload: reloadThread } = useChatThread(
    activeConversation?.id
  )

  const { presenceRows, onlineStaff } = useChatPresence({
    userId: user?.id,
    role: profile?.role === "seller" ? "seller" : "admin",
    displayName: profile?.full_name || user?.email || "Atendimento",
    currentConversationId: activeConversation?.id,
  })

  const currentStaffDisplayName = useMemo(() => {
    if (isMeaningfulName(profile?.full_name)) return profile!.full_name!.trim()
    if (isMeaningfulName(profile?.company_name)) return profile!.company_name!.trim()
    const metadataFullName =
      typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : ""
    if (metadataFullName) return metadataFullName
    const metadataCompanyName =
      typeof user?.user_metadata?.company_name === "string" ? user.user_metadata.company_name.trim() : ""
    if (metadataCompanyName) return metadataCompanyName
    return formatEmailDisplayName(user?.email) || "Equipe comercial"
  }, [profile?.company_name, profile?.full_name, user?.email, user?.user_metadata])

  useEffect(() => {
    if (!activeConversationId && conversations.length) {
      setActiveConversationId(conversations[0].id)
    }
  }, [activeConversationId, conversations])

  useEffect(() => {
    if (!activeConversation?.id || !user?.id) {
      return
    }

    if (mode === "admin" && !activeConversation.assigned_admin_id) {
      assignConversation(activeConversation.id, user.id, currentStaffDisplayName).catch(() => undefined)
    }
  }, [activeConversation?.id, activeConversation?.assigned_admin_id, currentStaffDisplayName, mode, user?.id])

  useEffect(() => {
    if (!activeConversation?.id) return

    fetchConversationParticipants(activeConversation.id)
      .then((rows) => {
        setParticipantsInfo(
          rows.reduce<Record<string, string>>((acc, row) => {
            if (row.participant_type === "admin" && row.display_name) {
              acc[row.user_id] = row.display_name
            }
            return acc
          }, {})
        )
      })
      .catch(() => setParticipantsInfo({}))
  }, [activeConversation?.id])

  const decoratedConversations = useMemo(
    () =>
      conversations.map((conversation) => ({
        ...conversation,
        customer_online: Boolean(presenceRows[conversation.customer_user_id]?.is_online),
        staff_online: onlineStaff.length > 0,
        last_seen: presenceRows[conversation.customer_user_id]?.last_seen ?? null,
      })),
    [conversations, onlineStaff.length, presenceRows]
  )

  const handleSend = async ({ text, attachment }: { text: string; attachment?: File | null }) => {
    if (!activeConversation?.id) return

    setSending(true)
    try {
        await sendConversationMessage({
          conversationId: activeConversation.id,
          senderType: "admin",
          senderName: currentStaffDisplayName,
          content: text,
          attachment,
        })

      await updateConversationStatus(activeConversation.id, "active")
      await Promise.all([reload(), reloadThread()])
    } catch (error) {
      toast.error("Erro ao responder", {
        description: error instanceof Error ? error.message : "Não foi possível enviar a mensagem.",
      })
      throw error
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (status: ChatConversation["status"]) => {
    if (!activeConversation?.id) return

    try {
      await updateConversationStatus(activeConversation.id, status)
      await reload()
      toast.success("Status atualizado")
    } catch (error) {
      toast.error("Erro ao atualizar status", {
        description: error instanceof Error ? error.message : "Não foi possível atualizar o chat.",
      })
    }
  }

  const handleCloseConversation = async () => {
    if (!activeConversation?.id) return

    try {
      await updateConversationStatus(activeConversation.id, "closed")
      await reload()
      toast.success("Chat finalizado")
    } catch (error) {
      toast.error("Erro ao finalizar chat", {
        description: error instanceof Error ? error.message : "Não foi possível finalizar o atendimento.",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <ChatConversationList
          conversations={decoratedConversations}
          activeId={activeConversation?.id}
          onSelect={setActiveConversationId}
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          loading={loading}
        />

        <div className="space-y-4">
          {!activeConversation && (
            <Card className="border-dashed border-slate-300 bg-slate-50 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <MessageCircleMore className="h-10 w-10 text-slate-400" />
                <div className="space-y-1">
                  <div className="text-base font-semibold text-slate-900">Nenhuma conversa selecionada</div>
                  <div className="text-sm text-slate-500">Selecione um atendimento na lista lateral para responder.</div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeConversation && (
            <>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <ChatMessageList
                      messages={messages}
                      viewerRole={mode === "manager" ? "manager" : "admin"}
                      adminDisplayName={
                        isMeaningfulName(activeConversation.assigned_admin_name)
                          ? activeConversation.assigned_admin_name
                          : currentStaffDisplayName
                      }
                    />
                    <ChatComposer
                      loading={sending || threadLoading}
                      placeholder="Responder cliente ou visitante"
                      onSend={handleSend}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dados do cliente</div>
                      <div className="mt-3 space-y-3">
                        <Detail label="Nome" value={activeConversation.customer_name} />
                        <Detail label="E-mail" value={activeConversation.customer_email || "-"} />
                        <Detail label="Telefone" value={activeConversation.customer_phone || "-"} />
                        <Detail label="Motivo" value={activeConversation.subject} />
                        <Detail label="Pedido / referência" value={activeConversation.order_reference || "-"} />
                        <Detail
                          label="Responsável"
                          value={
                            (isMeaningfulName(activeConversation.assigned_admin_name) && activeConversation.assigned_admin_name) ||
                            participantsInfo[user?.id || ""] ||
                            currentStaffDisplayName
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ações do atendimento</div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <Button
                          type="button"
                          variant={activeConversation.status === "pending" ? "default" : "outline"}
                          onClick={() => handleStatusChange("pending")}
                        >
                          Pendente
                        </Button>
                        <Button
                          type="button"
                          variant={activeConversation.status === "active" ? "default" : "outline"}
                          onClick={() => handleStatusChange("active")}
                        >
                          Em atendimento
                        </Button>
                        <Button
                          type="button"
                          variant={activeConversation.status === "closed" ? "default" : "outline"}
                          onClick={() => handleStatusChange("closed")}
                        >
                          Finalizar chat
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo operacional</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p>Mensagens não lidas (admin): {activeConversation.unread_admin_count}</p>
                        <p>Mensagens não lidas (cliente): {activeConversation.unread_customer_count}</p>
                        <p>Última interação: {activeConversation.last_message_at ? new Date(activeConversation.last_message_at).toLocaleString("pt-BR") : "-"}</p>
                        <p>Abertura: {new Date(activeConversation.created_at).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ChatConversationMeta
                conversation={activeConversation}
                statusLabel={getAdminStatusLabel(activeConversation.status)}
                customerOnline={Boolean(presenceRows[activeConversation.customer_user_id]?.is_online)}
                staffOnline={onlineStaff.length > 0}
                customerLastSeen={presenceRows[activeConversation.customer_user_id]?.last_seen ?? null}
                managerLabel={
                  (isMeaningfulName(activeConversation.assigned_admin_name) && activeConversation.assigned_admin_name) ||
                  currentStaffDisplayName
                }
              />

              <ChatStatusBar online={onlineStaff.length > 0} connectionState={threadConnectionState === "connected" ? threadConnectionState : connectionState}>
                <Button
                  variant="outline"
                  size="icon-sm"
                  title="Atualizar"
                  aria-label="Atualizar"
                  onClick={() => reload().catch(() => undefined)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                {activeConversation && activeConversation.status !== "closed" && (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    title="Finalizar chat"
                    aria-label="Finalizar chat"
                    onClick={handleCloseConversation}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </ChatStatusBar>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

function getAdminStatusLabel(status: string) {
  if (status === "active") return "Em atendimento"
  if (status === "closed") return "Finalizado"
  return "Aguardando atendimento"
}

function playNotificationSound() {
  try {
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
    gain.gain.setValueAtTime(0.02, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2)

    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch {
    // noop
  }
}
