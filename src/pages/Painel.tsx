import { useEffect, useState, type ComponentType } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Building2, Clock3, LogOut, ShieldCheck } from "lucide-react"
import { Footer } from "@/components/Footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { findResellerProfileByCurrentUser, signOutReseller, type ResellerProfile } from "@/lib/auth"
import { formatCNPJ, formatPhone } from "@/lib/masks"

const statusCopy: Record<ResellerProfile["status_cadastro"], { label: string; tone: string; description: string }> = {
  pending: {
    label: "Em análise",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    description: "Seu cadastro está em análise pela equipe comercial. Um gerente de contas dará continuidade ao atendimento.",
  },
  approved: {
    label: "Aprovado",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    description: "Cadastro validado. Sua operação já pode seguir para atendimento comercial e próximos pedidos.",
  },
  rejected: {
    label: "Indisponível",
    tone: "border-rose-200 bg-rose-50 text-rose-800",
    description: "O cadastro está indisponível no momento. Fale com seu gerente de contas para revisar o processo.",
  },
  blocked: {
    label: "Bloqueado",
    tone: "border-rose-200 bg-rose-50 text-rose-800",
    description: "A conta está bloqueada no momento. Entre em contato com a equipe comercial para orientação.",
  },
}

export default function PainelPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ResellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    findResellerProfileByCurrentUser()
      .then((data) => {
        if (!mounted) {
          return
        }

        if (!data) {
          navigate("/login", { replace: true })
          return
        }

        setProfile(data)
        setLoading(false)
      })
      .catch((loadError) => {
        if (!mounted) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o painel.")
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [navigate])

  async function handleLogout() {
    try {
      await signOutReseller()
      navigate("/login", { replace: true })
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Não foi possível encerrar a sessão.")
    }
  }

  const status = profile ? statusCopy[profile.status_cadastro] : null

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_32%,#fffdf7_100%)] text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,213,79,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.16),transparent_24%)]" />
        <div className="container relative mx-auto grid gap-8 px-4 py-16 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
          <div className="space-y-5">
            <Badge className="border-blue-200 bg-blue-100 text-blue-900">Área do revendedor</Badge>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Painel inicial do credenciamento
            </h1>
            <p className="max-w-2xl text-lg text-slate-100/90">
              Ambiente inicial para acompanhar o status do seu cadastro empresarial e a continuidade comercial.
            </p>
          </div>

          <Card className="border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
            <CardContent className="space-y-4 p-6 md:p-8">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Situação atual</div>
              {loading && <p className="text-sm text-slate-200">Carregando dados do cadastro...</p>}
              {!loading && profile && status && (
                <>
                  <div className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${status.tone}`}>
                    {status.label}
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-semibold text-white">{profile.razao_social}</div>
                    <p className="text-sm text-slate-200">{status.description}</p>
                  </div>
                </>
              )}
              {!loading && !profile && !error && <p className="text-sm text-slate-200">Nenhum perfil empresarial localizado.</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto grid gap-6 px-4 py-12 lg:grid-cols-[0.62fr,0.38fr]">
        <div className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <Card className="border-slate-200 shadow-xl">
            <CardContent className="grid gap-6 p-6 md:grid-cols-2">
              <InfoRow label="Razão social" value={profile?.razao_social || "-"} />
              <InfoRow label="CNPJ" value={profile ? formatCNPJ(profile.cnpj) : "-"} />
              <InfoRow label="Responsável" value={profile?.nome_responsavel || "-"} />
              <InfoRow label="Contato" value={profile?.email || "-"} />
              <InfoRow label="Telefone" value={profile?.telefone ? formatPhone(profile.telefone) : "-"} />
              <InfoRow label="Localidade" value={profile ? `${profile.cidade} - ${profile.estado}` : "-"} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <SupportBlock
              icon={Clock3}
              title="Status claro"
              description="Acompanhe a fase atual do credenciamento e os próximos passos do atendimento."
            />
            <SupportBlock
              icon={ShieldCheck}
              title="Fluxo seguro"
              description="Cadastro e autenticação estruturados com dados empresariais persistidos no Supabase."
            />
            <SupportBlock
              icon={Building2}
              title="Gerente de contas"
              description="A continuidade comercial segue com acompanhamento dedicado após a análise cadastral."
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-amber-200 bg-amber-50 shadow-lg">
            <CardContent className="space-y-4 p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Próximos passos</div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Aguarde a análise das informações enviadas.</li>
                <li>• Mantenha telefone e e-mail acessíveis para contato comercial.</li>
                <li>• Em caso de validação adicional, a equipe entrará em contato.</li>
              </ul>
              <Button asChild className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800">
                <Link to="/oportunidade">
                  Ver oportunidade comercial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full rounded-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

function SupportBlock({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Card className="border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="space-y-3 p-5">
        <Icon className="h-5 w-5 text-blue-700" />
        <div className="text-base font-semibold text-slate-950">{title}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
