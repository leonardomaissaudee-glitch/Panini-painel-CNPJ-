import { Link, useLocation } from "react-router-dom"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/context/AuthContext"
import { LogOut } from "lucide-react"

type NavItem = { label: string; to: string }

interface AppShellProps {
  title: string
  nav?: NavItem[]
  actions?: ReactNode
  children: ReactNode
  contentClassName?: string
}

export function AppShell({ title, nav = [], actions, children, contentClassName }: AppShellProps) {
  const location = useLocation()
  const { signOut, user, profile } = useAuth()
  const hasNav = nav.length > 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="https://pub-c0bfb119504542e0b2e6ebc8f6b3b1df.r2.dev/user-uploads/user_38XNRHxmsUPTGvoK09TMInYrBxw/09cf08fa-d355-4e36-811b-7f54f9f72f94.png"
                alt="Logo"
                className="h-10 w-auto"
              />
              <span className="text-base font-semibold leading-tight">Painel</span>
            </Link>
            <div className="text-sm text-muted-foreground">/ {title}</div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {actions}
            {user && (
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className={cn("container mx-auto px-4 py-6", hasNav && "grid gap-6 md:grid-cols-[240px_1fr]")}>
        {hasNav && (
          <aside className="space-y-3">
            <nav className="rounded-lg border bg-white shadow-sm divide-y">
              {nav.map((item) => {
                const active = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "block px-4 py-3 text-sm font-medium transition-colors",
                      active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="rounded-lg border bg-white p-4 shadow-sm space-y-1">
              <div className="text-sm font-semibold">Sessão</div>
              <div className="text-sm text-muted-foreground">
                {profile?.full_name || user?.email}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                Role: {profile?.role || "-"}
              </div>
              <div className="text-xs text-muted-foreground">
                Status: {profile?.status_cadastro || "-"}
              </div>
            </div>
          </aside>
        )}

        <main className={cn("space-y-4", contentClassName)}>{children}</main>
      </div>
    </div>
  )
}
