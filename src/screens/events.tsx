import { useCallback, useContext, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { ThemeContext } from '../context'
import {
  EmptyState,
  EventBannerCard,
  ScreenHero,
  ScreenSurface,
  SearchField,
  Section,
} from '../components'
import { SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'
import { formatLocationLabel } from '../utils/formatLocationLabel'

type ApiEvent = {
  id: number
  title: string
  eventDate: string | null
  location: string | null
  bannerImageUrl?: string | null
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

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      paddingBottom: SPACING['3xl'],
    },
    eventsError: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    },
  })

export function Events() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const navigation = useNavigation<any>()
  const [featuredEvents, setFeaturedEvents] = useState<ApiEvent[]>([])
  const [eventsError, setEventsError] = useState<string | null>(null)

  const openEventPage = useCallback(
    (event: ApiEvent) => {
      navigation.navigate('EventPage', { event })
    },
    [navigation]
  )

  const loadFeaturedEvents = useCallback(async () => {
    try {
      setEventsError(null)
      const res = await apiRequest<{ events: ApiEvent[] }>('/admin/events')
      setFeaturedEvents(res.events || [])
    } catch {
      setEventsError('Could not load featured events')
      setFeaturedEvents([])
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadFeaturedEvents()
    }, [loadFeaturedEvents])
  )

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHero title="Event Locator" />
      <ScreenSurface style={{ gap: SPACING.sectionGap }}>
        <SearchField
          placeholder="Search upcoming events"
          containerClassName="rounded-full"
        />

        <Section title="Featured events" largeTitle embedded>
          {eventsError ? <Text style={styles.eventsError}>{eventsError}</Text> : null}
          {featuredEvents.length > 0
            ? featuredEvents.map((event, index) => (
                <EventBannerCard
                  key={event.id}
                  title={event.title}
                  dateLabel={formatEventDateLabel(event.eventDate)}
                  locationLabel={formatLocationLabel(event.location)}
                  bannerImageUrl={event.bannerImageUrl}
                  onPress={() => openEventPage(event)}
                  style={index === featuredEvents.length - 1 ? { marginBottom: 0 } : undefined}
                />
              ))
            : !eventsError ? (
                <EmptyState
                  variant="mutedBand"
                  message="No featured events right now. Pull to refresh or check Upcoming below."
                />
              ) : null}
        </Section>

        <Section title="Upcoming events" largeTitle embedded>
          <EmptyState
            variant="mutedBand"
            message="No scheduled events yet. Check back soon."
          />
        </Section>
      </ScreenSurface>
    </ScrollView>
  )
}
