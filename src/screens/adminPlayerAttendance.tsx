import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { ThemedButton, ThemedCard } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'
import { BADGE_AWARD_TEXT, BADGE_DISPLAY_TITLE, type BadgeId } from '../data/badgesCatalog'
import {
  type EventMatch,
  focalOutcome,
  matchForFocalRound,
  opponentIdFromMatch,
  opponentNameFromMatch,
  optimisticMatchFromResult,
  removeFocalRoundMatch,
  replaceFocalRoundMatches,
  suggestOpponentFromPreviousRound,
} from '../utils/matchUtils'
import {
  canPlacementDown,
  canPlacementUp,
  nextPlacementDown,
  nextPlacementUp,
} from '../utils/placementUtils'

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
}

type ManualBadgeId = Exclude<BadgeId, 'placed1st' | 'placed2nd' | 'placed3rd'>

const BADGES_TO_AWARD: Array<{ id: ManualBadgeId; icon: number }> = [
  { id: 'champion', icon: require('../../assets/badges/champion.png') },
  { id: 'magician', icon: require('../../assets/badges/magician.png') },
  { id: 'sweat', icon: require('../../assets/badges/sweat.png') },
  { id: 'scholar', icon: require('../../assets/badges/scholar.png') },
  { id: 'quick', icon: require('../../assets/badges/quick.png') },
  { id: 'scientist', icon: require('../../assets/badges/scientist.png') },
  { id: 'flawless', icon: require('../../assets/badges/flawless.png') },
]

