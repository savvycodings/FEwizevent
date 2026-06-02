import { useCallback, useContext, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { AppContext, ThemeContext } from '../context'
import {
  DeckLabel,
  Divider,
  EmptyState,
  FeedEventCard,
  ScreenHero,
  ScreenSurface,
  Section,
} from '../components'
import { SeasonLeaderboard } from '../components/content/SeasonLeaderboard'
import { HOME_STORE_LABEL, type HomeStore } from '../constants/stores'
import { SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type PlayRecentEvent = {
  id: number
  eventTitle: string
  markedAt: string
  deckId?: string | null
}

function formatEventDateLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
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
  return formatEventDateLabel(iso)
}

function storeLabel(store: string | null | undefined): string | null {
  if (store === 'glendower' || store === 'rosebank') {
    return HOME_STORE_LABEL[store as HomeStore]
  }
  return null
}

const SEASON_LADDER_PREVIEW = 10

export function Play() {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const navigation = useNavigation<any>()
  const styles = getStyles(theme)
  const [recentEvents, setRecentEvents] = useState<PlayRecentEvent[]>([])
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)
  const [activeDeckLabel, setActiveDeckLabel] = useState<string | null>(null)

  const loadPlay = useCallback(async () => {
    if (!currentUser?.id) {
      setRecentEvents([])
      setActiveDeckId(null)
      setActiveDeckLabel(null)
      return
    }
    try {
      const [summaryRes, deckRes] = await Promise.all([
        apiRequest<{ feed: PlayRecentEvent[] }>(`/auth/home-summary?userId=${currentUser.id}`),
        apiRequest<{ activeDeckId: string | null; activeDeckLabel: string | null }>(
          `/auth/deck-profile?userId=${currentUser.id}`
        ).catch(() => ({ activeDeckId: null, activeDeckLabel: null })),
      ])
      setRecentEvents(Array.isArray(summaryRes.feed) ? summaryRes.feed : [])
      setActiveDeckId(deckRes.activeDeckId ?? null)
      setActiveDeckLabel(deckRes.activeDeckLabel ?? null)
    } catch {
      setRecentEvents([])
      setActiveDeckId(null)
      setActiveDeckLabel(null)
    }
  }, [currentUser?.id])

  useFocusEffect(
    useCallback(() => {
      loadPlay()
    }, [loadPlay])
  )

  const homeStoreName = storeLabel(currentUser?.homeStore)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHero title="Play!" />

      <ScreenSurface>
        <View style={styles.profileBlock}>
          <Text style={styles.profileName}>{currentUser?.name || 'Trainer'}</Text>
          {homeStoreName ? (
            <Text style={styles.profileMeta}>Home store · {homeStoreName}</Text>
          ) : !currentUser?.id ? (
            <Text style={styles.profileMeta}>Sign in to sync attendance and season XP.</Text>
          ) : null}
          {currentUser?.id ? (
            activeDeckId || activeDeckLabel ? (
              <DeckLabel
                deckId={activeDeckId}
                label={activeDeckLabel}
                prefix="Profile deck"
                iconSize={22}
                textStyle={styles.deckMeta}
              />
            ) : (
              <Text style={styles.deckMeta}>
                Profile deck · Not selected — set on Profile
              </Text>
            )
          ) : null}
        </View>
        <Divider faint spacing="md" />

        <Section
          title="Season ladder"
          compactTopSpacing
          onPressSeeAll={() => navigation.navigate('SeasonLeaderboard')}
        >
          <SeasonLeaderboard mode="combined" limit={SEASON_LADDER_PREVIEW} />
        </Section>

        <Section title="Store teams" compactTopSpacing>
          <SeasonLeaderboard
            key={`store-${currentUser?.id ?? 0}-${currentUser?.homeStore ?? 'none'}`}
            mode="store-teams"
            initialStore={
              currentUser?.homeStore === 'glendower' || currentUser?.homeStore === 'rosebank'
                ? currentUser.homeStore
                : 'glendower'
            }
          />
        </Section>

        <Section title="Recent events" compactTopSpacing>
          {recentEvents.length > 0 ? (
            <View style={styles.eventList}>
              {recentEvents.map((item, ri) => (
                <FeedEventCard
                  key={item.id}
                  title={item.eventTitle}
                  subtitle={formatEventDateLabel(item.markedAt)}
                  timeLabel={formatRelativeTime(item.markedAt)}
                  deckId={item.deckId}
                  premiumRim={ri === 0}
                />
              ))}
            </View>
          ) : (
            <EmptyState variant="mutedBand" title="No history yet" message="No attended events yet." />
          )}
        </Section>
      </ScreenSurface>
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
    profileBlock: {
      marginBottom: SPACING.xs,
    },
    profileName: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
      lineHeight: TYPOGRAPHY.h3 * 1.15,
    },
    profileMeta: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
    },
    deckMeta: {
      marginTop: SPACING.xs,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
    },
    eventList: {
      gap: SPACING.md,
    },
  })
