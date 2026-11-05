type PublicSupabaseEnv = {
  url: string
  publishableKey: string
}

export function getSupabasePublicEnv(): PublicSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !publishableKey) {
    return null
  }

  return { url, publishableKey }
}

export function requireSupabasePublicEnv(): PublicSupabaseEnv {
  const env = getSupabasePublicEnv()

  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local."
    )
  }

  return env
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}
