import { z } from "zod"

import { isOpenAIConfigured } from "@/lib/env"
import { jsonError } from "@/lib/http"

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  enquiryId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  let json: unknown

  try {
    json = await request.json()
  } catch {
    return jsonError("Invalid JSON body.", 400)
  }

  const parsed = chatRequestSchema.safeParse(json)

  if (!parsed.success) {
    return jsonError("Invalid request.", 400, parsed.error.flatten())
  }

  if (!isOpenAIConfigured()) {
    return jsonError("OPENAI_API_KEY is not configured on the server.", 503)
  }

  // getOpenAI() will be called here when the assistant feature is implemented.
  // The OpenAI client lives in src/lib/openai/client.ts and is server-only.
  return jsonError("AI assistant is not implemented yet.", 501)
}
