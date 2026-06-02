import { StyleSheet, Text, View } from 'react-native'
import { DeckIcon } from './DeckIcon'

export type LossOpponent = {
  userId: number
  name: string
  deckId: string | null
}

function firstName(full: string): string {
  const part = full.trim().split(/\s+/)[0]
  return part || full
}

type LostToCellProps = {
  opponents: LossOpponent[]
  textStyle?: object
  iconSize?: number
}

/** Renders `[icon] Jason | [icon] Morgan` for event loss chains (deck = icon only). */
export function LostToCell({ opponents, textStyle, iconSize = 18 }: LostToCellProps) {
  if (!opponents.length) {
    return <Text style={textStyle}>—</Text>
  }

  return (
    <View style={styles.row}>
      {opponents.map((opp, index) => {
        const player = firstName(opp.name)
        return (
          <View key={`${opp.userId}-${index}`} style={styles.segment}>
            {index > 0 ? <Text style={[textStyle, styles.sep]}> | </Text> : null}
            <View style={styles.chip}>
              <DeckIcon deckId={opp.deckId} size={iconSize} accessibilityLabel={opp.name} />
              <Text style={[textStyle, styles.chipText]} numberOfLines={1}>
                {player || '—'}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 2,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  chipText: {
    flexShrink: 1,
  },
  sep: {
    marginHorizontal: 2,
  },
})
