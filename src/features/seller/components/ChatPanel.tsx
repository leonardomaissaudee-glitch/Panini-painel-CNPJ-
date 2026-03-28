import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  fetchConversationsForSeller,
  fetchMessages,
  sendMessage,
  type Conversation,
  type Message,
} from "@/features/seller/services/sellerService"

export function ChatPanel({ sellerId }: { sellerId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(false)

  const loadConversations = async () => {
    try {
      const rows = await fetchConversationsForSeller(sellerId)
      setConversations(rows)
      if (!selected && rows.length) setSelected(rows[0].id)
    } catch (e: any) {
      toast.error("Erro ao carregar conversas", { description: e.message })
    }
  }

  const loadMessages = async (conversationId: string) => {
    setLoading(true)
    try {
      const rows = await fetchMessages(conversationId)
      setMessages(rows)
    } catch (e: any) {
      toast.error("Erro ao carregar mensagens", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [sellerId])

  useEffect(() => {
    if (selected) loadMessages(selected)
  }, [selected])

  const handleSend = async () => {
    if (!selected || !reply.trim()) return
    try {
      await sendMessage(selected, "seller", reply.trim())
      setReply("")
      loadMessages(selected)
    } catch (e: any) {
      toast.error("Erro ao enviar", { description: e.message })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-3 py-2 text-sm font-semibold">Conversas</div>
          <div className="max-h-80 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                className={`w-full text-left px-3 py-2 border-b text-sm ${
                  selected === c.id ? "bg-muted/60 font-semibold" : ""
                }`}
                onClick={() => setSelected(c.id)}
              >
                {c.id.slice(0, 8)} • {c.status || "novo"}
              </button>
            ))}
            {conversations.length === 0 && <div className="p-3 text-sm text-muted-foreground">Sem conversas</div>}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3">
          <div className="border rounded-lg p-3 max-h-80 overflow-y-auto bg-muted/30">
            {messages.map((m) => (
              <div key={m.id} className="mb-2">
                <div className="text-xs text-muted-foreground">
                  {m.sender_type} • {m.created_at?.slice(0, 16) || ""}
                </div>
                <div className="rounded bg-background px-2 py-1 text-sm border">{m.mensagem}</div>
              </div>
            ))}
            {messages.length === 0 && !loading && (
              <div className="text-sm text-muted-foreground">Selecione uma conversa.</div>
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Responder cliente..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex flex-col gap-2">
              <Button onClick={handleSend}>Enviar</Button>
              <Button variant="outline" onClick={() => setReply("")}>
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
