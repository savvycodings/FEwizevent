import { AnthropicIcon } from './src/components/AnthropicIcon'
import { GeminiIcon } from './src/components/GeminiIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'
import { Platform } from 'react-native'

const normalizeDomain = (value?: string) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/+$/, '')
  }
  const host = trimmed.replace(/\/+$/, '')
  // Local dev: use http. Public hosts (Railway, etc.): use https — http:// often causes "network request failed" on device.
  const isLocal =
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('10.0.2.2') ||
    /^192\.168\.\d+\.\d+$/.test(host)
  const scheme = isLocal ? 'http' : 'https'
  return `${scheme}://${host}`
}

/** Android emulator cannot reach host machine via localhost — use 10.0.2.2 */
function resolveDevApiForPlatform(url: string): string {
  if (Platform.OS !== 'android') return url
  try {
    const withScheme = url.startsWith('http') ? url : `http://${url}`
    const parsed = new URL(withScheme)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = '10.0.2.2'
      return parsed.toString().replace(/\/+$/, '')
    }
  } catch {
    /* keep original */
  }
  return url
}

const env = (process.env.EXPO_PUBLIC_ENV || 'DEVELOPMENT').toUpperCase()
const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL
const prodUrl = process.env.EXPO_PUBLIC_PROD_API_URL
const rawDomain = env === 'DEVELOPMENT' ? devUrl : prodUrl
const fallbackDevDomain = Platform.OS === 'android' ? 'http://10.0.2.2:3060' : 'http://localhost:3060'

const normalized = normalizeDomain(rawDomain || devUrl || prodUrl || fallbackDevDomain)
export const DOMAIN =
  env === 'DEVELOPMENT' ? resolveDevApiForPlatform(normalized) : normalized

if (__DEV__) {
  console.log('[api] EXPO_PUBLIC_ENV=', env, 'DOMAIN=', DOMAIN)
}

export const MODELS = {
  claudeOpus47: {
    name: 'Claude Opus 4.7',
    label: 'claudeOpus47',
    icon: AnthropicIcon
  },
  claudeOpus: {
    name: 'Claude Opus',
    label: 'claudeOpus',
    icon: AnthropicIcon
  },
  claudeSonnet: {
    name: 'Claude Sonnet',
    label: 'claudeSonnet',
    icon: AnthropicIcon
  },
  claudeHaiku: {
    name: 'Claude Haiku',
    label: 'claudeHaiku',
    icon: AnthropicIcon
  },
  claudeSonnet4: {
    name: 'Claude Sonnet 4',
    label: 'claudeSonnet4',
    icon: AnthropicIcon
  },
  gpt52: { name: 'GPT 5.2', label: 'gpt52', icon: OpenAIIcon },
  gpt5Mini: { name: 'GPT 5 Mini', label: 'gpt5Mini', icon: OpenAIIcon },
  gemini: { name: 'Gemini', label: 'gemini', icon: GeminiIcon },
}

export const IMAGE_MODELS = {
  nanoBanana: { name: 'Nano Banana (Gemini Flash Image)', label: 'nanoBanana' },
  nanoBananaPro: { name: 'Nano Banana Pro (Gemini 3 Pro)', label: 'nanoBananaPro' },
}
