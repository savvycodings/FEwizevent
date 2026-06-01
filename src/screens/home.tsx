import { useCallback, useContext, useMemo, useState } from 'react'
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppContext, ThemeContext } from '../context'
import { Section, ThemedCard } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { HOME_HERO_TOP_COLOR } from '../constants/homeHero'
import { profile } from '../data/mockData'
import {
  BADGE_ASSET,
  BADGE_AWARD_TEXT,
  type BadgeId,
} from '../data/badgesCatalog'
import { apiRequest } from '../api'
import QRCode from 'react-native-qrcode-svg'
import { getPlayerProfileDeepLink } from '../utils/playerProfileLink'

const QR_MODAL_SIZE = 256

interface HomeProps {
  navigation: any
}

type HomeFeedItem = {
  id: number
  eventId: number
  eventTitle: string
  markedAt: string
  placement?: number | null
}

type RankSummary = {
  xp: number
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Champion'
}
type EarnedBadge = {
  badgeId: BadgeId
  placement: number | null
  eventId: number | null
  eventTitle: string | null
  awardedAt: string
}

const RANK_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion'] as const
const RANK_MIN_XP: Record<RankSummary['rank'], number> = {
  Bronze: 0,
  Silver: 100,
  Gold: 300,
  Platinum: 650,
  Diamond: 1200,
  Champion: 2000,
}
const RANK_BADGE: Record<RankSummary['rank'], any> = {
  Bronze: require('../../assets/ranked/bronze.png'),
  Silver: require('../../assets/ranked/silver.png'),
  Gold: require('../../assets/ranked/gold.png'),
  Platinum: require('../../assets/ranked/platnuim.png'),
  Diamond: require('../../assets/ranked/diomand.png'),
  Champion: require('../../assets/ranked/champion.png'),
}

