import { LayoutGrid, PackageSearch, ShoppingBag, UserRound, MessageCircleMore } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { key: "catalogo", label: "Catálogo", icon: LayoutGrid },
  { key: "pedidos", label: "Meus pedidos", icon: ShoppingBag },
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
      <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-1 md:overflow-visible md:pb-0">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                "inline-flex min-w-max items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                "md:w-full md:justify-start",
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
    </aside>
  )
}
