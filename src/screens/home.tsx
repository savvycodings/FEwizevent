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
import { AppContext, ThemeContext } from '../context'
import {
  AppIcon,
  FeedEventCard,
  MotionBadgeIcon,
  RankProgressCard,
  RemoteImage,
  ScreenSurface,
  Section,
  StatTile,
} from '../components'
import { CommunityDeckMetaSection } from '../components/content/CommunityDeckMetaSection'
import { DeckPicker } from '../components/content/DeckPicker'
import { BRAND } from '../constants/brandColors'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { HOME_HERO_TOP_COLOR } from '../constants/homeHero'
import { profile } from '../data/mockData'
import { BADGE_AWARD_TEXT, BADGE_DISPLAY_TITLE, type BadgeId } from '../data/badgesCatalog'
import { apiRequest } from '../api'
import { setCachedPlayerStats } from '../state/playerStatsCache'
import QRCode from 'react-native-qrcode-svg'
import { getPlayerProfileDeepLink } from '../utils/playerProfileLink'
import { formatRankProgressFooter, xpRemainingToRank } from '../utils/rankProgressHint'
import {
  RANK_BADGE_ASSET,
  RANK_MIN_XP,
  RANK_ORDER,
  type RankTier,
} from '../data/rankSystem'

const QR_MODAL_SIZE = 256
const HOME_BADGE_COLUMNS = 4
const HOME_BADGE_GUTTER = SPACING.sm
const HOME_BADGE_CELL_PERCENT = `${100 / HOME_BADGE_COLUMNS}%`

interface HomeProps {
  navigation: any
}

type HomeFeedItem = {
  id: number
  eventId: number
  eventTitle: string
  markedAt: string
  placement?: number | null
  deckId?: string | null
}

