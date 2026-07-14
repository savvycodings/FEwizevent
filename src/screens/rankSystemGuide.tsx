import { useCallback, useContext, useMemo, useState } from 'react'
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { BadgeVectorIcon, ThemedCard } from '../components'
import { AppContext, ThemeContext } from '../context'
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
import {
  RANK_ENTITLEMENT_REWARD,
  entitlementStatusHint,
  type EntitlementTier,
} from '../data/rankCatalog'
import type { EntitlementStatus, RankEntitlementItem } from '../data/rankEntitlements'
import type { BadgeId } from '../data/badgesCatalog'
import { parseActiveSeasonBadges, type BadgeDefinitionRow } from '../utils/badgeDefinitions'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { HOME_STORE_LABEL, HOME_STORE_ORDER } from '../constants/stores'

const OFFICIAL_STORES = HOME_STORE_ORDER.map((store) => HOME_STORE_LABEL[store]).join(' or ')

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

type RankRow = {
  tier: RankTier
  minXp: number
  xpRange: string
  reward: string
  status: EntitlementStatus | null
}

type BadgeRow = {
  id: string
  title: string
  blurb: string
  xpReward: number
  earned: boolean
}

type GuideItem =
  | { key: string; kind: 'section'; title: string; hint?: string; spaced?: boolean }
  | { key: string; kind: 'placement' }
  | { key: string; kind: 'tiers' }
  | { key: string; kind: 'judged' }
  | { key: string; kind: 'rank'; row: RankRow; isLast: boolean }
  | { key: string; kind: 'claim' }
  | { key: string; kind: 'badge'; row: BadgeRow; isLast: boolean }

