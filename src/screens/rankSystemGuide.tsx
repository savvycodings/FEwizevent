import { useCallback, useContext, useMemo, useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { BadgeVectorIcon, ScreenHero, ScreenSurface, ThemedCard } from '../components'
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
import { SPACING, TYPOGRAPHY } from '../constants/layout'
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

export function RankSystemGuide() {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const [thresholds, setThresholds] = useState<Record<RankTier, number>>(RANK_MIN_XP)
  const [rewardMap, setRewardMap] = useState<Record<EntitlementTier, string>>(RANK_ENTITLEMENT_REWARD)
  const [entitlements, setEntitlements] = useState<RankEntitlementItem[]>([])
  const [badgeDefinitions, setBadgeDefinitions] = useState<BadgeDefinitionRow[]>(parseActiveSeasonBadges(undefined))
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<BadgeId>>(new Set())

  useFocusEffect(
    useCallback(() => {
      apiRequest<{
        season?: {
          rankThresholds?: Record<RankTier, number>
          rewardMap?: Record<EntitlementTier, string>
        } | null
        badges?: BadgeDefinitionRow[]
      }>('/auth/league/active-season')
        .then((res) => {
          if (res.season?.rankThresholds) setThresholds(res.season.rankThresholds)
          if (res.season?.rewardMap) setRewardMap({ ...RANK_ENTITLEMENT_REWARD, ...res.season.rewardMap })
          setBadgeDefinitions(parseActiveSeasonBadges(res.badges))
        })
        .catch(() => {
          setBadgeDefinitions(parseActiveSeasonBadges(undefined))
        })

      if (!currentUser?.id) {
        setEntitlements([])
        setEarnedBadgeIds(new Set())
        return
      }

      apiRequest<{ entitlements?: RankEntitlementItem[] }>(
        `/auth/rank-entitlements?userId=${currentUser.id}`
      )
        .then((res) => setEntitlements(res.entitlements ?? []))
        .catch(() => setEntitlements([]))

      apiRequest<{ badges?: { badgeId: BadgeId }[] }>(`/admin/users/${currentUser.id}/details`)
        .then((res) => {
          const next = new Set<BadgeId>()
          for (const badge of res.badges ?? []) {
            if (badge?.badgeId) next.add(badge.badgeId)
          }
          setEarnedBadgeIds(next)
        })
        .catch(() => setEarnedBadgeIds(new Set()))
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHero title="">
        <View />
      </ScreenHero>

      <ScreenSurface style={styles.surface}>
        <Text style={styles.sectionTitle}>XP from placements</Text>
        <Text style={styles.hint}>Size bonus: +2 XP per opponent (1st), +1 (2nd), then × event tier.</Text>
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

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Event tiers</Text>
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

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Judged awards</Text>
        <ThemedCard compact style={styles.card}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Best Bling / Best Rogue</Text>
            <Text style={styles.dataValue}>{JUDGED_AWARD_BASE_XP} XP base</Text>
          </View>
        </ThemedCard>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>All ranks</Text>
        <Text style={styles.hint}>
          Season rank is from season XP. Resets each season. Each rank unlocks a prize entitlement.
        </Text>
        {rankRows.map((row, index) => (
          <RankGuideRow
            key={row.tier}
            styles={styles}
            tier={row.tier}
            minXp={row.minXp}
            xpRange={row.xpRange}
            reward={row.reward}
            status={row.status}
            isLast={index === rankRows.length - 1}
          />
        ))}

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Claiming your rewards</Text>
        <Text style={styles.claimHint}>
          To claim rank rewards you have earned, visit one of our official stores ({OFFICIAL_STORES}).
          A staff member will redeem your entitlement in the app and hand you the prizes you have unlocked.
        </Text>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Badges you can earn</Text>
        <Text style={styles.hint}>
          Earn badges at events. Some are awarded automatically; others are given by staff at the prize desk.
        </Text>
        {badgeRows.map((row, index) => (
          <BadgeGuideRow
            key={row.id}
            styles={styles}
            theme={theme}
            row={row}
            isLast={index === badgeRows.length - 1}
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
  reward,
  status,
  isLast,
}: {
  styles: ReturnType<typeof getStyles>
  tier: RankTier
  minXp: number
  xpRange: string
  reward: string
  status: EntitlementStatus | null
  isLast: boolean
}) {
  const statusHint = status ? entitlementStatusHint(status) : null

  return (
    <ThemedCard compact style={isLast ? styles.rankCardLast : styles.rankCard}>
      <View style={styles.rankRow}>
        <Image source={RANK_BADGE_ASSET[tier]} style={styles.rankBadge} resizeMode="contain" />
        <View style={styles.rankCopy}>
          <Text style={styles.rankName}>{tier}</Text>
          <Text style={styles.rankThreshold}>
            {minXp > 0 ? `Requires ${formatRankXpThreshold(minXp)}` : 'Starting rank'} · {xpRange}
          </Text>
          <Text style={styles.rankReward}>{reward}</Text>
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
  row: {
    id: string
    title: string
    blurb: string
    xpReward: number
    earned: boolean
  }
  isLast: boolean
}) {
  return (
    <ThemedCard compact style={isLast ? styles.badgeCardLast : styles.badgeCard}>
      <View style={styles.badgeRow}>
        <View style={styles.badgeCopy}>
          <Text style={styles.badgeTitle}>{row.title}</Text>
          <Text style={styles.badgeBlurb}>{row.blurb}</Text>
          {row.xpReward > 0 ? (
            <Text style={styles.badgeXp}>+{row.xpReward} season XP (one-time)</Text>
          ) : null}
          {row.earned ? <Text style={styles.badgeEarned}>Earned this season</Text> : null}
        </View>
        <View style={styles.badgeIconWrap}>
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
