export class ApiError extends Error {
  status: number
  body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const DEFAULT_BASE_URL = 'http://localhost:8000'

export function getApiBaseUrl(): string {
  const v = (import.meta as any).env?.VITE_API_BASE_URL
  if (typeof v === 'string' && v.trim()) return v.trim().replace(/\/+$/, '')
  return DEFAULT_BASE_URL
}

async function safeReadJson(res: Response): Promise<unknown | undefined> {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return undefined
  try {
    return await res.json()
  } catch {
    return undefined
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`

  const headers = new Headers(init?.headers || {})
  headers.set('accept', 'application/json')
  if (init?.json !== undefined) headers.set('content-type', 'application/json')

  const res = await fetch(url, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  })

  if (res.status === 204) return undefined as T

  const body = await safeReadJson(res)
  if (!res.ok) {
    const detail =
      typeof (body as any)?.detail === 'string'
        ? (body as any).detail
        : `Request failed (${res.status})`
    throw new ApiError(detail, res.status, body)
  }

  if (body === undefined) {
    // Best effort fallback for non-json responses
    return (await res.text()) as unknown as T
  }
  return body as T
}