export function RankSystemGuide() {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const [thresholds, setThresholds] = useState<Record<RankTier, number>>(RANK_MIN_XP)
  const [rewardMap, setRewardMap] = useState<Record<EntitlementTier, string>>(RANK_ENTITLEMENT_REWARD)
  const [entitlements, setEntitlements] = useState<RankEntitlementItem[]>([])
  const [badgeDefinitions, setBadgeDefinitions] = useState<BadgeDefinitionRow[]>(
    parseActiveSeasonBadges(undefined)
  )
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<BadgeId>>(new Set())

  useFocusEffect(
    useCallback(() => {
      let cancelled = false

      async function load() {
        const seasonPromise = apiRequest<{
          season?: {
            rankThresholds?: Record<RankTier, number>
            rewardMap?: Record<EntitlementTier, string>
          } | null
          badges?: BadgeDefinitionRow[]
        }>('/auth/league/active-season')
          .then((res) => res)
          .catch(() => null)

        const entitlementsPromise =
          currentUser?.id != null
            ? apiRequest<{ entitlements?: RankEntitlementItem[] }>(
                `/auth/rank-entitlements?userId=${currentUser.id}`
              )
                .then((res) => res.entitlements ?? [])
                .catch(() => [] as RankEntitlementItem[])
            : Promise.resolve([] as RankEntitlementItem[])

        const badgesPromise =
          currentUser?.id != null
            ? apiRequest<{ badges?: { badgeId: BadgeId }[] }>(`/admin/users/${currentUser.id}/details`)
                .then((res) => {
                  const next = new Set<BadgeId>()
                  for (const badge of res.badges ?? []) {
                    if (badge?.badgeId) next.add(badge.badgeId)
                  }
                  return next
                })
                .catch(() => new Set<BadgeId>())
            : Promise.resolve(new Set<BadgeId>())

        const [seasonRes, nextEntitlements, nextEarned] = await Promise.all([
          seasonPromise,
          entitlementsPromise,
          badgesPromise,
        ])

        if (cancelled) return

        if (seasonRes?.season?.rankThresholds) setThresholds(seasonRes.season.rankThresholds)
        if (seasonRes?.season?.rewardMap) {
          setRewardMap({ ...RANK_ENTITLEMENT_REWARD, ...seasonRes.season.rewardMap })
        }
        setBadgeDefinitions(parseActiveSeasonBadges(seasonRes?.badges))
        setEntitlements(nextEntitlements)
        setEarnedBadgeIds(nextEarned)
      }

      void load()
      return () => {
        cancelled = true
      }
    }, [currentUser?.id])
  )

  const entitlementByTier = useMemo(() => {
    const map = new Map<EntitlementTier, RankEntitlementItem>()
    for (const row of entitlements) map.set(row.tier, row)
    return map
  }, [entitlements])

  const rankRows = useMemo(
    () =>
      RANK_ORDER.map((tier) => {
        const entitlement = entitlementByTier.get(tier)
        return {
          tier,
          minXp: thresholds[tier] ?? RANK_MIN_XP[tier],
          xpRange: formatRankXpRange(tier, thresholds),
          reward: entitlement?.reward ?? rewardMap[tier] ?? RANK_ENTITLEMENT_REWARD[tier],
          status: entitlement?.status ?? null,
        }
      }),
    [entitlementByTier, rewardMap, thresholds]
  )

  const badgeRows = useMemo(
    () =>
      badgeDefinitions.map((def) => ({
        id: def.id,
        title: def.title,
        blurb: def.description,
        xpReward: def.xpReward,
        earned: earnedBadgeIds.has(def.id as BadgeId),
      })),
    [badgeDefinitions, earnedBadgeIds]
  )

  const listItems = useMemo<GuideItem[]>(() => {
    const items: GuideItem[] = [
      {
        key: 'sec-placements',
        kind: 'section',
        title: 'XP from placements',
        hint: 'Size bonus: +2 XP per opponent (1st), +1 (2nd), then × event tier.',
      },
      { key: 'placement', kind: 'placement' },
      { key: 'sec-tiers', kind: 'section', title: 'Event tiers', spaced: true },
      { key: 'tiers', kind: 'tiers' },
      { key: 'sec-judged', kind: 'section', title: 'Judged awards', spaced: true },
      { key: 'judged', kind: 'judged' },
      {
        key: 'sec-ranks',
        kind: 'section',
        title: 'All ranks',
        spaced: true,
        hint: 'Season rank is from season XP. Resets each season. Each rank unlocks a prize entitlement.',
      },
      ...rankRows.map((row, index) => ({
        key: `rank-${row.tier}`,
        kind: 'rank' as const,
        row,
        isLast: index === rankRows.length - 1,
      })),
      { key: 'sec-claim', kind: 'section', title: 'Claiming your rewards', spaced: true },
      { key: 'claim', kind: 'claim' },
      {
        key: 'sec-badges',
        kind: 'section',
        title: 'Badges you can earn',
        spaced: true,
        hint: 'Earn badges at events. Some are awarded automatically; others are given by staff at the prize desk.',
      },
      ...badgeRows.map((row, index) => ({
        key: `badge-${row.id}`,
        kind: 'badge' as const,
        row,
        isLast: index === badgeRows.length - 1,
      })),
    ]
    return items
  }, [badgeRows, rankRows])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<GuideItem>) => {
      switch (item.kind) {
        case 'section':
          return (
            <View>
              <Text style={[styles.sectionTitle, item.spaced && styles.sectionTitleSpaced]}>
                {item.title}
              </Text>
              {item.hint ? <Text style={styles.hint}>{item.hint}</Text> : null}
            </View>
          )
        case 'placement':
          return (
            <ThemedCard compact style={styles.card}>
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
          )
        case 'tiers':
          return (
            <ThemedCard compact style={styles.card}>
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
          )
        case 'judged':
          return (
            <ThemedCard compact style={styles.card}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Best Bling / Best Rogue</Text>
                <Text style={styles.dataValue}>{JUDGED_AWARD_BASE_XP} XP base</Text>
              </View>
            </ThemedCard>
          )
        case 'rank':
          return <RankGuideRow styles={styles} row={item.row} isLast={item.isLast} />
        case 'claim':
          return (
            <Text style={styles.claimHint}>
              To claim rank rewards you have earned, visit one of our official stores ({OFFICIAL_STORES}).
              A staff member will redeem your entitlement in the app and hand you the prizes you have
              unlocked.
            </Text>
          )
        case 'badge':
          return (
            <BadgeGuideRow styles={styles} theme={theme} row={item.row} isLast={item.isLast} />
          )
        default:
          return null
      }
    },
    [styles, theme]
  )

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={listItems}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews
      initialNumToRender={12}
      windowSize={8}
      maxToRenderPerBatch={8}
      updateCellsBatchingPeriod={50}
    />
  )
}

