export const ENQUIRY_STATUSES = [
  "new",
  "contacted",
  "interested",
  "paid",
  "lost",
] as const

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  paid: "Paid",
  lost: "Lost",
}

export type Enquiry = {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  interest: string | null
  status: EnquiryStatus
  original_message: string
  preferred_language: string | null
  follow_up_at: string | null
  last_contacted_at: string | null
  ai_summary: string | null
  ai_reply: string | null
  created_at: string
  updated_at: string | null
}

export type PipelineStageId = EnquiryStatus

export type AppRoute =
  | "/dashboard"
  | "/enquiries"
  | "/pipeline"
  | "/assistant"
  | "/settings"
