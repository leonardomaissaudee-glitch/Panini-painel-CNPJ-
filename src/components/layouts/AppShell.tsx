import { Link, useLocation } from "react-router-dom"
import { ReactNode, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/context/AuthContext"
import { LogOut, Menu, X } from "lucide-react"

type NavItem = { label: string; to: string; badge?: string | number | null }

interface AppShellProps {
  title: string
  nav?: NavItem[]
  actions?: ReactNode
  children: ReactNode
  contentClassName?: string
}

function isActivePath(pathname: string, target: string) {
  return pathname === target || pathname.startsWith(`${target}/`)
}

function ShellNav({ nav, pathname, onNavigate }: { nav: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="grid gap-3">
        {nav.map((item) => {
          const active = isActivePath(pathname, item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "inline-flex min-h-[54px] w-full min-w-0 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                active
                  ? "border-blue-900 bg-blue-950 text-white shadow-lg"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900"
              )}
            >
              <span className="truncate">{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export function AppShell({ title, nav = [], actions, children, contentClassName }: AppShellProps) {
  const location = useLocation()
  const { signOut, user, profile } = useAuth()
  const hasNav = nav.length > 0
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dashboardPath =
    profile?.role === "admin"
      ? "/admin/pedidos"
      : profile?.role === "seller"
        ? profile?.user_type === "gerente"
          ? "/gerente/resumo"
          : "/seller"
        : profile?.role === "client"
          ? "/app/catalogo"
          : "/painel"

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {hasNav && (
                <Button variant="outline" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <Link to={dashboardPath} className="flex items-center gap-2">
                <img
                  src="https://pub-c0bfb119504542e0b2e6ebc8f6b3b1df.r2.dev/user-uploads/user_38XNRHxmsUPTGvoK09TMInYrBxw/09cf08fa-d355-4e36-811b-7f54f9f72f94.png"
                  alt="Logo"
                  className="h-8 w-auto sm:h-10"
                />
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              {actions}
              {user && (
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              )}
            </div>
          </div>
          <div className="mt-3 text-center text-xs font-medium tracking-[0.16em] text-muted-foreground sm:text-sm">{title}</div>
        </div>
      </header>

      {hasNav && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu" />
          <div className="absolute left-0 top-0 h-full w-[84vw] max-w-[320px] overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Menu</div>
              <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ShellNav nav={nav} pathname={location.pathname} onNavigate={() => setMobileMenuOpen(false)} />
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold">Sessão</div>
              <div className="mt-1 text-sm text-muted-foreground">{profile?.full_name || user?.email}</div>
              <div className="mt-1 text-xs text-muted-foreground capitalize">Acesso: {profile?.user_type || profile?.role || "-"}</div>
              <div className="text-xs text-muted-foreground">Status: {profile?.status_cadastro || "-"}</div>
            </div>
          </div>
        </div>
      )}

      <div className={cn("container mx-auto px-4 py-6", hasNav && "grid gap-6 md:grid-cols-[280px_1fr]") }>
        {hasNav && (
          <aside className="hidden self-start md:sticky md:top-24 md:block">
            <div className="space-y-4">
              <ShellNav nav={nav} pathname={location.pathname} />
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
                <div className="text-sm font-semibold">Sessão</div>
                <div className="text-sm text-muted-foreground">{profile?.full_name || user?.email}</div>
                <div className="text-xs text-muted-foreground capitalize">Acesso: {profile?.user_type || profile?.role || "-"}</div>
                <div className="text-xs text-muted-foreground">Status: {profile?.status_cadastro || "-"}</div>
              </div>
            </div>
          </aside>
        )}

        <main className={cn("space-y-4 min-w-0", contentClassName)}>{children}</main>
      </div>
    </div>
  )
}
