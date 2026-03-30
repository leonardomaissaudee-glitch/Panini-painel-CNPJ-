import { ClientLiveChat } from "@/features/chat/components/ClientLiveChat"
import { useClientDashboardContext } from "@/features/client/pages/ClientDashboard"

export default function ClientSupportPage() {
  const { resellerProfile } = useClientDashboardContext()

  return <ClientLiveChat resellerProfile={resellerProfile} />
}
