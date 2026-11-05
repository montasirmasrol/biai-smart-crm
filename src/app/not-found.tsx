import { cookies } from "next/headers"
import Link from "next/link"
import { SearchX } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { EmptyState } from "@/components/layout/empty-state"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

export default async function NotFound() {
  const cookieStore = await cookies()
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <AppShell defaultSidebarOpen={defaultSidebarOpen}>
      <PageHeader
        title="Page not found"
        description="That URL is not part of the CRM workspace."
        actions={
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            Back to Dashboard
          </Button>
        }
      />
      <EmptyState
        icon={SearchX}
        title="No matching route"
        description="Use the sidebar to open Dashboard, Enquiries, Pipeline, AI Assistant, or Settings."
      />
    </AppShell>
  )
}
