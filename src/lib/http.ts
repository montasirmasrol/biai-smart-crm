import { NextResponse } from "next/server"

export type ApiErrorBody = {
  error: string
  details?: unknown
}

export function jsonError(
  error: string,
  status: number,
  details?: unknown
) {
  const body: ApiErrorBody = details === undefined ? { error } : { error, details }
  return NextResponse.json(body, { status })
}

export function jsonOk<T extends object>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}