type RankSummary = {
  xp: number
  rank: RankTier
  seasonXp: number
}
type EarnedBadge = {
  badgeId: BadgeId
  placement: number | null
  eventId: number | null
  eventTitle: string | null
  awardedAt: string
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
  const badgeIconSize = useMemo(() => {
    const contentWidth = screenWidth - SPACING.containerPadding * 2
    const tileWidth = contentWidth / HOME_BADGE_COLUMNS - HOME_BADGE_GUTTER
    return Math.round(Math.max(44, tileWidth * 0.68))
  }, [screenWidth])
  const styles = getStyles(theme)
  const openAttendedEvents = useCallback(() => {
    navigation.navigate('AttendedEvents')
  }, [navigation])
  const openRankGuide = useCallback(() => {
    navigation.navigate('RankSystemGuide', { returnTab: 'HomeTab' })
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
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [feed, setFeed] = useState<HomeFeedItem[]>([])
  const [homeLoading, setHomeLoading] = useState(false)
  const [rankSummary, setRankSummary] = useState<RankSummary>({ xp: 0, rank: 'Bronze' })
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([])
  const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | null>(null)
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)
  const [deckSaving, setDeckSaving] = useState(false)

  const loadHome = useCallback(async () => {
    if (!currentUser?.id) {
      setWeekStreak(0)
      setGamesPlayed(0)
      setFeed([])
      setActiveDeckId(null)
      return
    }
    try {
      setHomeLoading(true)
      const [homeRes, rankRes, deckRes] = await Promise.all([
        apiRequest<{
          weekStreak: number
          gamesPlayed?: number
          feed: HomeFeedItem[]
          season?: { seasonXp: number; rank: RankTier; entitlementTier: RankTier; lifetimeXp: number } | null
        }>(`/auth/home-summary?userId=${currentUser.id}`),
        apiRequest<{ user: { xp?: number; rank?: RankSummary['rank'] }; badges?: EarnedBadge[] }>(
          `/admin/users/${currentUser.id}/details`
        ),
        apiRequest<{ activeDeckId: string | null }>(
          `/auth/deck-profile?userId=${currentUser.id}`
        ).catch(() => ({ activeDeckId: null })),
      ])
      setWeekStreak(homeRes.weekStreak ?? 0)
      setGamesPlayed(Number(homeRes.gamesPlayed ?? 0))
      setFeed(Array.isArray(homeRes.feed) ? homeRes.feed : [])
      const season = homeRes.season
      const xp = Number(season?.seasonXp ?? rankRes.user?.xp ?? 0)
      const rank = (season?.rank ?? rankRes.user?.rank as RankSummary['rank']) || 'Bronze'
      setRankSummary({ xp, rank, seasonXp: xp })
      setCachedPlayerStats(currentUser.id, {
        xp,
        rank,
        name: currentUser.name,
      })
      setEarnedBadges(Array.isArray(rankRes.badges) ? rankRes.badges : [])
      setActiveDeckId(deckRes.activeDeckId ?? null)
    } catch {
      setWeekStreak(0)
      setGamesPlayed(0)
      setFeed([])
      setRankSummary({ xp: 0, rank: 'Bronze', seasonXp: 0 })
      setEarnedBadges([])
      setActiveDeckId(null)
    } finally {
      setHomeLoading(false)
    }
  }, [currentUser?.id])

  const saveActiveDeck = useCallback(
    async (deckId: string) => {
      if (!currentUser?.id) return
      try {
        setDeckSaving(true)
        const res = await apiRequest<{ activeDeckId: string | null }>('/auth/active-deck', {
          method: 'PATCH',
          body: JSON.stringify({ userId: currentUser.id, deckId }),
        })
        setActiveDeckId(res.activeDeckId ?? deckId)
      } catch {
        /* keep previous selection */
      } finally {
        setDeckSaving(false)
      }
    },
    [currentUser?.id]
  )

  const currentRank = RANK_ORDER.includes(rankSummary.rank) ? rankSummary.rank : 'Bronze'
  const currentXp = Math.max(0, Number(rankSummary.xp || 0))
  const currentRankMin = RANK_MIN_XP[currentRank]
  const currentRankIndex = RANK_ORDER.indexOf(currentRank)
  const nextRank = currentRankIndex < RANK_ORDER.length - 1 ? RANK_ORDER[currentRankIndex + 1] : null
  const nextRankMin = nextRank ? RANK_MIN_XP[nextRank] : currentRankMin
  const xpIntoTier = Math.max(0, currentXp - currentRankMin)
  const tierSpan = Math.max(1, nextRankMin - currentRankMin)
  const progressPct = nextRank ? Math.max(0, Math.min(100, Math.round((xpIntoTier / tierSpan) * 100))) : 100
  const xpToNextRank = nextRank ? xpRemainingToRank(currentXp, nextRankMin) : 0
  const rankProgressFooter = formatRankProgressFooter(nextRank, xpToNextRank)

  useFocusEffect(
    useCallback(() => {
      loadHome()
    }, [loadHome])
  )

  const statColumnWidth = useMemo(() => {
    const rowInner = screenWidth - SPACING.containerPadding * 2 - SPACING.sm * 2
    return rowInner / 3
  }, [screenWidth])

  const overviewItems = useMemo(
    () => [
      {
        id: 'streak',
        label: 'Win streak',
        value: homeLoading ? '…' : String(weekStreak),
        badgeId: 'sweat' as BadgeId,
        accent: theme.tintColor,
      },
      {
        id: 'games',
        label: 'Events played',
        value: homeLoading ? '…' : String(gamesPlayed),
        badgeId: 'quick' as BadgeId,
        accent: theme.tintColor,
      },
      {
        id: 'badges',
        label: 'Badges',
        value: homeLoading ? '…' : String(earnedBadges.length),
        badgeId: 'champion' as BadgeId,
        accent: theme.tintColor,
      },
    ],
    [weekStreak, gamesPlayed, homeLoading, earnedBadges.length, theme.tintColor]
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
            <View>
              {currentUser?.profileImageUrl ? (
                <RemoteImage
                  uri={currentUser.profileImageUrl}
                  style={styles.heroAvatar}
                  spinnerSize={20}
                  spinnerColor={BRAND.heroInk}
                  fallback={
                    <View style={styles.heroAvatarFallback}>
                      <Text style={styles.heroAvatarInitial}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  }
                />
              ) : (
                <View style={styles.heroAvatarFallback}>
                  <Text style={styles.heroAvatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroGreeting}>Wizard</Text>
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
                {currentUser?.id ? (
                  <DeckPicker
                    variant="heroIcon"
                    value={activeDeckId}
                    onChange={saveActiveDeck}
                    label="Current deck"
                    showFieldLabel={false}
                    placeholder="Choose deck"
                    disabled={deckSaving || homeLoading}
                  />
                ) : null}
              </View>
              <View style={styles.heroPills}>
                <View style={styles.rankPill}>
                  <Image
                    source={RANK_BADGE_ASSET[currentRank]}
                    style={styles.rankPillIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.rankPillText}>
                    {currentRank} · {homeLoading ? '…' : `${currentXp} XP`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate('PlayerSearch')}
            style={({ pressed }) => [styles.heroSearchBtn, pressed && styles.heroSearchBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Search players"
            hitSlop={8}
          >
            <AppIcon name="search" size={26} color={BRAND.heroInk} />
          </Pressable>
        </View>
        </View>
      </View>

      <ScreenSurface>
        <View style={styles.statsRow}>
          {overviewItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.statColumn,
                { width: statColumnWidth },
                index < overviewItems.length - 1 && styles.statColumnGap,
              ]}
            >
              <StatTile
                label={item.label}
                value={item.value}
                iconNode={
                  <MotionBadgeIcon
                    badgeId={item.badgeId}
                    size={28}
                    color={item.accent}
                  />
                }
                accentColor={item.accent}
              />
            </View>
          ))}
        </View>

        <Section title="Meta share" compactTopSpacing>
          <CommunityDeckMetaSection />
        </Section>

        <Section
          title="Rank progress"
          compactTopSpacing
          headerTrailing={
            <Pressable
              onPress={openRankGuide}
              hitSlop={8}
              style={({ pressed }) => [styles.rankHelpButton, pressed && styles.rankHelpButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="How the rank system works"
            >
              <Text style={styles.rankHelpButtonText}>?</Text>
            </Pressable>
          }
        >
          <RankProgressCard
            premiumRim
            badgeSource={RANK_BADGE_ASSET[currentRank]}
            tierLabel={`${currentRank} tier`}
            xpLabel={
              nextRank
                ? `${xpIntoTier} / ${tierSpan} XP to ${nextRank}`
                : `Champion maxed · ${currentXp} XP`
            }
            progressPct={progressPct}
            progressFooter={rankProgressFooter}
          />
        </Section>

        <Section
          title="Badges earned"
          compactTopSpacing
        >
          {earnedBadges.length > 0 ? (
            <View style={styles.earnedBadgesGrid}>
              {[...earnedBadges]
                .sort(
                  (a, b) =>
                    new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime()
                )
                .map((badge, index) => (
                  <View
                    key={`${badge.badgeId}-${badge.eventId}-${badge.awardedAt}-${index}`}
                    style={styles.earnedBadgeCell}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.earnedBadgeTile,
                        pressed && styles.earnedBadgePressed,
                      ]}
                      onPress={() => setSelectedBadge(badge)}
                      accessibilityLabel={BADGE_DISPLAY_TITLE[badge.badgeId]}
                    >
                      <View
                        style={[
                          styles.earnedBadgeIconWrap,
                          { width: badgeIconSize, height: badgeIconSize },
                        ]}
                      >
                        <MotionBadgeIcon
                          badgeId={badge.badgeId}
                          size={badgeIconSize}
                          color={theme.tintColor}
                          animate={false}
                        />
                      </View>
                      <Text style={styles.earnedBadgeTitle} numberOfLines={1}>
                        {BADGE_DISPLAY_TITLE[badge.badgeId]}
                      </Text>
                    </Pressable>
                  </View>
                ))}
            </View>
          ) : (
            <View style={styles.emptyBadgesWrap}>
              <AppIcon name="award" size={28} color={theme.mutedForegroundColor} />
              <Text style={styles.noEarnedBadgesText}>No badges yet.</Text>
            </View>
          )}
        </Section>

        <Section
          title="Activity"
          onPressSeeAll={openAttendedEvents}
          compactTopSpacing
        >
          {!currentUser?.id ? (
            <View style={styles.feedEmptyCard}>
              <AppIcon name="user" size={24} color={theme.mutedForegroundColor} />
              <Text style={styles.feedEmpty}>Sign in to see your activity.</Text>
            </View>
          ) : feed.length === 0 ? (
            <View style={styles.feedEmptyCard}>
              <AppIcon name="activity" size={24} color={theme.mutedForegroundColor} />
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
                  <FeedEventCard
                    key={item.id}
                    title={item.eventTitle}
                    timeLabel={formatRelativeTime(item.markedAt)}
                    placementLabel={place != null ? `${ordinalPlacement(place)} place` : null}
                    deckId={item.deckId}
                    onPress={() => openEventPage(item)}
                    premiumRim={feedIndex === 0}
                  />
                )
              })}
            </View>
          )}
        </Section>
      </ScreenSurface>
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
                  <MotionBadgeIcon
                    badgeId={selectedBadge.badgeId}
                    size={108}
                    color={theme.tintColor}
                    style={styles.badgeModalImage}
                  />
                </LinearGradient>
                <Text style={styles.badgeModalTitle}>
                  {BADGE_DISPLAY_TITLE[selectedBadge.badgeId]}
                </Text>
                <Text style={styles.badgeModalText}>
                  {BADGE_AWARD_TEXT[selectedBadge.badgeId]}
                </Text>
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
                    backgroundColor={BRAND.qrBackground}
                    color={BRAND.qrForeground}
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
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.sm,
      zIndex: 1,
    },
    heroIdentityRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      minWidth: 0,
      paddingRight: SPACING.xs,
    },
    heroSearchBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: -SPACING.xs,
    },
    heroSearchBtnPressed: {
      opacity: 0.85,
    },
    heroGreeting: {
      color: BRAND.heroMuted,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      minWidth: 0,
      marginTop: 2,
    },
    heroPills: {
      marginTop: SPACING.sm,
      gap: SPACING.xs,
      alignItems: 'flex-start',
    },
    heroTextWrap: {
      flex: 1,
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
      backgroundColor: BRAND.heroInk,
    },
    heroAvatarInitial: {
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
    },
    heroNamePressable: {
      flex: 1,
      minWidth: 0,
      maxWidth: '100%',
    },
    heroNamePressed: {
      opacity: 0.65,
    },
    heroName: {
      color: BRAND.heroInk,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
      letterSpacing: -0.3,
    },
    rankPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: SPACING.xs,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: 'rgba(0,0,0,0.12)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },
    rankPillIcon: {
      width: 18,
      height: 18,
    },
    rankPillText: {
      color: BRAND.heroInk,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    rankHelpButton: {
      width: 28,
      height: 28,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: theme.cardBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankHelpButtonPressed: {
      opacity: 0.72,
    },
    rankHelpButtonText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      width: '100%',
      marginBottom: SPACING.sm,
    },
    statColumn: {
      minWidth: 0,
    },
    statColumnGap: {
      marginRight: SPACING.sm,
    },
    earnedBadgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%',
      marginHorizontal: -HOME_BADGE_GUTTER / 2,
    },
    earnedBadgeCell: {
      width: HOME_BADGE_CELL_PERCENT,
      paddingHorizontal: HOME_BADGE_GUTTER / 2,
      marginBottom: SPACING.lg,
    },
    earnedBadgeTile: {
      width: '100%',
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      backgroundColor: theme.cardBackground,
      paddingHorizontal: SPACING.xs,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
      alignItems: 'center',
    },
    earnedBadgeIconWrap: {
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xs,
    },
    earnedBadgeTitle: {
      width: '100%',
      textAlign: 'center',
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: TYPOGRAPHY.caption * 1.2,
    },
    earnedBadgePressed: {
      opacity: 0.88,
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
      backgroundColor: 'transparent',
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
      backgroundColor: 'transparent',
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
      backgroundColor: BRAND.qrBackground,
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
