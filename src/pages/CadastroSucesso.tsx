import { Link } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/Footer"

export default function CadastroSucesso() {
  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col">
      <section className="bg-gradient-to-r from-amber-400 via-amber-500 to-red-500 text-slate-900 py-16 px-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/50 px-3 py-1 text-xs font-semibold text-slate-900">
            <CheckCircle2 className="h-4 w-4" /> Cadastro enviado
          </div>
          <h1 className="text-4xl font-bold">Cadastro enviado com sucesso</h1>
          <p className="text-lg text-slate-900/80">
            Nossa equipe comercial dará continuidade ao atendimento após a análise das informações cadastradas. Você poderá acompanhar pelo login com seu CNPJ.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button asChild variant="secondary" className="bg-slate-900 text-white hover:bg-slate-800">
              <Link to="/login">Ir para login</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-900 text-slate-900">
              <Link to="/">Voltar à home</Link>
            </Button>
          </div>
        </div>
      </section>
      <div className="flex-1" />
      <Footer />
    </div>
  )
}
