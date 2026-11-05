import type { Enquiry, EnquiryStatus } from "@/types/crm"

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      enquiries: {
        Row: Enquiry
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          source?: string | null
          interest?: string | null
          status?: EnquiryStatus
          original_message: string
          preferred_language?: string | null
          follow_up_at?: string | null
          last_contacted_at?: string | null
          ai_summary?: string | null
          ai_reply?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          source?: string | null
          interest?: string | null
          status?: EnquiryStatus
          original_message?: string
          preferred_language?: string | null
          follow_up_at?: string | null
          last_contacted_at?: string | null
          ai_summary?: string | null
          ai_reply?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      enquiry_status: EnquiryStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type { Json }
