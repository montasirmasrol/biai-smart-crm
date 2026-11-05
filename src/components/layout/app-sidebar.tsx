"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Loader2, LogOut, Sparkles } from "lucide-react"

import { SITE_NAME } from "@/lib/site"
import { APP_NAV } from "@/lib/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpenMobile } = useSidebar()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  const handleLogout = async () => {
    setLogoutError(null)
    setIsLoggingOut(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[auth] signOut failed", {
            name: error.name,
            message: error.message,
            status: error.status,
          })
        }
        throw error
      }

      if (process.env.NODE_ENV === "development") {
        console.info("[auth] signOut succeeded")
      }

      router.replace("/login")
      router.refresh()
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[auth] logout flow failed", {
          name: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : "Unknown logout error",
          status:
            error instanceof Error && "status" in error ? error.status : undefined,
        })
      }
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Unable to sign out. Please try again."
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              tooltip={SITE_NAME}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-heading text-sm font-semibold">
                  {SITE_NAME}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Sales workspace
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {APP_NAV.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {logoutError ? (
          <p
            role="alert"
            className="px-2 pb-2 text-xs leading-relaxed text-destructive group-data-[collapsible=icon]:hidden"
          >
            {logoutError}
          </p>
        ) : null}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              tooltip="Log out"
              className="text-sidebar-foreground hover:text-destructive"
            >
              {isLoggingOut ? (
                <Loader2 className="animate-spin" />
              ) : (
                <LogOut />
              )}
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
