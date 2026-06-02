import { ImageSourcePropType, StyleSheet, View } from 'react-native'
import { useContext } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemeContext } from '../../context'
import { BRAND } from '../../constants/brandColors'
import { RADIUS, SPACING } from '../../constants/layout'
import { ThemedCard } from '../ui/ThemedCard'
import { Text } from '../ui/text'
import { RankSummaryRow } from './RankSummaryRow'

type RankProgressCardProps = {
  badgeSource: ImageSourcePropType
  tierLabel: string
  xpLabel: string
  progressPct: number
  /** Replaces “% to next tier” (e.g. top-5 finish estimate). */
  progressFooter: string
  premiumRim?: boolean
  style?: object
}

export function RankProgressCard({
  badgeSource,
  tierLabel,
  xpLabel,
  progressPct,
  progressFooter,
  premiumRim = false,
  style,
}: RankProgressCardProps) {
  const { theme } = useContext(ThemeContext)

  return (
    <ThemedCard premiumRim={premiumRim} style={style}>
      <RankSummaryRow
        badgeSource={badgeSource}
        title={tierLabel}
        subtitle={xpLabel}
        badgeSize={44}
      />
      <View style={[styles.track, { backgroundColor: theme.borderColor }]}>
        <LinearGradient
          colors={[...BRAND.progressGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${Math.max(0, Math.min(100, progressPct))}%` }]}
        />
      </View>
      <Text variant="muted" className="mt-2 text-right text-xs">
        {progressFooter}
      </Text>
    </ThemedCard>
  )
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
    minWidth: 8,
  },
})
