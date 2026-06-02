import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { ThemeContext } from '../../context'
import { apiRequest } from '../../api'
import {
  BADGE_AWARD_TEXT,
  BADGE_CATALOG_ORDER,
  BADGE_DISPLAY_TITLE,
  type BadgeId,
} from '../../data/badgesCatalog'
import type { EntitlementStatus, RankEntitlementItem } from '../../data/rankEntitlements'
import { BadgeVectorIcon } from '../badges/BadgeVectorIcon'
import {
  ENTITLEMENT_MIN_XP,
  ENTITLEMENT_TIER_ORDER,
  RANK_BADGE_ASSET,
  RANK_ENTITLEMENT_REWARD,
  entitlementTierForXp,
  formatEntitlementXpThreshold,
  type EntitlementTier,
} from '../../data/rankCatalog'
import { RADIUS, SPACING, TYPOGRAPHY } from '../../constants/layout'
import { AppIcon, SELECTION_ICON_NAME } from '../ui/app-icon'
import { ToolbarRow } from '../layout/ToolbarRow'
import { rowGrow } from '../layout/PressableRow'
type RanksBadgesModalProps = {
  visible: boolean
  onClose: () => void
  userId?: number | null
  currentXp: number
  earnedBadgeIds: Set<BadgeId>
}

