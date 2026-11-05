import { z } from "zod"
import { zodTextFormat } from "openai/helpers/zod"

import {
  detectCustomerLanguage,
  getReplyLanguageInstruction,
} from "@/lib/ai/reply-helpers"
import { getOpenAI } from "@/lib/openai/client"
import { createClient } from "@/lib/supabase/server"
import { jsonError, jsonOk } from "@/lib/http"

const customerReplyRequestSchema = z.object({
  original_message: z.string().trim().min(10).max(8000),
  name: z.string().trim().max(120).optional().transform((value) => value || undefined),
  phone: z.string().trim().max(30).optional().transform((value) => value || undefined),
  source: z.string().trim().max(80).optional().transform((value) => value || undefined),
  interest: z.string().trim().max(200).optional().transform((value) => value || undefined),
  preferred_language: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((value) => value || undefined),
  ai_summary: z.string().trim().max(2000).optional().transform((value) => value || undefined),
})

const customerReplyResultSchema = z.object({
  reply: z.string().min(1).max(4000),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return jsonError("Authentication required.", 401)
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonError("Invalid JSON body.", 400)
    }

    const parsed = customerReplyRequestSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError("Validation failed.", 400, parsed.error.flatten())
    }

    const {
      original_message,
      name,
      phone,
      source,
      interest,
      ai_summary,
    } = parsed.data

    const language = detectCustomerLanguage(original_message)
    const languageInstruction = getReplyLanguageInstruction(language)

    const client = getOpenAI()

    const response = await client.responses.parse({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            `You are the BIAI customer support assistant. Draft a natural, friendly, polite, and professional reply to the customer's original message. ${languageInstruction} Match both the language and writing system of that message. Never invent prices, schedules, payment policies, guarantees, or dates. If the requested information is unavailable, politely tell the customer to contact the BIAI team. Do not send the message automatically. Return only a final reply text that a team member can review and edit.`,
        },
        {
          role: "user",
          content: `Customer inquiry: ${original_message}\nName: ${name ?? "not provided"}\nPhone: ${phone ?? "not provided"}\nSource: ${source ?? "not provided"}\nInterest: ${interest ?? "not provided"}\nPreferred language: ${language}\nAI summary: ${ai_summary ?? "not provided"}`,
        },
      ],
      text: {
        format: zodTextFormat(customerReplyResultSchema, "customer_reply"),
      },
    })

    if (!response.output_parsed) {
      return jsonError("The model did not return a valid reply.", 502)
    }

    return jsonOk({ reply: response.output_parsed.reply })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    if (message.toLowerCase().includes("api key") || message.toLowerCase().includes("openai")) {
      return jsonError("OpenAI is not configured on the server.", 503)
    }

    return jsonError("Unable to generate a customer reply.", 500, { message })
  }
}
