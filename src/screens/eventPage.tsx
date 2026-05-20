import { useCallback, useContext, useMemo, useState } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  useWindowDimensions,
} from 'react-native'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemeContext } from '../context'
import { apiRequest } from '../api'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { Section, ThemedCard, CardCaption, Surface, Divider } from '../components'

type ApiEvent = {
  id: number
  title: string
  eventDate: string | null
  location: string | null
  bannerImageUrl?: string | null
  scheduledRounds?: number | null
  useMatchTracking?: boolean
}

type LeaderboardEntry = {
  userId: number
  userName: string
  userEmail: string
  placement: number | null
  attended: boolean
  updatedAt: string
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  lostToUserId: number | null
  lostToName: string | null
}

type EventLeaderboardResponse = {
  event: ApiEvent
  leaderboard: LeaderboardEntry[]
  stats: {
    attendeeCount: number
    participantCount: number
  }
}

const TABLE_MIN_WIDTH = 560
const COL = {
  place: 48,
  player: 168,
  gp: 40,
  w: 36,
  l: 36,
  d: 36,
  lost: 120,
}

const MEDAL_GRADIENTS: Record<1 | 2 | 3, [string, string, string]> = {
  1: ['#FFF5C2', '#FFD24A', '#B88300'],
  2: ['#F8FAFC', '#D9E1EA', '#9BA7B5'],
  3: ['#F4D2B8', '#C98956', '#8A4E23'],
}

function MedalGradientText({
  placement,
  text,
  style,
}: {
  placement: number | null | undefined
  text: string
  style: StyleProp<TextStyle>
}) {
  if (placement !== 1 && placement !== 2 && placement !== 3) {
    return <Text style={style}>{text}</Text>
  }
  const colors = MEDAL_GRADIENTS[placement]

  return (
    <MaskedView
      maskElement={<Text style={style}>{text}</Text>}
      style={{ alignSelf: 'flex-start' }}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, stylesForGradient.hiddenText]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  )
}

const stylesForGradient = StyleSheet.create({
  hiddenText: {
    opacity: 0,
  },
})

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

