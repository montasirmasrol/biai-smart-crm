import { RegisterForm } from "@/components/auth/register-form"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata(
  "Create an account",
  "Create a Supabase account to access the BIAI CRM."
)

export default function RegisterPage() {
  return <RegisterForm />
}
