import { useCallback, useContext, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppContext, ThemeContext } from '../context'
import { Surface } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type AttendedEventItem = {
  id: number
  eventId: number
  eventTitle: string
  eventDate: string | null
  markedAt: string
  placement?: number | null
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

export function AttendedEvents({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const [events, setEvents] = useState<AttendedEventItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!currentUser?.id) {
      setEvents([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const res = await apiRequest<{ events: AttendedEventItem[] }>(
        `/auth/attended-events?userId=${currentUser.id}`
      )
      setEvents(Array.isArray(res.events) ? res.events : [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  function openEvent(item: AttendedEventItem) {
    const eventId = Number(item.eventId)
    if (!eventId || Number.isNaN(eventId)) return
    navigation.navigate('EventPage', {
      event: { id: eventId, title: item.eventTitle },
    })
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Attended events</Text>
        <Text style={styles.heroSubtitle}>Every tournament you have been marked attended at.</Text>
      </View>

      <View style={styles.surface}>
        {!currentUser?.id ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="person-outline" size={28} color={theme.mutedForegroundColor} />
            <Text style={styles.emptyText}>Sign in to see your attended events.</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={theme.tintColor} style={styles.loader} />
        ) : events.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="calendar-outline" size={28} color={theme.mutedForegroundColor} />
            <Text style={styles.emptyText}>
              No attended events yet. When an admin marks you attended, they will show up here.
            </Text>
          </View>
        ) : (
          events.map((item, index) => {
            const place =
              item.placement != null && Number(item.placement) >= 1 ? Number(item.placement) : null
            return (
              <Pressable
                key={item.id}
                onPress={() => openEvent(item)}
                style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.eventTitle}`}
              >
                <Surface
                  style={[styles.card, index === 0 ? styles.cardFeatured : null]}
                  padding="lg"
                >
                  <View style={styles.cardTop}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryText}>Attended</Text>
                    </View>
                    <Text style={styles.dateText}>{formatRelativeTime(item.markedAt)}</Text>
                  </View>
                  <Text style={styles.title}>{item.eventTitle}</Text>
                  <Text style={styles.excerpt}>
                    {formatEventDateLabel(item.eventDate)}
                    {place != null ? ` · ${ordinalPlacement(place)} place` : ''}
                  </Text>
                  <View style={styles.readRow}>
                    <Text style={styles.readMore}>View event</Text>
                    <Ionicons name="chevron-forward" size={18} color={theme.tintColor} />
                  </View>
                </Surface>
              </Pressable>
            )
          })
        )}
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
      paddingBottom: SPACING['4xl'],
    },
    hero: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING['2xl'],
      paddingBottom: SPACING['3xl'],
    },
    heroTitle: {
      color: theme.backgroundColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
    },
    heroSubtitle: {
      marginTop: SPACING.sm,
      color: theme.backgroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      opacity: 0.92,
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
    },
    surface: {
      marginTop: -SPACING['2xl'],
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
      gap: SPACING.md,
      minHeight: 200,
    },
    loader: {
      marginVertical: SPACING['2xl'],
    },
    emptyWrap: {
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING['2xl'],
      paddingHorizontal: SPACING.lg,
    },
    emptyText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
      lineHeight: TYPOGRAPHY.bodySmall * 1.45,
    },
    cardPressable: {
      marginBottom: SPACING.sm,
    },
    cardPressed: {
      opacity: 0.88,
    },
    card: {
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    cardFeatured: {
      borderColor: theme.tintColor,
      borderWidth: 1.5,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.sm,
      gap: SPACING.sm,
    },
    categoryPill: {
      backgroundColor: theme.infoBackground ?? theme.surfaceMuted,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    categoryText: {
      color: theme.infoTextColor ?? theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.caption,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dateText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      flexShrink: 1,
      textAlign: 'right',
    },
    title: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      lineHeight: TYPOGRAPHY.h4 * 1.2,
      marginBottom: SPACING.xs,
    },
    excerpt: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.45,
      marginBottom: SPACING.md,
    },
    readRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    readMore: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
  })
