import "server-only"

import OpenAI from "openai"

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local. This key must never be exposed to the client."
    )
  }

  return new OpenAI({ apiKey })
}