function ordinalPlacement(n: number): string {
  const j = n % 10
  const k = n % 100
  if (j === 1 && k !== 11) return `${n}st`
  if (j === 2 && k !== 12) return `${n}nd`
  if (j === 3 && k !== 13) return `${n}rd`
  return `${n}th`
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso)
  const t = d.getTime()
  if (Number.isNaN(t)) return ''
  const diffMs = Date.now() - t
  if (diffMs < 0) return 'Just now'
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function Home({ navigation }: HomeProps) {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const badgeCellWidth = screenWidth / 3
  const styles = getStyles(theme)
  const openAttendedEvents = useCallback(() => {
    navigation.navigate('AttendedEvents')
  }, [navigation])
  const openEventPage = useCallback(
    (item: HomeFeedItem) => {
      const eventId = Number(item.eventId)
      if (!eventId || Number.isNaN(eventId)) return
      navigation.navigate('EventPage', {
        event: { id: eventId, title: item.eventTitle },
      })
    },
    [navigation]
  )
  const scrollBottomPadding = SPACING['4xl'] + insets.bottom

  const [weekStreak, setWeekStreak] = useState(0)
  const [feed, setFeed] = useState<HomeFeedItem[]>([])
  const [homeLoading, setHomeLoading] = useState(false)
  const [rankSummary, setRankSummary] = useState<RankSummary>({ xp: 0, rank: 'Bronze' })
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([])
  const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | null>(null)
  const [qrModalVisible, setQrModalVisible] = useState(false)

  const loadHome = useCallback(async () => {
    if (!currentUser?.id) {
      setWeekStreak(0)
      setFeed([])
      return
    }
    try {
      setHomeLoading(true)
      const [homeRes, rankRes] = await Promise.all([
        apiRequest<{ weekStreak: number; feed: HomeFeedItem[] }>(
          `/auth/home-summary?userId=${currentUser.id}`
        ),
        apiRequest<{ user: { xp?: number; rank?: RankSummary['rank'] }; badges?: EarnedBadge[] }>(
          `/admin/users/${currentUser.id}/details`
        ),
      ])
      setWeekStreak(homeRes.weekStreak ?? 0)
      setFeed(Array.isArray(homeRes.feed) ? homeRes.feed : [])
      setRankSummary({
        xp: Number(rankRes.user?.xp ?? 0),
        rank: (rankRes.user?.rank as RankSummary['rank']) || 'Bronze',
      })
      setEarnedBadges(Array.isArray(rankRes.badges) ? rankRes.badges : [])
    } catch {
      setWeekStreak(0)
      setFeed([])
      setRankSummary({ xp: 0, rank: 'Bronze' })
      setEarnedBadges([])
    } finally {
      setHomeLoading(false)
    }
  }, [currentUser?.id])

  const currentRank = RANK_ORDER.includes(rankSummary.rank) ? rankSummary.rank : 'Bronze'
  const currentXp = Math.max(0, Number(rankSummary.xp || 0))
  const currentRankMin = RANK_MIN_XP[currentRank]
  const currentRankIndex = RANK_ORDER.indexOf(currentRank)
  const nextRank = currentRankIndex < RANK_ORDER.length - 1 ? RANK_ORDER[currentRankIndex + 1] : null
  const nextRankMin = nextRank ? RANK_MIN_XP[nextRank] : currentRankMin
  const xpIntoTier = Math.max(0, currentXp - currentRankMin)
  const tierSpan = Math.max(1, nextRankMin - currentRankMin)
  const progressPct = nextRank ? Math.max(0, Math.min(100, Math.round((xpIntoTier / tierSpan) * 100))) : 100

  useFocusEffect(
    useCallback(() => {
      loadHome()
    }, [loadHome])
  )

  const overviewItems = useMemo(
    () => [
      {
        id: 'streak',
        label: 'Week streak',
        value: homeLoading ? '…' : String(weekStreak),
        icon: require('../../assets/badges/sweat.png'),
        accent: theme.tintColor,
      },
      {
        id: 'badges',
        label: 'Badges',
        value: homeLoading ? '…' : String(earnedBadges.length),
        icon: BADGE_ASSET.champion,
        accent: theme.tintColor,
      },
    ],
    [weekStreak, homeLoading, earnedBadges.length, theme.tintColor]
  )

  const displayName = currentUser?.name || profile.trainerName
  const profileDeepLink =
    currentUser?.id && currentUser.id > 0 ? getPlayerProfileDeepLink(currentUser.id) : null

  return (
    <View style={styles.screenRoot}>
      <StatusBar style="dark" backgroundColor={HOME_HERO_TOP_COLOR} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.heroWrap}>
        <View style={styles.heroInner}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIdentityRow}>
            <View style={styles.avatarRing}>
              {currentUser?.profileImageUrl ? (
                <Image source={{ uri: currentUser.profileImageUrl }} style={styles.heroAvatar} />
              ) : (
                <View style={styles.heroAvatarFallback}>
                  <Text style={styles.heroAvatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroGreeting}>Welcome back</Text>
              <View style={styles.heroNameRow}>
                <Pressable
                  onPress={() => profileDeepLink && setQrModalVisible(true)}
                  disabled={!profileDeepLink}
                  style={({ pressed }) => [
                    styles.heroNamePressable,
                    pressed && profileDeepLink && styles.heroNamePressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Show my profile QR code"
                >
                  <Text style={styles.heroName} numberOfLines={1}>
                    {displayName}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('PlayerSearch')}
                  style={({ pressed }) => [styles.heroSearchBtn, pressed && styles.heroSearchBtnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Search players"
                  hitSlop={8}
                >
                  <Ionicons name="search-outline" size={30} color="#000" />
                </Pressable>
              </View>
              <View style={styles.rankPill}>
                <Image source={RANK_BADGE[currentRank]} style={styles.rankPillIcon} resizeMode="contain" />
                <Text style={styles.rankPillText}>
                  {currentRank} · {homeLoading ? '…' : `${currentXp} XP`}
                </Text>
              </View>
            </View>
          </View>
        </View>
        </View>
      </View>

      <View style={styles.surface}>
        <View style={styles.statsRow}>
          {overviewItems.map((item) => {
            const inner = (
              <View style={[styles.statCardInner, { borderColor: `${item.accent}55` }]}>
                <Image source={item.icon} style={styles.statIconImage} resizeMode="contain" />
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            )
            if (item.id === 'badges') {
              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.statCardWrap, pressed && styles.statCardPressed]}
                  onPress={() => navigation.navigate('BadgesCatalog')}
                  accessibilityRole="button"
                  accessibilityLabel="View all badges"
                >
                  {inner}
                </Pressable>
              )
            }
            return (
              <View key={item.id} style={styles.statCardWrap}>
                {inner}
              </View>
            )
          })}
        </View>

        <Section title="Rank progress" compactTopSpacing>
          <ThemedCard premiumRim style={styles.rankCard}>
            <View style={styles.rankHeaderRow}>
              <View style={styles.rankTitleBlock}>
                <Text style={styles.rankTierLabel}>{currentRank} tier</Text>
                <Text style={styles.rankXpLabel}>
                  {nextRank
                    ? `${xpIntoTier} / ${tierSpan} XP to ${nextRank}`
                    : `Champion maxed · ${currentXp} XP`}
                </Text>
              </View>
              <Image source={RANK_BADGE[currentRank]} style={styles.rankBadgeImage} resizeMode="contain" />
            </View>
            <View style={styles.rankProgressTrack}>
              <LinearGradient
                colors={['#8FD3FF', '#4DA8E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.rankProgressFill, { width: `${progressPct}%` }]}
              />
            </View>
            <Text style={styles.rankProgressPct}>{progressPct}% to next tier</Text>
          </ThemedCard>

          <Text style={styles.earnedBadgesTitle}>Badges earned</Text>
          {earnedBadges.length > 0 ? (
            <View style={styles.earnedBadgesGrid}>
              {earnedBadges.map((badge, index) => (
                <Pressable
                  key={`${badge.badgeId}-${badge.eventId}-${badge.awardedAt}-${index}`}
                  style={({ pressed }) => [
                    styles.earnedBadgeCell,
                    { width: badgeCellWidth },
                    pressed && styles.earnedBadgePressed,
                  ]}
                  onPress={() => setSelectedBadge(badge)}
                >
                  <Image
                    source={BADGE_ASSET[badge.badgeId]}
                    style={{ width: badgeCellWidth, height: badgeCellWidth }}
                    resizeMode="contain"
                  />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBadgesWrap}>
              <Ionicons name="ribbon-outline" size={28} color={theme.mutedForegroundColor} />
              <Text style={styles.noEarnedBadgesText}>No tournament badges yet. Compete to earn your first.</Text>
            </View>
          )}
        </Section>

        <Section
          title="Activity"
          subtitle="Recent events you attended."
          onPressSeeAll={openAttendedEvents}
          compactTopSpacing
        >
          {!currentUser?.id ? (
            <View style={styles.feedEmptyCard}>
              <Ionicons name="person-outline" size={24} color={theme.mutedForegroundColor} />
              <Text style={styles.feedEmpty}>Sign in to see your activity.</Text>
            </View>
          ) : feed.length === 0 ? (
            <View style={styles.feedEmptyCard}>
              <Ionicons name="pulse-outline" size={24} color={theme.mutedForegroundColor} />
              <Text style={styles.feedEmpty}>
                When an admin marks you attended, your results will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.feedList}>
              {feed.map((item, feedIndex) => {
                const place =
                  item.placement != null && Number(item.placement) >= 1 ? Number(item.placement) : null
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openEventPage(item)}
                    style={({ pressed }) => [styles.feedCardPressable, pressed && styles.feedCardPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.eventTitle}`}
                  >
                    <ThemedCard premiumRim={feedIndex === 0} style={styles.feedCard}>
                      <View style={styles.feedCardHeader}>
                        <View style={styles.feedIconBubble}>
                          <Ionicons name="trophy-outline" size={16} color={theme.tintColor} />
                        </View>
                        <Text style={styles.feedTime}>{formatRelativeTime(item.markedAt)}</Text>
                      </View>
                      <Text style={styles.feedTitle}>{item.eventTitle}</Text>
                      <Text style={styles.feedSubtitle}>Marked attended</Text>
                      {place != null ? (
                        <View style={styles.placementChip}>
                          <Text style={styles.placementChipText}>{ordinalPlacement(place)} place</Text>
                        </View>
                      ) : null}
                    </ThemedCard>
                  </Pressable>
                )
              })}
            </View>
          )}
        </Section>
      </View>
      </ScrollView>

      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable style={styles.badgeModalBackdrop} onPress={() => setSelectedBadge(null)}>
          <Pressable style={styles.badgeModalCard} onPress={() => {}}>
            {selectedBadge ? (
              <>
                <LinearGradient
                  colors={['rgba(143, 211, 255, 0.25)', 'rgba(143, 211, 255, 0.05)']}
                  style={styles.badgeModalGlow}
                >
                  <Image
                    source={BADGE_ASSET[selectedBadge.badgeId]}
                    style={styles.badgeModalImage}
                    resizeMode="contain"
                  />
                </LinearGradient>
                <Text style={styles.badgeModalTitle}>Badge unlocked</Text>
                <Text style={styles.badgeModalText}>{BADGE_AWARD_TEXT[selectedBadge.badgeId]}</Text>
                {selectedBadge.eventTitle ? (
                  <Text style={styles.badgeModalEventText}>{selectedBadge.eventTitle}</Text>
                ) : null}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <Pressable style={styles.qrModalBackdrop} onPress={() => setQrModalVisible(false)}>
          <Pressable style={styles.qrModalCard} onPress={() => {}}>
            {profileDeepLink ? (
              <>
                <View style={styles.qrModalQuietZone}>
                  <QRCode
                    value={profileDeepLink}
                    size={QR_MODAL_SIZE}
                    backgroundColor="#ffffff"
                    color="#000000"
                  />
                </View>
                <Text style={styles.qrModalCaption}>Scan to view profile</Text>
                <Pressable
                  onPress={() => setQrModalVisible(false)}
                  style={styles.qrModalClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text style={styles.qrModalCloseText}>Close</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screenRoot: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    heroWrap: {
      backgroundColor: HOME_HERO_TOP_COLOR,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING['2xl'],
      paddingBottom: SPACING['3xl'],
    },
    heroInner: {
      width: '100%',
    },
    content: {
      flexGrow: 1,
    },
    heroTopRow: {
      zIndex: 1,
    },
    heroIdentityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      minWidth: 0,
    },
    heroNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginTop: 2,
    },
    heroSearchBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    heroSearchBtnPressed: {
      opacity: 0.85,
    },
    heroGreeting: {
      color: 'rgba(0,0,0,0.65)',
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    heroTextWrap: {
      flex: 1,
    },
    avatarRing: {
      padding: 3,
      borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderWidth: 2,
      borderColor: 'rgba(0,0,0,0.12)',
    },
    heroAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    heroAvatarFallback: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
    },
    heroAvatarInitial: {
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
    },
    heroNamePressable: {
      flex: 1,
      minWidth: 0,
    },
    heroNamePressed: {
      opacity: 0.65,
    },
    heroName: {
      color: '#000',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
      letterSpacing: -0.3,
    },
    rankPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: SPACING.xs,
      marginTop: SPACING.sm,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
    rankPillIcon: {
      width: 18,
      height: 18,
    },
    rankPillText: {
      color: '#000',
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    surface: {
      marginTop: -SPACING['2xl'],
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
    },
    statsRow: {
      flexDirection: 'row',
      gap: SPACING.md,
      marginBottom: SPACING.sm,
    },
    statCardWrap: {
      flex: 1,
    },
    statCardPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    statCardInner: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      backgroundColor: theme.cardBackground,
      padding: SPACING.md,
      minHeight: 128,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIconImage: {
      width: 32,
      height: 32,
      marginBottom: SPACING.sm,
    },
    statValue: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    statLabel: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginTop: 2,
      textAlign: 'center',
    },
    rankCard: {
      marginBottom: SPACING.md,
    },
    rankHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.md,
      marginBottom: SPACING.md,
    },
    rankTitleBlock: {
      flex: 1,
    },
    rankTierLabel: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    rankXpLabel: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginTop: SPACING.xs,
    },
    rankBadgeImage: {
      width: 44,
      height: 44,
    },
    rankProgressTrack: {
      height: 12,
      borderRadius: RADIUS.full,
      backgroundColor: theme.borderColor,
      overflow: 'hidden',
    },
    rankProgressFill: {
      height: '100%',
      borderRadius: RADIUS.full,
      minWidth: 8,
    },
    rankProgressPct: {
      marginTop: SPACING.sm,
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      textAlign: 'right',
    },
    earnedBadgesTitle: {
      marginTop: SPACING.xs,
      marginBottom: SPACING.sm,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
    },
    earnedBadgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      marginHorizontal: -SPACING.containerPadding,
    },
    earnedBadgeCell: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    earnedBadgePressed: {
      opacity: 0.9,
    },
    emptyBadgesWrap: {
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.lg,
    },
    noEarnedBadgesText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
      lineHeight: TYPOGRAPHY.bodySmall * 1.45,
      paddingHorizontal: SPACING.md,
    },
    feedList: {
      gap: SPACING.md,
    },
    feedCardPressable: {
      width: '100%',
    },
    feedCardPressed: {
      opacity: 0.92,
    },
    feedCard: {
      width: '100%',
    },
    feedCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.sm,
    },
    feedIconBubble: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(143, 211, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedTime: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
    },
    feedTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    feedSubtitle: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginTop: SPACING.xs,
    },
    placementChip: {
      alignSelf: 'flex-start',
      marginTop: SPACING.sm,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: 'rgba(143, 211, 255, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(143, 211, 255, 0.35)',
    },
    placementChipText: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    feedEmptyCard: {
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING['2xl'],
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: theme.cardBackground,
    },
    feedEmpty: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
      lineHeight: TYPOGRAPHY.bodySmall * 1.45,
    },
    badgeModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
    },
    badgeModalCard: {
      width: '100%',
      maxWidth: 340,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: theme.cardBackground,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.xl,
      alignItems: 'center',
    },
    badgeModalGlow: {
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
    },
    badgeModalImage: {
      width: 120,
      height: 120,
    },
    badgeModalTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginBottom: SPACING.xs,
      textAlign: 'center',
    },
    badgeModalText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'center',
      lineHeight: TYPOGRAPHY.body * 1.4,
    },
    badgeModalEventText: {
      color: theme.tintColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
      marginTop: SPACING.sm,
    },
    qrModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.containerPadding,
    },
    qrModalCard: {
      width: '100%',
      maxWidth: 320,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      borderRadius: RADIUS.lg,
      padding: SPACING.xl,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.borderColor,
    },
    qrModalQuietZone: {
      padding: SPACING.md,
      backgroundColor: '#ffffff',
      borderRadius: RADIUS.md,
    },
    qrModalCaption: {
      marginTop: SPACING.lg,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'center',
    },
    qrModalClose: {
      marginTop: SPACING.lg,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xl,
    },
    qrModalCloseText: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.body,
    },
  })
