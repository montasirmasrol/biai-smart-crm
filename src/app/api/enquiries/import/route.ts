import { readFile } from "node:fs/promises"
import path from "node:path"
import Papa from "papaparse"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { jsonError, jsonOk } from "@/lib/http"
import type { Enquiry } from "@/types/crm"

const sampleRowSchema = z.object({
  id: z.string().trim().min(1).max(50),
  channel: z.string().trim().min(1).max(100),
  receivedAt: z.string().trim().min(1).max(50),
  senderName: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(30),
  message: z.string().trim().min(10).max(4000),
})

const importRowSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(120),
  email: z.string().email().nullable(),
  phone: z.string().trim().max(30),
  source: z.string().trim().min(1).max(80),
  interest: z.string().trim().max(200),
  preferred_language: z.enum(["English", "Bangla", "Banglish"]),
  summary: z.string().trim().min(1).max(2000),
  original_message: z.string().trim().min(10).max(4000),
  is_genuine_sales_enquiry: z.boolean(),
  received_at: z.string().trim().min(1).max(50),
})

const importRequestSchema = z.object({
  rows: z.array(importRowSchema).min(1).max(200),
})

const EXPECTED_HEADERS = [
  "id",
  "channel",
  "received_at",
  "sender_name",
  "phone",
  "message",
]

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").replace(/^00/, "+").trim()
}

function duplicateKey(row: {
  name: string
  phone: string | null
  source: string | null
  original_message: string
}) {
  const identity = normalizePhone(row.phone ?? "") || row.name.trim().toLowerCase()
  return [identity, (row.source ?? "").trim().toLowerCase(), row.original_message.trim()].join("\u0000")
}

function parseReceivedAt(value: string) {
  const isoValue = value.includes("T") ? value : value.replace(" ", "T")
  const date = new Date(`${isoValue}:00Z`)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized: sign in to import sample enquiries.")
  }

  return { supabase, user }
}

export async function GET() {
  try {
    await getAuthenticatedClient()

    const csvPath = path.join(process.cwd(), "data", "sample-enquiries.csv")
    const csvText = await readFile(csvPath, "utf8")
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
    })

    if (parsed.errors.length > 0) {
      return jsonError("The assignment CSV could not be parsed.", 400, parsed.errors)
    }

    const headers = parsed.meta.fields ?? []
    if (headers.length !== EXPECTED_HEADERS.length || headers.some((header, index) => header !== EXPECTED_HEADERS[index])) {
      return jsonError("The assignment CSV headers do not match the expected format.", 400, {
        expected: EXPECTED_HEADERS,
        received: headers,
      })
    }

    const validatedRows = parsed.data.map((record) =>
      sampleRowSchema.safeParse({
        id: record.id,
        channel: record.channel,
        receivedAt: record.received_at,
        senderName: record.sender_name,
        phone: record.phone ?? "",
        message: record.message,
      })
    )

    const invalidRows = validatedRows.flatMap((result, index) =>
      result.success
        ? []
        : [{ row: index + 2, issues: result.error.flatten() }]
    )

    if (invalidRows.length > 0) {
      return jsonError("The assignment CSV contains invalid records.", 400, invalidRows)
    }

    const rows = validatedRows.map((result) => result.data)

    return jsonOk({ rows, count: rows.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read the assignment CSV."
    if (message.toLowerCase().includes("unauthorized")) {
      return jsonError("Authentication required.", 401)
    }
    return jsonError("Unable to read the assignment CSV.", 500, { message })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    const body = await request.json().catch(() => null)
    const parsed = importRequestSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError("Import validation failed.", 400, parsed.error.flatten())
    }

    const { data: existing, error: existingError } = await supabase
      .from("enquiries")
      .select("id, name, phone, source, original_message")

    if (existingError) {
      throw existingError
    }

    const existingKeys = new Set(
      (existing ?? []).map((row) => duplicateKey(row))
    )
    const seenKeys = new Set<string>()
    const inserted: Enquiry[] = []
    const duplicates: string[] = []
    const failed: Array<{ id: string; error: string }> = []

    for (const row of parsed.data.rows) {
      const key = duplicateKey({
        name: row.name,
        phone: row.phone,
        source: row.source,
        original_message: row.original_message,
      })

      if (existingKeys.has(key) || seenKeys.has(key)) {
        duplicates.push(row.id)
        continue
      }

      try {
        const { data, error } = await supabase
          .from("enquiries")
          .insert({
            user_id: user.id,
            name: row.name,
            email: row.email,
            phone: normalizePhone(row.phone) || null,
            source: row.source,
            interest: row.interest || null,
            status: row.is_genuine_sales_enquiry ? "new" : "lost",
            original_message: row.original_message,
            preferred_language: row.preferred_language,
            ai_summary: row.summary,
            ai_reply: null,
            created_at: parseReceivedAt(row.received_at),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        inserted.push(data as Enquiry)
        seenKeys.add(key)
      } catch (error) {
        failed.push({
          id: row.id,
          error: error instanceof Error ? error.message : "Unable to insert this row.",
        })
      }
    }

    return jsonOk({
      inserted,
      insertedCount: inserted.length,
      duplicateIds: duplicates,
      duplicateCount: duplicates.length,
      failed,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to import enquiries."
    if (message.toLowerCase().includes("unauthorized")) {
      return jsonError("Authentication required.", 401)
    }
    return jsonError("Unable to import enquiries into Supabase.", 500, { message })
  }
}
