import { Pressable, StyleSheet, View } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../../context'
import { deckShortLabelForId } from '@/constants/deckCatalog'
import { RADIUS, SPACING } from '../../constants/layout'
import { DeckIcon } from '../decks/DeckIcon'
import { AppIcon } from '../ui/app-icon'
import { ThemedCard } from '../ui/ThemedCard'
import { Text } from '../ui/text'

type FeedEventCardProps = {
  title: string
  subtitle?: string
  timeLabel: string
  placementLabel?: string | null
  /** Deck used at this event (from event attendance, not current profile). */
  deckId?: string | null
  onPress?: () => void
  premiumRim?: boolean
  accessibilityLabel?: string
}

export function FeedEventCard({
  title,
  subtitle = 'Marked attended',
  timeLabel,
  placementLabel,
  deckId,
  onPress,
  premiumRim = false,
  accessibilityLabel,
}: FeedEventCardProps) {
  const { theme } = useContext(ThemeContext)
  const deckLine = deckId ? deckShortLabelForId(deckId) : ''

  const card = (
    <ThemedCard premiumRim={premiumRim} style={styles.card}>
      {timeLabel ? (
        <View style={styles.header}>
          <View style={[styles.iconBubble, { backgroundColor: `${theme.tintColor}26` }]}>
            <AppIcon name="trophy" size={16} color={theme.tintColor} />
          </View>
          <Text variant="muted" className="text-xs">
            {timeLabel}
          </Text>
        </View>
      ) : null}
      <Text className="text-lg font-bold text-foreground">{title}</Text>
      {subtitle ? (
        <Text variant="muted" className="mt-1 text-sm">
          {subtitle}
        </Text>
      ) : null}
      {deckLine ? (
        <View style={styles.deckRow}>
          <DeckIcon deckId={deckId} size={18} />
          <Text variant="muted" className="text-sm">
            {deckLine}
          </Text>
        </View>
      ) : null}
      {placementLabel ? (
        <View style={[styles.chip, { borderColor: `${theme.tintColor}59`, backgroundColor: `${theme.tintColor}2e` }]}>
          <Text className="text-xs font-semibold text-primary">{placementLabel}</Text>
        </View>
      ) : null}
    </ThemedCard>
  )

  if (!onPress) {
    return card
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `Open ${title}`}
    >
      {card}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  pressed: {
    opacity: 0.92,
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  card: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
})
