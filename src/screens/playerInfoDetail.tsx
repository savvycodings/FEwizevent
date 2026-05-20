import { useCallback, useContext, useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import { AppContext, ThemeContext } from '../context'
import { ThemedCard } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type Player = {
  id: number
  name: string
  email: string
  profileImageUrl?: string | null
  profile_image_url?: string | null
  xp?: number
  rank?: string
  isAdmin?: boolean
  createdAt?: string
}

type PlayerAttendance = {
  eventId: number
  eventTitle: string
  eventDate: string | null
  location: string | null
  attended: boolean
  placement: number | null
  updatedAt: string
}

type PlayerDetailsResponse = {
  user: Player
  attendance: PlayerAttendance[]
  badges?: EarnedBadge[]
  stats: {
    eventsAttended: number
    eventRecords: number
  }
}

type BadgeId =
  | 'placed1st'
  | 'placed2nd'
  | 'placed3rd'
  | 'champion'
  | 'magician'
  | 'sweat'
  | 'scholar'
  | 'quick'
  | 'scientist'
  | 'flawless'

type EarnedBadge = {
  badgeId: BadgeId
  placement: number | null
  eventId: number | null
  eventTitle: string | null
  awardedAt: string
}

const RANK_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion'] as const
type RankTier = (typeof RANK_ORDER)[number]
const RANK_MIN_XP: Record<RankTier, number> = {
  Bronze: 0,
  Silver: 100,
  Gold: 300,
  Platinum: 650,
  Diamond: 1200,
  Champion: 2000,
}
const RANK_BADGE: Record<RankTier, any> = {
  Bronze: require('../../assets/ranked/bronze.png'),
  Silver: require('../../assets/ranked/silver.png'),
  Gold: require('../../assets/ranked/gold.png'),
  Platinum: require('../../assets/ranked/platnuim.png'),
  Diamond: require('../../assets/ranked/diomand.png'),
  Champion: require('../../assets/ranked/champion.png'),
}

const BADGE_ASSET: Record<BadgeId, any> = {
  placed1st: require('../../assets/badges/placed1st.png'),
  placed2nd: require('../../assets/badges/placed2nd.png'),
  placed3rd: require('../../assets/badges/placed3rd.png'),
  champion: require('../../assets/badges/champion.png'),
  magician: require('../../assets/badges/magician.png'),
  sweat: require('../../assets/badges/sweat.png'),
  scholar: require('../../assets/badges/scholar.png'),
  quick: require('../../assets/badges/quick.png'),
  scientist: require('../../assets/badges/scientist.png'),
  flawless: require('../../assets/badges/flawless.png'),
}

function formatEventDateLabel(eventDate: string | null): string {
  if (!eventDate) return 'Date TBA'
  const normalized = eventDate.includes('T') ? eventDate : `${eventDate}T12:00:00`
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return String(eventDate)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PlayerInfoDetail() {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const route = useRoute<any>()
  const routePlayer = route.params?.player as
    | { id: number; profileImageUrl?: string | null; profile_image_url?: string | null }
    | undefined
  const playerId = Number(routePlayer?.id)

  const [player, setPlayer] = useState<Player | null>(null)
  const [attendance, setAttendance] = useState<PlayerAttendance[]>([])
  const [badges, setBadges] = useState<EarnedBadge[]>([])
  const [stats, setStats] = useState({ eventsAttended: 0, eventRecords: 0 })
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!playerId) {
      setError('Missing player')
      return
    }
    try {
      setError(null)
      const res = await apiRequest<PlayerDetailsResponse>(`/admin/users/${playerId}/details`)
      const normalizedUser: Player = {
        ...res.user,
        profileImageUrl:
          res.user?.profileImageUrl ??
          res.user?.profile_image_url ??
          routePlayer?.profileImageUrl ??
          routePlayer?.profile_image_url ??
          (currentUser?.id === playerId ? currentUser?.profileImageUrl ?? null : null) ??
          null,
      }
      setPlayer(normalizedUser)
      setAttendance(res.attendance || [])
      setBadges(Array.isArray(res.badges) ? res.badges : [])
      setStats(res.stats || { eventsAttended: 0, eventRecords: 0 })
    } catch {
      setError('Could not load player details')
      setPlayer(null)
      setAttendance([])
      setBadges([])
    }
  }, [playerId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const currentRank: RankTier = RANK_ORDER.includes(player?.rank as RankTier)
    ? (player?.rank as RankTier)
    : 'Bronze'
  const currentXp = Math.max(0, Number(player?.xp ?? 0))
  const currentRankMin = RANK_MIN_XP[currentRank]
  const currentRankIndex = RANK_ORDER.indexOf(currentRank)
  const nextRank = currentRankIndex < RANK_ORDER.length - 1 ? RANK_ORDER[currentRankIndex + 1] : null
  const nextRankMin = nextRank ? RANK_MIN_XP[nextRank] : currentRankMin
  const xpIntoTier = Math.max(0, currentXp - currentRankMin)
  const tierSpan = Math.max(1, nextRankMin - currentRankMin)
  const progressPct = nextRank ? Math.max(0, Math.min(100, Math.round((xpIntoTier / tierSpan) * 100))) : 100
  const badgeSource = RANK_BADGE[currentRank]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />
      <View style={styles.surface}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {player ? (
          <ThemedCard style={styles.playerCard}>
            <View style={styles.playerHeaderRow}>
              {player.profileImageUrl ? (
                <Image source={{ uri: player.profileImageUrl }} style={styles.playerAvatar} />
              ) : (
                <View style={styles.playerAvatarFallback}>
                  <Text style={styles.playerAvatarInitial}>{player.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.playerName}>{player.name}</Text>
            </View>
            <View style={styles.progressAndBadgeRow}>
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progressPct}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {nextRank
                    ? `${xpIntoTier} / ${tierSpan} XP to ${nextRank}`
                    : `Champion tier maxed (${currentXp} XP)`}
                </Text>
              </View>
              <View style={styles.badgeWrap}>
                <Image
                  source={badgeSource}
                  style={styles.badgeImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.playerMeta}>Email: {player.email}</Text>
            <Text style={styles.playerMeta}>ID: {player.id}</Text>
            <Text style={styles.playerMeta}>Role: {player.isAdmin ? 'Admin' : 'Player'}</Text>
            <Text style={styles.playerMeta}>
              Events attended: {stats.eventsAttended} / {stats.eventRecords}
            </Text>
            <View style={styles.badgesGrid}>
              {badges.length > 0 ? (
                badges.map((badge, index) => (
                  <View key={`${badge.badgeId}-${badge.eventId}-${badge.awardedAt}-${index}`} style={styles.badgePlainItem}>
                    <Image
                      source={BADGE_ASSET[badge.badgeId]}
                      style={styles.earnedBadgeImage}
                      resizeMode="contain"
                    />
                  </View>
                ))
              ) : (
                <View style={styles.noBadgesBox}>
                  <Text style={styles.noBadgesText}>
                    No badges earned yet.
                  </Text>
                </View>
              )}
            </View>
          </ThemedCard>
        ) : null}

        <Text style={styles.sectionTitle}>Attendance per event</Text>
        {attendance.length > 0 ? (
          attendance.map((row) => (
            <ThemedCard key={`${row.eventId}-${row.updatedAt}`} style={styles.attendanceCard}>
              <Text style={styles.eventTitle}>{row.eventTitle}</Text>
              <Text style={styles.eventMeta}>
                {formatEventDateLabel(row.eventDate)}
                {row.location?.trim() ? ` · ${row.location.trim()}` : ''}
              </Text>
              <Text style={styles.eventMeta}>Status: {row.attended ? 'Attended' : 'Not attended'}</Text>
              <Text style={styles.eventMeta}>
                Placement: {row.placement != null && row.placement >= 1 ? `#${row.placement}` : '—'}
              </Text>
            </ThemedCard>
          ))
        ) : (
          <ThemedCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>No event attendance records.</Text>
          </ThemedCard>
        )}
      </View>
    </ScrollView>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.backgroundColor },
    content: { paddingBottom: SPACING['3xl'] },
    hero: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING['2xl'],
      paddingBottom: SPACING['3xl'],
    },
    surface: {
      marginTop: -SPACING.xl,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
    },
    errorText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    },
    playerCard: { marginBottom: SPACING.md },
    playerHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      marginBottom: SPACING.xs,
    },
    playerName: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      flexShrink: 1,
    },
    playerAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: theme.cardBackground,
    },
    playerAvatarFallback: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: theme.borderColor,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.cardBackground,
    },
    playerAvatarInitial: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
    },
    playerMeta: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginTop: 2,
    },
    progressAndBadgeRow: {
      marginTop: SPACING.sm,
      marginBottom: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.md,
    },
    progressWrap: {
      flex: 1,
    },
    progressTrack: {
      height: 10,
      borderRadius: RADIUS.full,
      backgroundColor: theme.borderColor,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.tintColor,
    },
    progressText: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
    },
    badgeWrap: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    badgeImage: {
      width: 32,
      height: 32,
    },
    badgesGrid: {
      marginTop: SPACING.md,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    badgePlainItem: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    earnedBadgeImage: {
      width: 58,
      height: 58,
    },
    noBadgesBox: {
      width: '100%',
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.cardBackground,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noBadgesText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
    },
    sectionTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      marginBottom: SPACING.sm,
    },
    attendanceCard: { marginBottom: SPACING.md },
    eventTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
    },
    eventMeta: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginTop: SPACING.xs,
    },
    emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg },
    emptyText: { color: theme.mutedForegroundColor, fontFamily: theme.regularFont, fontSize: TYPOGRAPHY.body },
  })
