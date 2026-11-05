"use client"

import { usePathname } from "next/navigation"

import { SITE_NAME } from "@/lib/site"
import { getNavItem } from "@/lib/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppHeader() {
  const pathname = usePathname()
  const current = getNavItem(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-background/95 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {current?.title ?? SITE_NAME}
        </p>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          {current?.description ?? "Enquiry, pipeline, and AI-assisted follow-up."}
        </p>
      </div>
      <p className="hidden text-[11px] text-muted-foreground lg:block">
        Ctrl/⌘ + B to collapse
      </p>
    </header>
  )
}
