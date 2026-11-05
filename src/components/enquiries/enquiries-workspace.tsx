"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, Sparkles, Trash2 } from "lucide-react"

import { SectionCard } from "@/components/layout/section-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Enquiry, EnquiryStatus } from "@/types/crm"
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS } from "@/types/crm"

const EMPTY_DRAFT = {
  name: "",
  email: "",
  phone: "",
  source: "",
  interest: "",
  status: "new" as EnquiryStatus,
  original_message: "",
  ai_summary: "",
  preferred_language: "",
  follow_up_at: "",
  last_contacted_at: "",
}

type EnquiryDraft = typeof EMPTY_DRAFT

type EnquiriesWorkspaceProps = {
  initialEnquiries: Enquiry[]
  initialSelectedEnquiryId?: string
}

type ExtractedEnquiry = {
  name: string | null
  email: string | null
  phone: string | null
  interest:
    | "Bootcamp"
    | "Fellowship"
    | "Corporate Training"
    | "Unknown"
    | "Not a Sales Enquiry"
  preferred_language: "English" | "Bangla" | "Banglish"
  summary: string
  is_genuine_sales_enquiry: boolean
}

const AI_SOURCE_OPTIONS = [
  "Website",
  "WhatsApp",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "Email",
  "Phone",
  "Other",
]

type SampleCsvRow = {
  id: string
  channel: string
  receivedAt: string
  senderName: string
  phone: string
  message: string
}

type ImportResult = {
  insertedCount: number
  duplicateCount: number
  failed: Array<{ id: string; error: string }>
}

