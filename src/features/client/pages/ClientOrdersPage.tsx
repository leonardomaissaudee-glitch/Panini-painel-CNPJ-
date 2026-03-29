import { ClientOrders } from "@/features/client/components/ClientOrders"
import { useClientDashboardContext } from "@/features/client/pages/ClientDashboard"

export default function ClientOrdersPage() {
  const { userEmail } = useClientDashboardContext()

  return <ClientOrders email={userEmail} />
}
