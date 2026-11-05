import { LoginForm } from "@/components/auth/login-form"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata(
  "Sign in",
  "Sign in with your Supabase account to access the BIAI CRM."
)

export default function LoginPage() {
  return <LoginForm />
}
