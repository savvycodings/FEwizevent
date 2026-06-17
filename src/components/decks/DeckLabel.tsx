import { StyleProp, Text, TextStyle, View } from 'react-native'
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
  iconPosition?: 'left' | 'right'
}

export function DeckLabel({
  deckId,
  label,
  prefix,
  iconSize = 24,
  numberOfLines = 1,
  textStyle,
  mutedPrefix = true,
  iconPosition = 'left',
}: DeckLabelProps) {
  const name = label ?? deckLabelForId(deckId)
  const line = prefix ? `${prefix} ${name}` : name
  const icon = <DeckIcon deckId={deckId} size={iconSize} accessibilityLabel={name} />
  const text = (
    <Text
      style={[
        iconPosition === 'left' ? rowGrow.text : null,
        textStyle,
        mutedPrefix && prefix ? { opacity: 0.85 } : null,
      ]}
      numberOfLines={numberOfLines}
      ellipsizeMode="tail"
    >
      {line}
    </Text>
  )

  return (
    <ToolbarRow style={{ flex: 1, minWidth: 0, alignSelf: iconPosition === 'right' ? 'flex-start' : undefined }}>
      {iconPosition === 'left' ? (
        <>
          {icon}
          {text}
        </>
      ) : (
        <>
          {text}
          <View style={rowGrow.end}>{icon}</View>
        </>
      )}
    </ToolbarRow>
  )
}
