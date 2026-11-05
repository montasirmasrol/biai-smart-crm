"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { CalendarClock, CircleDashed, Loader2, Sparkles } from "lucide-react"

import { SectionCard } from "@/components/layout/section-card"
import type { Enquiry } from "@/types/crm"

type DashboardStats = {
  total: number
  new: number
  interested: number
  paid: number
  bySource: Array<{ name: string; value: number }>
  byProgramme: Array<{ name: string; value: number }>
  recentEnquiries: Enquiry[]
  overdueFollowUps: FollowUpReminder[]
  upcomingFollowUps: Enquiry[]
}

type FollowUpReminder = Enquiry & {
  follow_up_reference_at: string
  waiting_ms: number
}

type WeeklySummaryResult = {
  noData: boolean
  periodStart: string
  periodEnd: string
  counts?: {
    total: number
    byInterest: Record<"Bootcamp" | "Fellowship" | "Corporate Training", number>
    byStatus: Record<"New" | "Contacted" | "Interested" | "Paid" | "Lost", number>
  }
  observations?: string[]
  suggestedActions?: string[]
}

const CHART_COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6366f1"]

function formatWaitingTime(milliseconds: number) {
  const totalHours = Math.floor(milliseconds / (60 * 60 * 1000))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  return days > 0 ? `${days}d ${hours}h` : `${hours}h`
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

function WeeklyAiSummary() {
  const [result, setResult] = useState<WeeklySummaryResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSummary = async () => {
    setError(null)
    setIsGenerating(true)

    try {
      const summary = await fetchJson<WeeklySummaryResult>(
        "/api/dashboard/weekly-summary",
        { method: "POST" }
      )
      setResult(summary)
    } catch (summaryError) {
      setError(
        summaryError instanceof Error
          ? summaryError.message
          : "Unable to generate the weekly summary. Please try again."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <SectionCard
      title="Weekly AI Summary"
      description="A private, aggregate-only review of your enquiries from the last 7 days."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Generate a concise overview and suggested priorities for the coming week.
          </p>
          <button
            type="button"
            onClick={() => void generateSummary()}
            disabled={isGenerating}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-60"
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isGenerating ? "Generating…" : "Generate Weekly Summary"}
          </button>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {result?.noData ? (
          <p role="status" className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            No enquiries were received in the last 7 days, so there is not enough recent activity to create a useful summary.
          </p>
        ) : null}

        {result && !result.noData && result.counts ? (
          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              {new Date(result.periodStart).toLocaleDateString()} – {new Date(result.periodEnd).toLocaleDateString()}
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Total enquiries</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{result.counts.total}</p>
              </div>
              {Object.entries(result.counts.byInterest).map(([label, count]) => (
                <div key={label} className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{count}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">By status</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {Object.entries(result.counts.byStatus).map(([label, count]) => (
                  <div key={label} className="rounded-lg border border-border px-3 py-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Important patterns</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                  {result.observations?.map((observation, index) => (
                    <li key={`${index}-${observation}`}>{observation}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Suggested actions</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                  {result.suggestedActions?.map((action, index) => (
                    <li key={`${index}-${action}`}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
  )
}

export function DashboardBoard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadStats = async () => {
      try {
        const data = await fetchJson<{ stats: DashboardStats }>("/api/dashboard")

        if (!active) {
          return
        }

        setStats(data.stats)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load dashboard statistics."
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadStats()

    return () => {
      active = false
    }
  }, [])

  const sourceChartData = useMemo(
    () => stats?.bySource ?? [],
    [stats]
  )

  const programmeChartData = useMemo(
    () => stats?.byProgramme ?? [],
    [stats]
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
              <div className="mb-3 h-3 w-20 rounded bg-muted" />
              <div className="h-8 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
          <div className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <CircleDashed className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">No enquiry data yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your dashboard insights will appear here once you start adding enquiries.
          </p>
        </div>
        <WeeklyAiSummary />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Total enquiries" description="All customer enquiries in your CRM">
          <p className="text-3xl font-semibold text-foreground">{stats.total}</p>
        </SectionCard>
        <SectionCard title="New enquiries" description="Fresh leads awaiting follow-up">
          <p className="text-3xl font-semibold text-sky-600">{stats.new}</p>
        </SectionCard>
        <SectionCard title="Interested enquiries" description="Enquiries currently marked Interested">
          <p className="text-3xl font-semibold text-amber-600">{stats.interested}</p>
        </SectionCard>
        <SectionCard title="Paid enquiries" description="Human-confirmed paid enquiries">
          <p className="text-3xl font-semibold text-emerald-600">{stats.paid}</p>
        </SectionCard>
      </div>

      <WeeklyAiSummary />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Enquiries by source" description="Lead volume by acquisition source">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {sourceChartData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [Number(value ?? 0), "Enquiries"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Enquiries by programme" description="Breakdown by interest area">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programmeChartData} margin={{ top: 8, right: 16, left: -12, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" height={54} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [Number(value ?? 0), "Enquiries"]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {programmeChartData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <SectionCard title="Recent enquiries" description="A snapshot of your latest customer conversations">
          <div className="space-y-3">
            {stats.recentEnquiries.map((enquiry) => (
              <div key={enquiry.id} className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{enquiry.name}</p>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {enquiry.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {enquiry.source ?? "Unknown source"} · {enquiry.interest ?? "No interest specified"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(enquiry.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Follow-up reminders" description="Active enquiries waiting at least 48 hours for follow-up">
          <div className="space-y-3">
            {stats.overdueFollowUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enquiries currently need a follow-up.</p>
            ) : (
              stats.overdueFollowUps.map((enquiry) => (
                <div key={enquiry.id} className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm">
                  <p className="font-medium text-rose-700">{enquiry.name}</p>
                  <p className="text-rose-700">{enquiry.source ?? "Unknown source"}</p>
                  <p className="mt-1 text-rose-600">
                    Waiting {formatWaitingTime(enquiry.waiting_ms)} · Since {new Date(enquiry.follow_up_reference_at).toLocaleString()}
                  </p>
                  <Link
                    href={`/enquiries?enquiryId=${encodeURIComponent(enquiry.id)}`}
                    className="mt-2 inline-flex text-sm font-medium text-rose-800 underline underline-offset-2 hover:text-rose-950"
                  >
                    Open enquiry
                  </Link>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming follow-ups" description="Scheduled in the future">
          <div className="space-y-3">
            {stats.upcomingFollowUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming follow-ups.</p>
            ) : (
              stats.upcomingFollowUps.map((enquiry) => (
                <div key={enquiry.id} className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-sm">
                  <p className="font-medium text-sky-700">{enquiry.name}</p>
                  <p className="text-sky-600">
                    {enquiry.follow_up_at ? new Date(enquiry.follow_up_at).toLocaleString() : "Unknown"}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="rounded-2xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4" />
          Stay up to date with your latest CRM activity.
        </div>
      </div>
    </div>
  )
}
