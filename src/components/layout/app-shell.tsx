import type { ReactNode } from "react"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageContainer } from "@/components/layout/page-container"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type AppShellProps = {
  children: ReactNode
  defaultSidebarOpen?: boolean
}

export function AppShell({
  children,
  defaultSidebarOpen = true,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar />
      <SidebarInset className="bg-muted/30">
        <AppHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <PageContainer>{children}</PageContainer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
