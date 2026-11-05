import type { ReactNode } from "react"

import { cn } from "cn"

import { PageHeader } from "@/components/layout/page-header"

type CrmPageLayoutProps = {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
  aside?: ReactNode
}

export function CrmPageLayout({
  title,
  description,
  actions,
  children,
  aside,
}: CrmPageLayoutProps) {
  return (
    <>
      <PageHeader title={title} description={description} actions={actions} />
      <div
        className={cn(
          "grid gap-4",
          aside ? "xl:grid-cols-[minmax(0,1fr)_20rem]" : "grid-cols-1"
        )}
      >
        <div className="space-y-4">{children}</div>
        {aside ? <aside className="space-y-4">{aside}</aside> : null}
      </div>
    </>
  )
}