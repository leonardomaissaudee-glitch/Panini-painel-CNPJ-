import { Link } from "react-router-dom"
import { ArrowRight, BadgeCheck, BarChart3, Building2, Crown, Globe2, ShieldCheck, Sparkles } from "lucide-react"
import { Footer } from "@/components/Footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const steps = [
  { icon: BadgeCheck, title: "Cadastre-se", desc: "Envie seus dados (CNPJ) para análise." },
  { icon: Building2, title: "Escolha produtos", desc: "Selecione figurinhas, álbuns e Adrenalyn." },
  { icon: Sparkles, title: "Monte o pedido", desc: "Defina volumes e finalize com o consultor." },
  { icon: ShieldCheck, title: "Ativação", desc: "Pagamento aprovado, conta liberada e pedido faturado." },
]

const market = [
  { icon: Globe2, title: "Marca global", desc: "Panini é referência mundial em colecionáveis esportivos." },
  { icon: BarChart3, title: "Alta demanda", desc: "Copa do Mundo gera pico de procura e giro acelerado." },
  { icon: Crown, title: "Produto oficial", desc: "Licença FIFA 2026™, confiança e desejo do público." },
]

const tips = [
  { title: "Estoque estratégico", desc: "Combine volumes de figurinhas, álbuns e Adrenalyn." },
  { title: "Aproveite picos", desc: "Lançamento e datas de jogos aumentam as vendas." },
  { title: "Monte combos", desc: "Ofereça kits para elevar ticket médio." },
  { title: "Reposição rápida", desc: "Reabasteça antes de ficar sem itens-chave." },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <Hero />
      <ResaleSteps />
      <Market />
      <Tips />
      <FinalCTA />
      <Footer />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,#FFD54F,transparent_35%),radial-gradient(circle_at_bottom_right,#EF4444,transparent_30%)]" />
      <div className="container mx-auto px-4 pt-20 pb-16 relative">
        <div className="max-w-4xl space-y-6">
          <Badge className="bg-amber-200 text-amber-900 border-amber-300">Revenda Oficial Copa do Mundo 2026™</Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Revenda Panini: autoridade, demanda massiva e operação segura para a Copa 2026™.
          </h1>
          <p className="text-lg text-slate-100 max-w-2xl">
            Conecte-se à marca mais desejada de colecionáveis esportivos. Estruture pedidos com descontos progressivos,
            frete grátis e atendimento exclusivo com gerente de contas.
          </p>
          <div className="flex flex-wrap gap-3">
            <CTA to="/register" label="Quero revender Panini" primary />
            <CTA to="/login" label="Já sou credenciado" />
          </div>
        </div>
      </div>
    </section>
  )
}

