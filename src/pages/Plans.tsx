import { Footer } from "@/components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Percent, Gem, Truck, Shield, Wallet, FileText, CreditCard } from "lucide-react"

const plans = [
  { name: "Classic", value: "A partir de R$ 800", desc: "Entrada acessível para testar o mercado.", badge: "Novo" },
  { name: "Standard", value: "A partir de R$ 2.500", desc: "Descontos melhores e mais benefícios.", badge: "Equilíbrio" },
  { name: "Premium", value: "A partir de R$ 5.000", desc: "Margem alta, brindes e prioridade logística.", badge: "Melhor margem" },
]

const benefits = [
  { icon: Percent, title: "Descontos progressivos", desc: "Aplicados automaticamente conforme o volume." },
  { icon: Gem, title: "Brindes e materiais", desc: "Apoio de marketing varia conforme o plano." },
  { icon: Truck, title: "Frete grátis", desc: "Brasil inteiro via centros logísticos." },
  { icon: Shield, title: "Gerente de contas", desc: "Atendimento exclusivo e acompanhamento de pedidos." },
]

const payments = [
  { icon: Wallet, title: "PIX", desc: "Desconto adicional no pagamento imediato." },
  { icon: FileText, title: "Boleto", desc: "Primeiro pedido à vista para cadastro." },
  { icon: CreditCard, title: "Cartão", desc: "Parcelamento disponível (sem desconto)." },
]

export default function PlansPage() {
  return (
    <div className="bg-white text-foreground min-h-screen">
      <section className="bg-gradient-to-r from-amber-400 via-amber-500 to-red-500 text-slate-900 py-16 px-4">
        <div className="container mx-auto space-y-4">
          <Badge variant="outline" className="border-slate-900 text-slate-900 bg-white/40">Planos e benefícios</Badge>
          <h1 className="text-4xl font-bold">Planos flexíveis e benefícios progressivos</h1>
          <p className="text-lg max-w-3xl text-slate-900/80">
            Escolha os produtos, monte o pedido e receba descontos automáticos. Frete grátis, NF em todos os pedidos e gerente de contas exclusivo.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 space-y-8">
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
              </CardContent>
            </Card>
          ))}
        </div>

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

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Formas de pagamento</h2>
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
        </div>
      </section>
      <Footer />
    </div>
  )
}
