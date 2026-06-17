import { useCallback, useContext, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { ThemeContext } from '../context'
import { RainSpinner, ThemedCard } from '../components'
import { apiRequest } from '../api'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'

type CheckInPlayer = {
  userId: number
  userName: string
  attended: boolean
  placement: number | null
  seasonXp: number
  currentRank: string
  entitlementTier: string
}

export function AdminEventCheckIn({ route }: { route: { params?: { eventId?: number } } }) {
  const eventId = Number(route.params?.eventId)
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<CheckInPlayer[]>([])

  const load = useCallback(async () => {
    if (!eventId) {
      setPlayers([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const res = await apiRequest<{ players: CheckInPlayer[] }>(
        `/admin/events/${eventId}/check-in`
      )
      setPlayers(Array.isArray(res.players) ? res.players : [])
    } catch {
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading) {
    return (
      <View style={styles.center}>
        <RainSpinner size={32} color={theme.tintColor} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Rank · entitlement · season XP for prize desk</Text>
      {players.length === 0 ? (
        <Text style={styles.empty}>No players registered for this event yet.</Text>
      ) : (
        players.map((p) => (
          <ThemedCard key={p.userId} style={styles.row}>
            <Text style={styles.name}>{p.userName}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>Rank: {p.currentRank}</Text>
              <Text style={styles.meta}>Entitlement: {p.entitlementTier}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>Season XP: {p.seasonXp}</Text>
              <Text style={styles.meta}>
                {p.attended ? (p.placement ? `#${p.placement}` : 'Attended') : 'Not checked in'}
              </Text>
            </View>
          </ThemedCard>
        ))
      )}
    </ScrollView>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.backgroundColor },
    content: { padding: SPACING.containerPadding, paddingBottom: SPACING['3xl'], gap: SPACING.sm },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    subtitle: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    },
    empty: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
      paddingVertical: SPACING.xl,
    },
    row: { gap: SPACING.xs },
    name: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
    },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
    meta: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
  })
