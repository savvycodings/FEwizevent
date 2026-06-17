import { useCallback, useContext, useMemo, useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { ScreenHero, ScreenSurface, ThemedCard } from '../components'
import { ThemeContext } from '../context'
import { apiRequest } from '../api'
import {
  DEFAULT_PLACEMENT_XP,
  EVENT_TIER_MULTIPLIER,
  JUDGED_AWARD_BASE_XP,
  PLACEMENT_XP,
  RANK_BADGE_ASSET,
  RANK_MIN_XP,
  RANK_ORDER,
  formatRankXpRange,
  formatRankXpThreshold,
  type RankTier,
} from '../data/rankSystem'
import { SPACING, TYPOGRAPHY } from '../constants/layout'

const PLACEMENT_ROWS: { label: string; xp: number }[] = [
  { label: '1st place', xp: PLACEMENT_XP[1] },
  { label: '2nd place', xp: PLACEMENT_XP[2] },
  { label: '3rd place', xp: PLACEMENT_XP[3] },
  { label: '4th–5th place', xp: PLACEMENT_XP[4] },
  { label: '6th–7th place', xp: PLACEMENT_XP[6] },
  { label: '8th place or lower', xp: DEFAULT_PLACEMENT_XP },
]

const TIER_ROWS: { label: string; multiplier: number }[] = [
  { label: 'Casual', multiplier: EVENT_TIER_MULTIPLIER.casual },
  { label: 'Challenge', multiplier: EVENT_TIER_MULTIPLIER.challenge },
  { label: 'Cup', multiplier: EVENT_TIER_MULTIPLIER.cup },
]

export function RankSystemGuide() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [thresholds, setThresholds] = useState<Record<RankTier, number>>(RANK_MIN_XP)

  useFocusEffect(
    useCallback(() => {
      apiRequest<{ season?: { rankThresholds?: Record<RankTier, number> } | null }>(
        '/auth/league/active-season'
      )
        .then((res) => {
          if (res.season?.rankThresholds) setThresholds(res.season.rankThresholds)
        })
        .catch(() => {})
    }, [])
  )

  const rankRows = useMemo(
    () =>
      RANK_ORDER.map((tier) => ({
        tier,
        minXp: thresholds[tier] ?? RANK_MIN_XP[tier],
        xpRange: formatRankXpRange(tier, thresholds),
      })),
    [thresholds]
  )

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHero title="Rank system" />

      <ScreenSurface style={styles.surface}>
        <Text style={styles.sectionTitle}>XP from placements</Text>
        <Text style={styles.hint}>Size bonus: +2 XP per opponent (1st), +1 (2nd), then × event tier.</Text>
        <ThemedCard style={styles.card}>
          {PLACEMENT_ROWS.map((row, index) => (
            <View
              key={row.label}
              style={[styles.dataRow, index < PLACEMENT_ROWS.length - 1 && styles.dataRowBorder]}
            >
              <Text style={styles.dataLabel}>{row.label}</Text>
              <Text style={styles.dataValue}>{row.xp} XP base</Text>
            </View>
          ))}
        </ThemedCard>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Event tiers</Text>
        <ThemedCard style={styles.card}>
          {TIER_ROWS.map((row, index) => (
            <View
              key={row.label}
              style={[styles.dataRow, index < TIER_ROWS.length - 1 && styles.dataRowBorder]}
            >
              <Text style={styles.dataLabel}>{row.label}</Text>
              <Text style={styles.dataValue}>×{row.multiplier.toFixed(1)} XP</Text>
            </View>
          ))}
        </ThemedCard>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Judged awards</Text>
        <ThemedCard style={styles.card}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Best Bling / Best Rogue</Text>
            <Text style={styles.dataValue}>{JUDGED_AWARD_BASE_XP} XP base</Text>
          </View>
        </ThemedCard>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>All ranks</Text>
        <Text style={styles.hint}>Season rank is from season XP. Resets each season.</Text>
        {rankRows.map((row, index) => (
          <RankGuideRow
            key={row.tier}
            styles={styles}
            tier={row.tier}
            minXp={row.minXp}
            xpRange={row.xpRange}
            isLast={index === rankRows.length - 1}
          />
        ))}
      </ScreenSurface>
    </ScrollView>
  )
}

function RankGuideRow({
  styles,
  tier,
  minXp,
  xpRange,
  isLast,
}: {
  styles: ReturnType<typeof getStyles>
  tier: RankTier
  minXp: number
  xpRange: string
  isLast: boolean
}) {
  return (
    <ThemedCard style={isLast ? styles.rankCardLast : styles.rankCard}>
      <View style={styles.rankRow}>
        <Image source={RANK_BADGE_ASSET[tier]} style={styles.rankBadge} resizeMode="contain" />
        <View style={styles.rankCopy}>
          <Text style={styles.rankName}>{tier}</Text>
          <Text style={styles.rankThreshold}>
            {minXp > 0 ? `Requires ${formatRankXpThreshold(minXp)}` : 'Starting rank'} · {xpRange}
          </Text>
        </View>
      </View>
    </ThemedCard>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      paddingBottom: SPACING['3xl'],
    },
    surface: {
      gap: SPACING.sm,
    },
    sectionTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      marginTop: SPACING.sm,
    },
    sectionTitleSpaced: {
      marginTop: SPACING.lg,
    },
    hint: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    card: {
      marginTop: SPACING.xs,
    },
    dataRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    dataRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    dataLabel: {
      flex: 1,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    dataValue: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    rankCard: {
      marginTop: SPACING.sm,
    },
    rankCardLast: {
      marginTop: SPACING.sm,
      marginBottom: 0,
    },
    rankRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.md,
    },
    rankBadge: {
      width: 52,
      height: 52,
    },
    rankCopy: {
      flex: 1,
      minWidth: 0,
    },
    rankName: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    rankThreshold: {
      marginTop: 2,
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
  })