type ImportPreviewRow = {
  id: string
  rowNumber: number
  received_at: string
  original_message: string
  source: string
  name: string
  email: string | null
  phone: string
  interest: string
  preferred_language: "English" | "Bangla" | "Banglish"
  summary: string
  is_genuine_sales_enquiry: boolean
  selected: boolean
  duplicatePhone: boolean
  error?: string
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

function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

export function EnquiriesWorkspace({
  initialEnquiries,
  initialSelectedEnquiryId,
}: EnquiriesWorkspaceProps) {
  const router = useRouter()
  const [enquiries, setEnquiries] = useState<Enquiry[]>(initialEnquiries)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "all">("all")
  const [sourceFilter, setSourceFilter] = useState("")
  const [draft, setDraft] = useState<EnquiryDraft>(EMPTY_DRAFT)
  const [aiMessage, setAiMessage] = useState("")
  const [aiSource, setAiSource] = useState("Website")
  const [senderName, setSenderName] = useState("")
  const [senderPhone, setSenderPhone] = useState("")
  const [aiPreview, setAiPreview] = useState<ExtractedEnquiry | null>(null)
  const [aiSuccess, setAiSuccess] = useState<string | null>(null)
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(
    initialEnquiries.some((enquiry) => enquiry.id === initialSelectedEnquiryId)
      ? initialSelectedEnquiryId ?? null
      : initialEnquiries[0]?.id ?? null
  )
  const [replyDraft, setReplyDraft] = useState("")
  const [replySuccess, setReplySuccess] = useState<string | null>(null)
  const [followUpDateTime, setFollowUpDateTime] = useState(() => {
    const selected = initialEnquiries.find((enquiry) => enquiry.id === initialSelectedEnquiryId)
      ?? initialEnquiries[0]
    return toLocalDateTimeInput(selected?.follow_up_at)
  })
  const [followUpSuccess, setFollowUpSuccess] = useState<string | null>(null)
  const [followUpError, setFollowUpError] = useState<string | null>(null)
  const [isRecordingFollowUp, setIsRecordingFollowUp] = useState(false)
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false)
  const [replyGenerating, setReplyGenerating] = useState(false)
  const [replySaving, setReplySaving] = useState(false)
  const [importingSample, setImportingSample] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([])
  const [failedImportRows, setFailedImportRows] = useState<ImportPreviewRow[]>([])
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadEnquiries = async (
    nextSearch = search,
    nextStatus = statusFilter,
    nextSource = sourceFilter
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (nextSearch.trim()) params.set("search", nextSearch.trim())
      if (nextStatus !== "all") params.set("status", nextStatus)
      if (nextSource.trim()) params.set("source", nextSource.trim())

      const data = await fetchJson<{ enquiries: Enquiry[] }>(
        `/api/enquiries?${params.toString()}`
      )

      setEnquiries(data.enquiries)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? "Unable to load enquiries. Please try again."
          : "Unable to load enquiries. Please try again."
      )
      setEnquiries([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCount = useMemo(() => enquiries.length, [enquiries])
  const importSelectedCount = useMemo(
    () => importPreview.filter((row) => row.selected).length,
    [importPreview]
  )
  const selectedEnquiry = useMemo(
    () =>
      enquiries.find((enquiry) => enquiry.id === selectedEnquiryId) ??
      enquiries[0] ??
      null,
    [enquiries, selectedEnquiryId]
  )

  const handleDraftChange = (
    field: keyof EnquiryDraft,
    value: string | EnquiryStatus
  ) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!draft.name.trim()) {
      setError("Name is required before saving the enquiry.")
      return
    }

    if (!draft.original_message.trim()) {
      setError("Original message is required before saving the enquiry.")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        ...draft,
        email: draft.email.trim() || null,
        phone: draft.phone.trim() || null,
        source: draft.source.trim() || null,
        interest: draft.interest.trim() || null,
        ai_summary: draft.ai_summary.trim() || null,
        preferred_language: draft.preferred_language.trim() || null,
        follow_up_at: draft.follow_up_at || null,
        last_contacted_at: draft.last_contacted_at || null,
        original_message: draft.original_message.trim(),
        name: draft.name.trim(),
      }

      await fetchJson<{ enquiry: Enquiry }>("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      setDraft(EMPTY_DRAFT)
      setAiPreview(null)
      setAiSuccess("Enquiry created successfully.")
      setAiMessage("")
      setSenderName("")
      setSenderPhone("")
      setAiSource("Website")
      await loadEnquiries()
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create enquiry."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExtract = async () => {
    setError(null)
    setAiSuccess(null)
    setIsExtracting(true)

    try {
      const payload = {
        message: aiMessage.trim(),
        senderName: senderName.trim() || undefined,
        phone: senderPhone.trim() || undefined,
        source: aiSource,
      }

      if (!payload.message || payload.message.length < 20) {
        throw new Error("Enter a longer customer message so the model can extract the enquiry accurately.")
      }

      const result = await fetchJson<{ extraction: ExtractedEnquiry }>(
        "/api/ai/extract",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      setAiPreview(result.extraction)
      setDraft((current) => ({
        ...current,
        name: result.extraction.name ?? current.name,
        email: result.extraction.email ?? current.email,
        phone: result.extraction.phone ?? current.phone,
        source: aiSource,
        interest: result.extraction.interest,
        status: result.extraction.is_genuine_sales_enquiry ? "new" : "lost",
        ai_summary: result.extraction.summary,
        preferred_language: result.extraction.preferred_language,
        original_message: aiMessage,
      }))
    } catch (extractError) {
      setError(
        extractError instanceof Error
          ? extractError.message
          : "AI extraction failed."
      )
      setAiSuccess(null)
      setAiPreview(null)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleImportSampleData = async () => {
    setError(null)
    setImportMessage(null)
    setImportingSample(true)

    try {
      const { rows } = await fetchJson<{ rows: SampleCsvRow[]; count: number }>(
        "/api/enquiries/import"
      )
      const phoneCounts = new Map<string, number>()

      for (const row of rows) {
        const phone = row.phone.replace(/[^\d+]/g, "").replace(/^00/, "+").trim()
        if (phone) phoneCounts.set(phone, (phoneCounts.get(phone) ?? 0) + 1)
      }

      const extracted: ImportPreviewRow[] = []

      for (const [index, row] of rows.entries()) {
        try {
          const extraction = await fetchJson<{ extraction: ExtractedEnquiry }>("/api/ai/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: row.message,
              senderName: row.senderName,
              phone: row.phone || undefined,
              source: row.channel,
            }),
          })

          const normalizedPhone = (row.phone || extraction.extraction.phone || "")
            .replace(/[^\d+]/g, "")
            .replace(/^00/, "+")
            .trim()
          const duplicatePhone = Boolean(
            normalizedPhone && (phoneCounts.get(normalizedPhone) ?? 0) > 1
          )

          extracted.push({
            id: row.id,
            rowNumber: index + 1,
            received_at: row.receivedAt,
            original_message: row.message,
            source: row.channel,
            name: (extraction.extraction.name ?? row.senderName) || "Unknown",
            email: extraction.extraction.email,
            phone: (extraction.extraction.phone ?? row.phone) || "",
            interest: extraction.extraction.interest,
            preferred_language: extraction.extraction.preferred_language,
            summary: extraction.extraction.summary,
            is_genuine_sales_enquiry: extraction.extraction.is_genuine_sales_enquiry,
            selected: true,
            duplicatePhone,
          })
        } catch (rowError) {
          const normalizedPhone = row.phone.replace(/[^\d+]/g, "").replace(/^00/, "+").trim()
          const duplicatePhone = Boolean(normalizedPhone && (phoneCounts.get(normalizedPhone) ?? 0) > 1)

          extracted.push({
            id: row.id,
            rowNumber: index + 1,
            received_at: row.receivedAt,
            original_message: row.message,
            source: row.channel,
            name: row.senderName || "Unknown",
            email: null,
            phone: row.phone || "",
            interest: "Unknown",
            preferred_language: "English",
            summary: "AI extraction failed while processing this row.",
            is_genuine_sales_enquiry: false,
            selected: false,
            duplicatePhone,
            error:
              rowError instanceof Error ? rowError.message : "AI extraction failed.",
          })
        }
      }

      setImportPreview(extracted)
      setFailedImportRows([])
      setImportMessage(`${extracted.length} assignment rows loaded for review.`)
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Unable to load and process the sample data."
      )
      setImportPreview([])
      setImportMessage(null)
    } finally {
      setImportingSample(false)
    }
  }

  const toggleImportRowSelection = (id: string, selected: boolean) => {
    setImportPreview((current) =>
      current.map((row) => (row.id === id ? { ...row, selected } : row))
    )
  }

  const handleRetryFailedImportRows = async () => {
    if (failedImportRows.length === 0) {
      return
    }

    setError(null)
    setImportMessage(null)
    setImportingSample(true)

    try {
      const result = await fetchJson<ImportResult>("/api/enquiries/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: failedImportRows }),
      })
      const failedIds = new Set(result.failed.map((row) => row.id))
      setFailedImportRows(failedImportRows.filter((row) => failedIds.has(row.id)))
      setImportMessage(
        `${result.insertedCount} failed row(s) imported on retry. ${result.duplicateCount} duplicate row(s) skipped.`
      )
      await loadEnquiries()
    } catch (retryError) {
      setError(
        retryError instanceof Error ? retryError.message : "Unable to retry failed rows."
      )
    } finally {
      setImportingSample(false)
    }
  }

  const handleConfirmImport = async () => {
    const rowsToImport = importPreview.filter((row) => row.selected)

    if (!rowsToImport.length) {
      setError("Select at least one record to import.")
      return
    }

    setError(null)
    setImportMessage(null)
    setImportingSample(true)

    try {
      const result = await fetchJson<ImportResult>("/api/enquiries/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: rowsToImport }),
      })
      const failedById = new Map(result.failed.map((row) => [row.id, row.error]))
      const failed = rowsToImport
        .filter((row) => failedById.has(row.id))
        .map((row) => ({ ...row, error: failedById.get(row.id) }))

      setFailedImportRows(failed)
      setImportPreview((current) =>
        current.map((row) => ({
          ...row,
          selected: failed.some((failedRow) => failedRow.id === row.id),
        }))
      )

      setImportMessage(
        `${result.insertedCount} record(s) imported successfully. ${result.duplicateCount} duplicate row(s) skipped.${failed.length ? ` ${failed.length} row(s) failed and can be retried.` : ""}`
      )

      if (result.insertedCount > 0) {
        await loadEnquiries()
        router.refresh()
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to import sample data."
      )
    } finally {
      setImportingSample(false)
    }
  }

  const handleGenerateReply = async () => {
    if (!selectedEnquiry) {
      setError("Select an enquiry before generating a reply.")
      return
    }

    setError(null)
    setReplySuccess(null)
    setReplyGenerating(true)

    try {
      const result = await fetchJson<{ reply: string }>("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_message: selectedEnquiry.original_message,
          name: selectedEnquiry.name,
          phone: selectedEnquiry.phone ?? undefined,
          source: selectedEnquiry.source ?? undefined,
          interest: selectedEnquiry.interest ?? undefined,
          preferred_language: selectedEnquiry.preferred_language ?? undefined,
          ai_summary: selectedEnquiry.ai_summary ?? undefined,
        }),
      })

      setReplyDraft(result.reply)
    } catch (replyError) {
      setError(
        replyError instanceof Error
          ? replyError.message
          : "Unable to generate a customer reply."
      )
    } finally {
      setReplyGenerating(false)
    }
  }

  const handleSaveReply = async () => {
    if (!selectedEnquiry) {
      setError("Select an enquiry before saving a reply.")
      return
    }

    if (!replyDraft.trim()) {
      setError("Generate or draft a reply before saving it.")
      return
    }

    setError(null)
    setReplySuccess(null)
    setReplySaving(true)

    try {
      const result = await fetchJson<{ enquiry: Enquiry }>("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEnquiry.id,
          ai_reply: replyDraft.trim(),
        }),
      })

      setEnquiries((current) =>
        current.map((item) =>
          item.id === selectedEnquiry.id
            ? { ...item, ai_reply: result.enquiry.ai_reply }
            : item
        )
      )
      await loadEnquiries()
      setReplySuccess("Reply saved successfully to this enquiry.")
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the draft reply."
      )
    } finally {
      setReplySaving(false)
    }
  }

  const handleRecordFollowUp = async () => {
    if (!selectedEnquiry) return

    setFollowUpError(null)
    setFollowUpSuccess(null)
    setIsRecordingFollowUp(true)

    try {
      const result = await fetchJson<{ enquiry: Enquiry }>("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEnquiry.id,
          last_contacted_at: new Date().toISOString(),
        }),
      })

      setEnquiries((current) =>
        current.map((item) => item.id === result.enquiry.id ? result.enquiry : item)
      )
      await loadEnquiries()
      router.refresh()
      setFollowUpSuccess("Follow-up recorded. The 48-hour reminder timer has reset.")
    } catch (recordError) {
      setFollowUpError(
        recordError instanceof Error ? recordError.message : "Unable to record this follow-up."
      )
    } finally {
      setIsRecordingFollowUp(false)
    }
  }

  const handleScheduleFollowUp = async () => {
    if (!selectedEnquiry) return

    if (!followUpDateTime) {
      setFollowUpError("Choose a date and time for the follow-up.")
      return
    }

    const scheduledAt = new Date(followUpDateTime)
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      setFollowUpError("Choose a future date and time.")
      return
    }

    setFollowUpError(null)
    setFollowUpSuccess(null)
    setIsSchedulingFollowUp(true)

    try {
      const result = await fetchJson<{ enquiry: Enquiry }>("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEnquiry.id,
          follow_up_at: scheduledAt.toISOString(),
        }),
      })

      setEnquiries((current) =>
        current.map((item) => item.id === result.enquiry.id ? result.enquiry : item)
      )
      await loadEnquiries()
      router.refresh()
      setFollowUpSuccess("Follow-up scheduled successfully.")
    } catch (scheduleError) {
      setFollowUpError(
        scheduleError instanceof Error ? scheduleError.message : "Unable to schedule this follow-up."
      )
    } finally {
      setIsSchedulingFollowUp(false)
    }
  }

  const handleCopyReply = async () => {
    if (!replyDraft.trim()) {
      setError("Generate a reply before copying it.")
      return
    }

    try {
      await navigator.clipboard.writeText(replyDraft.trim())
      setError(null)
    } catch {
      setError("Unable to copy the reply to the clipboard.")
    }
  }

  const handleStatusChange = async (id: string, status: EnquiryStatus) => {
    setError(null)

    try {
      await fetchJson<{ enquiry: Enquiry }>("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      await loadEnquiries()
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update enquiry status."
      )
    }
  }

  const handleArchive = async (id: string) => {
    setError(null)

    try {
      await fetchJson<{ id: string }>("/api/enquiries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      await loadEnquiries()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to archive enquiry."
      )
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Search & filter" description="Quickly find enquiries using search and filters.">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search enquiries"
              value={search}
              onChange={(event) => {
                const value = event.target.value
                setSearch(value)
                void loadEnquiries(value, statusFilter, sourceFilter)
              }}
              placeholder="Search by name, interest, or message"
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter status"
            value={statusFilter}
            onChange={(event) => {
              const value = event.target.value as EnquiryStatus | "all"
              setStatusFilter(value)
              void loadEnquiries(search, value, sourceFilter)
            }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {ENQUIRY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ENQUIRY_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <Input
            aria-label="Filter source"
            value={sourceFilter}
            onChange={(event) => {
              const value = event.target.value
              setSourceFilter(value)
              void loadEnquiries(search, statusFilter, value)
            }}
            placeholder="Source"
            className="max-w-32"
          />
        </div>
      </SectionCard>

      <SectionCard title="AI enquiry extraction" description="Turn a customer's message into an editable enquiry draft.">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Sender name</label>
              <Input
                value={senderName}
                onChange={(event) => setSenderName(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <Input
                value={senderPhone}
                onChange={(event) => setSenderPhone(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Source</label>
            <select
              value={aiSource}
              onChange={(event) => setAiSource(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {AI_SOURCE_OPTIONS.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Customer message</label>
            <textarea
              value={aiMessage}
              onChange={(event) => setAiMessage(event.target.value)}
              placeholder="Paste a customer message in English, Bangla, or Banglish..."
              className="min-h-36 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleExtract} disabled={isExtracting}>
              {isExtracting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Extracting…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Extract with AI
                </>
              )}
            </Button>
          </div>
          {aiSuccess ? (
            <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700">
              {aiSuccess}
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Import sample data"
        description="Explore your CRM with 20 fictional customer enquiries."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {importPreview.length > 0
              ? `${importPreview.length} rows loaded. ${importSelectedCount} selected.`
              : "No import preview loaded yet."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={handleImportSampleData} disabled={importingSample}>
              {importingSample ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </>
              ) : (
                "Import Sample Data"
              )}
            </Button>
            {failedImportRows.length > 0 ? (
              <Button type="button" variant="secondary" onClick={handleRetryFailedImportRows} disabled={importingSample}>
                Retry failed ({failedImportRows.length})
              </Button>
            ) : null}
            {importPreview.length > 0 ? (
              <Button type="button" variant="outline" onClick={handleConfirmImport} disabled={importingSample || importSelectedCount === 0}>
                Save selected rows
              </Button>
            ) : null}
          </div>
        </div>

        {importMessage ? (
          <div role="status" className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700">
            {importMessage}
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {importPreview.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {importPreview.map((row) => (
              <div key={row.id} className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(event) => toggleImportRowSelection(row.id, event.target.checked)}
                    />
                    <p className="text-sm font-medium text-foreground">
                      Row {row.rowNumber}: {row.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {row.duplicatePhone ? (
                      <span className="rounded-full border border-amber-400/50 bg-amber-500/10 px-2 py-1 text-amber-700">
                        Duplicate phone
                      </span>
                    ) : null}
                    {row.is_genuine_sales_enquiry ? (
                      <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-emerald-700">
                        Sales lead
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-400/40 bg-slate-500/10 px-2 py-1 text-slate-700">
                        Not a lead
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <p><span className="font-medium text-foreground">Phone:</span> {row.phone || "—"}</p>
                  <p><span className="font-medium text-foreground">Source:</span> {row.source}</p>
                  <p><span className="font-medium text-foreground">Interest:</span> {row.interest}</p>
                  <p><span className="font-medium text-foreground">Language:</span> {row.preferred_language}</p>
                </div>

                <p className="mt-3 text-sm text-foreground">{row.original_message}</p>
                {row.summary ? (
                  <p className="mt-2 text-sm text-muted-foreground">AI summary: {row.summary}</p>
                ) : null}
                {row.error ? (
                  <p className="mt-2 text-sm text-destructive">{row.error}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>

      {aiPreview ? (
        <SectionCard title="Extraction preview" description="Review and correct the extracted fields before saving to the CRM.">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={aiPreview.name ?? ""}
              onChange={(event) =>
                setAiPreview((current) => {
                  const name = event.target.value || null
                  setDraft((draft) => ({ ...draft, name: name ?? "" }))
                  return current ? { ...current, name } : current
                })
              }
              placeholder="Name"
            />
            <Input
              type="email"
              value={aiPreview.email ?? ""}
              onChange={(event) =>
                setAiPreview((current) => {
                  const email = event.target.value || null
                  setDraft((draft) => ({ ...draft, email: email ?? "" }))
                  return current ? { ...current, email } : current
                })
              }
              placeholder="Email (optional)"
            />
            <Input
              value={aiPreview.phone ?? ""}
              onChange={(event) =>
                setAiPreview((current) => {
                  const phone = event.target.value || null
                  setDraft((draft) => ({ ...draft, phone: phone ?? "" }))
                  return current ? { ...current, phone } : current
                })
              }
              placeholder="Phone"
            />
            <select
              value={aiPreview.interest}
              onChange={(event) =>
                setAiPreview((current) => {
                  const interest = event.target.value as ExtractedEnquiry["interest"]
                  setDraft((draft) => ({ ...draft, interest }))
                  return current ? { ...current, interest } : current
                })
              }
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {[
                "Bootcamp",
                "Fellowship",
                "Corporate Training",
                "Unknown",
                "Not a Sales Enquiry",
              ].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={aiPreview.preferred_language}
              onChange={(event) =>
                setAiPreview((current) => {
                  const preferred_language = event.target.value as ExtractedEnquiry["preferred_language"]
                  setDraft((draft) => ({ ...draft, preferred_language }))
                  return current ? { ...current, preferred_language } : current
                })
              }
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {[
                "English",
                "Bangla",
                "Banglish",
              ].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="md:col-span-2">
              <textarea
                value={aiPreview.summary}
                onChange={(event) =>
                  setAiPreview((current) => {
                    const summary = event.target.value
                    setDraft((draft) => ({ ...draft, ai_summary: summary }))
                    return current ? { ...current, summary } : current
                  })
                }
                className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Genuine sales enquiry?</p>
                <p className="text-xs text-muted-foreground">Only true sales leads should enter the pipeline.</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={aiPreview.is_genuine_sales_enquiry}
                  onChange={(event) => {
                    const isGenuine = event.target.checked
                    setAiPreview((current) =>
                      current
                        ? { ...current, is_genuine_sales_enquiry: isGenuine }
                        : current
                    )
                    setDraft((current) => ({
                      ...current,
                      status: isGenuine ? "new" : "lost",
                    }))
                  }}
                />
                {aiPreview.is_genuine_sales_enquiry ? "Yes" : "No"}
              </label>
            </div>
            <div className="md:col-span-2 rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Review the populated Create enquiry form below, then use its Create enquiry button to save this record.
            </div>
          </div>
        </SectionCard>
      ) : null}

      {selectedEnquiry ? (
        <SectionCard
          title="Follow-up"
          description={`Record contact or schedule the next follow-up for ${selectedEnquiry.name}.`}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Record only after actual customer contact. This resets the 48-hour reminder timer.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleRecordFollowUp()}
                disabled={isRecordingFollowUp || isSchedulingFollowUp}
              >
                {isRecordingFollowUp ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Recording…
                  </>
                ) : (
                  "Record Follow-up"
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor="follow-up-at" className="text-xs font-medium text-foreground">
                  Schedule follow-up
                </label>
                <Input
                  id="follow-up-at"
                  type="datetime-local"
                  value={followUpDateTime}
                  onChange={(event) => setFollowUpDateTime(event.target.value)}
                  min={toLocalDateTimeInput(new Date().toISOString())}
                  disabled={isRecordingFollowUp || isSchedulingFollowUp}
                />
              </div>
              <Button
                type="button"
                onClick={() => void handleScheduleFollowUp()}
                disabled={isRecordingFollowUp || isSchedulingFollowUp}
              >
                {isSchedulingFollowUp ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Scheduling…
                  </>
                ) : (
                  "Schedule Follow-up"
                )}
              </Button>
            </div>

            {followUpSuccess ? (
              <p role="status" className="text-sm text-emerald-700">{followUpSuccess}</p>
            ) : null}
            {followUpError ? (
              <p role="alert" className="text-sm text-destructive">{followUpError}</p>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {selectedEnquiry ? (
        <SectionCard title="AI customer reply generator" description={`Create a professional BIAI reply for ${selectedEnquiry.name}.`}>
          <div className="mb-4 space-y-2 rounded-xl border border-border bg-muted/20 p-3">
            <h3 className="text-sm font-medium text-foreground">Saved AI Reply</h3>
            {selectedEnquiry.ai_reply?.trim() ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {selectedEnquiry.ai_reply}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No saved AI reply yet.</p>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Original enquiry
                </p>
                <p className="text-sm leading-6 text-foreground">
                  {selectedEnquiry.original_message}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Name:</span> {selectedEnquiry.name}
              </p>
              <p>
                <span className="font-medium text-foreground">Phone:</span> {selectedEnquiry.phone ?? "Not provided"}
              </p>
              <p>
                <span className="font-medium text-foreground">Source:</span> {selectedEnquiry.source ?? "Unknown"}
              </p>
              <p>
                <span className="font-medium text-foreground">Interest:</span> {selectedEnquiry.interest ?? "Not specified"}
              </p>
              <p>
                <span className="font-medium text-foreground">Language:</span> {selectedEnquiry.preferred_language ?? "Not specified"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" onClick={handleGenerateReply} disabled={replyGenerating}>
              {replyGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating…
                </>
              ) : (
                "Generate"
              )}
            </Button>
            <Button type="button" variant="secondary" onClick={handleGenerateReply} disabled={replyGenerating}>
              Regenerate
            </Button>
            <Button type="button" variant="outline" onClick={handleCopyReply}>
              Copy Reply
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-foreground">Reply draft</label>
            <textarea
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value)}
              placeholder="A generated BIAI response will appear here..."
              className="min-h-40 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button type="button" variant="secondary" onClick={handleSaveReply} disabled={replySaving}>
              {replySaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Reply"
              )}
            </Button>
          </div>
          {replySuccess ? (
            <div role="status" className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700">
              {replySuccess}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Create enquiry" description="Add a new customer enquiry and keep all important details organized.">
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Full name"
            value={draft.name}
            onChange={(event) => handleDraftChange("name", event.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email (optional)"
            value={draft.email}
            onChange={(event) => handleDraftChange("email", event.target.value)}
          />
          <Input
            placeholder="Phone"
            value={draft.phone}
            onChange={(event) => handleDraftChange("phone", event.target.value)}
          />
          <Input
            placeholder="Source"
            value={draft.source}
            onChange={(event) => handleDraftChange("source", event.target.value)}
          />
          <Input
            placeholder="Interest"
            value={draft.interest}
            onChange={(event) => handleDraftChange("interest", event.target.value)}
          />
          <select
            value={draft.status}
            onChange={(event) =>
              handleDraftChange("status", event.target.value as EnquiryStatus)
            }
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {ENQUIRY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ENQUIRY_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <Input
            placeholder="Preferred language"
            value={draft.preferred_language}
            onChange={(event) =>
              handleDraftChange("preferred_language", event.target.value)
            }
          />
          <div className="md:col-span-2">
            <textarea
              value={draft.original_message}
              onChange={(event) =>
                handleDraftChange("original_message", event.target.value)
              }
              placeholder="Original message"
              required
              className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Create enquiry"
              )}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Enquiries" description={`${filteredCount} customer enquiries`}>
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading enquiries…
          </div>
        ) : enquiries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
            No enquiries match the current filters. Create the first entry or adjust your search.
          </div>
        ) : (
          <div className="space-y-3">
            {enquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                onClick={() => {
                  setSelectedEnquiryId(enquiry.id)
                  setReplyDraft(enquiry.ai_reply ?? "")
                  setFollowUpDateTime(toLocalDateTimeInput(enquiry.follow_up_at))
                  setFollowUpError(null)
                  setFollowUpSuccess(null)
                }}
                className={
                  selectedEnquiryId === enquiry.id
                    ? "cursor-pointer rounded-xl border border-primary/70 bg-card p-4 shadow-sm"
                    : "cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
                }
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{enquiry.name}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {ENQUIRY_STATUS_LABELS[enquiry.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {enquiry.phone ?? "No phone"} · {enquiry.source ?? "Unknown source"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {enquiry.interest ?? "No interest provided"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Update status for ${enquiry.name}`}
                      value={enquiry.status}
                      onChange={(event) =>
                        handleStatusChange(
                          enquiry.id,
                          event.target.value as EnquiryStatus
                        )
                      }
                      className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                    >
                      {ENQUIRY_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {ENQUIRY_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      onClick={() => handleArchive(enquiry.id)}
                    >
                      <Trash2 className="size-4" />
                      Archive
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Message:</span>{" "}
                    {enquiry.original_message}
                  </p>
                  {enquiry.ai_summary ? (
                    <p>
                      <span className="font-medium text-foreground">AI summary:</span>{" "}
                      {enquiry.ai_summary}
                    </p>
                  ) : null}
                  <p>
                    Created: {new Date(enquiry.created_at).toLocaleString()} · Updated: {enquiry.updated_at ? new Date(enquiry.updated_at).toLocaleString() : "n/a"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
