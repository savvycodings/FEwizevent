/** Same blue as Events hero (`theme.tintColor` / wizardsGreen). */
export const HOME_HERO_TOP_COLOR = '#8FD3FF'

/** Solid hero (gradient removed); kept for any legacy imports. */
export const HOME_HERO_GRADIENT = [HOME_HERO_TOP_COLOR, HOME_HERO_TOP_COLOR] as const

export const HOME_HERO_GRADIENT_LOCATIONS = [0, 1] as const

export const HOME_HERO_GRADIENT_START = { x: 0.5, y: 0 } as const

export const HOME_HERO_GRADIENT_END = { x: 0.5, y: 1 } as const
