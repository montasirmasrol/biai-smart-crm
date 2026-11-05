import { pageMetadata } from "@/lib/site"
import { CrmPageLayout } from "@/components/layout/crm-page-layout"
import { DashboardBoard } from "@/components/dashboard/dashboard-board"

export const metadata = pageMetadata(
  "Dashboard",
  "Monitor your enquiries and track your business performance."
)

export default function DashboardPage() {
  return (
    <CrmPageLayout
      title="Dashboard"
      description="Monitor your enquiries and track your business performance."
    >
      <DashboardBoard />
    </CrmPageLayout>
  )
}
