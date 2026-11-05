import type { ReactNode } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"

import { SITE_NAME } from "@/lib/site"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-md items-center px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            {SITE_NAME}
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        {children}
      </main>
    </div>
  )
}
