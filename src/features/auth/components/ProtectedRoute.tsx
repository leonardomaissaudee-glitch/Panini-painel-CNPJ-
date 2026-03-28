import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import type { UserRole } from "@/shared/types/auth"
import { useAuth } from "@/features/auth/context/AuthContext"
import { Spinner } from "@/components/ui/spinner"

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  children: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (profile?.status_cadastro === "pending") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg border p-6 text-center space-y-2">
          <h2 className="text-xl font-bold">Cadastro em análise</h2>
          <p className="text-sm text-muted-foreground">Aguarde aprovação para acessar.</p>
        </div>
      </div>
    )
  }

  if (profile?.status_cadastro === "rejected" || profile?.status_cadastro === "blocked") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg border p-6 text-center space-y-2">
          <h2 className="text-xl font-bold">
            {profile?.status_cadastro === "blocked" ? "Cadastro bloqueado" : "Cadastro reprovado"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {profile.motivo_reprovacao || "Entre em contato com o suporte."}
          </p>
        </div>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role ?? "client")) {
    const fallback =
      profile?.role === "admin" ? "/admin" : profile?.role === "seller" ? "/seller" : "/app"
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
