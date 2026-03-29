import { ClientSupport } from "@/features/client/components/ClientSupport"
import { useClientDashboardContext } from "@/features/client/pages/ClientDashboard"

export default function ClientSupportPage() {
  const { resellerProfile } = useClientDashboardContext()

  return <ClientSupport profile={resellerProfile} />
}
