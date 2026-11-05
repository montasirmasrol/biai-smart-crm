import { z } from "zod"

import {
  archiveEnquiry,
  createEnquiry,
  getEnquiries,
  updateEnquiry,
} from "@/lib/data/enquiries"
import { jsonError, jsonOk } from "@/lib/http"
import { ENQUIRY_STATUSES } from "@/types/crm"

const enquiryStatusSchema = z.enum(ENQUIRY_STATUSES)

const enquiryCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320).nullish().transform((value) => value || null),
  phone: z.string().trim().max(30).nullish().transform((value) => value || null),
  source: z.string().trim().max(80).nullish().transform((value) => value || null),
  interest: z.string().trim().max(200).nullish().transform((value) => value || null),
  status: enquiryStatusSchema.default("new"),
  original_message: z.string().trim().min(10).max(4000),
  preferred_language: z
    .string()
    .trim()
    .max(50)
    .nullish()
    .transform((value) => value || null),
  follow_up_at: z
    .string()
    .datetime({ local: true })
    .nullish()
    .transform((value) => value || null),
  last_contacted_at: z
    .string()
    .datetime({ local: true })
    .nullish()
    .transform((value) => value || null),
  ai_summary: z.string().trim().max(2000).nullish().transform((value) => value || null),
  ai_reply: z.string().trim().max(2000).nullish().transform((value) => value || null),
})

const enquiryUpdateSchema = enquiryCreateSchema.partial().extend({
  id: z.string().uuid(),
})

async function readJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new Error("Invalid JSON body.")
  }
}

function databaseErrorResponse(error: unknown, fallback: string) {
  const code =
    typeof error === "object" && error !== null && "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined
  const message = error instanceof Error ? error.message : "Unknown database error."

  if (process.env.NODE_ENV === "development") {
    console.error("[enquiries] Supabase operation failed", {
      code,
      message,
    })
  }

  if (code === "42501") {
    return jsonError("Supabase denied this operation because of Row Level Security.", 403)
  }

  if (code === "PGRST116") {
    return jsonError("The enquiry was not found or is not owned by this account.", 404)
  }

  if (message.toLowerCase().includes("schema cache") || message.toLowerCase().includes("column") && message.toLowerCase().includes("does not exist")) {
    return jsonError("The Supabase enquiries table is missing the required migration.", 500)
  }

  return jsonError(fallback, 500)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const search = searchParams.get("search") ?? undefined
  const source = searchParams.get("source") ?? undefined
  const limit = Number(searchParams.get("limit") ?? "50")

  try {
    const enquiries = await getEnquiries({
      status: status && status !== "all" ? (status as (typeof ENQUIRY_STATUSES)[number]) : "all",
      search,
      source,
      limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50,
    })

    return jsonOk({ enquiries })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load enquiries."
    if (message.toLowerCase().includes("unauthorized")) {
      return jsonError("Authentication required.", 401)
    }
    return databaseErrorResponse(error, "Unable to load enquiries from Supabase.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request)
    const parsed = enquiryCreateSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError("Validation failed.", 400, parsed.error.flatten())
    }

    const enquiry = await createEnquiry({
      ...parsed.data,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      source: parsed.data.source ?? null,
      interest: parsed.data.interest ?? null,
      preferred_language: parsed.data.preferred_language ?? null,
      follow_up_at: parsed.data.follow_up_at ?? null,
      last_contacted_at: parsed.data.last_contacted_at ?? null,
      ai_summary: parsed.data.ai_summary ?? null,
      ai_reply: parsed.data.ai_reply ?? null,
    })

    return jsonOk({ enquiry }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create enquiry."
    if (message.toLowerCase().includes("unauthorized")) {
      return jsonError("Authentication required.", 401)
    }
    return databaseErrorResponse(error, "Unable to create enquiry in Supabase.")
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await readJsonBody(request)
    const parsed = enquiryUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError("Validation failed.", 400, parsed.error.flatten())
    }

    const { id, ...updates } = parsed.data

    const enquiry = await updateEnquiry(id, updates)

    return jsonOk({ enquiry })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update enquiry."
    if (message.toLowerCase().includes("unauthorized")) {
      return jsonError("Authentication required.", 401)
    }
    return databaseErrorResponse(error, "Unable to update enquiry in Supabase.")
  }
}

export async function DELETE(request: Request) {
  try {
    let id: string | null = null

    try {
      const payload = await request.json()
      id = typeof payload?.id === "string" ? payload.id : null
    } catch {
      const { searchParams } = new URL(request.url)
      id = searchParams.get("id")
    }

    if (!id) {
      return jsonError("Missing enquiry id.", 400)
    }

    const archived = await archiveEnquiry(id)
    return jsonOk({ id: archived.id, archived: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to archive enquiry."
    if (message.toLowerCase().includes("unauthorized")) {
      return jsonError("Authentication required.", 401)
    }
    return databaseErrorResponse(error, "Unable to archive enquiry in Supabase.")
  }
}
