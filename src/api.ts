import { DOMAIN } from '../constants'

const nonJsonHint =
  'Server returned a web page instead of JSON — check EXPO_PUBLIC_DEV_API_URL. Use your PC LAN IP (e.g. http://192.168.1.5:3050) on a real device; Android emulator can use http://10.0.2.2:3050; iOS simulator often needs http://127.0.0.1:3050.'

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const trimmed = text.trim()
  if (trimmed.startsWith('<')) {
    throw new Error(
      `${nonJsonHint} (${response.status}) ${trimmed.slice(0, 100).replace(/\s+/g, ' ')}`
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
  const response = await fetch(`${DOMAIN}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })

  const data = await readJsonResponse<T & { error?: string }>(response)
  if (!response.ok) {
    throw new Error((data as any)?.error || 'Request failed')
  }
  return data as T
}
