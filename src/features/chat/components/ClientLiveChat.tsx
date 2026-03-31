import { useEffect, useMemo, useState } from "react"
import { RotateCcw, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/context/AuthContext"
import { ChatComposer } from "@/features/chat/components/ChatComposer"
import { ChatStatusBar } from "@/features/chat/components/ChatHeader"
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

function isMeaningfulName(value?: string | null) {
  return Boolean(value && value.trim() && !value.includes("@"))
}

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
  const assignedManagerName =
    (isMeaningfulName(activeConversation?.assigned_admin_name) ? activeConversation?.assigned_admin_name : null) ||
    (isMeaningfulName(resellerProfile?.account_manager_name) ? resellerProfile?.account_manager_name : null) ||
    null
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
      {connectionBanner && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{connectionBanner}</div>
      )}

      <div className="space-y-4">
        {!activeConversation && (
          <ChatStartForm initialValues={initialValues} loading={starting} onSubmit={handleStartConversation} />
        )}

        {activeConversation && (
          <>
            <ChatStatusBar
              online={managerOnline}
              connectionState={threadConnectionState === "connected" ? threadConnectionState : listConnectionState}
            >
              {activeConversation.status === "closed" ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  title="Reabrir conversa"
                  aria-label="Reabrir conversa"
                  onClick={handleReopenConversation}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : (
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

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <ChatMessageList messages={messages} viewerRole="customer" adminDisplayName={managerDisplayName} />

                <ChatComposer
                  disabled={activeConversation.status === "closed"}
                  loading={sending || loadingMessages}
                  placeholder="Digite sua mensagem para o gerente"
                  onSend={handleSendMessage}
                />
              </CardContent>
            </Card>
          </>
        )}

        {!activeConversation && !loadingConversations && conversations.length > 0 && (
          <Card className="border-dashed border-slate-300 bg-slate-50 shadow-none">
            <CardContent className="p-8 text-center text-sm text-slate-500">
              Reabra o atendimento enviando uma nova mensagem no formulario acima.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

