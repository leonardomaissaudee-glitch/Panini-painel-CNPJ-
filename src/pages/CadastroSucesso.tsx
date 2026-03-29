import { type ComponentType } from "react"
import { Link, useLocation } from "react-router-dom"
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { Footer } from "@/components/Footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type SuccessState = {
  razaoSocial?: string
  email?: string
}

export default function CadastroSucesso() {
  const location = useLocation()
  const state = (location.state as SuccessState | null) ?? null

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_32%,#fffdf7_100%)] text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,213,79,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.16),transparent_24%)]" />
        <div className="container relative mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="border-emerald-200 bg-emerald-100 text-emerald-900">Cadastro concluído</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
                Cadastro enviado com sucesso.
              </h1>
              <p className="max-w-2xl text-lg text-slate-100/90">
                Nossa equipe comercial dará continuidade ao seu atendimento após a análise das informações cadastradas.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatusPill icon={CheckCircle2} title="Dados recebidos" />
              <StatusPill icon={ShieldCheck} title="Análise cadastral" />
              <StatusPill icon={Sparkles} title="Gerente de contas" />
            </div>
          </div>

          <Card className="border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
            <CardContent className="space-y-5 p-6 md:p-8">
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Próximo passo</div>
                <h2 className="text-2xl font-bold text-white">Seu credenciamento está em análise</h2>
                <p className="text-sm text-slate-200">
                  O atendimento comercial seguirá com base nas informações enviadas. Se necessário, a equipe poderá
                  solicitar validações adicionais.
                </p>
              </div>

              {(state?.razaoSocial || state?.email) && (
                <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5 text-sm text-slate-100">
                  {state?.razaoSocial && <div><span className="font-semibold">Empresa:</span> {state.razaoSocial}</div>}
                  {state?.email && <div className="mt-2"><span className="font-semibold">Contato:</span> {state.email}</div>}
                </div>
              )}

              <ul className="space-y-2 text-sm text-slate-200">
                <li>• O login do revendedor é feito com CNPJ e senha.</li>
                <li>• O painel inicial mostra o status do cadastro e os próximos passos.</li>
                <li>• Um gerente de contas acompanha a continuidade comercial.</li>
              </ul>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-amber-400 text-slate-950 hover:bg-amber-300">
                  <Link to="/login">Ir para login</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10">
                  <Link to="/">Voltar à home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <SupportCard title="Sem formulário solto" description="Cadastro concluído com autenticação, dados empresariais e persistência real." />
          <SupportCard title="Fluxo profissional" description="Acompanhamento organizado, comunicação comercial e validação estruturada." />
          <SupportCard title="Área do revendedor" description="Após o login, acompanhe o status do cadastro e a próxima etapa do atendimento." />
        </div>
      </section>

      <Footer />
    </div>
  )
}

function StatusPill({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-100">
      <Icon className="h-4 w-4 text-amber-300" />
      <span className="font-medium">{title}</span>
    </div>
  )
}

function SupportCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="space-y-2 p-5">
        <div className="text-base font-semibold text-slate-950">{title}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
