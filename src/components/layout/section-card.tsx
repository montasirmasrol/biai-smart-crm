import type { ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SectionCardProps = {
  title: string
  description?: string
  children?: ReactNode
}

export function SectionCard({
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <Card className="rounded-2xl border-border/90 shadow-none">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      {children ? <CardContent className="pt-4">{children}</CardContent> : null}
    </Card>
  )
}