import { DOMAIN } from '../constants'
import { getAdminPassHeaders } from './adminSession'

const nonJsonHint =
  'Server returned a web page instead of JSON — check EXPO_PUBLIC_DEV_API_URL. Use your PC LAN IP (e.g. http://192.168.1.5:3060) on a real device; Android emulator can use http://10.0.2.2:3060; iOS simulator often needs http://127.0.0.1:3060.'

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${DOMAIN}${p}`
}

export async function readJsonResponse<T>(response: Response, requestUrl?: string): Promise<T> {
  const text = await response.text()
  const trimmed = text.trim()
  if (trimmed.startsWith('<')) {
    const where = requestUrl ? ` GET ${requestUrl}` : ''
    const routeHint =
      response.status === 404
        ? ' Route not found on that host — run local server (pnpm dev in server/) with EXPO_PUBLIC_DEV_API_URL=http://10.0.2.2:3060, or deploy latest server to production.'
        : ''
    throw new Error(
      `${nonJsonHint}${routeHint}${where} (${response.status}) ${trimmed.slice(0, 80).replace(/\s+/g, ' ')}`
    )
  }
  let data: T
  try {
    data = trimmed ? (JSON.parse(trimmed) as T) : ({} as T)
  } catch {
    throw new Error(
      `${nonJsonHint} (${response.status}) ${trimmed.slice(0, 100).replace(/\s+/g, ' ')}`
    )
  }
  return data
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers: initHeaders, ...restInit } = init ?? {}
  const url = apiUrl(path)
  const response = await fetch(url, {
    ...restInit,
    headers: {
      'Content-Type': 'application/json',
      ...getAdminPassHeaders(),
      ...(initHeaders as Record<string, string> | undefined),
    },
  })

  const data = await readJsonResponse<T & { error?: string }>(response, url)
  if (!response.ok) {
    throw new Error((data as any)?.error || 'Request failed')
  }
  return data as T
}
