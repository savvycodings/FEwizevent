import { useCallback, useContext, useMemo, useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import {
  BadgeVectorIcon,
  ConnectedTabPills,
  Input,
  SearchField,
  ThemedButton,
  ThemedCard,
} from '../components'
import { DeckPicker } from '../components/content/DeckPicker'
import { DeckIcon } from '../components/decks/DeckIcon'
import { deckLabelForId } from '../constants/deckCatalog'
import { ThemeContext } from '../context'
import { BADGE_DISPLAY_TITLE, type BadgeId } from '../data/badgesCatalog'
import {
  EVENT_TIER_LABEL,
  formatTierMultiplier,
  type EventTier,
} from '../constants/eventTiers'
import {
  JUDGED_AWARD_LABEL,
  JUDGED_AWARD_TYPES,
  type JudgedAwardType,
} from '../constants/judgedAwards'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type EventDetails = {
  id: number
  title: string
  eventDate: string | null
  location: string | null
  eventTier?: EventTier | string | null
}

type PlacementRow = {
  userId: number
  userName: string
  userEmail: string
  attended: boolean
  placement: number | null
  deckId?: string | null
}

type JudgedAwardRow = {
  awardType: JudgedAwardType
  label: string
  criteria: string
  userId: number | null
  userName: string | null
  bonusXp: number
}

type EarnedBadge = {
  badgeId: BadgeId
  placement: number | null
  eventId: number | null
  eventTitle: string | null
}

type ManualBadgeId = Exclude<BadgeId, 'placed1st' | 'placed2nd' | 'placed3rd'>

const MANUAL_BADGES: ManualBadgeId[] = [
  'champion',
  'magician',
  'sweat',
  'scholar',
  'quick',
  'scientist',
  'flawless',
]

type ManageTab = 'players' | 'leaderboard' | 'awards' | 'settings'

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

function tierLabel(tier: string | null | undefined): string {
  if (tier === 'challenge' || tier === 'cup' || tier === 'casual') {
    return `${EVENT_TIER_LABEL[tier]} (${formatTierMultiplier(tier)})`
  }
  return `${EVENT_TIER_LABEL.casual} (${formatTierMultiplier('casual')})`
}

export function AdminEventManage({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const route = useRoute<any>()
  const event = route.params?.event as EventDetails | undefined
  const eventId = Number(event?.id)

  const [tab, setTab] = useState<ManageTab>('players')
  const [placements, setPlacements] = useState<PlacementRow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [judgedAwards, setJudgedAwards] = useState<JudgedAwardRow[]>([])
  const [judgedBonusXp, setJudgedBonusXp] = useState(50)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([])
  const [roundsInput, setRoundsInput] = useState('')
  const [useMatchTracking, setUseMatchTracking] = useState(false)
  const [savingJudge, setSavingJudge] = useState(false)
  const [importingTdf, setImportingTdf] = useState(false)
  const [savingAward, setSavingAward] = useState<JudgedAwardType | null>(null)
  const [awardPickerFor, setAwardPickerFor] = useState<JudgedAwardType | null>(null)

  const duplicatePlacements = useMemo(() => {
    const counts = new Map<number, number>()
    for (const row of placements) {
      const p = row.placement
      if (p != null && p >= 1) counts.set(p, (counts.get(p) || 0) + 1)
    }
    const dups = new Set<number>()
    counts.forEach((n, p) => {
      if (n > 1) dups.add(p)
    })
    return dups
  }, [placements])

  const filteredPlacements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return placements
    return placements.filter(
      (p) =>
        p.userName.toLowerCase().includes(q) || p.userEmail.toLowerCase().includes(q)
    )
  }, [placements, searchQuery])

  const attendedPlayers = useMemo(
    () => placements.filter((p) => p.attended),
    [placements]
  )

  const leaderboardRows = useMemo(() => {
    return [...placements]
      .filter((p) => p.attended && p.placement != null && p.placement >= 1)
      .sort((a, b) => Number(a.placement) - Number(b.placement))
  }, [placements])

  const selectedUser = useMemo(
    () => placements.find((p) => p.userId === selectedUserId) ?? null,
    [placements, selectedUserId]
  )

  const load = useCallback(async () => {
    if (!eventId) return
    const [boardRes, awardsRes, settingsRes] = await Promise.all([
      apiRequest<{ placements: PlacementRow[] }>(`/admin/events/${eventId}/placement-board`),
      apiRequest<{ awards: JudgedAwardRow[]; bonusXp: number }>(
        `/admin/events/${eventId}/judged-awards`
      ).catch(() => ({ awards: [], bonusXp: 50 })),
      apiRequest<{ event: { scheduledRounds?: number | null; useMatchTracking?: boolean } }>(
        `/admin/events/${eventId}/settings`
      ).catch(() => ({ event: {} })),
    ])
    setPlacements(Array.isArray(boardRes.placements) ? boardRes.placements : [])
    setJudgedAwards(Array.isArray(awardsRes.awards) ? awardsRes.awards : [])
    setJudgedBonusXp(awardsRes.bonusXp ?? 50)
    const ev = settingsRes.event
    setRoundsInput(ev?.scheduledRounds != null ? String(ev.scheduledRounds) : '')
    setUseMatchTracking(!!ev?.useMatchTracking)
  }, [eventId])

  const loadBadgesForUser = useCallback(async (userId: number) => {
    const res = await apiRequest<{ badges?: EarnedBadge[] }>(`/admin/users/${userId}/details`)
    setEarnedBadges(Array.isArray(res.badges) ? res.badges : [])
  }, [])

  useFocusEffect(
    useCallback(() => {
      load().catch((err) => Alert.alert('Load failed', err?.message || 'Try again'))
    }, [load])
  )

  useFocusEffect(
    useCallback(() => {
      if (selectedUserId) {
        loadBadgesForUser(selectedUserId).catch(() => setEarnedBadges([]))
      } else {
        setEarnedBadges([])
      }
    }, [selectedUserId, loadBadgesForUser])
  )

  async function setAttended(userId: number, attended: boolean) {
    await apiRequest('/admin/attendance', {
      method: 'POST',
      body: JSON.stringify({ userId, eventId, attended }),
    })
    await load()
  }

  async function setDeck(userId: number, deckId: string) {
    await apiRequest('/admin/attendance-deck', {
      method: 'POST',
      body: JSON.stringify({ userId, eventId, deckId }),
    })
    await load()
  }

  async function setPlacementFromInput(userId: number, raw: string) {
    const trimmed = raw.trim()
    const next = trimmed === '' ? null : Math.floor(Number(trimmed))
    if (trimmed !== '' && (!Number.isFinite(next) || (next as number) < 1)) {
      Alert.alert('Invalid place', 'Enter a whole number (1 or higher), or leave empty.')
      return
    }
    await apiRequest('/admin/attendance-placement', {
      method: 'POST',
      body: JSON.stringify({ userId, eventId, placement: next }),
    })
    await load()
  }

  async function setJudgedWinner(awardType: JudgedAwardType, userId: number | null) {
    try {
      setSavingAward(awardType)
      const res = await apiRequest<{ awards: JudgedAwardRow[]; bonusXp: number }>(
        `/admin/events/${eventId}/judged-awards`,
        {
          method: 'POST',
          body: JSON.stringify({ awardType, userId }),
        }
      )
      setJudgedAwards(res.awards ?? [])
      setJudgedBonusXp(res.bonusXp ?? judgedBonusXp)
    } catch (err: unknown) {
      Alert.alert('Award failed', err instanceof Error ? err.message : 'Try again')
    } finally {
      setSavingAward(null)
    }
  }

  async function chooseJudgedWinner(awardType: JudgedAwardType, userId: number) {
    await setJudgedWinner(awardType, userId)
    setAwardPickerFor(null)
  }

  async function toggleManualBadge(badgeId: ManualBadgeId) {
    if (!selectedUserId) return
    const already = earnedBadges.some((b) => b.badgeId === badgeId)
    try {
      await apiRequest(
        already
          ? `/admin/users/${selectedUserId}/badges/remove`
          : `/admin/users/${selectedUserId}/badges`,
        { method: 'POST', body: JSON.stringify({ badgeId }) }
      )
      await loadBadgesForUser(selectedUserId)
    } catch (err: unknown) {
      Alert.alert('Badge failed', err instanceof Error ? err.message : 'Try again')
    }
  }

  async function pickAndImportTdf() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['text/xml', 'application/xml', '*/*'],
        copyToCacheDirectory: true,
      })
      if (picked.canceled || !picked.assets?.[0]) return
      const asset = picked.assets[0]
      const fileName = asset.name || 'import.tdf'
      setImportingTdf(true)
      const fileRes = await fetch(asset.uri)
      const xml = await fileRes.text()
      const res = await apiRequest<{
        fileKind: string
        roundNumber: number | null
        attendanceMarked: number
        pairingsImported: number
        resultsImported: number
        placementsSet: number
        unknownPopIds: string[]
        skippedMatches: number
      }>(`/admin/events/${eventId}/import-tdf`, {
        method: 'POST',
        body: JSON.stringify({ xml, fileName }),
      })
      await load()
      const lines = [
        `File: ${fileName}`,
        `Type: ${res.fileKind}${res.roundNumber != null ? ` (round ${res.roundNumber})` : ''}`,
      ]
      if (res.attendanceMarked) lines.push(`Attendance: ${res.attendanceMarked} players`)
      if (res.pairingsImported) lines.push(`Pairings: ${res.pairingsImported} matches`)
      if (res.resultsImported) lines.push(`Results: ${res.resultsImported} matches`)
      if (res.placementsSet) lines.push(`Placements: ${res.placementsSet}`)
      if (res.skippedMatches) lines.push(`Skipped: ${res.skippedMatches} matches`)
      if (res.unknownPopIds?.length) {
        lines.push(
          `Unknown Player IDs (add on signup): ${res.unknownPopIds.slice(0, 8).join(', ')}${
            res.unknownPopIds.length > 8 ? '…' : ''
          }`
        )
      }
      lines.push('Deck is still set manually per player.')
      Alert.alert('TDF imported', lines.join('\n'))
    } catch (err: unknown) {
      Alert.alert('Import failed', err instanceof Error ? err.message : 'Try again')
    } finally {
      setImportingTdf(false)
    }
  }

  async function saveJudgeSettings() {
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
        body: JSON.stringify({ scheduledRounds: n, useMatchTracking }),
      })
      Alert.alert('Saved', 'Event settings updated.')
    } catch (err: unknown) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Try again')
    } finally {
      setSavingJudge(false)
    }
  }

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
    <>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />
      <View style={styles.surface}>
        <ThemedCard style={styles.eventCard}>
          <Text style={styles.eventTitle}>{event?.title || 'Event'}</Text>
          <Text style={styles.eventMeta}>
            {tierLabel(event?.eventTier ?? null)}
            {' · '}
            {formatEventDateLabel(event?.eventDate ?? null)}
            {event?.location?.trim() ? ` · ${event.location.trim()}` : ''}
          </Text>
        </ThemedCard>

        <ConnectedTabPills<ManageTab>
          style={styles.tabPillsRow}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'players', label: 'Players' },
            { value: 'leaderboard', label: 'Board' },
            { value: 'awards', label: 'Awards' },
            { value: 'settings', label: 'Setup' },
          ]}
          accessibilityLabelPrefix="Open"
        />

        {tab === 'players' ? (
          <>
            <SearchField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search players"
              containerClassName="mb-3 rounded-lg border border-border bg-card px-3"
            />
            {filteredPlacements.map((row) => {
              const placeNum =
                row.placement == null || row.placement < 1 ? null : Number(row.placement)
              const key = `${row.userId}:${eventId}`
              return (
                <View key={row.userId} style={styles.playerRow}>
                  <Pressable
                    onPress={() => setSelectedUserId(row.userId)}
                    style={styles.playerNameTap}
                  >
                    <Text
                      style={[
                        styles.playerName,
                        selectedUserId === row.userId && styles.playerNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {row.userName}
                    </Text>
                  </Pressable>
                  <View style={styles.playerControls}>
                    <DeckPicker
                      compact
                      showFieldLabel={false}
                      value={row.deckId ?? null}
                      onChange={(id) => setDeck(row.userId, id)}
                    />
                    <Input
                      key={`place-${key}-${placeNum ?? 'x'}`}
                      defaultValue={placeNum == null ? '' : String(placeNum)}
                      onEndEditing={(e) =>
                        setPlacementFromInput(row.userId, e.nativeEvent.text)
                      }
                      keyboardType="number-pad"
                      placeholder="#"
                      returnKeyType="done"
                      className="mb-0 h-11 w-14 min-w-[56px] px-2 text-center"
                    />
                    <ThemedButton
                      label={row.attended ? '✓' : 'Mark'}
                      variant={row.attended ? 'primary' : 'outline'}
                      style={styles.attendBtn}
                      onPress={() => setAttended(row.userId, !row.attended)}
                    />
                  </View>
                </View>
              )
            })}
          </>
        ) : null}

        {tab === 'leaderboard' ? (
          <>
            <Text style={styles.sectionHint}>Attended players with a placement, best finish first.</Text>
            {leaderboardRows.length === 0 ? (
              <Text style={styles.muted}>No placements yet.</Text>
            ) : (
              <View style={styles.boardTable}>
                <View style={styles.boardHead}>
                  <Text style={[styles.boardTh, styles.boardThPlace]}>#</Text>
                  <Text style={styles.boardTh}>Player</Text>
                  <Text style={styles.boardThDeck}>Deck</Text>
                </View>
                {leaderboardRows.map((row) => {
                  const p = Number(row.placement)
                  const isDup = duplicatePlacements.has(p)
                  return (
                    <View key={row.userId} style={[styles.boardRow, isDup && styles.boardRowDup]}>
                      <Text style={[styles.boardPlace, isDup && styles.boardPlaceDup]}>{p}</Text>
                      <Text style={styles.boardName} numberOfLines={1}>
                        {row.userName}
                      </Text>
                      <View style={styles.boardDeckCell}>
                        {row.deckId ? (
                          <>
                            <DeckIcon deckId={row.deckId} size={20} />
                            <Text style={styles.boardDeckText} numberOfLines={1}>
                              {deckLabelForId(row.deckId)}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.boardDeckText}>—</Text>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </>
        ) : null}

        {tab === 'awards' ? (
          <>
            {JUDGED_AWARD_TYPES.map((awardType) => {
              const award =
                judgedAwards.find((a) => a.awardType === awardType) ?? {
                  awardType,
                  label: JUDGED_AWARD_LABEL[awardType],
                  criteria: '',
                  userId: null,
                  userName: null,
                  bonusXp: judgedBonusXp,
                }
              return (
                <ThemedCard key={awardType} style={styles.awardCard}>
                  <Text style={styles.awardTitle}>{award.label}</Text>
                  {award.userName ? (
                    <Text style={styles.awardWinner}>
                      Winner: {award.userName}
                      <Text style={styles.awardWinnerXp}>  · +{award.bonusXp} XP</Text>
                    </Text>
                  ) : (
                    <Text style={styles.muted}>
                      No winner yet
                      <Text style={styles.awardWinnerXp}>  · +{award.bonusXp} XP</Text>
                    </Text>
                  )}
                  <View style={styles.awardActionRow}>
                    <ThemedButton
                      label={savingAward === awardType ? 'Saving…' : 'Select winner'}
                      onPress={() => setAwardPickerFor(awardType)}
                      disabled={attendedPlayers.length === 0 || savingAward === awardType}
                    />
                    {award.userId ? (
                      <ThemedButton
                        label={savingAward === awardType ? 'Saving…' : 'Clear winner'}
                        variant="outline"
                        onPress={() => setJudgedWinner(awardType, null)}
                        disabled={savingAward === awardType}
                      />
                    ) : null}
                  </View>
                  {attendedPlayers.length === 0 ? <Text style={styles.muted}>Mark players attended first.</Text> : null}
                </ThemedCard>
              )
            })}

            <Text style={styles.manualBadgesHeading}>Manual badges</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userChips}>
              {placements.map((p) => (
                <Pressable
                  key={p.userId}
                  onPress={() => setSelectedUserId(p.userId)}
                  style={[
                    styles.userChip,
                    selectedUserId === p.userId && styles.userChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.userChipText,
                      selectedUserId === p.userId && styles.userChipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {p.userName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {selectedUser ? (
              <ThemedCard style={styles.badgesCard}>
                <Text style={styles.badgeFor}>
                  Badges for {selectedUser.userName}
                </Text>
                <View style={styles.badgeGrid}>
                  {MANUAL_BADGES.map((badgeId) => {
                    const on = earnedBadges.some((b) => b.badgeId === badgeId)
                    return (
                      <Pressable
                        key={badgeId}
                        onPress={() => toggleManualBadge(badgeId)}
                        style={[styles.badgeOption, on && styles.badgeOptionOn]}
                      >
                        <BadgeVectorIcon
                          badgeId={badgeId}
                          size={36}
                          color={on ? theme.tintColor : theme.mutedForegroundColor}
                          opacity={on ? 1 : 0.5}
                        />
                        <Text style={styles.badgeLabel} numberOfLines={1}>
                          {BADGE_DISPLAY_TITLE[badgeId]}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </ThemedCard>
            ) : (
              <Text style={styles.muted}>Select a player above to award badges.</Text>
            )}
          </>
        ) : null}

        {tab === 'settings' ? (
          <ThemedCard style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Tournament rounds</Text>
            <TextInput
              value={roundsInput}
              onChangeText={setRoundsInput}
              keyboardType="number-pad"
              placeholder="e.g. 5"
              placeholderTextColor={theme.mutedForegroundColor}
              style={styles.roundsInput}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Enable match tracking</Text>
              <Switch value={useMatchTracking} onValueChange={setUseMatchTracking} />
            </View>
            <View style={styles.settingsActions}>
              <ThemedButton
                label={savingJudge ? 'Saving…' : 'Save settings'}
                onPress={() => saveJudgeSettings().catch(() => {})}
                disabled={savingJudge}
              />
              {useMatchTracking && scheduledRoundsCount > 0 ? (
                <ThemedButton
                  label="Open round board"
                  variant="outline"
                  onPress={() => navigation.navigate('AdminRoundBoard', { event })}
                />
              ) : null}
            </View>

            <Text style={[styles.settingsTitle, styles.tdfSectionTitle]}>Import TDF</Text>
            <ThemedButton
              label={importingTdf ? 'Importing…' : 'Choose .tdf file'}
              variant="outline"
              onPress={() => pickAndImportTdf().catch(() => {})}
              disabled={importingTdf}
            />
          </ThemedCard>
        ) : null}
      </View>
    </ScrollView>

      <Modal
        visible={!!awardPickerFor}
        transparent
        animationType="fade"
        onRequestClose={() => setAwardPickerFor(null)}
      >
        <Pressable style={styles.awardModalBackdrop} onPress={() => setAwardPickerFor(null)}>
          <Pressable style={styles.awardModalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.awardModalTitle}>
              Select {awardPickerFor ? JUDGED_AWARD_LABEL[awardPickerFor] : 'winner'}
            </Text>

            <ScrollView style={styles.awardModalList} keyboardShouldPersistTaps="handled">
              {attendedPlayers.map((p) => {
                const selectedAward = awardPickerFor
                  ? judgedAwards.find((a) => a.awardType === awardPickerFor)
                  : null
                const selected = selectedAward?.userId === p.userId
                return (
                  <Pressable
                    key={`pick-${p.userId}`}
                    onPress={() => {
                      if (awardPickerFor) chooseJudgedWinner(awardPickerFor, p.userId).catch(() => {})
                    }}
                    style={({ pressed }) => [
                      styles.awardPickRow,
                      pressed && styles.awardPickRowPressed,
                    ]}
                    disabled={!awardPickerFor || !!savingAward}
                  >
                    <View style={[styles.awardPickPill, selected && styles.awardPickPillSelected]}>
                      <Text
                        style={[styles.awardPickName, selected && styles.awardPickNameSelected]}
                        numberOfLines={1}
                      >
                        {p.userName}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </ScrollView>

            <ThemedButton label="Close" variant="outline" onPress={() => setAwardPickerFor(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.backgroundColor },
    content: { paddingBottom: SPACING['4xl'] },
    hero: {
      backgroundColor: theme.tintColor,
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
    eventCard: { marginBottom: SPACING.md },
    eventTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginBottom: SPACING.xs,
    },
    eventMeta: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    tabPillsRow: {
      marginBottom: SPACING.md,
    },
    sectionHint: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: TYPOGRAPHY.caption * 1.45,
      marginBottom: SPACING.sm,
    },
    sectionHintSpaced: { marginTop: SPACING.lg },
    warnText: {
      color: theme.tintColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    },
    muted: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.md,
    },
    playerRow: {
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      padding: SPACING.sm,
      marginBottom: SPACING.sm,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    playerNameTap: { marginBottom: SPACING.xs },
    playerName: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    playerNameSelected: { color: theme.tintColor },
    playerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      flexWrap: 'wrap',
    },
    attendBtn: { minWidth: 52, paddingHorizontal: SPACING.sm },
    boardTable: {
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      marginBottom: SPACING.md,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    boardHead: {
      flexDirection: 'row',
      backgroundColor: theme.cardBackground,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    boardTh: {
      flex: 1,
      color: theme.mutedForegroundColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    boardThPlace: { flex: 0, width: 36 },
    boardThDeck: { flex: 0.8, textAlign: 'right' },
    boardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderColor,
    },
    boardRowDup: { backgroundColor: `${theme.tintColor}14` },
    boardPlace: {
      width: 36,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
    },
    boardPlaceDup: { color: theme.tintColor },
    boardName: {
      flex: 1,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginRight: SPACING.sm,
    },
    boardDeckCell: {
      flex: 0.8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      minWidth: 0,
    },
    boardDeckText: {
      flexShrink: 1,
      textAlign: 'right',
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    awardCard: {
      marginBottom: SPACING.md,
      gap: SPACING.xs,
      paddingTop: SPACING.sm,
    },
    awardTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    awardXp: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    awardWinner: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    awardWinnerXp: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    awardActionRow: {
      marginTop: SPACING.sm,
      gap: SPACING.sm,
    },
    awardModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      padding: SPACING.containerPadding,
    },
    awardModalCard: {
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      maxHeight: '80%',
    },
    awardModalTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
      textAlign: 'center',
      marginBottom: SPACING.md,
    },
    awardModalList: {
      maxHeight: 300,
      marginBottom: SPACING.sm,
    },
    awardPickRow: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      marginBottom: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
    },
    awardPickRowPressed: {
      opacity: 0.9,
    },
    awardPickPill: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.full,
      backgroundColor: 'transparent',
      alignSelf: 'center',
      flexGrow: 0,
      flexShrink: 1,
    },
    awardPickPillSelected: {
      backgroundColor: theme.tintColor,
    },
    awardPickName: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'center',
    },
    awardPickNameSelected: {
      color: '#000',
      fontFamily: theme.semiBoldFont,
    },
    manualBadgesHeading: {
      marginTop: SPACING.sm,
      marginBottom: SPACING.sm,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    userChips: {
      marginBottom: SPACING.md,
      maxHeight: 44,
    },
    userChip: {
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      marginRight: SPACING.sm,
      maxWidth: 160,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    userChipSelected: {
      borderWidth: 0,
      borderColor: 'transparent',
      backgroundColor: theme.tintColor,
    },
    userChipText: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
    },
    userChipTextSelected: { color: '#000' },
    badgesCard: { gap: 0 },
    badgeFor: {
      // ThemedCard adds internal padding; pull title up slightly to balance top/bottom spacing.
      marginTop: -SPACING.sm,
      marginBottom: SPACING.sm,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    badgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    badgeOption: {
      width: '30%',
      minWidth: 96,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      padding: SPACING.sm,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    badgeOptionOn: { borderColor: theme.tintColor },
    badgeLabel: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: 10,
      textAlign: 'center',
    },
    settingsCard: { gap: SPACING.sm },
    settingsActions: {
      gap: SPACING.lg,
      marginTop: SPACING.xs,
    },
    settingsTitle: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.body,
      marginBottom: SPACING.md,
    },
    tdfSectionTitle: {
      marginTop: SPACING.lg,
      marginBottom: SPACING.md,
    },
    inputLabel: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
    },
    roundsInput: {
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      minHeight: 48,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: SPACING.sm,
    },
    switchLabel: {
      flex: 1,
      paddingRight: SPACING.md,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
    },
    emptyText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.body,
    },
  })
