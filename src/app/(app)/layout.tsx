import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/layout/app-shell"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  const cookieStore = await cookies()
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false"

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (process.env.NODE_ENV === "development") {
    console.info("[auth] dashboard session check", {
      hasUser: Boolean(user),
      error: error
        ? {
            name: error.name,
            message: error.message,
            status: error.status,
          }
        : null,
    })
  }

  if (error || !user) {
    redirect("/login")
  }

  return (
    <AppShell defaultSidebarOpen={defaultSidebarOpen}>{children}</AppShell>
  )
}
