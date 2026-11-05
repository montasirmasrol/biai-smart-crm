import { z } from "zod"
import { zodTextFormat } from "openai/helpers/zod"

import { getOpenAI } from "@/lib/openai/client"
import { createClient } from "@/lib/supabase/server"
import { jsonError, jsonOk } from "@/lib/http"
import type { EnquiryStatus } from "@/types/crm"

const PAGE_SIZE = 500
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const weeklyNarrativeSchema = z.object({
  observations: z.array(z.string().trim().min(1).max(240)).min(1).max(4),
  suggestedActions: z.array(z.string().trim().min(1).max(240)).min(1).max(4),
})

type InterestCategory = "Bootcamp" | "Fellowship" | "Corporate Training"
type StatusCategory = "New" | "Contacted" | "Interested" | "Paid" | "Lost"

type WeeklyCounts = {
  total: number
  byInterest: Record<InterestCategory, number>
  byStatus: Record<StatusCategory, number>
}

function classifyInterest(value: string | null): InterestCategory | null {
  const normalized = value?.trim().toLowerCase() ?? ""

  if (normalized.includes("bootcamp")) return "Bootcamp"
  if (normalized.includes("fellowship")) return "Fellowship"
  if (normalized.includes("corporate") || normalized.includes("training")) {
    return "Corporate Training"
  }

  return null
}

function classifyStatus(value: EnquiryStatus): StatusCategory {
  switch (value) {
    case "new":
      return "New"
    case "contacted":
      return "Contacted"
    case "interested":
      return "Interested"
    case "paid":
      return "Paid"
    case "lost":
      return "Lost"
  }
}

function emptyCounts(): WeeklyCounts {
  return {
    total: 0,
    byInterest: {
      Bootcamp: 0,
      Fellowship: 0,
      "Corporate Training": 0,
    },
    byStatus: {
      New: 0,
      Contacted: 0,
      Interested: 0,
      Paid: 0,
      Lost: 0,
    },
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return jsonError("Authentication required.", 401)
    }

    const periodEnd = new Date()
    const periodStart = new Date(periodEnd.getTime() - WEEK_MS)
    const recentRows: Array<{ interest: string | null; status: EnquiryStatus }> = []

    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("enquiries")
        .select("interest, status, created_at")
        .eq("user_id", user.id)
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString())
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) {
        throw error
      }

      const rows = data ?? []
      recentRows.push(...rows)
      if (rows.length < PAGE_SIZE) break
    }

    if (recentRows.length === 0) {
      return jsonOk({
        noData: true,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      })
    }

    const counts = emptyCounts()
    counts.total = recentRows.length

    for (const row of recentRows) {
      const interest = classifyInterest(row.interest)
      if (interest) counts.byInterest[interest] += 1
      counts.byStatus[classifyStatus(row.status)] += 1
    }

    const openai = getOpenAI()
    const response = await openai.responses.parse({
      model: "gpt-4o-mini",
      max_output_tokens: 700,
      input: [
        {
          role: "system",
          content:
            "You are a concise CRM analyst. Based only on the aggregate counts supplied, write useful observations and practical actions for the coming week. Do not invent causes, customer details, trends over time, or facts that are not in the counts. Mention uncertainty when counts are small. Return 2 to 4 observations and 2 to 4 actionable recommendations. Do not include personal data.",
        },
        {
          role: "user",
          content: JSON.stringify({
            periodDays: 7,
            total: counts.total,
            byInterest: counts.byInterest,
            byStatus: counts.byStatus,
          }),
        },
      ],
      text: {
        format: zodTextFormat(weeklyNarrativeSchema, "weekly_crm_summary"),
      },
    })

    if (!response.output_parsed) {
      return jsonError("OpenAI did not return a valid weekly summary.", 502)
    }

    return jsonOk({
      noData: false,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      counts,
      observations: response.output_parsed.observations,
      suggestedActions: response.output_parsed.suggestedActions,
    })
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error &&
      typeof error.status === "number"
        ? error.status
        : undefined
    const code =
      typeof error === "object" && error !== null && "code" in error &&
      typeof error.code === "string"
        ? error.code
        : undefined

    if (process.env.NODE_ENV === "development") {
      console.error("[dashboard.weekly-summary] failed", {
        name: error instanceof Error ? error.name : "UnknownError",
        status,
        code,
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      return jsonError("Weekly AI Summary is not configured on the server.", 503)
    }
    if (status === 401) {
      return jsonError("The OpenAI API key was rejected or has expired.", 502)
    }
    if (status === 402 || code === "insufficient_quota") {
      return jsonError("OpenAI credits are unavailable for this request.", 402)
    }
    if (status === 429) {
      return jsonError("OpenAI is rate-limiting requests. Please try again later.", 429)
    }
    if (error instanceof Error && error.name.toLowerCase().includes("connection")) {
      return jsonError("Could not reach OpenAI. Check the server network and try again.", 503)
    }
    if (error instanceof Error && error.message.toLowerCase().includes("unauthorized")) {
      return jsonError("Authentication required.", 401)
    }

    return jsonError("Unable to generate the weekly summary right now. Please try again.", 502)
  }
}
