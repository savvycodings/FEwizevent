import AsyncStorage from '@react-native-async-storage/async-storage'

const ADMIN_PASS_KEY = 'wizardevent-admin-pass'

let adminPass: string | null = null
let loadPromise: Promise<void> | null = null

async function ensureLoaded() {
  if (adminPass !== null) return
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        adminPass = await AsyncStorage.getItem(ADMIN_PASS_KEY)
      } catch {
        adminPass = null
      }
    })()
  }
  await loadPromise
}

export async function hydrateAdminPass() {
  await ensureLoaded()
}

export function setAdminPass(pass: string | null) {
  adminPass = pass
  if (pass) {
    AsyncStorage.setItem(ADMIN_PASS_KEY, pass).catch(() => {})
  } else {
    AsyncStorage.removeItem(ADMIN_PASS_KEY).catch(() => {})
  }
}

export function clearAdminPass() {
  adminPass = null
  AsyncStorage.removeItem(ADMIN_PASS_KEY).catch(() => {})
}

export function hasAdminPass(): boolean {
  return Boolean(adminPass)
}

export function getAdminPassHeaders(): Record<string, string> {
  if (!adminPass) return {}
  return { 'x-admin-pass': adminPass }
}
