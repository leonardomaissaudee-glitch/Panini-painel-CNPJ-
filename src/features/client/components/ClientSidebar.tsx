import { LayoutGrid, CircleHelp, PackageSearch, ShoppingBag, UserRound, MessageCircleMore } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { key: "catalogo", label: "Catálogo", icon: LayoutGrid },
  { key: "pedidos", label: "Meus pedidos", icon: ShoppingBag },
  { key: "informacoes", label: "Informações", icon: CircleHelp },
  { key: "perfil", label: "Perfil", icon: UserRound },
  { key: "gerente", label: "Falar com gerente", icon: MessageCircleMore },
  { key: "carrinho", label: "Carrinho", icon: PackageSearch },
]

export function ClientSidebar({
  active,
  onChange,
}: {
  active: string
  onChange: (key: string) => void
}) {
  return (
    <aside className="space-y-4">
      <div className="-mx-1 overflow-x-auto pb-2 xl:mx-0 xl:overflow-visible xl:pb-0">
        <div className="flex min-w-max gap-3 px-1 xl:grid xl:min-w-0 xl:grid-cols-1 xl:px-0">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                "inline-flex min-h-[54px] min-w-[152px] items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition xl:w-full xl:min-w-0",
                "justify-start",
                active === item.key
                  ? "border-blue-900 bg-blue-950 text-white shadow-lg"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
        </div>
      </div>
    </aside>
  )
}
