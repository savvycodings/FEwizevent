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

        <Section title="Championship points" compactTopSpacing>
          <ThemedCard premiumRim>
            <View style={styles.threeColRow}>
              {championshipPoints.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.threeColCell, index > 0 ? styles.threeColCellWithRule : null]}
                >
                  <Text style={styles.colLabel} numberOfLines={2}>
                    {item.label}
                  </Text>
                  <Text style={styles.colValue}>{item.points}</Text>
                </View>
              ))}
            </View>
          </ThemedCard>
        </Section>

        <Section title="Championship tiers" compactTopSpacing>
          <ThemedCard premiumRim>
            <View style={styles.threeColRow}>
              {eventBuckets.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.threeColCell, index > 0 ? styles.threeColCellWithRule : null]}
                >
                  <Text style={styles.colLabel} numberOfLines={2}>
                    {item.label}
                  </Text>
                  <Text style={styles.colValue}>{item.count}</Text>
                </View>
              ))}
            </View>
          </ThemedCard>
        </Section>

        <Section title="Recent events" compactTopSpacing>
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
            <EmptyState variant="mutedBand" title="No history yet" message="No attended events yet." />
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
    threeColRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      width: '100%',
    },
    threeColCell: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      gap: SPACING.sm,
      paddingRight: SPACING.sm,
    },
    threeColCellWithRule: {
      borderLeftWidth: StyleSheet.hairlineWidth * 2,
      borderLeftColor: theme.dividerColor ?? theme.borderColor,
      paddingLeft: SPACING.sm,
    },
    colLabel: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: Math.round(TYPOGRAPHY.caption * 1.35),
      textAlign: 'left',
      width: '100%',
    },
    colValue: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      textAlign: 'left',
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
