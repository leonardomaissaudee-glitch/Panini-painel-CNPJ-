import { useEffect, useState, type ComponentType } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Building2, KeyRound, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Footer } from "@/components/Footer"
import { FormError } from "@/components/feedback/FormFeedback"
import { FormField, InputBase } from "@/components/forms/FormField"
import { InputMasked } from "@/components/forms/InputMasked"
import { LoadingButton } from "@/components/forms/LoadingButton"
import { findResellerProfileByCurrentUser, signInWithCnpjAndPassword, signOutReseller } from "@/lib/auth"
import { formatCNPJ, unformatCNPJ } from "@/lib/masks"

export default function LoginPage() {
  const navigate = useNavigate()
  const [cnpj, setCnpj] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    findResellerProfileByCurrentUser()
      .then((profile) => {
        if (!mounted) {
          return
        }

        if (profile) {
          navigate("/painel", { replace: true })
          return
        }

        setCheckingSession(false)
      })
      .catch(() => {
        if (mounted) {
          setCheckingSession(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [navigate])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      const cleanCnpj = unformatCNPJ(cnpj)

      if (cleanCnpj.length !== 14) {
        throw new Error("Informe um CNPJ válido para continuar.")
      }

      if (!password) {
        throw new Error("Informe sua senha para acessar a área do revendedor.")
      }

      await signInWithCnpjAndPassword(cleanCnpj, password)
      const resellerProfile = await findResellerProfileByCurrentUser()

      if (!resellerProfile) {
        throw new Error("Sua sessão foi iniciada, mas o perfil empresarial não foi localizado.")
      }

      if (resellerProfile.status_cadastro === "rejected" || resellerProfile.status_cadastro === "blocked") {
        await signOutReseller()
        throw new Error("Sua conta está indisponível no momento. Fale com seu gerente de contas para regularização.")
      }

      navigate("/painel", { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível entrar agora.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_32%,#fffdf7_100%)] text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,213,79,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.16),transparent_24%)]" />
        <div className="container relative mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="border-amber-300 bg-amber-200 text-amber-950">Área do revendedor</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
                Acesse sua área de revendedor
              </h1>
              <p className="max-w-2xl text-lg text-slate-100/90">
                Entre com seu CNPJ e senha para continuar seu atendimento e acompanhar seu cadastro.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <FeatureCard icon={Building2} title="Login por CNPJ" description="Experiência empresarial sem expor o e-mail operacional." />
              <FeatureCard icon={ShieldCheck} title="Sessão protegida" description="Autenticação estruturada em ambiente seguro." />
              <FeatureCard icon={KeyRound} title="Acompanhamento dedicado" description="Status cadastral e suporte com gerente de contas." />
            </div>
          </div>

          <Card className="border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
            <CardContent className="space-y-6 p-6 md:p-8">
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Login empresarial</div>
                <h2 className="text-2xl font-bold text-white">Continuar atendimento</h2>
                <p className="text-sm text-slate-200">
                  Use o CNPJ credenciado e a senha definida no cadastro. Administradores e vendedores acessam pela rota
                  dedicada.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <FormError message={error} />

                <FormField label="CNPJ" error={error && unformatCNPJ(cnpj).length !== 14 ? "CNPJ inválido" : undefined}>
                  <InputMasked
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(event) => {
                      setError("")
                      setCnpj(formatCNPJ(event.target.value))
                    }}
                    maxLength={18}
                    inputMode="numeric"
                    autoComplete="off"
                    className={error && unformatCNPJ(cnpj).length !== 14 ? "border-red-400 focus:border-red-500 focus:ring-red-100" : undefined}
                  />
                </FormField>

                <FormField label="Senha">
                  <InputBase
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(event) => {
                      setError("")
                      setPassword(event.target.value)
                    }}
                    autoComplete="current-password"
                  />
                </FormField>

                <LoadingButton
                  loading={loading || checkingSession}
                  className="h-12 w-full rounded-full bg-amber-400 text-sm font-semibold text-slate-950 hover:bg-amber-300"
                >
                  Entrar
                </LoadingButton>
              </form>

              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
                Se ainda não iniciou o credenciamento, envie primeiro seu cadastro empresarial. Um gerente de contas dará
                sequência após a análise cadastral.
              </div>

              <div className="flex flex-col gap-3 text-sm text-slate-100 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/cadastro" className="inline-flex items-center gap-2 font-semibold text-amber-300 hover:text-amber-200">
                  Ainda não tenho cadastro <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/loginadmin" className="text-slate-300 transition hover:text-white">
                  Acesso administrativo
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <SupportCard title="Atendimento exclusivo" description="Cada cadastro segue com gerente de contas após análise documental e comercial." />
          <SupportCard title="Status claro" description="Após o login, o revendedor acompanha a situação do cadastro em um painel simples." />
          <SupportCard title="Operação profissional" description="Fluxo empresarial com CNPJ, dados institucionais e continuidade organizada." />
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Card className="border-white/10 bg-white/8 text-white shadow-none backdrop-blur">
      <CardContent className="space-y-3 p-4">
        <Icon className="h-5 w-5 text-amber-300" />
        <div className="text-sm font-semibold">{title}</div>
        <p className="text-xs text-slate-200">{description}</p>
      </CardContent>
    </Card>
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
