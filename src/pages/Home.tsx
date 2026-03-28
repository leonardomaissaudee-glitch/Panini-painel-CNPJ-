import { ProductCard } from "@/components/ProductCard"
import { Footer } from "@/components/Footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { products } from "@/data/products"
import { BadgeCheck, Building2, Lock, Sparkles, ShieldCheck, Package, BarChart, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const faqs = [
  {
    value: "item-1",
    question: "Como funciona o cadastro e aprovação?",
    answer: "Você se cadastra com CPF ou CNPJ, nossa equipe analisa e libera o acesso ao painel apropriado.",
  },
  {
    value: "item-2",
    question: "Quais formas de pagamento são aceitas?",
    answer: "PIX e Cartão, processados via gateway seguro. Pedidos ficam registrados no painel e no Supabase.",
  },
  {
    value: "item-3",
    question: "Consigo rastrear meu pedido?",
    answer: "Sim, status, NF e código de rastreio ficam disponíveis no painel do cliente.",
  },
  {
    value: "item-4",
    question: "Existe suporte dedicado?",
    answer: "Oferecemos chat interno e canal direto via WhatsApp.",
  },
]

const heroHighlights = [
  "Plataforma pronta para vendas corporativas",
  "Checkout seguro e integração Supabase",
  "Painéis para admin, vendedor e cliente",
]

const benefits = [
  { icon: ShieldCheck, title: "Segurança e confiança", desc: "Fluxo de pagamentos e dados protegido." },
  { icon: BarChart, title: "Gestão completa", desc: "Pedidos, aprovação de contas e catálogo centralizado." },
  { icon: Users, title: "Perfis e papéis", desc: "Admin, vendedor e cliente com acessos dedicados." },
  { icon: Package, title: "Logística clara", desc: "Status, NF e rastreio em um só lugar." },
]

const steps = [
  { icon: BadgeCheck, title: "Cadastre-se", desc: "Envie seus dados (CPF/CNPJ) para análise." },
  { icon: Building2, title: "Seja aprovado", desc: "Perfil validado e papel atribuído (admin, seller, client)." },
  { icon: Sparkles, title: "Venda e acompanhe", desc: "Use o painel para pedidos, catálogo e atendimento." },
]

const featuredProducts = products.slice(0, 6)

export default function Home() {

  return (
    <div className="min-h-screen bg-white text-foreground">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6 grid gap-6 lg:grid-cols-2 items-center">
          <div className="space-y-4">
            <Badge variant="outline" className="text-xs">Plataforma corporativa</Badge>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Gestão completa de catálogo, pedidos e atendimento em um ambiente seguro.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Centralize produtos, acompanhe vendas, aprove cadastros e ofereça uma experiência premium para admin, vendedores e clientes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg">Começar agora</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">Já tenho conta</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {heroHighlights.map((item) => (
                <div key={item} className="text-sm text-muted-foreground flex gap-2 items-start">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full">
            <div className="rounded-2xl border bg-white shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Status da operação</div>
                  <div className="text-2xl font-bold">Online e seguro</div>
                </div>
                <Lock className="h-10 w-10 text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Stat label="Pedidos hoje" value="128" />
                <Stat label="Tempo médio" value="00:45" />
                <Stat label="SLA atendimento" value="99.9%" />
              </div>
              <div className="rounded-xl border bg-muted/40 p-4">
                <div className="text-sm font-semibold mb-2">Checkout seguro</div>
                <div className="text-sm text-muted-foreground">
                  Integração Supabase + gateway de pagamento. Registro completo de pedidos, NF e rastreio.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-12 space-y-10">
        <SectionTitle title="Benefícios para seu time" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <Card key={b.title} className="h-full">
              <CardContent className="p-5 space-y-3">
                <b.icon className="h-6 w-6 text-primary" />
                <div className="text-lg font-semibold">{b.title}</div>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-12 space-y-6">
          <SectionTitle title="Como funciona" subtitle="Fluxo simples, do cadastro ao rastreio" />
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.title} className="h-full">
                <CardContent className="p-5 space-y-3">
                  <s.icon className="h-6 w-6 text-primary" />
                  <div className="text-lg font-semibold">{s.title}</div>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 space-y-6">
        <SectionTitle title="Catálogo em destaque" subtitle="Produtos prontos para vender" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="flex justify-center pt-4">
          <Link to="/cart">
            <Button variant="outline">Ver carrinho</Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 space-y-6">
        <SectionTitle title="Dúvidas frequentes" />
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((item) => (
            <AccordionItem key={item.value} value={item.value} className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 space-y-2">
                <p>{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-2xl font-bold">Pronto para uma experiência profissional?</div>
            <p className="text-sm opacity-90">Cadastre-se e aguarde nossa aprovação para acessar o painel.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/register">
              <Button size="lg" variant="secondary">Cadastrar</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-primary">Plataforma corporativa</div>
      <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}