function RankGuideRow({
  styles,
  row,
  isLast,
}: {
  styles: ReturnType<typeof getStyles>
  row: RankRow
  isLast: boolean
}) {
  const statusHint = row.status ? entitlementStatusHint(row.status) : null

  return (
    <ThemedCard compact style={isLast ? styles.rankCardLast : styles.rankCard}>
      <View style={styles.rankRow}>
        <Image
          source={RANK_BADGE_ASSET[row.tier]}
          style={styles.rankBadge}
          resizeMode="contain"
          pointerEvents="none"
        />
        <View style={styles.rankCopy} pointerEvents="box-none">
          <Text style={styles.rankName}>{row.tier}</Text>
          <Text style={styles.rankThreshold}>
            {row.minXp > 0 ? `Requires ${formatRankXpThreshold(row.minXp)}` : 'Starting rank'} ·{' '}
            {row.xpRange}
          </Text>
          <Text style={styles.rankReward}>{row.reward}</Text>
          {statusHint ? <Text style={styles.rankStatus}>{statusHint}</Text> : null}
        </View>
      </View>
    </ThemedCard>
  )
}

function BadgeGuideRow({
  styles,
  theme,
  row,
  isLast,
}: {
  styles: ReturnType<typeof getStyles>
  theme: { tintColor: string; mutedForegroundColor: string }
  row: BadgeRow
  isLast: boolean
}) {
  return (
    <ThemedCard compact style={isLast ? styles.badgeCardLast : styles.badgeCard}>
      <View style={styles.badgeRow}>
        <View style={styles.badgeCopy} pointerEvents="box-none">
          <Text style={styles.badgeTitle}>{row.title}</Text>
          <Text style={styles.badgeBlurb}>{row.blurb}</Text>
          {row.xpReward > 0 ? (
            <Text style={styles.badgeXp}>+{row.xpReward} season XP (one-time)</Text>
          ) : null}
          {row.earned ? <Text style={styles.badgeEarned}>Earned this season</Text> : null}
        </View>
        <View style={styles.badgeIconWrap} pointerEvents="none">
          <BadgeVectorIcon
            badgeId={row.id}
            size={44}
            color={row.earned ? theme.tintColor : theme.mutedForegroundColor}
            opacity={row.earned ? 1 : 0.45}
          />
        </View>
      </View>
    </ThemedCard>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      // Tint matches header so top overscroll does not flash black.
      backgroundColor: theme.tintColor,
    },
    content: {
      flexGrow: 1,
      backgroundColor: theme.backgroundColor,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.sectionGap,
      paddingBottom: SPACING['3xl'],
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
    claimHint: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.45,
    },
    card: {
      marginTop: SPACING.xs,
    },
    dataRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.md,
      paddingVertical: SPACING.xs,
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
      alignItems: 'center',
      gap: SPACING.md,
    },
    rankBadge: {
      width: 48,
      height: 48,
      alignSelf: 'center',
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
    rankReward: {
      marginTop: SPACING.xs,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
    },
    rankStatus: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    badgeCard: {
      marginTop: SPACING.sm,
    },
    badgeCardLast: {
      marginTop: SPACING.sm,
      marginBottom: 0,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    badgeCopy: {
      flex: 1,
      minWidth: 0,
    },
    badgeTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      lineHeight: TYPOGRAPHY.body * 1.25,
    },
    badgeBlurb: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: Math.round(TYPOGRAPHY.caption * 1.45),
    },
    badgeXp: {
      marginTop: SPACING.xs,
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    badgeEarned: {
      marginTop: SPACING.xs,
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    badgeIconWrap: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
