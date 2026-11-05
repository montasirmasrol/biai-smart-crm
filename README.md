# BIAI Smart CRM

Professional CRM foundation for an AI internship assignment.

Tech stack:

- Next.js App Router + TypeScript
- Tailwind CSS (v4) + shadcn/ui
- Supabase PostgreSQL + Supabase Auth
- OpenAI API (server-side only)
- Lucide React + Recharts

## Current Scope

This repository currently focuses on architecture and shared layout only:

- SaaS dashboard shell and responsive navigation
- Collapsible sidebar with app sections
- Reusable page and section components
- Server route scaffolding for sensitive operations
- No mock CRM records in production-facing components

Feature implementation (real dashboard analytics, enquiry CRUD, pipeline board, assistant chat) is intentionally deferred.

## App Architecture

### Route groups

- `src/app/(app)`
	- Authenticated app workspace with shared shell layout.
- `src/app/(auth)`
	- Authentication pages with a simplified layout.
- `src/app/api`
	- Server-only route handlers for data and AI operations.

### Shared layout system

- `src/components/layout/app-shell.tsx`
	- Root shell composition (sidebar + header + content container).
- `src/components/layout/app-sidebar.tsx`
	- Collapsible navigation for Dashboard, Enquiries, Pipeline, AI Assistant, Settings.
- `src/components/layout/app-header.tsx`
	- Sticky contextual header and sidebar trigger.
- `src/components/layout/crm-page-layout.tsx`
	- Reusable page scaffold with page header, main area, and optional aside panel.
- `src/components/layout/section-card.tsx`
	- Reusable section block for consistent card-based content zones.
- `src/components/layout/empty-state.tsx`
	- Placeholder content for not-yet-implemented features without fake metrics.

### Data and security boundaries

- `src/lib/supabase/server.ts`
	- Server Supabase client utility (cookie-aware).
- `src/lib/data/enquiries.ts`
	- Server-only data access for enquiries.
- `src/lib/openai/client.ts`
	- Server-only OpenAI client factory.
- `src/app/api/ai/chat/route.ts`
	- AI route handler scaffold with input validation.
- `src/app/api/enquiries/route.ts`
	- Enquiry route handler scaffold.

## Design Direction Applied

- White and light-gray surfaces
- Dark navy foreground hierarchy
- Subtle green primary accent
- Rounded cards and minimal borders
- Responsive desktop/mobile behavior

## Local Development

1. Install dependencies.
2. Add environment variables in `.env.local`:
	 - `NEXT_PUBLIC_SUPABASE_URL`
	 - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	 - `OPENAI_API_KEY`
3. Run:

```bash
npm run dev
```

Open http://localhost:3000.
