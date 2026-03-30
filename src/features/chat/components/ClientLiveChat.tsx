import { useEffect, useMemo, useState } from "react"
import { MessageCircleMore, RotateCcw, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/context/AuthContext"
import { ChatComposer } from "@/features/chat/components/ChatComposer"
import { ChatConversationList } from "@/features/chat/components/ChatConversationList"
import { ChatHeader, ChatConversationMeta } from "@/features/chat/components/ChatHeader"
import { ChatMessageList } from "@/features/chat/components/ChatMessageList"
import { ChatStartForm } from "@/features/chat/components/ChatStartForm"
import { useChatConversationList } from "@/features/chat/hooks/useChatConversationList"
import { useChatPresence } from "@/features/chat/hooks/useChatPresence"
import { useChatThread } from "@/features/chat/hooks/useChatThread"
import {
  ensureChatUser,
  fetchConversationById,
  sendConversationMessage,
  startOrReuseConversation,
  updateConversationStatus,
  isAnonymousUser,
} from "@/features/chat/services/chatService"
import type { ChatConversationFormInput } from "@/features/chat/types"
import type { ResellerProfile } from "@/lib/auth"

export function ClientLiveChat({
  resellerProfile,
  publicMode = false,
}: {
  resellerProfile: ResellerProfile | null
  publicMode?: boolean
}) {
  const { user } = useAuth()
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [sending, setSending] = useState(false)
  const [connectionBanner, setConnectionBanner] = useState("")
  const [showConversationMenu, setShowConversationMenu] = useState(false)

  const { conversations, loading: loadingConversations, connectionState: listConnectionState, reload } = useChatConversationList({
    role: "customer",
    enabled: true,
  })

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0] ?? null,
    [activeConversationId, conversations]
  )

  const { messages, loading: loadingMessages, connectionState: threadConnectionState, reload: reloadThread } = useChatThread(
    activeConversation?.id
  )

  const { onlineStaff, presenceRows } = useChatPresence({
    userId: user?.id,
    role: user ? (isAnonymousUser(user) ? "visitor" : "customer") : undefined,
    displayName: resellerProfile?.razao_social || user?.email || "Cliente",
    currentConversationId: activeConversation?.id,
  })

  useEffect(() => {
    if (!activeConversationId && conversations.length) {
      setActiveConversationId(conversations[0].id)
    }
  }, [activeConversationId, conversations])

  useEffect(() => {
    if (!activeConversation) {
      setShowConversationMenu(true)
    }
  }, [activeConversation])

  useEffect(() => {
    if (threadConnectionState === "error" || listConnectionState === "error") {
      setConnectionBanner("Conexão instável. Tentando reconectar o atendimento...")
      return
    }

    if (threadConnectionState === "connecting" || listConnectionState === "connecting") {
      setConnectionBanner("Conectando o atendimento em tempo real...")
      return
    }

    setConnectionBanner("")
  }, [listConnectionState, threadConnectionState])

  const customerLastSeen = user?.id ? presenceRows[user.id]?.last_seen ?? null : null
  const assignedManagerName = activeConversation?.assigned_admin_name || resellerProfile?.account_manager_name || null
  const activeManagerOnline = activeConversation?.assigned_admin_id
    ? Boolean(presenceRows[activeConversation.assigned_admin_id]?.is_online)
    : false
  const assignedManagerOnline = assignedManagerName
    ? onlineStaff.some((entry) => entry.displayName?.trim().toLowerCase() === assignedManagerName.trim().toLowerCase())
    : false
  const managerOnline = assignedManagerName ? activeManagerOnline || assignedManagerOnline : onlineStaff.length > 0
  const managerDisplayName = assignedManagerName || "Gerente comercial"

  const handleStartConversation = async (values: ChatConversationFormInput) => {
    setStarting(true)
    try {
      await ensureChatUser()
      const conversationId = await startOrReuseConversation(values)
      await reload()
      const conversation = await fetchConversationById(conversationId)
      setActiveConversationId(conversation?.id ?? conversationId)
      setShowConversationMenu(false)

      toast.success("Atendimento iniciado", {
        description: managerOnline
          ? "Sua conversa foi aberta e o gerente já pode responder em tempo real."
          : "No momento estamos offline, mas sua mensagem foi registrada e será respondida assim que possível.",
      })
    } catch (error) {
      toast.error("Erro ao iniciar atendimento", {
        description: error instanceof Error ? error.message : "Não foi possível iniciar a conversa.",
      })
    } finally {
      setStarting(false)
    }
  }

  const handleSendMessage = async ({ text, attachment }: { text: string; attachment?: File | null }) => {
    if (!activeConversation?.id) return

    setSending(true)
    try {
      await sendConversationMessage({
        conversationId: activeConversation.id,
        senderType: "customer",
        senderName: resellerProfile?.razao_social || user?.email || "Cliente",
        content: text,
        attachment,
      })
      await Promise.all([reload(), reloadThread()])
    } finally {
      setSending(false)
    }
  }

  const handleCloseConversation = async () => {
    if (!activeConversation?.id) return

    try {
      await updateConversationStatus(activeConversation.id, "closed")
      await Promise.all([reload(), reloadThread()])
      toast.success("Chat finalizado")
    } catch (error) {
      toast.error("Não foi possível finalizar o chat", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  const handleReopenConversation = async () => {
    if (!activeConversation?.id) return

    try {
      await updateConversationStatus(activeConversation.id, "pending")
      await reload()
      toast.success("Conversa reaberta")
    } catch (error) {
      toast.error("Não foi possível reabrir a conversa", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
    }
  }

  const initialValues = {
    name: resellerProfile?.razao_social || "",
    email: resellerProfile?.email || user?.email || "",
    phone: resellerProfile?.whatsapp || resellerProfile?.telefone || "",
  }

  return (
    <div className="space-y-4">
      <ChatHeader
        title="Atendimento ao vivo"
        subtitle={managerOnline ? `${managerDisplayName} online no momento` : "No momento estamos offline, mas sua mensagem será respondida."}
        online={managerOnline}
        connectionState={threadConnectionState === "connected" ? threadConnectionState : listConnectionState}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {conversations.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowConversationMenu((current) => !current)}>
                <MessageCircleMore className="mr-2 h-4 w-4" />
                Conversas
              </Button>
            )}
            {activeConversation?.status === "closed" ? (
              <Button variant="outline" size="sm" onClick={handleReopenConversation}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reabrir conversa
              </Button>
            ) : activeConversation ? (
              <Button variant="outline" size="sm" onClick={handleCloseConversation}>
                <XCircle className="mr-2 h-4 w-4" />
                Finalizar chat
              </Button>
            ) : undefined}
          </div>
        }
      />

      {connectionBanner && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{connectionBanner}</div>
      )}

      <div className={`grid gap-4 ${showConversationMenu ? "xl:grid-cols-[320px_1fr]" : "grid-cols-1"}`}>
        {showConversationMenu && (
          <ChatConversationList
            conversations={conversations.map((conversation) => ({
              ...conversation,
              customer_online: Boolean(user?.id && presenceRows[user.id]?.is_online),
              staff_online: conversation.assigned_admin_id
                ? Boolean(presenceRows[conversation.assigned_admin_id]?.is_online)
                : conversation.assigned_admin_name
                  ? onlineStaff.some(
                      (entry) => entry.displayName?.trim().toLowerCase() === conversation.assigned_admin_name?.trim().toLowerCase()
                    )
                  : managerOnline,
              last_seen: customerLastSeen,
            }))}
            activeId={activeConversation?.id}
            onSelect={(conversationId) => {
              setActiveConversationId(conversationId)
              setShowConversationMenu(false)
            }}
            search=""
            onSearchChange={() => undefined}
            viewerRole="customer"
            showSearch={false}
            loading={loadingConversations}
          />
        )}

        <div className="space-y-4">
          {!activeConversation && (
            <ChatStartForm initialValues={initialValues} loading={starting} onSubmit={handleStartConversation} />
          )}

          {activeConversation && (
            <>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="space-y-4 p-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <MetaBox label="Pedido / referência" value={activeConversation.order_reference || "-"} />
                      <MetaBox label="Gerente" value={managerDisplayName} />
                      <MetaBox label="WhatsApp" value={resellerProfile?.account_manager_whatsapp || "-"} />
                    </div>
                  </div>

                  <ChatMessageList messages={messages} viewerRole="customer" adminDisplayName={managerDisplayName} />

                  <ChatComposer
                    disabled={activeConversation.status === "closed"}
                    loading={sending || loadingMessages}
                    placeholder="Digite sua mensagem para o gerente"
                    onSend={handleSendMessage}
                  />
                </CardContent>
              </Card>

              <ChatConversationMeta
                conversation={activeConversation}
                statusLabel={getConversationStatusLabel(activeConversation.status)}
                customerOnline={Boolean(user?.id && presenceRows[user.id]?.is_online)}
                staffOnline={managerOnline}
                customerLastSeen={customerLastSeen}
                managerLabel={managerDisplayName}
              />
            </>
          )}

          {!activeConversation && !loadingConversations && conversations.length > 0 && (
            <Card className="border-dashed border-slate-300 bg-slate-50 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <MessageCircleMore className="h-10 w-10 text-slate-400" />
                <div className="space-y-1">
                  <div className="text-base font-semibold text-slate-900">
                    {publicMode ? "Inicie seu atendimento" : "Abra sua conversa com o gerente"}
                  </div>
                  <div className="text-sm text-slate-500">
                    Preencha o formulário acima para criar a conversa e acompanhar as respostas em tempo real.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium leading-5 text-slate-900">{value}</div>
    </div>
  )
}

function getConversationStatusLabel(status: string) {
  if (status === "active") return "Em atendimento"
  if (status === "closed") return "Finalizado"
  return "Aguardando atendimento"
}
