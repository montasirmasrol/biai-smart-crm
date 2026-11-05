import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  nextSteps?: string[]
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  nextSteps,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed bg-card shadow-none">
      <CardContent className="flex flex-col gap-4 py-8">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-base font-medium">{title}</h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        {nextSteps && nextSteps.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
