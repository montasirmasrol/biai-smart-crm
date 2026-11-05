import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Settings,
  KanbanSquare,
  Inbox,
} from "lucide-react"

import type { AppRoute } from "@/types/crm"

export type NavItem = {
  title: string
  href: AppRoute
  icon: LucideIcon
  description: string
}

export const APP_NAV: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Monitor your enquiries and track your business performance.",
  },
  {
    title: "Enquiries",
    href: "/enquiries",
    icon: Inbox,
    description: "Manage and organize all your customer enquiries in one place.",
  },
  {
    title: "Pipeline",
    href: "/pipeline",
    icon: KanbanSquare,
    description: "Track every lead from first enquiry to successful conversion.",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Account information and security.",
  },
]

export function getNavItem(pathname: string): NavItem | undefined {
  return APP_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
}
