import { ClientProfile } from "@/features/client/components/ClientProfile"
import { useClientDashboardContext } from "@/features/client/pages/ClientDashboard"

export default function ClientProfilePage() {
  const { resellerProfile } = useClientDashboardContext()

  return <ClientProfile profile={resellerProfile} />
}
