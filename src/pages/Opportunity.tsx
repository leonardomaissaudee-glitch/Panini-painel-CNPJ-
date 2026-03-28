import { Footer } from "@/components/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe2, BarChart3, Crown, Rocket, Sparkles } from "lucide-react"

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

export default function OpportunityPage() {
  return (
    <div className="bg-white text-foreground min-h-screen">
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white py-16 px-4">
        <div className="container mx-auto space-y-4">
          <Badge className="bg-amber-200 text-amber-900 border-amber-300">Mercado</Badge>
          <h1 className="text-4xl font-bold">Mercado e oportunidade</h1>
          <p className="text-lg max-w-3xl text-slate-100">
            Evento global, demanda massiva e alto giro de produtos oficiais. Garanta suporte comercial com gerente de contas exclusivo.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 space-y-8">
        <div className="grid md:grid-cols-3 gap-4">
          {market.map((m, i) => (
            <Card
              key={m.title}
              className={`h-full hover:-translate-y-1 hover:shadow-xl transition-all ${
                i === 0 ? "border-amber-300 bg-amber-50" : i === 1 ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"
              }`}
            >
              <CardContent className="p-5 space-y-3">
                <m.icon className="h-6 w-6 text-blue-700" />
                <div className="text-lg font-semibold">{m.title}</div>
                <p className="text-sm text-slate-700">{m.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">Dicas para revenda</h2>
          </div>
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
        </div>

        <div className="pt-6">
          <Badge variant="outline" className="border-slate-900 text-slate-900 bg-white">Acompanhamento premium</Badge>
          <p className="text-sm text-muted-foreground mt-2">Cada revendedor conta com gerente de contas para ativação e reorders.</p>
        </div>
      </section>
      <Footer />
    </div>
  )
}