export function EventPage() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const routeEvent = route.params?.event as ApiEvent | undefined
  const [event, setEvent] = useState<ApiEvent | null>(routeEvent ?? null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState({ attendeeCount: 0, participantCount: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { width: windowWidth } = useWindowDimensions()
  const isWideLayout = windowWidth >= 720
  const tableMinWidth = useMemo(
    () =>
      isWideLayout
        ? Math.min(900, Math.max(TABLE_MIN_WIDTH, windowWidth - 2 * SPACING.containerPadding))
        : TABLE_MIN_WIDTH,
    [isWideLayout, windowWidth]
  )
  const col = useMemo(
    () =>
      isWideLayout
        ? { ...COL, player: 220, lost: 140 }
        : COL,
    [isWideLayout]
  )

  const loadEventLeaderboard = useCallback(async () => {
    if (!routeEvent?.id) {
      setError('Missing event details')
      setLoading(false)
      return
    }
    try {
      setError(null)
      const res = await apiRequest<EventLeaderboardResponse>(
        `/admin/events/${routeEvent.id}/leaderboard`
      )
      setEvent(res.event)
      const rows = res.leaderboard || []
      setLeaderboard(
        rows.map((r) => ({
          ...r,
          gamesPlayed: Number(r.gamesPlayed ?? 0),
          wins: Number(r.wins ?? 0),
          losses: Number(r.losses ?? 0),
          draws: Number(r.draws ?? 0),
        }))
      )
      setStats(res.stats || { attendeeCount: 0, participantCount: 0 })
    } catch {
      setError('Could not load event leaderboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [routeEvent?.id])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      loadEventLeaderboard()
    }, [loadEventLeaderboard])
  )

  const dateLabel = formatEventDateLabel(event?.eventDate ?? null)
  const locationLabel = event?.location?.trim() || 'Location TBA'

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          tintColor={theme.tintColor}
          colors={[theme.tintColor]}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true)
            loadEventLeaderboard()
          }}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <View style={styles.titleRow}>
            <Pressable
              onPress={() => navigation.navigate('EventsTab')}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back-outline" size={22} color="#000" />
            </Pressable>
            <Text style={styles.heroTitle}>{event?.title || 'Event'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.surface}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaText}>{dateLabel}</Text>
          <Text style={styles.metaText}>{locationLabel}</Text>
        </View>

        <Section title="At a glance" compactTopSpacing>
          <View style={styles.infoBadgeRow}>
            <Surface style={styles.infoBadge}>
              <CardCaption caption="Marked present for this event">
                <Text style={styles.infoLabel}>Attendees</Text>
                <Text style={styles.infoValue}>{stats.attendeeCount}</Text>
              </CardCaption>
            </Surface>
            <Surface style={styles.infoBadge}>
              <CardCaption caption="Ranked / placement recorded">
                <Text style={styles.infoLabel}>Participants</Text>
                <Text style={styles.infoValue}>{stats.participantCount}</Text>
              </CardCaption>
            </Surface>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </Section>

        <Section
          title="Leaderboard"
          compactTopSpacing
        >
          {loading ? (
            <ThemedCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>Loading leaderboard...</Text>
            </ThemedCard>
          ) : leaderboard.length > 0 ? (
            <Surface padding="none" style={styles.tableCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
                <View style={[styles.tableInner, { minWidth: tableMinWidth }]}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { width: col.place }]}>#</Text>
                    <Text style={[styles.th, { width: col.player }]}>Player</Text>
                    <Text style={[styles.th, { width: col.gp }]}>GP</Text>
                    <Text style={[styles.th, { width: col.w }]}>W</Text>
                    <Text style={[styles.th, { width: col.l }]}>L</Text>
                    <Text style={[styles.th, { width: col.d }]}>D</Text>
                    <Text style={[styles.th, { width: col.lost }]}>Lost to</Text>
                  </View>
                  <Divider faint spacing="sm" />
                  {leaderboard.map((entry) => (
                    <View key={`${entry.userId}-${entry.placement ?? 'na'}`}>
                      <View style={styles.tableRow}>
                        <View style={[styles.tdPlace, { width: col.place }]}>
                          <MedalGradientText
                            placement={entry.placement}
                            text={`${entry.placement ?? '—'}`}
                            style={[
                              styles.placeText,
                              entry.placement && entry.placement <= 3 ? styles.topRankPlace : null,
                            ]}
                          />
                        </View>
                        <View style={[styles.tdPlayer, { width: col.player }]}>
                          <MedalGradientText
                            placement={entry.placement}
                            text={entry.userName || entry.userEmail}
                            style={[
                              styles.nameText,
                              entry.placement && entry.placement <= 3 ? styles.topRankName : null,
                            ]}
                          />
                          <Text style={styles.emailMicro} numberOfLines={1}>
                            {entry.userEmail}
                          </Text>
                        </View>
                        <Text style={[styles.tdNum, { width: col.gp }]}>{entry.gamesPlayed}</Text>
                        <Text style={[styles.tdNum, { width: col.w }]}>{entry.wins}</Text>
                        <Text style={[styles.tdNum, { width: col.l }]}>{entry.losses}</Text>
                        <Text style={[styles.tdNum, { width: col.d }]}>{entry.draws}</Text>
                        <Text style={[styles.tdLost, { width: col.lost }]} numberOfLines={2}>
                          {entry.lostToName || '—'}
                        </Text>
                      </View>
                      <View style={styles.rowRule} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </Surface>
          ) : (
            <ThemedCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {stats.attendeeCount > 0
                  ? 'No attendees to show.'
                  : 'Mark players as attended to appear on the leaderboard.'}
              </Text>
            </ThemedCard>
          )}
        </Section>
      </View>
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
      paddingTop: SPACING.lg,
      paddingBottom: SPACING['3xl'],
    },
    titleRow: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButton: {
      position: 'absolute',
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.xs,
    },
    heroContent: {
      gap: SPACING.xs,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    heroTitle: {
      color: '#000',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
      flexShrink: 1,
      textAlign: 'center',
    },
    surface: {
      marginTop: -SPACING['2xl'],
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
    },
    metaBlock: {
      alignItems: 'center',
      marginBottom: SPACING.xs,
      gap: 2,
    },
    metaText: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'center',
    },
    infoBadgeRow: {
      flexDirection: 'row',
      gap: SPACING.md,
    },
    infoBadge: {
      flex: 1,
      alignItems: 'stretch',
      justifyContent: 'flex-start',
    },
    infoLabel: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.h4,
      textAlign: 'left',
    },
    infoValue: {
      marginTop: 2,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
      textAlign: 'left',
    },
    errorText: {
      marginTop: SPACING.sm,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    tableCard: {
      padding: 0,
      overflow: 'hidden',
    },
    tableInner: {
      minWidth: TABLE_MIN_WIDTH,
      padding: SPACING.md,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingBottom: SPACING.xs,
      gap: SPACING.xs,
    },
    th: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      gap: SPACING.xs,
    },
    rowRule: {
      height: StyleSheet.hairlineWidth * 2,
      backgroundColor: theme.dividerColor ?? theme.borderColor,
      opacity: 0.55,
    },
    tdPlace: {
      justifyContent: 'center',
    },
    placeText: {
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
    },
    topRankPlace: {
      fontSize: Math.round(TYPOGRAPHY.body * 1.08),
    },
    tdPlayer: {
      justifyContent: 'center',
    },
    nameText: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'left',
    },
    topRankName: {
      fontSize: Math.round(TYPOGRAPHY.bodySmall * 1.06),
    },
    emailMicro: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    tdNum: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
    },
    tdLost: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      textAlign: 'left',
      lineHeight: TYPOGRAPHY.caption * 1.35,
    },
    emptyCard: {
      alignItems: 'stretch',
      justifyContent: 'center',
      paddingVertical: SPACING.xl,
    },
    emptyText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'left',
    },
  })
