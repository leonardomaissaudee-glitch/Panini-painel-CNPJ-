import { LayoutGrid, PackageCheck, UserRound } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ClientInfo({ managerName }: { managerName: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Informações operacionais</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoCard
          icon={LayoutGrid}
          title="Canal ativo"
          description="Catálogo completo liberado para pedidos corporativos e reabastecimento de estoque."
        />
        <InfoCard
          icon={PackageCheck}
          title="Pedidos monitorados"
          description="Acompanhamento de aprovação, pagamento, expedição, nota fiscal e localizador no mesmo painel."
        />
        <InfoCard
          icon={UserRound}
          title="Gerente dedicado"
          description={`${managerName} acompanha o atendimento comercial e a continuidade dos seus pedidos.`}
        />
      </CardContent>
    </Card>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof LayoutGrid
  title: string
  description: string
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-blue-700" />
      <div className="mt-4 text-lg font-semibold text-slate-950">{title}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}
