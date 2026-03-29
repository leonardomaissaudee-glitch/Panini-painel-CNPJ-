import { formatPhone } from "@/lib/masks"
import { ClientInfo } from "@/features/client/components/ClientInfo"
import { useClientDashboardContext } from "@/features/client/pages/ClientDashboard"

export default function ClientInfoPage() {
  const { resellerProfile } = useClientDashboardContext()
  const assignedManagerPhone = resellerProfile?.account_manager_whatsapp
    ? formatPhone(resellerProfile.account_manager_whatsapp.replace(/\D/g, "").slice(-11))
    : null

  return <ClientInfo managerName={resellerProfile?.account_manager_name ?? null} managerPhone={assignedManagerPhone} />
}
