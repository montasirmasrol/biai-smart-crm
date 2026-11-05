"use client"

import { useEffect } from "react"
import { TriangleAlert } from "lucide-react"

import { EmptyState } from "@/components/layout/empty-state"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <>
      <PageHeader
        title="Something went wrong"
        description="The workspace hit an unexpected error. You can retry without leaving this page."
        actions={
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        }
      />
      <EmptyState
        icon={TriangleAlert}
        title="This view could not be rendered"
        description="CRM data stays on the server. Retry, then check the server logs if the problem continues."
      />
    </>
  )
}
