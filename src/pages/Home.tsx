import { Link } from "react-router-dom"
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CreditCard,
  Crown,
  FileText,
  Gem,
  Globe2,
  Lock,
  Package,
  Percent,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkle,
  Sparkles,
  Timer,
  Truck,
  Wallet,
} from "lucide-react"
import { Footer } from "@/components/Footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const steps = [
  { icon: BadgeCheck, title: "Cadastre-se", desc: "Envie seus dados (CNPJ) para análise." },
  { icon: Building2, title: "Escolha produtos", desc: "Selecione figurinhas, álbuns e Adrenalyn." },
  { icon: Sparkles, title: "Monte o pedido", desc: "Defina volumes e finalize com o consultor." },
  { icon: ShieldCheck, title: "Ativação", desc: "Pagamento aprovado, conta liberada e pedido faturado." },
]

const products = [
  {
    title: "Figurinhas",
    points: ["Vendidas em envelopes", "Cada pacote com múltiplas figurinhas", "Para completar o álbum oficial"],
    accent: "bg-amber-100 text-amber-900 border-amber-200",
  },
  {
    title: "Álbuns",
    points: ["Capas mole e dura", "Vendidos separadamente", "Produto oficial licenciado"],
    accent: "bg-blue-100 text-blue-900 border-blue-200",
  },
  {
    title: "Adrenalyn",
    points: ["Cards colecionáveis premium", "Versões raras e alto valor de revenda", "Linha diferente das figurinhas"],
    accent: "bg-red-100 text-red-900 border-red-200",
  },
]

const plans = [
  { name: "Classic", value: "A partir de R$ 800", desc: "Entrada acessível para testar o mercado.", badge: "Novo" },
  { name: "Standard", value: "A partir de R$ 2.500", desc: "Descontos melhores e mais benefícios.", badge: "Equilíbrio" },
  { name: "Premium", value: "A partir de R$ 5.000", desc: "Margem alta, brindes e prioridade logística.", badge: "Melhor margem" },
]

const benefits = [
  { icon: Percent, title: "Descontos progressivos", desc: "O sistema aplica automaticamente conforme o volume." },
  { icon: Gem, title: "Brindes e materiais", desc: "Apoio de marketing e itens promocionais nos pedidos maiores." },
  { icon: Truck, title: "Frete grátis Brasil", desc: "Envio pelos centros logísticos diretamente ao endereço." },
  { icon: Shield, title: "NF e rastreio", desc: "Faturamento oficial, pagamento direto à Panini, sem intermediários." },
]

const delivery = [
  { icon: Truck, title: "Frete grátis", desc: "Para todo o Brasil, via centros logísticos." },
  { icon: Package, title: "Entrega direta", desc: "Envio para o endereço cadastrado, sem retirada." },
  { icon: Timer, title: "Prazos claros", desc: "Em lançamentos a demanda sobe; antecipe seu pedido." },
]

const payments = [
  { icon: Wallet, title: "PIX", desc: "Desconto adicional no pagamento imediato." },
  { icon: FileText, title: "Boleto", desc: "Primeiro pedido à vista para cadastro." },
  { icon: CreditCard, title: "Cartão", desc: "Parcelamento disponível (sem desconto)." },
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
      <SectionNav />
      <AboutPanini />
      <ResaleSteps />
      <Products />
      <Plans />
      <Benefits />
      <Logistics />
      <Payments />
      <Security />
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
        <div className="grid lg:grid-cols-[1.2fr,0.9fr] gap-10 items-center">
          <div className="space-y-6">
            <Badge className="bg-amber-200 text-amber-900 border-amber-300">Revenda Oficial Copa do Mundo 2026™</Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Revenda Panini: autoridade, demanda massiva e operação segura para a Copa 2026™.
            </h1>
            <p className="text-lg text-slate-100 max-w-2xl">
              Conecte-se à marca mais desejada de colecionáveis esportivos. Estruture pedidos com descontos progressivos, frete grátis e atendimento exclusivo com gerente de contas.
            </p>
            <div className="flex flex-wrap gap-3">
              <CTA to="/register" label="Quero revender Panini" primary />
              <CTA to="/login" label="Já sou credenciado" />
            </div>
          </div>
          {/* Bloco de operação removido conforme solicitado */}
        </div>
      </div>
    </section>
  )
}

