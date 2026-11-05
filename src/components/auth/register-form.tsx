"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, KeyRound, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function RegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const normalizedName = fullName.trim()
    const normalizedEmail = email.trim()

    if (normalizedName.length < 2) {
      setError("Enter your full name.")
      return
    }

    if (!normalizedEmail) {
      setError("Enter your email address.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: normalizedName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (signUpError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[auth] signUp failed", {
            name: signUpError.name,
            message: signUpError.message,
            status: signUpError.status,
          })
        }
        throw signUpError
      }

      if (!data.user) {
        throw new Error("Supabase did not create a user. Please try again.")
      }

      if (process.env.NODE_ENV === "development") {
        console.info("[auth] signUp succeeded", {
          hasUser: Boolean(data.user),
          hasSession: Boolean(data.session),
        })
      }

      if (data.session) {
        setSuccess("Registration successful. Redirecting...")
        router.replace("/dashboard")
        router.refresh()
        return
      }

      setSuccess("Registration successful. Check your email to verify your account before signing in.")
    } catch (registrationError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[auth] registration flow failed", {
          name:
            registrationError instanceof Error
              ? registrationError.name
              : "UnknownError",
          message:
            registrationError instanceof Error
              ? registrationError.message
              : "Unknown registration error",
          status:
            registrationError instanceof Error && "status" in registrationError
              ? registrationError.status
              : undefined,
        })
      }
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Unable to create your account. Please try again."
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
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up your account to access the BIAI CRM workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="full-name" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <Input
            id="full-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="register-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="register-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
            Confirm password
          </label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            required
          />
        </div>

        {error ? (
          <div role="alert" aria-live="polite" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
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
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
