import { pageMetadata } from "@/lib/site"
import { CrmPageLayout } from "@/components/layout/crm-page-layout"
import { SectionCard } from "@/components/layout/section-card"
import { getCurrentUser } from "@/lib/data/session"

export const metadata = pageMetadata(
  "Settings",
  "Account information and security."
)

export default async function SettingsPage() {
  const user = await getCurrentUser()

  return (
    <CrmPageLayout
      title="Settings"
      description="Your account and CRM information."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Account">
          <p className="text-sm font-medium text-foreground">Email address</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {user?.email || "No email address is available for this account."}
          </p>
        </SectionCard>
        <SectionCard title="Security">
          <p className="text-sm text-muted-foreground">Your account is protected by authentication.</p>
        </SectionCard>
        <SectionCard title="About CRM">
          <p className="text-sm text-muted-foreground">BIAI Smart CRM — Version 1.0.</p>
        </SectionCard>
      </div>
    </CrmPageLayout>
  )
}