function SectionNav() {
  const nav = [
    { id: "sobre", label: "Sobre", icon: ShieldCheck },
    { id: "processo", label: "Processo", icon: Sparkles },
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "planos", label: "Planos", icon: Percent },
    { id: "logistica", label: "Logística", icon: Truck },
    { id: "pagamento", label: "Pagamento", icon: Wallet },
    { id: "mercado", label: "Mercado", icon: Globe2 },
    { id: "dicas", label: "Dicas", icon: BarChart3 },
  ]

  return (
    <div className="sticky top-16 z-40 bg-white/90 backdrop-blur border-b">
      <div className="container mx-auto px-4 py-3 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-700 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function AboutPanini() {
  return (
    <Section id="sobre" title="Sobre a Panini" eyebrow="Institucional" gradient>
      <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">
            A Panini é a empresa oficial responsável pela produção e distribuição dos álbuns e figurinhas da Copa do Mundo FIFA 2026™.
            Presença global, tradição e qualidade reconhecida no mercado de colecionáveis esportivos.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Licença oficial FIFA 2026™" },
              { label: "Marca líder em colecionáveis" },
              { label: "Operação global" },
            ].map((item) => (
              <Card key={item.label} className="border-blue-100">
                <CardContent className="p-4 text-sm font-semibold text-blue-900">{item.label}</CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-white to-blue-50 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <Sparkle className="h-6 w-6 text-amber-500" />
            <div>
              <div className="font-semibold text-blue-900">Marca consolidada</div>
              <p className="text-sm text-muted-foreground">Autoridade, desejo do público e alto giro.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoPill label="Distribuição oficial" />
            <InfoPill label="Faturamento com NF" />
            <InfoPill label="Rastreio e controle" />
            <InfoPill label="Suporte dedicado" />
          </div>
          <CTA to="/register" label="Iniciar credenciamento" primary />
        </div>
      </div>
    </Section>
  )
}

function ResaleSteps() {
  return (
    <Section id="processo" title="Como funciona a revenda" eyebrow="Processo" subtitle="Fluxo simples, sem taxa de adesão. O início é pela primeira compra.">
      <div className="grid md:grid-cols-4 gap-4">
        {steps.map((step, idx) => (
          <Card key={step.title} className="h-full border-slate-200 hover:shadow-lg transition-all">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center">{idx + 1}</span>
                <step.icon className="h-5 w-5 text-blue-700" />
              </div>
              <div className="text-lg font-semibold">{step.title}</div>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 pt-4">
        <Badge variant="outline">Sem taxa de adesão</Badge>
        <Badge variant="outline">Ativação após pagamento</Badge>
      </div>
    </Section>
  )
}

function Products() {
  return (
    <Section id="produtos" title="Produtos disponíveis" eyebrow="Catálogo" subtitle="Figurinhas, álbuns e Adrenalyn oficiais da Copa do Mundo FIFA 2026™.">
      <div className="grid md:grid-cols-3 gap-4">
        {products.map((p) => (
          <Card key={p.title} className={cn("h-full hover:shadow-xl transition-all border", p.accent)}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <div className="text-lg font-semibold">{p.title}</div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {p.points.map((pt) => (
                  <li key={pt}>• {pt}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

function Plans() {
  return (
    <Section id="planos" title="Planos e descontos" eyebrow="Volumetria" subtitle="Você escolhe os produtos e o sistema aplica o desconto conforme o valor.">
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.name} className="h-full hover:shadow-xl transition-all border-blue-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <Badge variant="secondary">{plan.badge}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{plan.value}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{plan.desc}</p>
              <p>Desconto progressivo aplicado automaticamente.</p>
              <CTA to="/register" label="Quero este plano" size="sm" />
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

function Benefits() {
  return (
    <Section id="beneficios" title="Descontos, margem e benefícios" eyebrow="Vantagens" subtitle="Quanto maior o pedido, maior o desconto, a margem e os brindes.">
      <div className="grid md:grid-cols-4 gap-4">
        {benefits.map((b) => (
          <Card key={b.title} className="h-full hover:-translate-y-1 hover:shadow-lg transition-all">
            <CardContent className="p-5 space-y-3">
              <b.icon className="h-6 w-6 text-blue-700" />
              <div className="text-lg font-semibold">{b.title}</div>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

function Logistics() {
  return (
    <Section id="logistica" title="Entrega e logística" eyebrow="Operação" subtitle="Frete grátis, centros logísticos e rastreamento.">
      <div className="grid md:grid-cols-3 gap-4">
        {delivery.map((d) => (
          <Card key={d.title} className="h-full">
            <CardContent className="p-5 space-y-3">
              <d.icon className="h-6 w-6 text-blue-700" />
              <div className="text-lg font-semibold">{d.title}</div>
              <p className="text-sm text-muted-foreground">{d.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Prazos podem variar por região e demanda (picos de lançamento). Antecipe pedidos para garantir disponibilidade.
        </CardContent>
      </Card>
    </Section>
  )
}

function Payments() {
  return (
    <Section id="pagamento" title="Formas de pagamento" eyebrow="Checkout">
      <div className="grid md:grid-cols-3 gap-4">
        {payments.map((p) => (
          <Card key={p.title} className="h-full hover:shadow-lg transition-all">
            <CardContent className="p-5 space-y-3">
              <p.icon className="h-6 w-6 text-blue-700" />
              <div className="text-lg font-semibold">{p.title}</div>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

function Security() {
  return (
    <Section id="seguranca" title="Nota fiscal e segurança" eyebrow="Compliance">
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="h-full">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-700" />
              <div className="font-semibold">Faturamento oficial</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Todos os pedidos são faturados com nota fiscal usando os dados do cadastro. Pagamento direto à Panini, sem intermediários.
            </p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-700" />
              <div className="font-semibold">Transparência e rastreio</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Processo transparente, rastreamento completo e suporte comercial para acompanhar cada fase do pedido.
            </p>
          </CardContent>
        </Card>
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
              Estruture uma operação lucrativa com produtos oficiais, frete grátis, faturamento com NF e descontos progressivos, com apoio de um gerente de contas dedicado. A hora de garantir estoque é agora.
            </p>
            <div className="flex flex-wrap gap-3">
              <CTA to="/register" label="Quero revender Panini" primary dark />
              <CTA to="/login" label="Falar com consultor" />
            </div>
          </div>
          <Card className="bg-white/90 backdrop-blur-lg shadow-2xl border-white/60">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Rocket className="h-5 w-5 text-amber-600" />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/10 p-3">
      <div className="text-xs text-slate-100">{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
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

function InfoPill({ label }: { label: string }) {
  return (
    <div className="text-xs font-semibold text-blue-900 bg-blue-100 px-3 py-2 rounded-full w-fit border border-blue-200">
      {label}
    </div>
  )
}
