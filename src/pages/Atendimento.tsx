import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { MessageCircleMore, ShieldCheck, Wifi } from "lucide-react"
import { useAuth } from "@/features/auth/context/AuthContext"
import { isAnonymousAuthUser } from "@/features/auth/utils/authUser"
import { ClientLiveChat } from "@/features/chat/components/ClientLiveChat"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function AtendimentoPage() {
  const { loading, user, profile } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (user && !isAnonymousAuthUser(user)) {
    if (profile?.role === "admin") return <Navigate to="/admin" replace />
    if (profile?.role === "seller") return <Navigate to="/seller" replace />
    if (profile?.role === "client") return <Navigate to="/app/gerente" replace />
  }

  return (
    <div className="bg-slate-50">
      <section className="border-b bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Atendimento ao vivo
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Fale com um gerente e acompanhe sua solicitação em tempo real.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  Abra sua conversa, envie documentos, áudio, PDF ou imagens e receba retorno sem sair do site. Se a equipe
                  estiver offline, sua mensagem fica registrada para continuidade do atendimento.
                </p>
              </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="grid gap-3 p-5 text-sm text-slate-700">
                <Feature title="Canal oficial" description="Conversa salva no histórico com atualização em tempo real." icon={<MessageCircleMore className="h-4 w-4" />} />
                <Feature title="Segurança" description="Upload controlado para imagens, PDF, arquivos e áudio." icon={<ShieldCheck className="h-4 w-4" />} />
                <Feature title="Status de conexão" description="Visual de online/offline com reconexão automática." icon={<Wifi className="h-4 w-4" />} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <ClientLiveChat resellerProfile={null} publicMode />
      </div>
    </div>
  )
}

function Feature({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="text-blue-900">{icon}</span>
        {title}
      </div>
      <div className="text-sm text-slate-600">{description}</div>
    </div>
  )
}