function ResaleSteps() {
  return (
    <Section
      id="processo"
      title="Como funciona a revenda"
      eyebrow="Processo"
      subtitle="Fluxo simples, sem taxa de adesão. O início é pela primeira compra."
    >
      <div className="grid md:grid-cols-4 gap-4">
        {steps.map((step, idx) => (
          <Card key={step.title} className="h-full border-slate-200 hover:shadow-lg transition-all">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <step.icon className="h-5 w-5 text-blue-700" />
              </div>
              <div className="text-lg font-semibold">{step.title}</div>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <Badge variant="outline">Sem taxa de adesão</Badge>
        <Badge variant="outline">Ativação após pagamento</Badge>
        <Badge variant="outline">Gerente de contas exclusivo</Badge>
      </div>
    </Section>
  )
}

function Market() {
  return (
    <Section
      id="mercado"
      title="Mercado e oportunidade"
      eyebrow="Copa do Mundo"
      subtitle="Evento global, demanda massiva e alto giro de produtos oficiais."
      gradient
    >
      <div className="grid md:grid-cols-3 gap-4">
        {market.map((m, i) => (
          <Card
            key={m.title}
            className={cn(
              "h-full hover:-translate-y-1 hover:shadow-xl transition-all",
              i === 0 && "border-amber-300 bg-amber-50",
              i === 1 && "border-blue-200 bg-blue-50",
              i === 2 && "border-red-200 bg-red-50"
            )}
          >
            <CardContent className="p-5 space-y-3">
              <m.icon className="h-6 w-6 text-blue-700" />
              <div className="text-lg font-semibold">{m.title}</div>
              <p className="text-sm text-slate-700">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="pt-6">
        <CTA to="/register" label="Aproveitar a demanda" primary size="lg" dark />
      </div>
    </Section>
  )
}

function Tips() {
  return (
    <Section
      id="dicas"
      title="Dicas para revenda"
      eyebrow="Sucesso"
      subtitle="Estratégias rápidas para elevar ticket médio e giro."
      gradient
    >
      <div className="grid md:grid-cols-4 gap-4">
        {tips.map((t) => (
          <Card key={t.title} className="h-full hover:shadow-lg transition-all border-slate-200">
            <CardContent className="p-5 space-y-2">
              <div className="font-semibold text-slate-900">{t.title}</div>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="pt-6">
        <CTA to="/register" label="Aplicar agora" primary />
      </div>
    </Section>
  )
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-amber-500 to-red-500 text-slate-900">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#ffffff,transparent_35%)]" />
      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid md:grid-cols-[1.3fr,0.7fr] gap-8 items-center">
          <div className="space-y-4">
            <Badge variant="outline" className="border-slate-900 text-slate-900 bg-white/40">Encerramento</Badge>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Revenda oficial Panini Copa 2026™: demanda alta, marca consolidada e suporte comercial dedicado.
            </h2>
            <p className="text-lg text-slate-900/80 max-w-3xl">
              Estruture uma operação lucrativa com produtos oficiais, frete grátis, faturamento com NF e descontos progressivos,
              com apoio de um gerente de contas dedicado. A hora de garantir estoque é agora.
            </p>
            <div className="flex flex-wrap gap-3">
              <CTA to="/register" label="Quero revender Panini" primary dark />
              <CTA to="/login" label="Falar com consultor" />
            </div>
          </div>
          <Card className="bg-white/90 backdrop-blur-lg shadow-2xl border-white/60">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Sparkle className="h-5 w-5 text-amber-600" />
                <div className="font-semibold text-lg">Comece em minutos</div>
              </div>
              <ul className="text-sm text-slate-700 space-y-2">
                <li>• Cadastro sem taxa de adesão</li>
                <li>• Primeira compra ativa a conta</li>
                <li>• NF em todos os pedidos</li>
                <li>• Acompanhamento por gerente de contas</li>
              </ul>
              <CTA to="/register" label="Iniciar credenciamento" primary />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function Section({
  title,
  subtitle,
  eyebrow,
  children,
  gradient = false,
  id,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  children: React.ReactNode
  gradient?: boolean
  id?: string
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 py-14 px-4", gradient ? "bg-gradient-to-br from-slate-50 via-white to-blue-50" : "")}
    >
      <div className="container mx-auto space-y-6">
        <div className="space-y-2">
          {eyebrow && <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">{eyebrow}</div>}
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          {subtitle && <p className="text-muted-foreground max-w-3xl">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  )
}

function CTA({ to, label, primary, size = "md", dark }: { to: string; label: string; primary?: boolean; size?: "sm" | "md" | "lg"; dark?: boolean }) {
  const classes = primary
    ? cn(
        "inline-flex items-center gap-2 rounded-full font-semibold transition-all shadow-lg",
        dark
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : "bg-amber-400 text-slate-900 hover:bg-amber-300",
        size === "sm" ? "px-4 py-2 text-sm" : size === "lg" ? "px-6 py-3 text-base" : "px-5 py-2.5 text-sm"
      )
    : cn(
        "inline-flex items-center gap-2 rounded-full font-semibold border transition-all",
        "border-white/50 text-white hover:bg-white/10",
        "px-5 py-2.5 text-sm",
        dark && "text-slate-900 border-slate-900 hover:bg-slate-900/10"
      )

  return (
    <Link to={to} className={classes}>
      {label} <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

