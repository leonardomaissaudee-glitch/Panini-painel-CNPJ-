import { Footer } from "@/components/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkle } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="bg-white text-foreground min-h-screen">
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white py-16 px-4">
        <div className="container mx-auto space-y-4">
          <Badge className="bg-amber-200 text-amber-900 border-amber-300">Institucional</Badge>
          <h1 className="text-4xl font-bold">Sobre a Panini</h1>
          <p className="text-lg max-w-3xl text-slate-100">
            Empresa oficial dos álbuns e figurinhas da Copa do Mundo FIFA 2026™. Presença global, tradição e qualidade
            reconhecida em colecionáveis esportivos.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 space-y-8">
        <div className="grid md:grid-cols-3 gap-4">
          {["Licença oficial FIFA 2026™", "Marca líder em colecionáveis", "Operação global"].map((item) => (
            <Card key={item} className="border-blue-100">
              <CardContent className="p-5 text-blue-900 font-semibold">{item}</CardContent>
            </Card>
          ))}
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-white to-blue-50 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <Sparkle className="h-6 w-6 text-amber-500" />
            <div>
              <div className="font-semibold text-blue-900">Marca consolidada</div>
              <p className="text-sm text-muted-foreground">Autoridade, desejo do público e alto giro.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {["Distribuição oficial", "Faturamento com NF", "Rastreio e controle", "Gerente de contas dedicado"].map(
              (pill) => (
                <div
                  key={pill}
                  className="text-xs font-semibold text-blue-900 bg-blue-100 px-3 py-2 rounded-full w-fit border border-blue-200"
                >
                  {pill}
                </div>
              )
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
