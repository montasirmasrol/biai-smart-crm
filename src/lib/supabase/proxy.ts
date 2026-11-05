import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabasePublicEnv } from "@/lib/env"
import type { Database } from "@/types/database"

export async function updateSession(request: NextRequest) {
  const env = getSupabasePublicEnv()

  if (!env) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth] proxy skipped: Supabase public environment is missing")
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        supabaseResponse = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value)
        })
      },
    },
  })

  const { data, error } = await supabase.auth.getClaims()

  if (process.env.NODE_ENV === "development") {
    console.info("[auth] proxy session check", {
      pathname: request.nextUrl.pathname,
      cookieNames: request.cookies.getAll().map(({ name }) => name),
      hasClaims: Boolean(data?.claims),
      error: error
        ? {
            name: error.name,
            message: error.message,
            status: error.status,
          }
        : null,
    })
  }

  return supabaseResponse
}
