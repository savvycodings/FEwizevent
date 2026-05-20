import { useCallback, useContext, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { BlurView } from 'expo-blur'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { Divider, EmptyState, Section, Surface } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

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
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    searchInputWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.xs,
    },
    searchInput: {
      flex: 1,
      color: theme.textColor,
      marginLeft: SPACING.sm,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
      paddingVertical: 0,
    },
    eventsError: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    },
    bannerOuter: {
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      marginBottom: SPACING.md,
      minHeight: 128,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.borderColor,
    },
    bannerDarkTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.38)',
    },
    bannerNoImageBg: {
      backgroundColor: theme.tintColor,
    },
    bannerContent: {
      flex: 1,
      minHeight: 128,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      justifyContent: 'flex-end',
    },
    bannerTitleOnImage: {
      color: '#fff',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 6,
    },
    bannerTitleFallback: {
      color: theme.tintTextColor ?? '#fff',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    bannerMetaOnImage: {
      marginTop: SPACING.xs,
      color: 'rgba(255,255,255,0.92)',
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textShadowColor: 'rgba(0,0,0,0.4)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    bannerMetaFallback: {
      marginTop: SPACING.xs,
      color: 'rgba(255,255,255,0.9)',
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
  })

type EventsScreenStyles = ReturnType<typeof getStyles>

function EventBannerCard({
  event,
  styles,
  style,
  onPress,
}: {
  event: ApiEvent
  styles: EventsScreenStyles
  style?: StyleProp<ViewStyle>
  onPress: (event: ApiEvent) => void
}) {
  const dateLabel = formatEventDateLabel(event.eventDate)
  const locationLabel = event.location?.trim() || 'Location TBA'
  const hasBanner = Boolean(event.bannerImageUrl)

  return (
    <Pressable
      style={[styles.bannerOuter, style]}
      onPress={() => onPress(event)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${event.title}`}
    >
      {hasBanner ? (
        <>
          <Image
            source={{ uri: event.bannerImageUrl! }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.bannerDarkTint} pointerEvents="none" />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.bannerNoImageBg]} />
      )}
      <View style={styles.bannerContent}>
        <Text style={hasBanner ? styles.bannerTitleOnImage : styles.bannerTitleFallback}>
          {event.title}
        </Text>
        <Text style={hasBanner ? styles.bannerMetaOnImage : styles.bannerMetaFallback}>{dateLabel}</Text>
        <Text style={hasBanner ? styles.bannerMetaOnImage : styles.bannerMetaFallback}>{locationLabel}</Text>
      </View>
    </Pressable>
  )
}

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
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Event Locator</Text>
        <Text style={styles.heroSubtitle}>Find tournaments, venues, and featured events.</Text>
      </View>
      <View style={styles.surface}>
        <Surface style={{ borderRadius: RADIUS.full }}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search-outline" size={18} color={theme.mutedForegroundColor} />
              <TextInput
                placeholder="Search upcoming events"
                placeholderTextColor={theme.mutedForegroundColor}
                style={styles.searchInput}
              />
            </View>
          </View>
        </Surface>
        <Divider faint spacing="lg" />

        <Section
          title="Featured events"
          subtitle="Tap an event for details and rankings."
          compactTopSpacing
        >
          {eventsError ? <Text style={styles.eventsError}>{eventsError}</Text> : null}
          {featuredEvents.length > 0
            ? featuredEvents.map((event, index) => (
                <EventBannerCard
                  key={event.id}
                  event={event}
                  styles={styles}
                  style={index === featuredEvents.length - 1 ? { marginBottom: 0 } : undefined}
                  onPress={openEventPage}
                />
              ))
            : !eventsError ? (
                <EmptyState
                  variant="mutedBand"
                  message="No featured events right now. Pull to refresh or check Upcoming below."
                />
              ) : null}
        </Section>

        <Section
          title="Upcoming events"
          subtitle="Tournament schedule and sign-ups will appear here."
          compactTopSpacing
        >
          <EmptyState
            variant="mutedBand"
            message="No scheduled events yet. Check back soon."
          />
        </Section>
      </View>
    </ScrollView>
  )
}
