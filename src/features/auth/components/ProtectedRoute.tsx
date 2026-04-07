import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import type { UserRole } from "@/shared/types/auth"
import { useAuth } from "@/features/auth/context/AuthContext"
import { Spinner } from "@/components/ui/spinner"
import { isAnonymousAuthUser } from "@/features/auth/utils/authUser"

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  allowedUserTypes?: string[]
  deniedUserTypes?: string[]
  children: ReactNode
}

function getDashboardFallback(role?: UserRole | null, userType?: string | null) {
  if (role === "admin") return "/admin/resumo"
  if (role === "seller" && userType === "gerente") return "/gerente/resumo"
  if (role === "seller") return "/seller"
  return "/app/catalogo"
}

export function ProtectedRoute({ allowedRoles, allowedUserTypes, deniedUserTypes, children }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (!user || isAnonymousAuthUser(user)) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!profile) {
    const fallbackLogin = allowedRoles?.some((role) => role === "admin" || role === "seller") ? "/loginadmin" : "/painel"
    return <Navigate to={fallbackLogin} replace />
  }

  const isBackoffice = profile.role === "admin" || profile.role === "seller"

  if (!isBackoffice && profile.status_cadastro === "pending") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg border p-6 text-center space-y-2">
          <h2 className="text-xl font-bold">Cadastro em análise</h2>
          <p className="text-sm text-muted-foreground">Aguarde aprovação para acessar.</p>
        </div>
      </div>
    )
  }

  if (!isBackoffice && (profile.status_cadastro === "rejected" || profile.status_cadastro === "blocked")) {
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

  if (allowedRoles && !allowedRoles.includes(profile.role ?? "client")) {
    return <Navigate to={getDashboardFallback(profile.role, profile.user_type)} replace />
  }

  if (allowedUserTypes && !allowedUserTypes.includes(profile.user_type ?? "")) {
    return <Navigate to={getDashboardFallback(profile.role, profile.user_type)} replace />
  }

  if (deniedUserTypes && deniedUserTypes.includes(profile.user_type ?? "")) {
    return <Navigate to={getDashboardFallback(profile.role, profile.user_type)} replace />
  }

  return <>{children}</>
}
