"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Loader2 } from "lucide-react"

import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  type Enquiry,
  type EnquiryStatus,
} from "@/types/crm"

const PIPELINE_COLUMNS = [
  { key: "new", label: "New", accent: "border-sky-200 bg-sky-50/70 text-sky-700" },
  { key: "contacted", label: "Contacted", accent: "border-violet-200 bg-violet-50/70 text-violet-700" },
  { key: "interested", label: "Interested", accent: "border-amber-200 bg-amber-50/70 text-amber-700" },
  { key: "paid", label: "Paid", accent: "border-emerald-200 bg-emerald-50/70 text-emerald-700" },
  { key: "lost", label: "Lost", accent: "border-rose-200 bg-rose-50/70 text-rose-700" },
] as const

const STATUS_OPTIONS = ENQUIRY_STATUSES.map((value) => ({
  value,
  label: ENQUIRY_STATUS_LABELS[value],
}))

function getColumnKey(status: EnquiryStatus | string) {
  switch (status) {
    case "new":
      return "new"
    case "contacted":
      return "contacted"
    case "interested":
      return "interested"
    case "paid":
      return "paid"
    case "lost":
      return "lost"
    default:
      return "new"
  }
}

function getStatusLabel(status: EnquiryStatus | string) {
  switch (status) {
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
    default:
      return "New"
  }
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; details?: unknown }
      | null

    throw new Error(payload?.error ?? "Request failed.")
  }

  return (await response.json()) as T
}

type PipelineBoardProps = {
  initialEnquiries: Enquiry[]
}

export function PipelineBoard({ initialEnquiries }: PipelineBoardProps) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(initialEnquiries)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const groupedEnquiries = useMemo(() => {
    return {
      new: enquiries.filter((enquiry) => getColumnKey(enquiry.status) === "new"),
      contacted: enquiries.filter(
        (enquiry) => getColumnKey(enquiry.status) === "contacted"
      ),
      interested: enquiries.filter(
        (enquiry) => getColumnKey(enquiry.status) === "interested"
      ),
      paid: enquiries.filter((enquiry) => getColumnKey(enquiry.status) === "paid"),
      lost: enquiries.filter((enquiry) => getColumnKey(enquiry.status) === "lost"),
    }
  }, [enquiries])

  const updateStatus = async (id: string, status: EnquiryStatus) => {
    if (status === "paid") {
      const confirmed = window.confirm(
        "Confirm payment has been received before marking this customer as Paid."
      )

      if (!confirmed) {
        return
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchJson<{ enquiry: Enquiry }>("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      setEnquiries((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: result.enquiry.status } : item
        )
      )
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update enquiry status."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = async (columnKey: (typeof PIPELINE_COLUMNS)[number]["key"]) => {
    if (!draggedId) {
      return
    }

    const nextStatus =
      columnKey === "new"
        ? "new"
        : columnKey === "contacted"
          ? "contacted"
          : columnKey === "interested"
            ? "interested"
            : columnKey === "paid"
              ? "paid"
              : "lost"

    await updateStatus(draggedId, nextStatus as EnquiryStatus)
    setDraggedId(null)
  }

  const handleStatusChange = async (
    id: string,
    value: string,
    label: string
  ) => {
    if (value === "paid") {
      const confirmed = window.confirm(
        `Mark ${label} as Paid after payment confirmation?`
      )

      if (!confirmed) {
        return
      }
    }

    await updateStatus(id, value as EnquiryStatus)
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Updating pipeline…
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-5 md:grid-cols-2">
        {PIPELINE_COLUMNS.map((column) => (
          <div
            key={column.key}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              void handleDrop(column.key)
            }}
            className={`min-h-[420px] rounded-2xl border ${column.accent} p-3`}
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-current/10 pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide">{column.label}</h3>
              <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium">
                {groupedEnquiries[column.key].length}
              </span>
            </div>

            <div className="space-y-3">
              {groupedEnquiries[column.key].length === 0 ? (
                <div className="rounded-xl border border-dashed border-current/40 bg-background/30 p-4 text-center text-xs text-current/70">
                  No records
                </div>
              ) : null}

              {groupedEnquiries[column.key].map((enquiry) => (
                <div
                  key={enquiry.id}
                  draggable
                  onDragStart={() => setDraggedId(enquiry.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className="rounded-xl border border-border bg-background/90 p-3 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{enquiry.name}</p>
                      <p className="text-xs text-muted-foreground">{enquiry.source ?? "Unknown source"}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {getStatusLabel(enquiry.status)}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Interest:</span> {enquiry.interest ?? "Not specified"}
                    </p>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-3.5" />
                      <span>
                        Follow-up: {enquiry.follow_up_at ? new Date(enquiry.follow_up_at).toLocaleDateString() : "No follow-up date"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Move stage
                    </label>
                    <select
                      value={enquiry.status}
                      onChange={(event) => {
                        const value = event.target.value
                        const label = getStatusLabel(value)
                        void handleStatusChange(enquiry.id, value, label)
                      }}
                      className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
