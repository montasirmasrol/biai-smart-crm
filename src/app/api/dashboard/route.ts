import { z } from "zod"

import { jsonError, jsonOk } from "@/lib/http"
import { createClient } from "@/lib/supabase/server"
import type { Enquiry } from "@/types/crm"

const dashboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = dashboardQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? "20",
    })

    if (!parsed.success) {
      return jsonError("Validation failed.", 400, parsed.error.flatten())
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return jsonError("Authentication required.", 401)
    }

    const { data, error } = await supabase.from("enquiries").select("*")

    if (error) {
      throw error
    }

    const enquiries = (data ?? []) as Enquiry[]
    const now = Date.now()

    const total = enquiries.length
    const newCount = enquiries.filter((enquiry) => enquiry.status === "new").length
    const interestedCount = enquiries.filter((enquiry) => enquiry.status === "interested").length
    const paidCount = enquiries.filter((enquiry) => enquiry.status === "paid").length

    const sourceCounts = new Map<string, number>()
    const programmeCounts = new Map<string, number>()

    for (const enquiry of enquiries) {
      if (enquiry.source?.trim()) {
        const source = enquiry.source.trim()
        sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1)
      }

      if (enquiry.interest?.trim()) {
        const interest = enquiry.interest.trim()
        programmeCounts.set(interest, (programmeCounts.get(interest) ?? 0) + 1)
      }
    }

    const recentEnquiries = [...enquiries]
      .sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      )
      .slice(0, parsed.data.limit)

    const overdueFollowUps = enquiries
      .flatMap((enquiry) => {
        if (["paid", "lost"].includes(enquiry.status)) {
          return []
        }

        const referenceAt = enquiry.last_contacted_at ?? enquiry.created_at
        const waitingMs = now - new Date(referenceAt).getTime()

        if (waitingMs < 48 * 60 * 60 * 1000) {
          return []
        }

        return [{ ...enquiry, follow_up_reference_at: referenceAt, waiting_ms: waitingMs }]
      })
      .sort((left, right) => right.waiting_ms - left.waiting_ms)

    const upcomingFollowUps = [...enquiries]
      .filter(
        (enquiry) =>
          enquiry.follow_up_at &&
          new Date(enquiry.follow_up_at).getTime() >= now &&
          !["paid", "lost"].includes(enquiry.status)
      )
      .sort(
        (left, right) =>
          new Date(left.follow_up_at ?? 0).getTime() -
          new Date(right.follow_up_at ?? 0).getTime()
      )

    return jsonOk({
      stats: {
        total,
        new: newCount,
        interested: interestedCount,
        paid: paidCount,
        bySource: [...sourceCounts.entries()]
          .map(([name, value]) => ({ name, value }))
          .sort((left, right) => right.value - left.value),
        byProgramme: [...programmeCounts.entries()]
          .map(([name, value]) => ({ name, value }))
          .sort((left, right) => right.value - left.value),
        recentEnquiries,
        overdueFollowUps,
        upcomingFollowUps,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard data."

    if (message.toLowerCase().includes("unauthorized")) {
      return jsonError("Authentication required.", 401)
    }

    return jsonError("Unable to load dashboard data.", 500, { message })
  }
}
