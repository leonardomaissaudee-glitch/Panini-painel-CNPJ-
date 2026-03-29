import { useNavigate } from "react-router-dom"
import { ClientCart } from "@/features/client/components/ClientCart"
import { useClientDashboardContext } from "@/features/client/pages/ClientDashboard"

export default function ClientCartPage() {
  const navigate = useNavigate()
  const { resellerProfile } = useClientDashboardContext()

  return (
    <ClientCart
      profile={resellerProfile}
      onOrderCreated={() => {
        navigate("/app/pedidos")
      }}
    />
  )
}
