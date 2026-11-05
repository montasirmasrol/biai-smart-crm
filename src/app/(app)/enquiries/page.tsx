import { getEnquiries } from "@/lib/data/enquiries"
import { pageMetadata } from "@/lib/site"
import { CrmPageLayout } from "@/components/layout/crm-page-layout"
import { EnquiriesWorkspace } from "@/components/enquiries/enquiries-workspace"
import type { EnquiryStatus } from "@/types/crm"

export const metadata = pageMetadata(
  "Enquiries",
  "Manage and organize all your customer enquiries in one place."
)

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string
    status?: string
    source?: string
    enquiryId?: string
  }>
}) {
  const params = (await searchParams) ?? {}
  const initialEnquiries = await getEnquiries({
    search: params.search,
    status:
      params.status && params.status !== "all"
        ? (params.status as EnquiryStatus)
        : "all",
    source: params.source,
    limit: 100,
  })

  return (
    <CrmPageLayout
      title="Enquiries"
      description="Manage and organize all your customer enquiries in one place."
    >
      <EnquiriesWorkspace
        initialEnquiries={initialEnquiries}
        initialSelectedEnquiryId={params.enquiryId}
      />
    </CrmPageLayout>
  )
}
