import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const items = [
  { key: "catalogo", label: "Catálogo" },
  { key: "pedidos", label: "Meus pedidos" },
  { key: "perfil", label: "Perfil" },
  { key: "atendimento", label: "Atendimento" },
  { key: "carrinho", label: "Carrinho" },
]

export function ClientSidebar({
  active,
  onChange,
}: {
  active: string
  onChange: (key: string) => void
}) {
  return (
    <aside className="w-full md:w-64 space-y-2">
      {items.map((item) => (
        <Button
          key={item.key}
          variant={active === item.key ? "default" : "outline"}
          className={cn("w-full justify-start")}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </Button>
      ))}
    </aside>
  )
}
