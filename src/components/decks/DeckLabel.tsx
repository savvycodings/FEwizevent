import { StyleProp, Text, TextStyle } from 'react-native'
import { ToolbarRow } from '@/components/layout/ToolbarRow'
import { rowGrow } from '@/components/layout/PressableRow'
import { deckLabelForId } from '@/constants/deckCatalog'
import { DeckIcon } from './DeckIcon'

type DeckLabelProps = {
  deckId: string | null | undefined
  /** Override catalog label. */
  label?: string | null
  /** e.g. `Current deck:` — shown before the deck name when set. */
  prefix?: string
  iconSize?: number
  numberOfLines?: number
  textStyle?: StyleProp<TextStyle>
  mutedPrefix?: boolean
}

export function DeckLabel({
  deckId,
  label,
  prefix,
  iconSize = 24,
  numberOfLines = 1,
  textStyle,
  mutedPrefix = true,
}: DeckLabelProps) {
  const name = label ?? deckLabelForId(deckId)
  const line = prefix ? `${prefix} ${name}` : name

  return (
    <ToolbarRow style={{ flex: 1, minWidth: 0 }}>
      <DeckIcon deckId={deckId} size={iconSize} accessibilityLabel={name} />
      <Text
        style={[rowGrow.text, textStyle, mutedPrefix && prefix ? { opacity: 0.85 } : null]}
        numberOfLines={numberOfLines}
        ellipsizeMode="tail"
      >
        {line}
      </Text>
    </ToolbarRow>
  )
}
