import { pageMetadata } from "@/lib/site"
import { CrmPageLayout } from "@/components/layout/crm-page-layout"
import { PipelineBoard } from "@/components/pipeline/pipeline-board"
import { getEnquiries } from "@/lib/data/enquiries"

export const metadata = pageMetadata(
  "Pipeline",
  "Track every lead from first enquiry to successful conversion."
)

export default async function PipelinePage() {
  const enquiries = await getEnquiries({ limit: 200 })

  return (
    <CrmPageLayout
      title="Pipeline"
      description="Track every lead from first enquiry to successful conversion."
    >
      <PipelineBoard initialEnquiries={enquiries} />
    </CrmPageLayout>
  )
}
