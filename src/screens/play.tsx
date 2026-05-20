import { useCallback, useContext, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { AppContext, ThemeContext } from '../context'
import { Divider, EmptyState, Section, ThemedCard, CardCaption } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { championshipPoints, eventBuckets } from '../data/mockData'
import { apiRequest } from '../api'

type PlayRecentEvent = {
  id: number
  eventTitle: string
  markedAt: string
}

function formatEventDateLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function Play() {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const [recentEvents, setRecentEvents] = useState<PlayRecentEvent[]>([])

  const loadPlayEvents = useCallback(async () => {
    if (!currentUser?.id) {
      setRecentEvents([])
      return
    }
    try {
      const res = await apiRequest<{ feed: PlayRecentEvent[] }>(`/auth/home-summary?userId=${currentUser.id}`)
      setRecentEvents(Array.isArray(res.feed) ? res.feed : [])
    } catch {
      setRecentEvents([])
    }
  }, [currentUser?.id])

  useFocusEffect(
    useCallback(() => {
      loadPlayEvents()
    }, [loadPlayEvents])
  )

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Play!</Text>
        <Text style={styles.heroSubtitle}>Championship points, tiers, and your recent events.</Text>
      </View>

      <View style={styles.surface}>
        <View style={styles.profileBlock}>
          <Text style={styles.profileName}>{currentUser?.name || 'Trainer'}</Text>
          {currentUser?.email ? (
            <Text style={styles.profileMeta}>{currentUser.email}</Text>
          ) : (
            <Text style={styles.profileMeta}>Sign in to sync attendance and points.</Text>
          )}
        </View>
        <Divider faint spacing="md" />

        <Section
          title="Championship points"
          subtitle="Totals are illustrative until synced with live events."
          compactTopSpacing
        >
          <ThemedCard premiumRim>
            <CardCaption caption="Per format — TCG, VGC, and GO.">
              <View style={styles.pointsRow}>
                {championshipPoints.map((item, index) => (
                  <View
                    key={item.id}
                    style={[styles.pointsCell, index > 0 ? styles.pointsCellWithRule : null]}
                  >
                    <Text style={styles.pointsLabel}>{item.label}</Text>
                    <Text style={styles.pointsValue}>{item.points}</Text>
                  </View>
                ))}
              </View>
            </CardCaption>
          </ThemedCard>
        </Section>

        <Section
          title="Championship tiers"
          subtitle="Breakdown by tournament level — Worlds, Internationals, and Regionals."
          compactTopSpacing
        >
          <View style={styles.bucketRow}>
            {eventBuckets.map((item, bi) => (
              <ThemedCard key={item.id} premiumRim={bi === 0} style={styles.bucketCard}>
                <CardCaption caption={item.label}>
                  <Text style={styles.bucketCount}>{item.count}</Text>
                </CardCaption>
              </ThemedCard>
            ))}
          </View>
        </Section>

        <Section title="Recent events" subtitle="From your attendance history." compactTopSpacing>
          {recentEvents.length > 0 ? (
            recentEvents.map((item, ri) => (
              <ThemedCard
                key={item.id}
                premiumRim={ri === 0}
                style={ri === recentEvents.length - 1 ? styles.playEventCardLast : styles.playEventCard}
              >
                <CardCaption caption={formatEventDateLabel(item.markedAt)}>
                  <Text style={styles.playEventTitle}>{item.eventTitle}</Text>
                </CardCaption>
              </ThemedCard>
            ))
          ) : (
            <EmptyState
              variant="mutedBand"
              title="No history yet"
              message="When an admin marks you attended for an event, it will show up here."
            />
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
    pointsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    pointsCell: {
      flex: 1,
      alignItems: 'flex-start',
      gap: SPACING.sm,
      paddingRight: SPACING.md,
    },
    pointsCellWithRule: {
      borderLeftWidth: StyleSheet.hairlineWidth * 2,
      borderLeftColor: theme.dividerColor ?? theme.borderColor,
      paddingLeft: SPACING.md,
      marginLeft: 0,
    },
    pointsLabel: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'left',
    },
    pointsValue: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      textAlign: 'left',
    },
    bucketRow: {
      flexDirection: 'row',
      gap: SPACING.md,
    },
    bucketCard: {
      flex: 1,
      minHeight: 108,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
    },
    bucketCount: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
      textAlign: 'left',
      lineHeight: TYPOGRAPHY.h2 * 1.1,
    },
    playEventCard: {
      marginBottom: SPACING.md,
    },
    playEventCardLast: {
      marginBottom: 0,
    },
    playEventTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      textAlign: 'left',
    },
  })
