import { Footer } from "@/components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BadgeCheck, Building2, Sparkles, ShieldCheck, Percent, Gem, Truck, Shield } from "lucide-react"

const steps = [
  { icon: BadgeCheck, title: "Cadastre-se", desc: "Envie seus dados (CNPJ) para análise." },
  { icon: Building2, title: "Escolha produtos", desc: "Selecione figurinhas, álbuns e Adrenalyn." },
  { icon: Sparkles, title: "Monte o pedido", desc: "Defina volumes e finalize com o consultor." },
  { icon: ShieldCheck, title: "Ativação", desc: "Pagamento aprovado, conta liberada e pedido faturado." },
]

const plans = [
  { name: "Classic", value: "A partir de R$ 800", desc: "Entrada acessível para testar o mercado.", badge: "Novo" },
  { name: "Standard", value: "A partir de R$ 2.500", desc: "Descontos melhores e mais benefícios.", badge: "Equilíbrio" },
  { name: "Premium", value: "A partir de R$ 5.000", desc: "Margem alta, brindes e prioridade logística.", badge: "Melhor margem" },
]

const perks = [
  { icon: Percent, title: "Descontos progressivos", desc: "Aplicados automaticamente conforme o volume." },
  { icon: Gem, title: "Brindes e materiais", desc: "Apoio de marketing varia conforme o plano." },
  { icon: Truck, title: "Frete grátis", desc: "Brasil inteiro via centros logísticos." },
  { icon: Shield, title: "Gerente de contas", desc: "Atendimento exclusivo e acompanhamento de pedidos." },
]

export default function ProcessPage() {
  return (
    <div className="bg-white text-foreground min-h-screen">
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white py-16 px-4">
        <div className="container mx-auto space-y-4">
          <Badge className="bg-amber-200 text-amber-900 border-amber-300">Processo</Badge>
          <h1 className="text-4xl font-bold">Como funciona a revenda</h1>
          <p className="text-lg max-w-3xl text-slate-100">Fluxo simples, sem taxa de adesão. O início é pela primeira compra.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 space-y-6">
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

        <div className="space-y-6 pt-8">
          <h2 className="text-2xl font-bold">Planos e benefícios</h2>
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
            {perks.map((p) => (
              <Card key={p.title} className="h-full hover:-translate-y-1 hover:shadow-lg transition-all">
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
