import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/context/AuthContext"
import {
  fetchMessages,
  getOrCreateConversationForClient,
  sendChatMessage,
  type ChatMessage,
} from "@/shared/services/chatService"

export function ClientSupport({ conversationId }: { conversationId?: string | null }) {
  const [message, setMessage] = useState("")
  const [convId, setConvId] = useState<string | null>(conversationId ?? null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const { user, profile } = useAuth()

  const handleSend = async () => {
    if (!convId || !message.trim()) return
    try {
      await sendChatMessage(convId, "client", message.trim())
      setMessage("")
      loadMessages(convId)
    } catch (e: any) {
      toast.error("Erro ao enviar", { description: e.message })
    }
  }

  const openWhatsApp = () => {
    const email = user?.email ? ` (${user.email})` : ""
    const msg = encodeURIComponent(`Olá, preciso de ajuda com meu pedido.${email}`)
    window.open(`https://wa.me/?text=${msg}`, "_blank")
  }

  const loadMessages = async (id: string) => {
    try {
      const rows = await fetchMessages(id)
      setMessages(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar mensagens", { description: e.message })
    }
  }

  useEffect(() => {
    const init = async () => {
      if (!profile?.id) return
      try {
        const conv = await getOrCreateConversationForClient(profile.id)
        setConvId(conv.id)
        await loadMessages(conv.id)
      } catch (e: any) {
        toast.error("Erro ao iniciar conversa", { description: e.message })
      }
    }
    if (!convId) init()
  }, [convId, profile?.id])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atendimento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-64 overflow-y-auto border rounded p-3 bg-muted/30 space-y-2 text-sm">
          {messages.map((m) => (
            <div key={m.id}>
              <div className="text-[11px] text-muted-foreground">
                {m.sender_type} • {m.created_at?.slice(0, 16) || ""}
              </div>
              <div className="border rounded px-2 py-1 bg-background">{m.mensagem}</div>
            </div>
          ))}
          {messages.length === 0 && <div className="text-muted-foreground text-sm">Sem mensagens ainda.</div>}
        </div>

        <Textarea
          placeholder="Envie uma mensagem ao suporte..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={handleSend} disabled={!conversationId}>
            Enviar
          </Button>
          <Button variant="outline" onClick={openWhatsApp}>
            WhatsApp
          </Button>
        </div>
        {!conversationId && (
          <p className="text-xs text-muted-foreground">
            Abra ou selecione uma conversa existente para enviar mensagens.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
