import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "@/features/auth/context/AuthContext"
import { Spinner } from "@/components/ui/spinner"

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (!user) {
    return <>{children}</>
  }

  const destination =
    profile?.role === "admin" ? "/admin" : profile?.role === "seller" ? "/seller" : profile?.role === "client" ? "/app/catalogo" : "/painel"

  return <Navigate to={destination} replace />
}
