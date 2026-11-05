"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, KeyRound, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setError("Enter your email address.")
      return
    }

    if (!password) {
      setError("Enter your password.")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (signInError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[auth] signInWithPassword failed", {
            name: signInError.name,
            message: signInError.message,
            status: signInError.status,
          })
        }
        throw signInError
      }

      if (!data.session) {
        throw new Error("Sign-in did not create a valid session. Please try again.")
      }

      if (process.env.NODE_ENV === "development") {
        console.info("[auth] signInWithPassword succeeded", {
          hasSession: Boolean(data.session),
          cookieNames: document.cookie
            .split(";")
            .map((cookie) => cookie.split("=", 1)[0]?.trim())
            .filter(Boolean),
        })
      }

      setSuccess("Login successful. Redirecting...")
      window.setTimeout(() => {
        router.replace("/dashboard")
        router.refresh()
      }, 250)
    } catch (loginError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[auth] login flow failed unexpectedly", {
          name: loginError instanceof Error ? loginError.name : "UnknownError",
          message:
            loginError instanceof Error ? loginError.message : "Unknown login error",
          status:
            loginError instanceof Error && "status" in loginError
              ? loginError.status
              : undefined,
        })
      }
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in. Check your credentials and try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to view enquiries, pipeline updates, and AI-assisted CRM workflows.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        {error ? (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div role="status" aria-live="polite" className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {isSubmitting ? (
          <p role="status" aria-live="polite" className="text-center text-sm text-muted-foreground">
            Submitting...
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  )
}
