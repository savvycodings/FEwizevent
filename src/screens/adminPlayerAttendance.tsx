import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { AppIcon, BadgeVectorIcon, RemoteImage } from '../components'
import { ThemeContext } from '../context'
import { Input, ThemedButton, ThemedCard } from '../components'
import { DeckPicker } from '../components/content/DeckPicker'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'
import { BADGE_DISPLAY_TITLE, MANUAL_AWARD_BADGE_ORDER, type BadgeId, type ManualAwardBadgeId } from '../data/badgesCatalog'

type User = {
  id: number
  name: string
  email: string
  profileImageUrl?: string | null
  profile_image_url?: string | null
}
type EventDetails = { id: number; title: string; eventDate: string | null; location: string | null }
type Attendance = { userId: number; eventId: number; attended: boolean; placement?: number | null }
type EarnedBadge = {
  badgeId: BadgeId
  placement: number | null
  eventId: number | null
  eventTitle: string | null
  awardedAt: string
}
type PlacementBoardRow = {
  userId: number
  userName: string
  userEmail: string
  attended: boolean
  placement: number | null
  deckId?: string | null
  suggestedDeckId?: string | null
}

const BADGES_TO_AWARD = MANUAL_AWARD_BADGE_ORDER

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

export function AdminPlayerAttendance() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const event = route.params?.event as EventDetails | undefined
  const user = route.params?.user as User | undefined
  const eventId = Number(event?.id)
  const userId = Number(user?.id)
  const userProfileImage = user?.profileImageUrl ?? user?.profile_image_url ?? null

  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([])
  const [placementBoard, setPlacementBoard] = useState<PlacementBoardRow[]>([])
  const [scheduledRounds, setScheduledRounds] = useState(0)
  const [useMatchTracking, setUseMatchTracking] = useState(false)
  const [placementDraft, setPlacementDraft] = useState('')
  const [savingPlacement, setSavingPlacement] = useState(false)
  const current = useMemo(
    () => attendance.find((row) => row.userId === userId && row.eventId === eventId) ?? null,
    [attendance, eventId, userId]
  )
  const attended = !!current?.attended
  const placeNum =
    current?.placement == null || Number(current.placement) < 1 ? null : Number(current.placement)
  const boardRow = useMemo(
    () => placementBoard.find((row) => row.userId === userId) ?? null,
    [placementBoard, userId]
  )
  const eventDeckId = boardRow?.deckId ?? null
  const suggestedDeckId = boardRow?.suggestedDeckId ?? null
  const duplicatePlacements = useMemo(() => {
    const counts = new Map<number, number>()
    for (const row of placementBoard) {
      const p = row.placement
      if (p != null && p >= 1) counts.set(p, (counts.get(p) || 0) + 1)
    }
    const dups = new Set<number>()
    counts.forEach((n, p) => {
      if (n > 1) dups.add(p)
    })
    return dups
  }, [placementBoard])

  const hasDuplicatePlacements = duplicatePlacements.size > 0

  useEffect(() => {
    setPlacementDraft(placeNum == null ? '' : String(placeNum))
  }, [placeNum])

  const badgeRows = useMemo(() => {
    const rows: ManualAwardBadgeId[][] = []
    for (let i = 0; i < BADGES_TO_AWARD.length; i += 2) {
      rows.push(BADGES_TO_AWARD.slice(i, i + 2))
    }
    return rows
  }, [])

  const load = useCallback(async () => {
    if (!eventId || !userId) return
    const [attendanceRes, detailsRes, boardRes, settingsRes] = await Promise.all([
      apiRequest<{ attendance: Attendance[] }>('/admin/attendance'),
      apiRequest<{ badges?: EarnedBadge[] }>(`/admin/users/${userId}/details`),
      apiRequest<{ placements: PlacementBoardRow[] }>(`/admin/events/${eventId}/placement-board`),
      apiRequest<{ event: { scheduledRounds?: number | null; useMatchTracking?: boolean } }>(
        `/admin/events/${eventId}/settings`
      ).catch(() => ({ event: {} as { scheduledRounds?: number | null; useMatchTracking?: boolean } })),
    ])
    setAttendance(attendanceRes.attendance)
    setEarnedBadges(Array.isArray(detailsRes.badges) ? detailsRes.badges : [])
    setPlacementBoard(Array.isArray(boardRes.placements) ? boardRes.placements : [])
    const sr = settingsRes.event?.scheduledRounds
    setScheduledRounds(
      sr != null && Number.isFinite(Number(sr)) ? Math.min(99, Math.max(0, Math.floor(Number(sr)))) : 0
    )
    setUseMatchTracking(!!settingsRes.event?.useMatchTracking)
  }, [eventId, userId])

  useFocusEffect(
    useCallback(() => {
      load().catch((err) => Alert.alert('Attendance load failed', err?.message || 'Try again'))
    }, [load])
  )

  async function setAttendanceValue(nextAttended: boolean) {
    if (!eventId || !userId) return
    await apiRequest('/admin/attendance', {
      method: 'POST',
      body: JSON.stringify({ userId, eventId, attended: nextAttended }),
    })
    await load()
  }

  async function setEventDeck(deckId: string) {
    if (!eventId || !userId) return
    try {
      await apiRequest('/admin/attendance-deck', {
        method: 'POST',
        body: JSON.stringify({ userId, eventId, deckId }),
      })
      await load()
    } catch (err: any) {
      Alert.alert('Deck update failed', err?.message || 'Try again')
    }
  }

  async function commitPlacement() {
    if (!eventId || !userId || savingPlacement) return
    const raw = placementDraft.trim()
    const next = raw === '' ? null : Math.floor(Number(raw))
    if (raw !== '' && (!Number.isFinite(next) || next < 1)) {
      Alert.alert('Invalid place', 'Enter a whole number (1 or higher), or leave empty to clear.')
      setPlacementDraft(placeNum == null ? '' : String(placeNum))
      return
    }
    if (next === placeNum) return
    try {
      setSavingPlacement(true)
      await apiRequest('/admin/attendance-placement', {
        method: 'POST',
        body: JSON.stringify({ userId, eventId, placement: next }),
      })
      await load()
    } catch (err: any) {
      Alert.alert('Placement failed', err?.message || 'Try again')
      setPlacementDraft(placeNum == null ? '' : String(placeNum))
    } finally {
      setSavingPlacement(false)
    }
  }

  async function toggleManualBadge(
    badgeId: Exclude<BadgeId, 'placed1st' | 'placed2nd' | 'placed3rd'>
  ) {
    if (!userId) return
    const alreadyAwarded = earnedBadges.some((b) => b.badgeId === badgeId)
    try {
      await apiRequest(
        alreadyAwarded ? `/admin/users/${userId}/badges/remove` : `/admin/users/${userId}/badges`,
        {
        method: 'POST',
        body: JSON.stringify({ badgeId }),
        }
      )
      await load()
    } catch (err: any) {
      Alert.alert('Badge update failed', err?.message || 'Try again')
    }
  }

  if (!eventId || !userId) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Missing user or event</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />
      <View style={styles.surface}>
        <ThemedCard style={styles.playerCard}>
          <View style={styles.playerHeaderRow}>
            {userProfileImage ? (
              <RemoteImage
                uri={userProfileImage}
                style={styles.playerAvatar}
                spinnerSize={18}
                spinnerColor={theme.tintColor}
                fallback={
                  <View style={styles.playerAvatarFallback}>
                    <Text style={styles.playerAvatarInitial}>
                      {(user?.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                }
              />
            ) : (
              <View style={styles.playerAvatarFallback}>
                <Text style={styles.playerAvatarInitial}>{(user?.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.playerHeaderText}>
              <Text style={styles.playerName} numberOfLines={1}>
                {user?.name}
              </Text>
              <Text style={styles.playerMeta} numberOfLines={1}>
                {event?.title} · {formatEventDateLabel(event?.eventDate ?? null)}
              </Text>
            </View>
          </View>
        </ThemedCard>

        <ThemedButton
          label={attended ? 'Attended' : 'Mark attended'}
          variant={attended ? 'primary' : 'outline'}
          onPress={() => setAttendanceValue(!attended)}
        />

        <ThemedCard style={styles.deckCard}>
          <DeckPicker
            value={eventDeckId}
            suggestedDeckId={suggestedDeckId}
            onChange={setEventDeck}
            label="Deck for this event"
            placeholder="Select deck"
          />
        </ThemedCard>

        {useMatchTracking && scheduledRounds > 0 ? (
          <Pressable
            onPress={() => navigation.navigate('AdminRoundBoard', { event, focusUserId: userId })}
            style={({ pressed }) => [styles.boardLink, pressed && styles.boardLinkPressed]}
          >
            <Text style={styles.boardLinkText}>Round board</Text>
            <AppIcon name="chevron-right" size={18} color={theme.tintColor} />
          </Pressable>
        ) : null}

        <ThemedCard style={styles.leaderboardCard}>
          <Text style={styles.controlLabel}>Leaderboard</Text>
          <View style={styles.placementEntryRow}>
            <Text style={styles.placementEntryLabel}>Place</Text>
            <Input
              value={placementDraft}
              onChangeText={setPlacementDraft}
              onBlur={() => commitPlacement()}
              onSubmitEditing={() => commitPlacement()}
              keyboardType="number-pad"
              placeholder="#"
              returnKeyType="done"
              editable={!savingPlacement}
              className="mb-0 min-h-11 flex-1"
            />
          </View>
          {hasDuplicatePlacements ? (
            <Text style={styles.placementWarn}>Duplicate places — adjust ranks</Text>
          ) : null}
          <View style={styles.placementTable}>
            <View style={styles.placementTableHead}>
              <Text style={[styles.placementTh, styles.placementThPlayer]}>Player</Text>
              <Text style={styles.placementTh}>#</Text>
            </View>
            <ScrollView
              style={styles.placementTableScroll}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {placementBoard.map((row) => {
                const p = row.placement == null || row.placement < 1 ? null : Number(row.placement)
                const placeCell = p == null ? '—' : String(p)
                const isDup = p != null && duplicatePlacements.has(p)
                const isCurrent = row.userId === userId
                return (
                  <View
                    key={row.userId}
                    style={[
                      styles.placementRow,
                      isDup && styles.placementRowDup,
                      isCurrent && styles.placementRowCurrent,
                    ]}
                  >
                    <Text style={styles.placementName} numberOfLines={1}>
                      {row.userName}
                    </Text>
                    <Text style={[styles.placementPlace, isDup && styles.placementPlaceDup]}>
                      {placeCell}
                    </Text>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        </ThemedCard>

        <ThemedCard style={styles.badgesCard}>
          <Text style={styles.controlLabel}>Badges</Text>
          {badgeRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.badgeRow}>
              {row.map((badgeId) => {
                const alreadyAwarded = earnedBadges.some((b) => b.badgeId === badgeId)
                const title = BADGE_DISPLAY_TITLE[badgeId]
                return (
                  <Pressable
                    key={badgeId}
                    onPress={() => toggleManualBadge(badgeId)}
                    style={({ pressed }) => [
                      styles.badgeOption,
                      alreadyAwarded && styles.badgeOptionAwarded,
                      pressed && styles.badgeOptionPressed,
                    ]}
                  >
                    <View style={styles.badgeImageWrap}>
                      <BadgeVectorIcon
                        badgeId={badgeId}
                        size={40}
                        color={alreadyAwarded ? theme.tintColor : theme.textColor}
                        opacity={alreadyAwarded ? 1 : 0.55}
                      />
                    </View>
                    <Text style={styles.badgeOptionTitle} numberOfLines={1}>
                      {title}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ))}
        </ThemedCard>
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
      gap: SPACING.md,
    },
    playerCard: { marginBottom: SPACING.md },
    playerHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      marginBottom: SPACING.xs,
    },
    playerHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    playerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: theme.cardBackground,
    },
    playerAvatarFallback: {
      width: 48,
      height: 48,
      borderRadius: 24,
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
    playerName: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      flexShrink: 1,
    },
    playerMeta: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginTop: 2,
    },
    boardLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      marginBottom: SPACING.md,
      minHeight: 48,
    },
    boardLinkPressed: { opacity: 0.9 },
    boardLinkText: {
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      color: theme.textColor,
    },
    deckCard: {
      marginTop: SPACING.md,
      marginBottom: SPACING.md,
    },
    leaderboardCard: {
      marginBottom: SPACING.md,
      gap: SPACING.sm,
    },
    placementEntryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    placementEntryLabel: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      width: 44,
    },
    placementWarn: {
      color: '#F97316',
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
    },
    placementTable: {
      marginTop: SPACING.sm,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      overflow: 'hidden',
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    placementTableScroll: {
      maxHeight: 320,
    },
    placementTableHead: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceMuted ?? theme.cardBackground ?? theme.backgroundColor,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.borderColor,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
    },
    placementTh: {
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
      color: theme.mutedForegroundColor,
      width: 56,
      textAlign: 'right',
    },
    placementThPlayer: { flex: 1, width: undefined, textAlign: 'left' },
    placementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      backgroundColor: theme.cardBackground,
    },
    placementRowDup: {
      backgroundColor: 'rgba(249, 115, 22, 0.12)',
    },
    placementRowCurrent: {
      borderLeftWidth: 3,
      borderLeftColor: theme.tintColor,
    },
    placementName: {
      flex: 1,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      paddingRight: SPACING.sm,
    },
    placementPlace: {
      width: 56,
      textAlign: 'right',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      color: theme.textColor,
    },
    placementPlaceDup: {
      color: '#F97316',
    },
    controlLabel: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginTop: SPACING.xs,
    },
    badgesCard: {
      marginTop: SPACING.md,
      gap: SPACING.sm,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    badgeOption: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      minHeight: 96,
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeOptionAwarded: {
      borderColor: theme.tintColor,
      backgroundColor: `${theme.tintColor}18`,
    },
    badgeOptionPressed: {
      opacity: 0.85,
    },
    badgeImageWrap: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xs,
    },
    badgeOptionTitle: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
      width: '100%',
    },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.backgroundColor },
    emptyText: { color: theme.mutedForegroundColor, fontFamily: theme.mediumFont, fontSize: TYPOGRAPHY.body },
  })
