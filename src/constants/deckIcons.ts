import type { FC } from 'react'
import type { SvgProps } from 'react-native-svg'

import AlakazamIcon from '../../assets/decks/Alakazam.svg'
import ClefairyIcon from '../../assets/decks/Clefairy.svg'
import CrustleIcon from '../../assets/decks/Crustle.svg'
import DiancieIcon from '../../assets/decks/Diancie.svg'
import DragapultIcon from '../../assets/decks/Dragapult.svg'
import GarchompIcon from '../../assets/decks/Garchomp.svg'
import HydrappleIcon from '../../assets/decks/Hydrapple.svg'
import KangaskhanIcon from '../../assets/decks/Kangaskhan.svg'
import LopunnyIcon from '../../assets/decks/Lopunny.svg'
import LucarioIcon from '../../assets/decks/Lucario.svg'
import OgerponIcon from '../../assets/decks/Ogerpon.svg'
import RagingBoltIcon from '../../assets/decks/RagingBolt.svg'
import SlowkingIcon from '../../assets/decks/Slowking.svg'
import WellspringIcon from '../../assets/decks/Wellspring.svg'
import ZoroarkIcon from '../../assets/decks/Zoroark.svg'

export type DeckIconComponent = FC<SvgProps>

/** Maps catalog `deckId` → character SVG in `app/assets/decks/`. */
export const DECK_ICON_BY_ID: Record<string, DeckIconComponent> = {
  dragapult: DragapultIcon,
  'raging-bolt': RagingBoltIcon,
  alakazam: AlakazamIcon,
  'lopunny-mega': LopunnyIcon,
  'ogerponogerpon-wellspring': OgerponIcon,
  crustle: CrustleIcon,
  hydrapple: HydrappleIcon,
  garchomp: GarchompIcon,
  zoroark: ZoroarkIcon,
  'lucario-mega': LucarioIcon,
  ogerponmeganium: OgerponIcon,
  slowking: SlowkingIcon,
  clefairy: ClefairyIcon,
  'noctowlogerpon-wellspring': WellspringIcon,
  'kangaskhan-mega': KangaskhanIcon,
  'diancie-mega': DiancieIcon,
}

export function deckIconForId(deckId: string | null | undefined): DeckIconComponent | null {
  if (!deckId) return null
  return DECK_ICON_BY_ID[deckId] ?? null
}