export function RanksBadgesModal({
  visible,
  onClose,
  userId,
  currentXp,
  earnedBadgeIds,
}: RanksBadgesModalProps) {
  const { theme } = useContext(ThemeContext)
  const { height: windowHeight } = useWindowDimensions()
  const styles = getStyles(theme)
  const currentEntitlement = entitlementTierForXp(currentXp)

  const [entitlements, setEntitlements] = useState<RankEntitlementItem[]>([])
  const [loadingEntitlements, setLoadingEntitlements] = useState(false)
  const [claimingTier, setClaimingTier] = useState<EntitlementTier | null>(null)

  const entitlementByTier = useMemo(() => {
    const map = new Map<EntitlementTier, RankEntitlementItem>()
    for (const row of entitlements) map.set(row.tier, row)
    return map
  }, [entitlements])

  const loadEntitlements = useCallback(async () => {
    if (!userId) {
      setEntitlements([])
      return
    }
    try {
      setLoadingEntitlements(true)
      const res = await apiRequest<{ entitlements: RankEntitlementItem[] }>(
        `/auth/rank-entitlements?userId=${userId}`
      )
      setEntitlements(res.entitlements ?? [])
    } catch {
      setEntitlements([])
    } finally {
      setLoadingEntitlements(false)
    }
  }, [userId])

  useEffect(() => {
    if (visible && userId) loadEntitlements()
  }, [visible, userId, loadEntitlements])

  const rankRows = useMemo(
    () =>
      ENTITLEMENT_TIER_ORDER.map((tier) => {
        const server = entitlementByTier.get(tier)
        return {
          tier,
          minXp: ENTITLEMENT_MIN_XP[tier],
          reward: RANK_ENTITLEMENT_REWARD[tier],
          active: tier === currentEntitlement,
          reached: currentXp >= ENTITLEMENT_MIN_XP[tier],
          status: server?.status ?? (currentXp >= ENTITLEMENT_MIN_XP[tier] ? 'claimable' : 'locked'),
          claimCode: server?.claimCode ?? null,
        }
      }),
    [currentEntitlement, currentXp, entitlementByTier]
  )

  const badgeRows = useMemo(
    () =>
      BADGE_CATALOG_ORDER.map((id) => ({
        id,
        title: BADGE_DISPLAY_TITLE[id],
        subtitle: BADGE_AWARD_TEXT[id],
        earned: earnedBadgeIds.has(id),
      })),
    [earnedBadgeIds]
  )

  async function claimTier(tier: EntitlementTier) {
    if (!userId) return
    try {
      setClaimingTier(tier)
      const res = await apiRequest<{ entitlements: RankEntitlementItem[] }>(
        '/auth/rank-entitlements/claim',
        {
          method: 'POST',
          body: JSON.stringify({ userId, tier }),
        }
      )
      setEntitlements(res.entitlements ?? [])
    } catch (err: unknown) {
      Alert.alert('Claim failed', err instanceof Error ? err.message : 'Try again')
    } finally {
      setClaimingTier(null)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { maxHeight: windowHeight * 0.88 }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <ToolbarRow style={styles.headerRow}>
            <Text style={[rowGrow.text, styles.title]} numberOfLines={1}>
              Ranks & badges
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={rowGrow.end}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <AppIcon name="x-circle" size={22} color={theme.mutedForegroundColor} />
            </Pressable>
          </ToolbarRow>
          <Text style={styles.entryFeeNote}>
            Reach a rank, tap Claim for your in-person code, then show staff at the prize desk.
          </Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loadingEntitlements ? (
              <ActivityIndicator color={theme.tintColor} style={{ marginBottom: SPACING.md }} />
            ) : null}
            {rankRows.map((row) => (
              <RankEntitlementRow
                key={row.tier}
                styles={styles}
                theme={theme}
                row={row}
                claiming={claimingTier === row.tier}
                onClaim={() => claimTier(row.tier)}
              />
            ))}

            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Badges</Text>
            {badgeRows.map((row) => (
              <View
                key={row.id}
                style={[styles.badgeRow, row.earned ? styles.badgeRowEarned : null]}
              >
                <View style={styles.badgeIcon}>
                  <BadgeVectorIcon
                    badgeId={row.id}
                    size={36}
                    color={row.earned ? theme.tintColor : theme.mutedForegroundColor}
                    opacity={row.earned ? 1 : 0.45}
                  />
                </View>
                <View style={styles.badgeCopy}>
                  <Text style={styles.badgeTitle}>{row.title}</Text>
                  <Text style={styles.badgeSubtitle}>{row.subtitle}</Text>
                </View>
                {row.earned ? (
                  <AppIcon name={SELECTION_ICON_NAME} size={20} color={theme.tintColor} />
                ) : (
                  <View style={styles.badgeLockedDot} />
                )}
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function RankEntitlementRow({
  styles,
  theme,
  row,
  claiming,
  onClaim,
}: {
  styles: ReturnType<typeof getStyles>
  theme: { tintColor: string; mutedForegroundColor: string }
  row: {
    tier: EntitlementTier
    minXp: number
    reward: string
    active: boolean
    reached: boolean
    status: EntitlementStatus
    claimCode: string | null
  }
  claiming: boolean
  onClaim: () => void
}) {
  const isRedeemed = row.status === 'redeemed'
  const showCode = row.status === 'claimed' || isRedeemed
  const canClaim = row.status === 'claimable'

  return (
    <ToolbarRow
      style={[
        styles.rankRow,
        row.active && styles.rankRowActive,
        isRedeemed && styles.rankRowRedeemed,
      ]}
    >
      <Image
        source={RANK_BADGE_ASSET[row.tier]}
        style={[styles.rankIcon, isRedeemed && styles.rankIconMuted]}
        resizeMode="contain"
      />
      <View style={styles.rankCopy}>
        <View style={styles.rankTitleRow}>
          <Text style={[styles.rankName, isRedeemed && styles.textMuted]}>{row.tier}</Text>
          {row.active ? <Text style={styles.rankYouPill}>You</Text> : null}
        </View>
        <Text style={[styles.rankSubtitle, isRedeemed && styles.textMuted]}>
          {formatEntitlementXpThreshold(row.minXp)} · {row.reward}
        </Text>
        {showCode && row.claimCode ? (
          <Text style={[styles.claimCode, isRedeemed && styles.claimCodeRedeemed]}>
            {row.claimCode}
          </Text>
        ) : null}
        {isRedeemed ? <Text style={styles.redeemedPill}>Redeemed</Text> : null}
      </View>
      {canClaim ? (
        <Pressable
          onPress={onClaim}
          disabled={claiming}
          style={({ pressed }) => [
            styles.claimPill,
            rowGrow.end,
            pressed && styles.claimPillPressed,
            claiming && styles.claimPillDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Claim ${row.tier} prize`}
        >
          <Text style={styles.claimPillText}>{claiming ? '…' : 'Claim'}</Text>
        </Pressable>
      ) : row.reached && row.status === 'claimed' ? (
        <View style={rowGrow.end}>
          <AppIcon name={SELECTION_ICON_NAME} size={18} color={theme.tintColor} />
        </View>
      ) : row.reached && isRedeemed ? (
        <View style={rowGrow.end}>
          <AppIcon name={SELECTION_ICON_NAME} size={18} color={theme.mutedForegroundColor} />
        </View>
      ) : null}
    </ToolbarRow>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.cardBackground,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.borderColor,
      paddingBottom: SPACING.xl,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: RADIUS.full,
      backgroundColor: theme.borderColor,
      marginTop: SPACING.sm,
      marginBottom: SPACING.md,
    },
    headerRow: {
      paddingHorizontal: SPACING.containerPadding,
      marginBottom: SPACING.xs,
    },
    title: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    entryFeeNote: {
      paddingHorizontal: SPACING.containerPadding,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: Math.round(TYPOGRAPHY.caption * 1.45),
      marginBottom: SPACING.sm,
    },
    scroll: {
      paddingHorizontal: SPACING.containerPadding,
    },
    scrollContent: {
      paddingBottom: SPACING['2xl'],
    },
    sectionTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      marginBottom: SPACING.xs,
    },
    sectionTitleSpaced: {
      marginTop: SPACING.lg,
    },
    rankRow: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: theme.backgroundColor,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    rankRowActive: {
      borderColor: `${theme.tintColor}88`,
      backgroundColor: `${theme.tintColor}12`,
    },
    rankRowRedeemed: {
      opacity: 0.72,
      backgroundColor: theme.cardBackground,
    },
    rankIcon: {
      width: 36,
      height: 36,
    },
    rankIconMuted: {
      opacity: 0.55,
    },
    rankCopy: {
      flex: 1,
      minWidth: 0,
    },
    rankTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    rankName: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.body,
    },
    rankYouPill: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    rankSubtitle: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: Math.round(TYPOGRAPHY.bodySmall * 1.45),
    },
    claimCode: {
      marginTop: SPACING.sm,
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
      letterSpacing: 4,
    },
    claimCodeRedeemed: {
      color: theme.mutedForegroundColor,
      textDecorationLine: 'line-through',
    },
    redeemedPill: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    textMuted: {
      color: theme.mutedForegroundColor,
    },
    claimPill: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: theme.tintColor,
      backgroundColor: theme.tintColor,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    claimPillPressed: {
      opacity: 0.88,
    },
    claimPillDisabled: {
      opacity: 0.6,
    },
    claimPillText: {
      color: theme.backgroundColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.borderColor,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      opacity: 0.92,
    },
    badgeRowEarned: {
      opacity: 1,
      borderColor: `${theme.tintColor}55`,
    },
    badgeIcon: {
      width: 40,
      height: 40,
    },
    badgeCopy: {
      flex: 1,
      minWidth: 0,
    },
    badgeTitle: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    badgeSubtitle: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: Math.round(TYPOGRAPHY.bodySmall * 1.45),
    },
    badgeLockedDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.borderColor,
    },
  })
