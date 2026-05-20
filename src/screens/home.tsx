import { useCallback, useContext, useMemo, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { AppContext, ThemeContext } from '../context'
import { Section, ThemedButton, ThemedCard, CardCaption } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { overviewStats, profile } from '../data/mockData'
import {
  BADGE_ASSET,
  BADGE_AWARD_TEXT,
  type BadgeId,
} from '../data/badgesCatalog'
import { apiRequest } from '../api'

interface HomeProps {
  navigation: any
}

type HomeFeedItem = {
  id: number
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
  const styles = getStyles(theme)
  const goToNews = () => navigation.navigate('News')

  const [weekStreak, setWeekStreak] = useState(0)
  const [feed, setFeed] = useState<HomeFeedItem[]>([])
  const [homeLoading, setHomeLoading] = useState(false)
  const [rankSummary, setRankSummary] = useState<RankSummary>({ xp: 0, rank: 'Bronze' })
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([])
  const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | null>(null)

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

  const overviewItems = useMemo(() => {
    const badgesStat = overviewStats.find((s) => s.id === 'badges')
    return [
      {
        id: 'streak',
        label: 'Week streak',
        value: homeLoading ? '…' : String(weekStreak),
        icon: require('../../assets/badges/sweat.png'),
      },
      {
        ...(badgesStat ?? { id: 'badges', label: 'Badges' }),
        value: homeLoading ? '…' : String(earnedBadges.length),
        icon: BADGE_ASSET.champion,
      },
    ]
  }, [weekStreak, homeLoading, earnedBadges.length])

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIdentityRow}>
          {currentUser?.profileImageUrl ? (
            <Image source={{ uri: currentUser.profileImageUrl }} style={styles.heroAvatar} />
          ) : (
            <View style={styles.heroAvatarFallback}>
              <Text style={styles.heroAvatarInitial}>
                {(currentUser?.name || profile.trainerName).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroGreeting}>Welcome back,</Text>
            <Text style={styles.heroName}>{currentUser?.name || profile.trainerName}</Text>
            <Text style={styles.heroId}>Player ID: {profile.playerId}</Text>
          </View>
        </View>
      </View>

      <View style={styles.surface}>
        <View style={styles.overviewBlock}>
          <View style={styles.overviewEyebrowRow}>
            <Text style={styles.overviewTitle}>Overview</Text>
            <View style={styles.newsPillWrap}>
              <ThemedButton
                label="News"
                variant="outline"
                premiumRim={false}
                onPress={goToNews}
                style={styles.newsPillButton}
              />
            </View>
          </View>
          <Text style={styles.overviewSubtitle}>Your streak and badge count at a glance.</Text>
        </View>

        <View style={styles.statsRow}>
          {overviewItems.map((item) => {
            const card = (
              <ThemedCard premiumRim style={styles.statCard}>
                <CardCaption caption={item.label}>
                  <View style={styles.statTop}>
                    <Image source={item.icon} style={styles.statIconImage} resizeMode="contain" />
                    <Text style={styles.statValue}>{item.value}</Text>
                  </View>
                </CardCaption>
              </ThemedCard>
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
                  {card}
                </Pressable>
              )
            }
            return (
              <View key={item.id} style={styles.statCardWrap}>
                {card}
              </View>
            )
          })}
        </View>

        <Section title="Rank" subtitle="Progress toward your next tier." compactTopSpacing>
          <ThemedCard premiumRim style={styles.rankCard}>
            <CardCaption
              caption={
                nextRank
                  ? `${xpIntoTier} / ${tierSpan} XP to ${nextRank}`
                  : `Champion tier maxed · ${currentXp} XP`
              }
            >
              <View style={styles.rankProgressAndBadgeRow}>
                <View style={styles.rankProgressWrap}>
                  <View style={styles.rankProgressTrack}>
                    <View style={[styles.rankProgressFill, { width: `${progressPct}%` }]} />
                  </View>
                </View>
                <View style={styles.rankBadgeWrap}>
                  <Image source={RANK_BADGE[currentRank]} style={styles.rankBadgeImage} resizeMode="contain" />
                </View>
              </View>
            </CardCaption>
          </ThemedCard>
          <Text style={styles.earnedBadgesTitle}>Badges earned</Text>
          <View style={styles.earnedBadgesBox}>
            {earnedBadges.length > 0 ? (
              <View style={styles.earnedBadgesGrid}>
                {earnedBadges.map((badge, index) => (
                  <Pressable
                    key={`${badge.badgeId}-${badge.eventId}-${badge.awardedAt}-${index}`}
                    style={styles.earnedBadgeCell}
                    onPress={() => setSelectedBadge(badge)}
                  >
                    <Image
                      source={BADGE_ASSET[badge.badgeId]}
                      style={styles.earnedBadgeImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.noEarnedBadgesText}>No tournament badges yet.</Text>
            )}
          </View>
        </Section>

        <Section title="My Feed" subtitle="Latest attendance from organizers." onPressSeeAll={goToNews} compactTopSpacing>
          {!currentUser?.id ? (
            <ThemedCard style={styles.feedCard}>
              <Text style={styles.feedEmpty}>Sign in to see your activity.</Text>
            </ThemedCard>
          ) : feed.length === 0 ? (
            <ThemedCard style={styles.feedCard}>
              <Text style={styles.feedEmpty}>
                When an admin marks you as attended for an event, it will show up here.
              </Text>
            </ThemedCard>
          ) : (
            feed.map((item, feedIndex) => {
              const place =
                item.placement != null && Number(item.placement) >= 1
                  ? Number(item.placement)
                  : null
              return (
                <ThemedCard key={item.id} premiumRim={feedIndex === 0} style={styles.feedCard}>
                  <CardCaption caption={formatRelativeTime(item.markedAt)}>
                    <Text style={styles.feedSubtitle}>You attended an event</Text>
                    <Text style={styles.feedTitle}>{item.eventTitle}</Text>
                    {place != null ? (
                      <Text style={styles.feedPlacement}>Placed {ordinalPlacement(place)}</Text>
                    ) : null}
                  </CardCaption>
                </ThemedCard>
              )
            })
          )}
        </Section>
      </View>
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
                <Image
                  source={BADGE_ASSET[selectedBadge.badgeId]}
                  style={styles.badgeModalImage}
                  resizeMode="contain"
                />
                <Text style={styles.badgeModalTitle}>Badge</Text>
                <Text style={styles.badgeModalText}>
                  {BADGE_AWARD_TEXT[selectedBadge.badgeId]}
                </Text>
                {selectedBadge.eventTitle ? (
                  <Text style={styles.badgeModalEventText}>Event: {selectedBadge.eventTitle}</Text>
                ) : null}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
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
    hero: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING['2xl'],
      paddingBottom: SPACING['4xl'],
    },
    heroGreeting: {
      color: theme.backgroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    heroIdentityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    heroTextWrap: {
      flex: 1,
    },
    heroAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.backgroundColor,
    },
    heroAvatarFallback: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
    },
    heroAvatarInitial: {
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
    },
    heroName: {
      color: theme.backgroundColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
      marginTop: SPACING.xs,
    },
    heroId: {
      color: theme.backgroundColor,
      fontFamily: theme.mediumFont,
      opacity: 0.9,
      marginTop: SPACING.xs,
    },
    surface: {
      marginTop: -SPACING['2xl'],
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
    },
    overviewBlock: {
      gap: SPACING.xs,
    },
    overviewEyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.md,
    },
    overviewTitle: {
      flexShrink: 1,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
    },
    newsPillWrap: {
      flexShrink: 0,
    },
    newsPillButton: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
    },
    overviewSubtitle: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.35,
      textAlign: 'left',
    },
    statsRow: {
      marginTop: SPACING.lg,
      flexDirection: 'row',
      gap: SPACING.md,
    },
    statCardWrap: {
      flex: 1,
    },
    statCardPressed: {
      opacity: 0.94,
    },
    statCard: {
      flex: 1,
      alignItems: 'stretch',
    },
    statTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: SPACING.sm,
    },
    statIconImage: {
      width: 20,
      height: 20,
    },
    statValue: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
    },
    feedCard: {
      marginBottom: SPACING.md,
    },
    rankCard: {
      marginBottom: SPACING.md,
    },
    rankProgressAndBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.md,
    },
    rankProgressWrap: {
      flex: 1,
    },
    rankProgressTrack: {
      height: 10,
      borderRadius: RADIUS.full,
      backgroundColor: theme.borderColor,
      overflow: 'hidden',
    },
    rankProgressFill: {
      height: '100%',
      backgroundColor: theme.tintColor,
    },
    rankBadgeWrap: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankBadgeImage: {
      width: 32,
      height: 32,
    },
    earnedBadgesTitle: {
      marginTop: SPACING.xs,
      marginBottom: SPACING.sm,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'left',
    },
    earnedBadgesBox: {
      width: '100%',
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.cardBackground,
      padding: SPACING.sm,
    },
    earnedBadgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    earnedBadgeCell: {
      width: '31%',
      minHeight: 132,
      alignItems: 'center',
      justifyContent: 'center',
    },
    earnedBadgeImage: {
      width: 120,
      height: 120,
    },
    noEarnedBadgesText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'left',
      paddingVertical: SPACING.sm,
    },
    badgeModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
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
      paddingVertical: SPACING.lg,
      alignItems: 'center',
    },
    badgeModalImage: {
      width: 124,
      height: 124,
      marginBottom: SPACING.sm,
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
    },
    badgeModalEventText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
      marginTop: SPACING.sm,
    },
    feedSubtitle: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'left',
    },
    feedTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginTop: SPACING.xs,
      textAlign: 'left',
    },
    feedPlacement: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginTop: SPACING.sm,
      textAlign: 'left',
    },
    feedEmpty: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'left',
      paddingVertical: SPACING.md,
    },
  })
