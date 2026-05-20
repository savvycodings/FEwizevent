import { useCallback, useContext, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable, Switch } from 'react-native'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { ThemedCard, ThemedButton } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type User = {
  id: number
  name: string
  email: string
  profileImageUrl?: string | null
  profile_image_url?: string | null
}
type EventDetails = { id: number; title: string; eventDate: string | null; location: string | null }

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

export function AdminEventAttendance({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const route = useRoute<any>()
  const event = route.params?.event as EventDetails | undefined
  const eventId = Number(event?.id)

  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roundsInput, setRoundsInput] = useState('')
  const [useMatchTracking, setUseMatchTracking] = useState(false)
  const [savingJudge, setSavingJudge] = useState(false)

  const load = useCallback(async () => {
    if (!eventId) return
    const [usersRes, settingsRes] = await Promise.all([
      apiRequest<{ users: User[] }>('/admin/users'),
      apiRequest<{ event: { scheduledRounds?: number | null; useMatchTracking?: boolean } }>(
        `/admin/events/${eventId}/settings`
      ).catch(() => ({ event: {} as { scheduledRounds?: number | null; useMatchTracking?: boolean } })),
    ])
    setUsers(usersRes.users)
    const ev = settingsRes.event
    setRoundsInput(ev?.scheduledRounds != null ? String(ev.scheduledRounds) : '')
    setUseMatchTracking(!!ev?.useMatchTracking)
  }, [eventId])

  async function saveJudgeSettings() {
    if (!eventId) return
    const raw = roundsInput.trim()
    const n = raw === '' ? null : Math.floor(Number(raw))
    if (n !== null && (!Number.isInteger(n) || n < 0 || n > 99)) {
      Alert.alert('Invalid rounds', 'Enter 0–99 or leave empty.')
      return
    }
    try {
      setSavingJudge(true)
      await apiRequest(`/admin/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          scheduledRounds: n,
          useMatchTracking,
        }),
      })
      Alert.alert('Saved', 'Tournament round settings updated.')
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Try again')
    } finally {
      setSavingJudge(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      load().catch((err) => Alert.alert('Attendance load failed', err?.message || 'Try again'))
    }, [load])
  )

  if (!eventId) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Missing event</Text>
      </View>
    )
  }

  const scheduledRoundsCount =
    roundsInput.trim() === ''
      ? 0
      : Math.min(99, Math.max(0, Math.floor(Number(roundsInput))))

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />
      <View style={styles.surface}>
        <ThemedCard style={styles.eventCard}>
          <Text style={styles.selectedEventTitle}>{event?.title || 'Event'}</Text>
          <Text style={styles.selectedEventMeta}>
            {formatEventDateLabel(event?.eventDate ?? null)}
            {event?.location?.trim() ? ` · ${event.location.trim()}` : ''}
          </Text>
        </ThemedCard>
        <ThemedCard style={styles.judgeCard}>
          <Text style={styles.judgeTitle}>Tournament rounds (match record)</Text>
          <Text style={styles.judgeHint}>
            Set how many rounds to show when recording W / L / Draw per player. Players must be marked attended.
          </Text>
          <Text style={styles.inputLabel}>Scheduled rounds</Text>
          <TextInput
            value={roundsInput}
            onChangeText={setRoundsInput}
            keyboardType="number-pad"
            placeholder="e.g. 5"
            placeholderTextColor={theme.mutedForegroundColor}
            style={styles.roundsInput}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable match tracking UI</Text>
            <Switch value={useMatchTracking} onValueChange={setUseMatchTracking} />
          </View>
          <ThemedButton
            label={savingJudge ? 'Saving…' : 'Save round settings'}
            onPress={() => saveJudgeSettings().catch(() => {})}
            disabled={savingJudge}
            premiumRim={false}
          />
          {useMatchTracking && scheduledRoundsCount > 0 ? (
            <ThemedButton
              label="Record rounds (board)"
              variant="outline"
              onPress={() => navigation.navigate('AdminRoundBoard', { event })}
              premiumRim={false}
            />
          ) : null}
        </ThemedCard>

        <Text style={styles.peopleSectionLabel}>People</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={theme.mutedForegroundColor} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholder="Search people"
            placeholderTextColor={theme.mutedForegroundColor}
          />
        </View>
        {users
          .filter((user) => {
            const q = searchQuery.trim().toLowerCase()
            if (!q) return true
            return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
          })
          .map((user) => {
            return (
              <Pressable
                key={user.id}
                style={styles.userPill}
                onPress={() => navigation.navigate('AdminPlayerAttendance', { event, user })}
              >
                <View style={styles.userIdentity}>
                  <Text style={styles.userText}>{user.name}</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={theme.mutedForegroundColor} />
              </Pressable>
            )
          })}
      </View>
    </ScrollView>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.backgroundColor },
    content: { paddingBottom: SPACING['4xl'] },
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
    eventCard: { marginTop: SPACING.md, marginBottom: SPACING.md },
    selectedEventTitle: { color: theme.textColor, fontFamily: theme.boldFont, fontSize: TYPOGRAPHY.h4, marginBottom: SPACING.xs },
    selectedEventMeta: { color: theme.mutedForegroundColor, fontFamily: theme.regularFont, fontSize: TYPOGRAPHY.bodySmall, marginBottom: SPACING.lg },
    judgeCard: { marginBottom: SPACING.lg, gap: SPACING.sm },
    judgeTitle: { color: theme.textColor, fontFamily: theme.semiBoldFont, fontSize: TYPOGRAPHY.bodySmall },
    judgeHint: { color: theme.mutedForegroundColor, fontFamily: theme.regularFont, fontSize: TYPOGRAPHY.caption, lineHeight: TYPOGRAPHY.caption * 1.4 },
    inputLabel: { color: theme.mutedForegroundColor, fontFamily: theme.mediumFont, fontSize: TYPOGRAPHY.caption, marginTop: SPACING.xs },
    roundsInput: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: SPACING.sm,
    },
    switchLabel: { color: theme.textColor, fontFamily: theme.regularFont, fontSize: TYPOGRAPHY.bodySmall, flex: 1, paddingRight: SPACING.md },
    peopleSectionLabel: { color: theme.textColor, fontFamily: theme.semiBoldFont, fontSize: TYPOGRAPHY.bodySmall, marginBottom: SPACING.sm },
    searchWrap: {
      borderColor: theme.borderColor, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
      flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, backgroundColor: theme.cardBackground,
    },
    searchInput: { flex: 1, color: theme.textColor, marginLeft: SPACING.sm, fontFamily: theme.regularFont, fontSize: TYPOGRAPHY.bodySmall, paddingVertical: 0 },
    userPill: {
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.full,
      backgroundColor: theme.surfaceMuted ?? theme.cardBackground,
      minHeight: 52,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    userIdentity: { flex: 1, paddingRight: SPACING.md, justifyContent: 'center', minHeight: 40 },
    userText: { color: theme.textColor, fontFamily: theme.mediumFont, fontSize: TYPOGRAPHY.bodySmall },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.backgroundColor },
    emptyText: { color: theme.mutedForegroundColor, fontFamily: theme.mediumFont, fontSize: TYPOGRAPHY.body },
  })
