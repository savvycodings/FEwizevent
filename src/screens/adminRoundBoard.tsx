import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { ThemeContext } from '../context'
import { ThemedButton, ThemedCard } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'
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

type EventDetails = { id: number; title: string; eventDate: string | null; location: string | null }
type PlacementBoardRow = {
  userId: number
  userName: string
  userEmail: string
  attended: boolean
  placement: number | null
}

const ROW_H = 102

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

export function AdminRoundBoard() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const event = route.params?.event as EventDetails | undefined
  const focusUserId = route.params?.focusUserId as number | undefined
  const eventId = Number(event?.id)

  const sheetRef = useRef<BottomSheetModal>(null)
  const listRef = useRef<FlatList<PlacementBoardRow>>(null)
  const optimisticSeq = useRef(0)

  const [loading, setLoading] = useState(true)
  const [scheduledRounds, setScheduledRounds] = useState(0)
  const [useMatchTracking, setUseMatchTracking] = useState(false)
  const [activeRound, setActiveRound] = useState(1)
  const [board, setBoard] = useState<PlacementBoardRow[]>([])
  const [matches, setMatches] = useState<EventMatch[]>([])
  const [draftOpponent, setDraftOpponent] = useState<Record<number, number>>({})
  const [pickerFocal, setPickerFocal] = useState<number | null>(null)
  const [sheetQuery, setSheetQuery] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [didScrollToFocus, setDidScrollToFocus] = useState(false)

  const nameByUserId = useMemo(() => {
    const m = new Map<number, string>()
    for (const r of board) {
      m.set(r.userId, r.userName || r.userEmail || `Player #${r.userId}`)
    }
    return m
  }, [board])

  const attendedIds = useMemo(() => {
    const s = new Set<number>()
    for (const r of board) {
      if (r.attended) s.add(r.userId)
    }
    return s
  }, [board])

  const attendedRows = useMemo(() => {
    return board
      .filter((r) => r.attended)
      .slice()
      .sort((a, b) => a.userName.localeCompare(b.userName, undefined, { sensitivity: 'base' }))
  }, [board])

  const missingResultCount = useMemo(() => {
    let n = 0
    for (const r of attendedRows) {
      const m = matchForFocalRound(matches, r.userId, activeRound)
      if (!m) n += 1
    }
    return n
  }, [attendedRows, matches, activeRound])

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const [settingsRes, boardRes, matchesRes] = await Promise.all([
        apiRequest<{ event: { scheduledRounds?: number | null; useMatchTracking?: boolean } }>(
          `/admin/events/${eventId}/settings`
        ).catch(() => ({ event: {} as { scheduledRounds?: number | null; useMatchTracking?: boolean } })),
        apiRequest<{ placements: PlacementBoardRow[] }>(`/admin/events/${eventId}/placement-board`),
        apiRequest<{ matches: EventMatch[] }>(`/admin/events/${eventId}/matches`).catch(() => ({
          matches: [],
        })),
      ])
      const sr = settingsRes.event?.scheduledRounds
      setScheduledRounds(
        sr != null && Number.isFinite(Number(sr)) ? Math.min(99, Math.max(0, Math.floor(Number(sr)))) : 0
      )
      setUseMatchTracking(!!settingsRes.event?.useMatchTracking)
      setBoard(Array.isArray(boardRes.placements) ? boardRes.placements : [])
      setMatches(Array.isArray(matchesRes.matches) ? matchesRes.matches : [])
    } catch (e: any) {
      Alert.alert('Load failed', e?.message || 'Try again')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {})
      setDidScrollToFocus(false)
    }, [load])
  )

  useEffect(() => {
    if (scheduledRounds > 0 && activeRound > scheduledRounds) {
      setActiveRound(scheduledRounds)
    }
  }, [scheduledRounds, activeRound])

  const nextOptimisticId = () => {
    optimisticSeq.current += 1
    return -(Date.now() + optimisticSeq.current)
  }

  const openPicker = (focalId: number) => {
    setPickerFocal(focalId)
    setSheetQuery('')
    sheetRef.current?.present()
  }

  const sheetBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  )

  const pickerFocalRow = pickerFocal != null ? board.find((r) => r.userId === pickerFocal) : undefined
  const sheetCandidates = useMemo(() => {
    if (pickerFocal == null) return []
    const q = sheetQuery.trim().toLowerCase()
    return board
      .filter(
        (r) =>
          r.attended &&
          r.userId !== pickerFocal &&
          (!q || r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q))
      )
      .slice()
      .sort((a, b) => a.userName.localeCompare(b.userName))
  }, [board, pickerFocal, sheetQuery])

  const sheetSuggestion =
    pickerFocal != null
      ? suggestOpponentFromPreviousRound(matches, pickerFocal, activeRound, attendedIds)
      : null

  const selectOpponent = (focalId: number, opponentId: number) => {
    setDraftOpponent((prev) => ({ ...prev, [focalId]: opponentId }))
    sheetRef.current?.dismiss()
    setPickerFocal(null)
  }

  async function postResult(focalId: number, opponentId: number, result: 'win' | 'loss' | 'draw') {
    if (!eventId) return
    const key = `${focalId}-${result}`
    const prevMatches = matches
    const optimistic = optimisticMatchFromResult(activeRound, focalId, opponentId, result, nameByUserId)
    optimistic.id = nextOptimisticId()
    setMatches((m) => replaceFocalRoundMatches(m, focalId, activeRound, optimistic))
    try {
      setSavingKey(key)
      await apiRequest(`/admin/events/${eventId}/matches`, {
        method: 'POST',
        body: JSON.stringify({
          roundNumber: activeRound,
          focalUserId: focalId,
          opponentUserId: opponentId,
          result,
        }),
      })
    } catch (e: any) {
      setMatches(prevMatches)
      Alert.alert('Match save failed', e?.message || 'Try again')
    } finally {
      setSavingKey(null)
    }
  }

  async function clearRound(focalId: number) {
    if (!eventId) return
    const m = matchForFocalRound(matches, focalId, activeRound)
    if (!m) return
    const prevMatches = matches
    const prevDraft = draftOpponent
    setMatches((cur) => removeFocalRoundMatch(cur, focalId, activeRound))
    setDraftOpponent((d) => {
      const next = { ...d }
      delete next[focalId]
      return next
    })
    try {
      await apiRequest(`/admin/events/${eventId}/matches`, {
        method: 'DELETE',
        body: JSON.stringify({ focalUserId: focalId, roundNumber: activeRound }),
      })
    } catch (e: any) {
      setMatches(prevMatches)
      setDraftOpponent(prevDraft)
      Alert.alert('Clear failed', e?.message || 'Try again')
    }
  }

  useEffect(() => {
    if (!focusUserId || didScrollToFocus || attendedRows.length === 0 || loading) return
    const idx = attendedRows.findIndex((r) => r.userId === focusUserId)
    if (idx < 0) return
    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: idx, viewPosition: 0.15 })
      setDidScrollToFocus(true)
    }, 100)
    return () => clearTimeout(t)
  }, [focusUserId, didScrollToFocus, attendedRows, loading])

  const roundTabs =
    scheduledRounds > 0 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {Array.from({ length: scheduledRounds }, (_, i) => i + 1).map((r) => (
          <Pressable
            key={r}
            onPress={() => setActiveRound(r)}
            style={({ pressed }) => [
              styles.tabPill,
              activeRound === r && styles.tabPillActive,
              pressed && styles.tabPillPressed,
            ]}
          >
            <Text
              style={[styles.tabPillLabel, activeRound === r && styles.tabPillLabelActive]}
              numberOfLines={1}
            >
              Round {r}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    ) : null

  const guardOk = useMatchTracking && scheduledRounds > 0

  const mainBody = loading ? (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={theme.tintColor} />
    </View>
  ) : !guardOk ? (
    <ThemedCard style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>Round board unavailable</Text>
      <Text style={styles.emptyHint}>
        Turn on match tracking and set at least one scheduled round on the event attendance screen.
      </Text>
      <ThemedButton
        label="Open event attendance"
        onPress={() => navigation.navigate('AdminEventManage', { event })}
        style={styles.emptyBtn}
      />
    </ThemedCard>
  ) : (
    <>
      <ThemedCard style={styles.eventCard}>
        <Text style={styles.eventTitle}>{event?.title || 'Event'}</Text>
        <Text style={styles.eventMeta}>
          {formatEventDateLabel(event?.eventDate ?? null)}
          {event?.location?.trim() ? ` · ${event.location.trim()}` : ''}
        </Text>
      </ThemedCard>

      <View style={styles.tabsWrap}>{roundTabs}</View>

      {missingResultCount > 0 ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {missingResultCount} player{missingResultCount === 1 ? '' : 's'} missing a result this round.
          </Text>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={attendedRows}
        keyExtractor={(item) => String(item.userId)}
        keyboardShouldPersistTaps="handled"
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true })
          }, 50)
        }}
        getItemLayout={(_, index) => ({ length: ROW_H, offset: ROW_H * index, index })}
        renderItem={({ item }) => {
          const focalId = item.userId
          const m = matchForFocalRound(matches, focalId, activeRound)
          const draft = draftOpponent[focalId]
          const effectiveOpp = m != null ? opponentIdFromMatch(m, focalId) : draft ?? null
          const oppDisplay =
            m != null
              ? opponentNameFromMatch(m, focalId) || (effectiveOpp != null ? nameByUserId.get(effectiveOpp) : '')
              : effectiveOpp != null
                ? nameByUserId.get(effectiveOpp) ?? `Player #${effectiveOpp}`
                : ''
          const curOutcome = m ? focalOutcome(m, focalId) : null
          const suggestion = suggestOpponentFromPreviousRound(matches, focalId, activeRound, attendedIds)
          const busy = savingKey != null && savingKey.startsWith(`${focalId}-`)

          return (
            <View style={styles.row}>
              <View style={styles.colPlayer}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {item.userName}
                </Text>
                <Text style={styles.playerEmail} numberOfLines={1}>
                  {item.userEmail}
                </Text>
              </View>
              <Pressable
                onPress={() => openPicker(focalId)}
                style={({ pressed }) => [styles.colOpp, pressed && styles.colOppPressed]}
              >
                <Text style={styles.oppMain} numberOfLines={1}>
                  {oppDisplay || 'Pick opponent'}
                </Text>
                {suggestion && m == null ? (
                  <Text style={styles.oppHint} numberOfLines={1}>
                    Suggested: {suggestion.name}
                  </Text>
                ) : null}
              </Pressable>
              <View style={styles.wldWrap}>
                {(['win', 'loss', 'draw'] as const).map((res) => (
                  <Pressable
                    key={res}
                    disabled={busy || effectiveOpp == null}
                    onPress={() => postResult(focalId, effectiveOpp!, res)}
                    style={({ pressed }) => [
                      styles.wldMini,
                      curOutcome === res && styles.wldMiniOn,
                      pressed && !busy && effectiveOpp != null && styles.wldMiniPressed,
                      (busy || effectiveOpp == null) && styles.wldMiniDim,
                    ]}
                  >
                    <Text
                      style={[styles.wldMiniLbl, curOutcome === res && styles.wldMiniLblOn]}
                      numberOfLines={1}
                    >
                      {res === 'win' ? 'W' : res === 'loss' ? 'L' : 'D'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={() => clearRound(focalId)}
                disabled={!m}
                style={({ pressed }) => [
                  styles.clearBtn,
                  m && pressed && styles.clearBtnPressed,
                  !m && styles.clearBtnOff,
                ]}
                hitSlop={6}
              >
                <Text style={[styles.clearLbl, !m && styles.clearLblOff]}>Clear</Text>
              </Pressable>
            </View>
          )
        }}
        ItemSeparatorComponent={() => <View style={styles.rowSep} />}
        ListFooterComponent={<View style={{ height: SPACING['3xl'] }} />}
      />
    </>
  )

  return (
    <BottomSheetModalProvider>
      <View style={styles.screen}>
        {mainBody}
        <BottomSheetModal
          ref={sheetRef}
          snapPoints={['56%', '88%']}
          enablePanDownToClose
          backdropComponent={sheetBackdrop}
          backgroundStyle={{ backgroundColor: theme.cardBackground }}
          handleIndicatorStyle={{ backgroundColor: theme.mutedForegroundColor }}
          onDismiss={() => setPickerFocal(null)}
        >
          <BottomSheetView style={styles.sheetRoot}>
            <Text style={styles.sheetTitle}>
              Opponent{pickerFocalRow ? ` · ${pickerFocalRow.userName}` : ''}
            </Text>
            <TextInput
              value={sheetQuery}
              onChangeText={setSheetQuery}
              placeholder="Search attended players"
              placeholderTextColor={theme.mutedForegroundColor}
              style={styles.sheetSearch}
            />
            {sheetSuggestion ? (
              <Pressable
                onPress={() => selectOpponent(pickerFocal!, sheetSuggestion.userId)}
                style={({ pressed }) => [styles.suggestChip, pressed && styles.suggestChipPressed]}
              >
                <Text style={styles.suggestChipText}>
                  Use {sheetSuggestion.name} (previous round)
                </Text>
              </Pressable>
            ) : null}
            {sheetCandidates.length === 1 ? (
              <Pressable
                onPress={() => selectOpponent(pickerFocal!, sheetCandidates[0].userId)}
                style={({ pressed }) => [styles.suggestChip, pressed && styles.suggestChipPressed]}
              >
                <Text style={styles.suggestChipText}>Use top match · {sheetCandidates[0].userName}</Text>
              </Pressable>
            ) : null}
            <BottomSheetFlatList
              data={sheetCandidates}
              keyExtractor={(r) => String(r.userId)}
              keyboardShouldPersistTaps="handled"
              style={styles.sheetList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => pickerFocal != null && selectOpponent(pickerFocal, item.userId)}
                  style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
                >
                  <Text style={styles.sheetRowName} numberOfLines={1}>
                    {item.userName}
                  </Text>
                  <Text style={styles.sheetRowEmail} numberOfLines={1}>
                    {item.userEmail}
                  </Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.sheetSep} />}
            />
          </BottomSheetView>
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.backgroundColor },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    eventCard: { marginHorizontal: SPACING.containerPadding, marginTop: SPACING.sm, marginBottom: SPACING.sm },
    eventTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
    },
    eventMeta: {
      marginTop: 4,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    tabsWrap: {
      paddingHorizontal: SPACING.containerPadding,
      marginBottom: SPACING.sm,
    },
    tabScroll: { flexGrow: 0 },
    tabPill: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.borderColor,
      marginRight: SPACING.sm,
      backgroundColor: theme.backgroundColor,
      minHeight: 44,
      justifyContent: 'center',
    },
    tabPillActive: {
      borderColor: theme.tintColor,
      backgroundColor: theme.tintColor,
    },
    tabPillPressed: { opacity: 0.88 },
    tabPillLabel: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
    },
    tabPillLabelActive: {
      color: theme.tintTextColor ?? theme.backgroundColor,
    },
    banner: {
      marginHorizontal: SPACING.containerPadding,
      marginBottom: SPACING.sm,
      padding: SPACING.sm,
      borderRadius: RADIUS.md,
      backgroundColor: 'rgba(249, 115, 22, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(249, 115, 22, 0.35)',
    },
    bannerText: {
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.containerPadding,
      minHeight: ROW_H - 1,
    },
    rowSep: {
      marginLeft: SPACING.containerPadding,
      height: StyleSheet.hairlineWidth * 2,
      backgroundColor: theme.borderColor,
    },
    colPlayer: { width: 110, paddingRight: SPACING.xs },
    playerName: { color: theme.textColor, fontFamily: theme.semiBoldFont, fontSize: TYPOGRAPHY.caption },
    playerEmail: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: 11,
    },
    colOpp: {
      flex: 1,
      paddingHorizontal: SPACING.xs,
      justifyContent: 'center',
    },
    colOppPressed: { opacity: 0.85 },
    oppMain: { color: theme.textColor, fontFamily: theme.mediumFont, fontSize: TYPOGRAPHY.caption },
    oppHint: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: 11,
    },
    wldWrap: { flexDirection: 'row', gap: 4, marginRight: SPACING.xs },
    wldMini: {
      minWidth: 40,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.borderColor,
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    wldMiniOn: {
      borderColor: theme.tintColor,
      backgroundColor: theme.tintColor,
    },
    wldMiniPressed: { opacity: 0.88 },
    wldMiniDim: { opacity: 0.45 },
    wldMiniLbl: { fontFamily: theme.boldFont, fontSize: 12, color: theme.textColor },
    wldMiniLblOn: { color: theme.tintTextColor ?? theme.backgroundColor },
    clearBtn: { paddingVertical: 6, paddingHorizontal: 4, minWidth: 44, alignItems: 'center' },
    clearBtnPressed: { opacity: 0.8 },
    clearBtnOff: { opacity: 0.4 },
    clearLbl: { fontFamily: theme.mediumFont, fontSize: TYPOGRAPHY.caption, color: theme.tintColor },
    clearLblOff: { color: theme.mutedForegroundColor },
    emptyCard: { margin: SPACING.containerPadding, gap: SPACING.sm },
    emptyTitle: { fontFamily: theme.semiBoldFont, fontSize: TYPOGRAPHY.body, color: theme.textColor },
    emptyHint: { fontFamily: theme.regularFont, fontSize: TYPOGRAPHY.caption, color: theme.mutedForegroundColor },
    emptyBtn: { marginTop: SPACING.sm },
    sheetRoot: { flex: 1, paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
    sheetTitle: {
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      color: theme.textColor,
      marginBottom: SPACING.sm,
    },
    sheetSearch: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.sm,
    },
    suggestChip: {
      alignSelf: 'flex-start',
      marginBottom: SPACING.sm,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.md,
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    suggestChipPressed: { opacity: 0.9 },
    suggestChipText: { fontFamily: theme.mediumFont, fontSize: TYPOGRAPHY.caption, color: theme.tintColor },
    sheetList: { flex: 1 },
    sheetRow: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.sm,
    },
    sheetRowPressed: { opacity: 0.85 },
    sheetRowName: { fontFamily: theme.mediumFont, fontSize: TYPOGRAPHY.bodySmall, color: theme.textColor },
    sheetRowEmail: {
      marginTop: 2,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      color: theme.mutedForegroundColor,
    },
    sheetSep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.borderColor },
  })