function ordinalPlacement(n: number): string {
  const j = n % 10
  const k = n % 100
  if (j === 1 && k !== 11) return `${n}st`
  if (j === 2 && k !== 12) return `${n}nd`
  if (j === 3 && k !== 13) return `${n}rd`
  return `${n}th`
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
  const [placementBoardOpen, setPlacementBoardOpen] = useState(false)
  const [scheduledRounds, setScheduledRounds] = useState(0)
  const [useMatchTracking, setUseMatchTracking] = useState(false)
  const [eventMatches, setEventMatches] = useState<EventMatch[]>([])
  const [roundQuery, setRoundQuery] = useState<Record<number, string>>({})
  const [debouncedRoundQuery, setDebouncedRoundQuery] = useState<Record<number, string>>({})
  const [pickedOpponentId, setPickedOpponentId] = useState<Record<number, number>>({})
  const [savingRoundKey, setSavingRoundKey] = useState<string | null>(null)
  const current = useMemo(
    () => attendance.find((row) => row.userId === userId && row.eventId === eventId) ?? null,
    [attendance, eventId, userId]
  )
  const attended = !!current?.attended
  const placeNum =
    current?.placement == null || Number(current.placement) < 1 ? null : Number(current.placement)
  const placeLabel = placeNum == null ? '—' : ordinalPlacement(placeNum)
  const canPlaceUp = canPlacementUp(placeNum)
  const canPlaceDown = canPlacementDown(placeNum)
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
    const t = setTimeout(() => setDebouncedRoundQuery(roundQuery), 200)
    return () => clearTimeout(t)
  }, [roundQuery])

  const attendedUserIds = useMemo(() => {
    const s = new Set<number>()
    for (const r of placementBoard) {
      if (r.attended) s.add(r.userId)
    }
    return s
  }, [placementBoard])

  const nameByUserId = useMemo(() => {
    const m = new Map<number, string>()
    for (const r of placementBoard) {
      m.set(r.userId, r.userName || r.userEmail || `Player #${r.userId}`)
    }
    return m
  }, [placementBoard])

  const load = useCallback(async () => {
    if (!eventId || !userId) return
    const [attendanceRes, detailsRes, boardRes, settingsRes, matchesRes] = await Promise.all([
      apiRequest<{ attendance: Attendance[] }>('/admin/attendance'),
      apiRequest<{ badges?: EarnedBadge[] }>(`/admin/users/${userId}/details`),
      apiRequest<{ placements: PlacementBoardRow[] }>(`/admin/events/${eventId}/placement-board`),
      apiRequest<{ event: { scheduledRounds?: number | null; useMatchTracking?: boolean } }>(
        `/admin/events/${eventId}/settings`
      ).catch(() => ({ event: {} as { scheduledRounds?: number | null; useMatchTracking?: boolean } })),
      apiRequest<{ matches: EventMatch[] }>(`/admin/events/${eventId}/matches`).catch(() => ({
        matches: [],
      })),
    ])
    setAttendance(attendanceRes.attendance)
    setEarnedBadges(Array.isArray(detailsRes.badges) ? detailsRes.badges : [])
    setPlacementBoard(Array.isArray(boardRes.placements) ? boardRes.placements : [])
    const sr = settingsRes.event?.scheduledRounds
    setScheduledRounds(
      sr != null && Number.isFinite(Number(sr)) ? Math.min(99, Math.max(0, Math.floor(Number(sr)))) : 0
    )
    setUseMatchTracking(!!settingsRes.event?.useMatchTracking)
    setEventMatches(Array.isArray(matchesRes.matches) ? matchesRes.matches : [])
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

  async function bumpPlacement(delta: -1 | 1) {
    if (!eventId || !userId) return
    const cur = placeNum
    const next = delta === -1 ? nextPlacementDown(cur) : nextPlacementUp(cur)
    if (delta === -1 && cur != null && next === null) {
      // Below current rank is all taken — clear placement
      try {
        await apiRequest('/admin/attendance-placement', {
          method: 'POST',
          body: JSON.stringify({ userId, eventId, placement: null }),
        })
        await load()
      } catch (err: any) {
        Alert.alert('Placement failed', err?.message || 'Try again')
      }
      return
    }
    if (next == null && delta === 1) return
    try {
      await apiRequest('/admin/attendance-placement', {
        method: 'POST',
        body: JSON.stringify({ userId, eventId, placement: next }),
      })
      await load()
    } catch (err: any) {
      Alert.alert('Placement failed', err?.message || 'Try again')
    }
  }

  async function saveRoundResult(roundNum: number, opponentId: number, result: 'win' | 'loss' | 'draw') {
    if (!eventId || !userId) return
    const key = `${roundNum}-${result}`
    const prev = eventMatches
    const optimistic = optimisticMatchFromResult(roundNum, userId, opponentId, result, nameByUserId)
    setEventMatches((cur) => replaceFocalRoundMatches(cur, userId, roundNum, optimistic))
    try {
      setSavingRoundKey(key)
      await apiRequest(`/admin/events/${eventId}/matches`, {
        method: 'POST',
        body: JSON.stringify({
          roundNumber: roundNum,
          focalUserId: userId,
          opponentUserId: opponentId,
          result,
        }),
      })
    } catch (err: any) {
      setEventMatches(prev)
      Alert.alert('Match save failed', err?.message || 'Try again')
    } finally {
      setSavingRoundKey(null)
    }
  }

  async function clearRoundMatch(roundNum: number) {
    if (!eventId || !userId) return
    const m = matchForFocalRound(eventMatches, userId, roundNum)
    if (!m) return
    const prevMatches = eventMatches
    const prevPicked = pickedOpponentId
    setEventMatches((cur) => removeFocalRoundMatch(cur, userId, roundNum))
    setPickedOpponentId((p) => {
      const next = { ...p }
      delete next[roundNum]
      return next
    })
    try {
      await apiRequest(`/admin/events/${eventId}/matches`, {
        method: 'DELETE',
        body: JSON.stringify({ focalUserId: userId, roundNumber: roundNum }),
      })
    } catch (err: any) {
      setEventMatches(prevMatches)
      setPickedOpponentId(prevPicked)
      Alert.alert('Clear failed', err?.message || 'Try again')
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
              <Image source={{ uri: userProfileImage }} style={styles.playerAvatar} />
            ) : (
              <View style={styles.playerAvatarFallback}>
                <Text style={styles.playerAvatarInitial}>{(user?.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.playerName}>{user?.name}</Text>
          </View>
          <Text style={styles.playerMeta}>Email: {user?.email}</Text>
          <Text style={styles.playerMeta}>Event: {event?.title}</Text>
          <Text style={styles.playerMeta}>
            {formatEventDateLabel(event?.eventDate ?? null)}
            {event?.location?.trim() ? ` · ${event.location.trim()}` : ''}
          </Text>
        </ThemedCard>

        {useMatchTracking && scheduledRounds > 0 ? (
          <ThemedCard style={styles.roundsCard}>
            <Text style={styles.controlLabel}>Round results</Text>
            <Text style={styles.roundsHint}>
              Choose an attended opponent, then W / L / D for this player. Set round count on the event
              attendance screen.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('AdminRoundBoard', { event, focusUserId: userId })}
              style={({ pressed }) => [styles.boardLink, pressed && styles.boardLinkPressed]}
            >
              <Text style={styles.boardLinkText}>Open round board</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.tintColor} />
            </Pressable>
            {Array.from({ length: scheduledRounds }, (_, idx) => idx + 1).map((roundNum) => {
              const m = matchForFocalRound(eventMatches, userId, roundNum)
              const effectiveOpp =
                m != null ? opponentIdFromMatch(m, userId) : pickedOpponentId[roundNum] ?? null
              const q = (debouncedRoundQuery[roundNum] || '').trim().toLowerCase()
              const filtered = placementBoard.filter(
                (r) =>
                  r.userId !== userId &&
                  r.attended &&
                  (!q ||
                    r.userName.toLowerCase().includes(q) ||
                    r.userEmail.toLowerCase().includes(q))
              )
              const candidates = filtered.slice(0, 6)
              const soleCandidate = filtered.length === 1 ? filtered[0] : null
              const curOutcome = m ? focalOutcome(m, userId) : null
              const busyPrefix = `${roundNum}-`
              const busy = savingRoundKey != null && savingRoundKey.startsWith(busyPrefix)
              const suggestion = suggestOpponentFromPreviousRound(
                eventMatches,
                userId,
                roundNum,
                attendedUserIds
              )
              return (
                <View key={roundNum} style={styles.roundBlock}>
                  <View style={styles.roundTitleRow}>
                    <Text style={styles.roundTitle}>Round {roundNum}</Text>
                    {m != null ? (
                      <Pressable
                        onPress={() => clearRoundMatch(roundNum)}
                        hitSlop={8}
                        style={({ pressed }) => [styles.roundClear, pressed && styles.roundClearPressed]}
                      >
                        <Text style={styles.roundClearLbl}>Clear</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {suggestion ? (
                    <Text style={styles.roundSuggest} numberOfLines={2}>
                      Previous round vs {suggestion.name}
                    </Text>
                  ) : null}
                  {m != null ? (
                    <Text style={styles.roundSavedOpp} numberOfLines={1}>
                      vs {opponentNameFromMatch(m, userId) || `Player #${effectiveOpp}`}
                    </Text>
                  ) : null}
                  <TextInput
                    value={roundQuery[roundNum] ?? ''}
                    onChangeText={(t) => setRoundQuery((prev) => ({ ...prev, [roundNum]: t }))}
                    placeholder="Search opponent (attended)"
                    placeholderTextColor={theme.mutedForegroundColor}
                    style={styles.roundSearch}
                  />
                  {soleCandidate && !m ? (
                    <Pressable
                      onPress={() =>
                        setPickedOpponentId((prev) => ({ ...prev, [roundNum]: soleCandidate.userId }))
                      }
                      style={({ pressed }) => [styles.topMatchChip, pressed && styles.topMatchChipPressed]}
                    >
                      <Text style={styles.topMatchChipText}>Use top match · {soleCandidate.userName}</Text>
                    </Pressable>
                  ) : null}
                  <ScrollView
                    style={styles.roundPickList}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {candidates.map((r) => (
                      <Pressable
                        key={r.userId}
                        onPress={() =>
                          setPickedOpponentId((prev) => ({ ...prev, [roundNum]: r.userId }))
                        }
                        style={({ pressed }) => [
                          styles.roundPickRow,
                          effectiveOpp === r.userId && styles.roundPickRowActive,
                          pressed && styles.roundPickRowPressed,
                        ]}
                      >
                        <Text style={styles.roundPickName} numberOfLines={1}>
                          {r.userName}
                        </Text>
                        <Text style={styles.roundPickEmail} numberOfLines={1}>
                          {r.userEmail}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {effectiveOpp != null ? (
                    <View style={styles.wldRow}>
                      {(['win', 'loss', 'draw'] as const).map((res) => (
                        <Pressable
                          key={res}
                          disabled={busy}
                          onPress={() => saveRoundResult(roundNum, effectiveOpp, res)}
                          style={({ pressed }) => [
                            styles.wldBtn,
                            curOutcome === res && styles.wldBtnActive,
                            pressed && !busy && styles.wldBtnPressed,
                            busy && styles.wldBtnDimmed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.wldBtnLabel,
                              curOutcome === res && styles.wldBtnLabelActive,
                            ]}
                          >
                            {res === 'win' ? 'W' : res === 'loss' ? 'L' : 'D'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.roundNeedOpp}>Select an opponent to record a result.</Text>
                  )}
                </View>
              )
            })}
          </ThemedCard>
        ) : null}

        <ThemedCard style={[styles.controlsCard, styles.placementRosterCard]}>
          <Pressable
            onPress={() => setPlacementBoardOpen((o) => !o)}
            style={({ pressed }) => [
              styles.placementBoardHeader,
              pressed && styles.placementBoardHeaderPressed,
            ]}
          >
            <View style={styles.placementBoardHeaderText}>
              <Text style={styles.placementBoardTitle}>Event placement roster</Text>
              <Text style={styles.placementBoardHint}>
                {hasDuplicatePlacements
                  ? 'Duplicate ranks — fix before saving more'
                  : "See every player's rank for this event"}
              </Text>
            </View>
            <View style={styles.placementBoardHeaderRight}>
              {hasDuplicatePlacements ? (
                <View style={styles.dupBadge}>
                  <Text style={styles.dupBadgeText}>!</Text>
                </View>
              ) : null}
              <Ionicons
                name={placementBoardOpen ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={theme.textColor}
              />
            </View>
          </Pressable>
          {placementBoardOpen ? (
            <View style={styles.placementTable}>
              <View style={styles.placementTableHead}>
                <Text style={[styles.placementTh, styles.placementThPlayer]}>Player</Text>
                <Text style={styles.placementTh}>Place</Text>
              </View>
              <ScrollView
                style={styles.placementTableScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {placementBoard.map((row) => {
                const p = row.placement == null || row.placement < 1 ? null : Number(row.placement)
                const placeCell = p == null ? '—' : ordinalPlacement(p)
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
                    <View style={styles.placementCellPlayer}>
                      <Text style={styles.placementName} numberOfLines={1}>
                        {row.userName}
                      </Text>
                      <Text style={styles.placementEmail} numberOfLines={1}>
                        {row.userEmail}
                      </Text>
                    </View>
                    <Text style={[styles.placementPlace, isDup && styles.placementPlaceDup]}>
                      {placeCell}
                    </Text>
                  </View>
                )
              })}
              </ScrollView>
            </View>
          ) : null}
        </ThemedCard>

        <ThemedCard style={styles.controlsCard}>
          <Text style={styles.controlLabel}>Placement</Text>
          <View style={styles.placementStepper}>
            <Pressable
              onPress={() => bumpPlacement(-1)}
              disabled={!canPlaceDown}
              style={({ pressed }) => [
                styles.placementStepperBtn,
                !canPlaceDown && styles.placementStepperBtnDimmed,
                pressed && canPlaceDown && styles.placementStepperBtnPressed,
              ]}
            >
              <Ionicons
                name="remove-outline"
                size={22}
                color={!canPlaceDown ? theme.mutedForegroundColor : theme.textColor}
              />
            </Pressable>
            <Text style={styles.placementStepperLabel}>{placeLabel}</Text>
            <Pressable
              onPress={() => bumpPlacement(1)}
              disabled={!canPlaceUp}
              style={({ pressed }) => [
                styles.placementStepperBtn,
                !canPlaceUp && styles.placementStepperBtnDimmed,
                pressed && canPlaceUp && styles.placementStepperBtnPressed,
              ]}
            >
              <Ionicons
                name="add-outline"
                size={22}
                color={!canPlaceUp ? theme.mutedForegroundColor : theme.textColor}
              />
            </Pressable>
          </View>
        </ThemedCard>
        <ThemedCard style={styles.badgesCard}>
          <Text style={styles.controlLabel}>Give badges</Text>
          <View style={styles.badgeGrid}>
            {BADGES_TO_AWARD.map((badge) => {
              const alreadyAwarded = earnedBadges.some((b) => b.badgeId === badge.id)
              const title = BADGE_DISPLAY_TITLE[badge.id]
              const description = BADGE_AWARD_TEXT[badge.id]
              return (
                <Pressable
                  key={badge.id}
                  onPress={() => toggleManualBadge(badge.id)}
                  style={({ pressed }) => [
                    styles.badgeOption,
                    alreadyAwarded && styles.badgeOptionAwarded,
                    pressed && styles.badgeOptionPressed,
                  ]}
                >
                  <View style={styles.badgeImageWrap}>
                    <Image source={badge.icon} style={styles.badgeOptionImage} resizeMode="contain" />
                  </View>
                  <Text style={styles.badgeOptionTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.badgeOptionDesc} numberOfLines={2}>
                    {description}
                  </Text>
                  {alreadyAwarded ? (
                    <Text style={styles.badgeAwardedLabel}>Awarded</Text>
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        </ThemedCard>
        <ThemedButton
          label={attended ? 'Attended' : 'Mark attended'}
          variant={attended ? 'primary' : 'outline'}
          onPress={() => setAttendanceValue(!attended)}
          style={styles.attendedButton}
        />
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
    playerCard: { marginBottom: SPACING.md },
    playerHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      marginBottom: SPACING.xs,
    },
    playerAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: theme.cardBackground,
    },
    playerAvatarFallback: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginBottom: SPACING.sm,
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
    roundsCard: {
      marginBottom: SPACING.md,
      gap: SPACING.sm,
    },
    roundsHint: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: TYPOGRAPHY.caption * 1.4,
      marginBottom: SPACING.xs,
    },
    roundBlock: {
      marginTop: SPACING.sm,
      paddingTop: SPACING.sm,
      borderTopWidth: StyleSheet.hairlineWidth * 2,
      borderTopColor: theme.borderColor,
    },
    roundTitle: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    roundTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.xs,
    },
    roundClear: { paddingVertical: 4, paddingHorizontal: 4 },
    roundClearPressed: { opacity: 0.8 },
    roundClearLbl: {
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      color: theme.tintColor,
    },
    roundSuggest: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      fontStyle: 'italic',
      marginBottom: SPACING.xs,
    },
    boardLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: theme.tintColor,
      backgroundColor: theme.cardBackground,
      marginBottom: SPACING.sm,
    },
    boardLinkPressed: { opacity: 0.9 },
    boardLinkText: { fontFamily: theme.semiBoldFont, fontSize: TYPOGRAPHY.bodySmall, color: theme.tintColor },
    topMatchChip: {
      alignSelf: 'flex-start',
      marginBottom: SPACING.xs,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.md,
      backgroundColor: theme.surfaceMuted ?? theme.buttonBackground,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    topMatchChipPressed: { opacity: 0.9 },
    topMatchChipText: { fontFamily: theme.mediumFont, fontSize: TYPOGRAPHY.caption, color: theme.tintColor },
    roundSavedOpp: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.xs,
    },
    roundSearch: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.xs,
    },
    roundPickList: {
      maxHeight: 140,
      marginBottom: SPACING.sm,
    },
    roundPickRow: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: SPACING.xs,
      backgroundColor: theme.cardBackground,
    },
    roundPickRowActive: {
      borderColor: theme.tintColor,
      backgroundColor: theme.surfaceMuted ?? theme.buttonBackground,
    },
    roundPickRowPressed: { opacity: 0.85 },
    roundPickName: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    roundPickEmail: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginTop: 2,
    },
    roundNeedOpp: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      fontStyle: 'italic',
    },
    wldRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      alignItems: 'center',
    },
    wldBtn: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: theme.borderColor,
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
    },
    wldBtnActive: {
      borderColor: theme.tintColor,
      backgroundColor: theme.tintColor,
    },
    wldBtnPressed: { opacity: 0.88 },
    wldBtnDimmed: { opacity: 0.5 },
    wldBtnLabel: {
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      color: theme.textColor,
    },
    wldBtnLabelActive: {
      color: theme.tintTextColor ?? theme.backgroundColor,
    },
    controlsCard: { gap: SPACING.sm },
    placementRosterCard: { marginBottom: SPACING.sm },
    placementBoardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.xs,
    },
    placementBoardHeaderPressed: { opacity: 0.85 },
    placementBoardHeaderText: { flex: 1, paddingRight: SPACING.md },
    placementBoardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    placementBoardTitle: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    placementBoardHint: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginTop: 4,
    },
    dupBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#F97316',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    dupBadgeText: {
      color: '#fff',
      fontFamily: theme.boldFont,
      fontSize: 12,
    },
    placementTable: {
      marginTop: SPACING.sm,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      overflow: 'hidden',
    },
    placementTableScroll: {
      maxHeight: 320,
    },
    placementTableHead: {
      flexDirection: 'row',
      backgroundColor: theme.buttonBackground,
      borderBottomWidth: 1,
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
    placementCellPlayer: { flex: 1, paddingRight: SPACING.sm },
    placementName: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    placementEmail: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginTop: 2,
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
    placementStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      backgroundColor: theme.cardBackground,
      overflow: 'hidden',
      alignSelf: 'flex-start',
    },
    placementStepperBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    placementStepperBtnDimmed: { opacity: 0.45 },
    placementStepperBtnPressed: { opacity: 0.75 },
    placementStepperLabel: {
      minWidth: 64,
      paddingHorizontal: SPACING.xs,
      textAlign: 'center',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      color: theme.textColor,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.borderColor,
      lineHeight: 44,
    },
    attendedButton: {
      marginTop: SPACING.md,
    },
    badgesCard: {
      marginTop: SPACING.md,
      gap: SPACING.sm,
    },
    badgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.md,
      justifyContent: 'space-between',
    },
    badgeOption: {
      width: '48%',
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.cardBackground,
      minHeight: 168,
      paddingHorizontal: SPACING.sm,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.md,
      alignItems: 'center',
    },
    badgeOptionAwarded: {
      borderColor: theme.tintColor,
      backgroundColor: theme.surfaceMuted ?? theme.cardBackground,
    },
    badgeOptionPressed: {
      opacity: 0.85,
    },
    badgeImageWrap: {
      width: 72,
      height: 72,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginBottom: SPACING.xs,
    },
    badgeOptionImage: {
      width: 56,
      height: 56,
      transform: [{ scale: 1.85 }, { translateY: 6 }],
    },
    badgeOptionTitle: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
      width: '100%',
    },
    badgeOptionDesc: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: Math.round(TYPOGRAPHY.caption * 1.35),
      textAlign: 'center',
      width: '100%',
      paddingHorizontal: 2,
    },
    badgeAwardedLabel: {
      marginTop: SPACING.xs,
      color: theme.tintColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      textAlign: 'center',
    },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.backgroundColor },
    emptyText: { color: theme.mutedForegroundColor, fontFamily: theme.mediumFont, fontSize: TYPOGRAPHY.body },
  })
