import { Bot } from "lucide-react"

import { pageMetadata } from "@/lib/site"
import { CrmPageLayout } from "@/components/layout/crm-page-layout"
import { EmptyState } from "@/components/layout/empty-state"

export const metadata = pageMetadata(
  "AI Assistant",
  "AI tools to support your customer conversations."
)

export default function AssistantPage() {
  return (
    <CrmPageLayout
      title="AI Assistant"
      description="AI tools to support your customer conversations."
    >
      <EmptyState
        icon={Bot}
        title="AI Assistant coming soon"
        description="This workspace is not available yet. You can use AI extraction and reply suggestions from Enquiries."
      />
    </CrmPageLayout>
  )
}
