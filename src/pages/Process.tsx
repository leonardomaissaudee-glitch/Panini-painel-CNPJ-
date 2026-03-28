import { Footer } from "@/components/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BadgeCheck, Building2, Sparkles, ShieldCheck } from "lucide-react"

const steps = [
  { icon: BadgeCheck, title: "Cadastre-se", desc: "Envie seus dados (CNPJ) para análise." },
  { icon: Building2, title: "Escolha produtos", desc: "Selecione figurinhas, álbuns e Adrenalyn." },
  { icon: Sparkles, title: "Monte o pedido", desc: "Defina volumes e finalize com o consultor." },
  { icon: ShieldCheck, title: "Ativação", desc: "Pagamento aprovado, conta liberada e pedido faturado." },
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
      </section>
      <Footer />
    </div>
  )
}
