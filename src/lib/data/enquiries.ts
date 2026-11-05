import "server-only"

import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import type { Enquiry, EnquiryStatus } from "@/types/crm"

type GetEnquiriesOptions = {
  search?: string
  status?: EnquiryStatus | "all"
  source?: string
  limit?: number
}

async function requireAuthenticatedClient() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized: sign in to access enquiries.")
  }

  return supabase
}

export const getEnquiries = cache(
  async ({
    search,
    status,
    source,
    limit = 50,
  }: GetEnquiriesOptions = {}): Promise<Enquiry[]> => {
    const supabase = await requireAuthenticatedClient()

    let query = supabase.from("enquiries").select("*").order("created_at", {
      ascending: false,
    })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (source && source.trim()) {
      query = query.ilike("source", `%${source.trim()}%`)
    }

    if (search && search.trim()) {
      const term = search.trim()
      query = query.or(
        `name.ilike.%${term}%,interest.ilike.%${term}%,original_message.ilike.%${term}%`
      )
    }

    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      throw error
    }

    return (data ?? []) as Enquiry[]
  }
)

export async function createEnquiry(
  input: Omit<Enquiry, "id" | "user_id" | "created_at" | "updated_at">
) {
  const supabase = await requireAuthenticatedClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized: sign in to create enquiries.")
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      ...input,
      user_id: user.id,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Enquiry
}

export async function updateEnquiry(
  id: string,
  updates: Partial<Omit<Enquiry, "id" | "user_id" | "created_at" | "updated_at">>
) {
  const supabase = await requireAuthenticatedClient()
  const now = new Date().toISOString()
  let firstContactAt: string | null = null

  if (updates.status === "contacted") {
    const { data: current, error: currentError } = await supabase
      .from("enquiries")
      .select("status")
      .eq("id", id)
      .single()

    if (currentError) {
      throw currentError
    }

    if (current.status !== "contacted") {
      firstContactAt = now
    }
  }

  const { data, error } = await supabase
    .from("enquiries")
    .update({
      ...updates,
      ...(firstContactAt ? { last_contacted_at: firstContactAt } : {}),
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Enquiry
}

export async function archiveEnquiry(id: string) {
  const supabase = await requireAuthenticatedClient()

  const { data, error } = await supabase
    .from("enquiries")
    .update({
      status: "lost",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Enquiry
}
