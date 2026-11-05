import "server-only"

import { cache } from "react"

import { getSupabasePublicEnv } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

/**
 * Shared session helper for the data access layer.
 * Returns null when Supabase env is missing so the shell can still render
 * before credentials are added.
 */
export const getCurrentUser = cache(async () => {
  if (!getSupabasePublicEnv()) {
    return null
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
})
