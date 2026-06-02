export const HOME_STORE_ORDER = ['glendower', 'rosebank'] as const

export type HomeStore = (typeof HOME_STORE_ORDER)[number]

export const HOME_STORE_LABEL: Record<HomeStore, string> = {
  glendower: 'Glendower',
  rosebank: 'Rosebank',
}

export const HOME_STORE_SEGMENT_OPTIONS = HOME_STORE_ORDER.map((value) => ({
  value,
  label: HOME_STORE_LABEL[value],
}))
