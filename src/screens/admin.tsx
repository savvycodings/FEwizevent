import { useContext, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { pickImageWithSource } from '../utils/pickImageWithSource'
import { BlurView } from 'expo-blur'
import { AppIcon } from '../components'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ThemeContext } from '../context'
import { BRAND } from '../constants/brandColors'
import {
  EventDateField,
  Input,
  Label,
  SearchField,
  SegmentedTabs,
  ThemedButton,
  ThemedCard,
  Text as UiText,
} from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'
import { DeckPicker } from '../components/content/DeckPicker'
import { DOMAIN } from '../../constants'
import { getAdminPassHeaders } from '../adminSession'
import {
  EVENT_TIER_EXAMPLES,
  EVENT_TIER_LABEL,
  EVENT_TIER_SEGMENT_OPTIONS,
  formatTierMultiplier,
  type EventTier,
} from '../constants/eventTiers'

function formatEventTierLabel(tier: string | null | undefined): string {
  if (tier === 'challenge' || tier === 'cup' || tier === 'casual') {
    return `${EVENT_TIER_LABEL[tier]} (${formatTierMultiplier(tier)})`
  }
  return `${EVENT_TIER_LABEL.casual} (${formatTierMultiplier('casual')})`
}

type User = { id: number; name: string; email: string }
type Event = {
  id: number
  title: string
  eventDate: string | null
  location: string | null
  bannerImageUrl?: string | null
  eventTier?: EventTier | string | null
}
type Attendance = {
  userId: number
  eventId: number
  attended: boolean
  placement?: number | null
  /** Deck recorded for this event (frozen once set). */
  deckId?: string | null
  /** Current profile deck — suggestion only when deckId is empty. */
  suggestedDeckId?: string | null
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

export function Admin() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const mode = route.params?.mode as 'attendance' | 'create' | undefined
  const lockedMode = mode === 'attendance' || mode === 'create' ? mode : null
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null)
  const [eventTier, setEventTier] = useState<EventTier>('casual')
  const [bannerUploading, setBannerUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [tab, setTab] = useState<'attendance' | 'create'>(lockedMode ?? 'attendance')
  useEffect(() => {
    if (lockedMode) {
      setTab(lockedMode)
    }
  }, [lockedMode])


  const attendanceMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    attendance.forEach((row) => {
      map[`${row.userId}:${row.eventId}`] = row.attended
    })
    return map
  }, [attendance])

  const placementMap = useMemo(() => {
    const map: Record<string, number | null> = {}
    attendance.forEach((row) => {
      const k = `${row.userId}:${row.eventId}`
      map[k] = row.placement == null ? null : Number(row.placement)
    })
    return map
  }, [attendance])

  const deckMap = useMemo(() => {
    const map: Record<string, string | null> = {}
    attendance.forEach((row) => {
      map[`${row.userId}:${row.eventId}`] = row.deckId ?? null
    })
    return map
  }, [attendance])

  const suggestedDeckMap = useMemo(() => {
    const map: Record<string, string | null> = {}
    attendance.forEach((row) => {
      map[`${row.userId}:${row.eventId}`] = row.suggestedDeckId ?? null
    })
    return map
  }, [attendance])

  const selectedEvent = useMemo(
    () => (selectedEventId == null ? null : events.find((e) => e.id === selectedEventId) ?? null),
    [events, selectedEventId]
  )

  async function load() {
    const [usersRes, eventsRes, attendanceRes] = await Promise.all([
      apiRequest<{ users: User[] }>('/admin/users'),
      apiRequest<{ events: Event[] }>('/admin/events'),
      apiRequest<{ attendance: Attendance[] }>('/admin/attendance'),
    ])
    setUsers(usersRes.users)
    setEvents(eventsRes.events)
    setAttendance(attendanceRes.attendance)
  }

  useEffect(() => {
    load().catch((err) => Alert.alert('Admin load failed', err.message))
  }, [])

  useEffect(() => {
    if (selectedEventId != null && !events.some((e) => e.id === selectedEventId)) {
      setSelectedEventId(null)
    }
  }, [events, selectedEventId])

  async function setAttendanceValue(userId: number, eventId: number, attended: boolean) {
    await apiRequest('/admin/attendance', {
      method: 'POST',
      body: JSON.stringify({ userId, eventId, attended }),
    })
    await load()
  }

  async function setAttendanceDeck(userId: number, eventId: number, deckId: string) {
    await apiRequest('/admin/attendance-deck', {
      method: 'POST',
      body: JSON.stringify({ userId, eventId, deckId }),
    })
    await load()
  }

  async function setPlacementFromInput(userId: number, eventId: number, raw: string) {
    const trimmed = raw.trim()
    const next = trimmed === '' ? null : Math.floor(Number(trimmed))
    if (trimmed !== '' && (!Number.isFinite(next) || next < 1)) {
      Alert.alert('Invalid place', 'Enter a whole number (1 or higher), or leave empty to clear.')
      return
    }
    const key = `${userId}:${eventId}`
    const cur = placementMap[key]
    const curNum = cur == null || cur < 1 ? null : cur
    if (next === curNum) return
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

  async function pickEventBanner() {
    const asset = await pickImageWithSource({
      quality: 0.85,
      aspect: [16, 9],
    })
    if (!asset) return

    try {
      setBannerUploading(true)
      const file = asset
      const formData = new FormData()
      formData.append('file', {
        uri: file.uri,
        name: file.fileName || `event-banner-${Date.now()}.jpg`,
        type: file.mimeType || 'image/jpeg',
      } as any)

      const uploadResponse = await fetch(`${DOMAIN}/admin/upload-event-banner`, {
        method: 'POST',
        headers: getAdminPassHeaders(),
        body: formData,
      })
      const uploadData = await uploadResponse.json()
      if (!uploadResponse.ok) {
        throw new Error(uploadData?.error || 'Banner upload failed')
      }
      setBannerImageUrl(uploadData.imageUrl)
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Please try again')
    } finally {
      setBannerUploading(false)
    }
  }

  async function createEvent() {
    if (!title.trim()) {
      Alert.alert('Validation', 'Event title is required')
      return
    }
    await apiRequest('/admin/events', {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),
        eventDate: eventDate || null,
        location: location || null,
        bannerImageUrl: bannerImageUrl || null,
        eventTier,
      }),
    })
    setTitle('')
    setEventDate('')
    setLocation('')
    setBannerImageUrl(null)
    setEventTier('casual')
    await load()
    if (!lockedMode) {
      setTab('attendance')
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
      </View>
      <View style={styles.surface}>
        {!lockedMode ? (
          <SegmentedTabs<'attendance' | 'create'>
            style={styles.tabRow}
            value={tab}
            onChange={setTab}
            options={[
              { value: 'attendance', label: 'Attendance' },
              { value: 'create', label: 'Create Event' },
            ]}
          />
        ) : null}

        {tab === 'create' ? (
          <ThemedCard>
            <UiText variant="h4" className="mb-3 text-foreground">
              Create Event
            </UiText>
            <Label nativeID="event-title" className="mb-2">
              Event title
            </Label>
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              className="mb-3"
              aria-labelledby="event-title"
            />
            <EventDateField
              value={eventDate}
              onChange={setEventDate}
              label="Event date (optional)"
              optional
            />
            <Label nativeID="event-location" className="mb-2">
              Location
            </Label>
            <Input
              value={location}
              onChangeText={setLocation}
              placeholder="Location"
              className="mb-3"
              aria-labelledby="event-location"
            />

            <Label nativeID="event-tier" className="mb-2">
              Event tier
            </Label>
            <UiText variant="muted" className="mb-2">
              Every event has a tier that multiplies earned XP. Set when creating the event.
            </UiText>
            <SegmentedTabs<EventTier>
              style={styles.tierTabs}
              value={eventTier}
              onChange={setEventTier}
              options={EVENT_TIER_SEGMENT_OPTIONS}
            />
            <UiText variant="muted" className="mb-1 mt-2 text-[11px]">
              {EVENT_TIER_EXAMPLES[eventTier]} · {formatTierMultiplier(eventTier)} XP
            </UiText>

            <UiText className="mb-1 mt-3 text-sm font-medium text-foreground">Event banner (optional)</UiText>
            <UiText variant="muted" className="mb-3">
              Wide image works best. Shown on the Events tab with a blurred background.
            </UiText>
            {bannerImageUrl ? (
              <View style={styles.bannerPreviewWrap}>
                <Image source={{ uri: bannerImageUrl }} style={styles.bannerPreview} />
                <ThemedButton
                  label="Remove banner"
                  variant="outline"
                  style={styles.bannerRemove}
                  onPress={() => setBannerImageUrl(null)}
                />
              </View>
            ) : null}
            <ThemedButton
              label={bannerUploading ? 'Uploading…' : bannerImageUrl ? 'Replace banner' : 'Upload event banner'}
              variant="outline"
              onPress={pickEventBanner}
              disabled={bannerUploading}
            />

            <ThemedButton label="Save Event" onPress={createEvent} style={styles.saveEvent} />
          </ThemedCard>
        ) : (
          <>
            {events.length === 0 ? (
              <ThemedCard style={styles.eventCard}>
                <UiText variant="muted">Create an event to take attendance.</UiText>
              </ThemedCard>
            ) : (
              <View style={styles.attendanceBannerList}>
                {events.map((event) => (
                  <Pressable
                    key={event.id}
                    onPress={() => {
                      if (lockedMode === 'attendance') {
                        navigation.navigate('AdminEventManage', { event })
                      } else {
                        setSelectedEventId(event.id)
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedEventId === event.id }}
                    style={({ pressed }) => [
                      styles.attendanceBannerPressable,
                      pressed && styles.attendanceBannerPressed,
                    ]}
                  >
                    <AttendanceEventBanner
                      event={event}
                      selected={selectedEventId === event.id}
                      styles={styles}
                    />
                  </Pressable>
                ))}
              </View>
            )}

            {lockedMode !== 'attendance' && selectedEvent ? (
              <ThemedCard style={styles.eventCard}>
                <Text style={styles.selectedEventTitle}>{selectedEvent.title}</Text>
                <Text style={styles.selectedEventMeta}>
                  {formatEventTierLabel(selectedEvent.eventTier)}
                  {' · '}
                  {formatEventDateLabel(selectedEvent.eventDate)}
                  {selectedEvent.location?.trim()
                    ? ` · ${selectedEvent.location.trim()}`
                    : ''}
                </Text>
                <Text style={styles.peopleSectionLabel}>People</Text>
                <SearchField
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search people"
                  containerClassName="mb-3 rounded-lg border border-border bg-card px-3"
                />
                {users
                  .filter((user) => {
                    const q = searchQuery.trim().toLowerCase()
                    if (!q) return true
                    return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
                  })
                  .map((user) => {
                    const eventId = selectedEvent.id
                    const key = `${user.id}:${eventId}`
                    const attended = attendanceMap[key] || false
                    const place = placementMap[key]
                    const placeNum = place == null || place < 1 ? null : place
                    const deckId = deckMap[key] ?? null
                    return (
                      <View key={user.id} style={styles.userRow}>
                        <Text style={styles.userText} numberOfLines={1}>
                          {user.name}
                        </Text>
                        <View style={styles.userRowControls}>
                          <DeckPicker
                            compact
                            showFieldLabel={false}
                            value={deckId}
                            suggestedDeckId={suggestedDeckMap[key] ?? null}
                            onChange={(id) => setAttendanceDeck(user.id, eventId, id)}
                          />
                          <Input
                            key={`place-${key}-${placeNum ?? 'x'}`}
                            defaultValue={placeNum == null ? '' : String(placeNum)}
                            onEndEditing={(e) =>
                              setPlacementFromInput(user.id, eventId, e.nativeEvent.text)
                            }
                            keyboardType="number-pad"
                            placeholder="#"
                            returnKeyType="done"
                            className="mb-0 h-11 w-14 min-w-[56px] px-2 text-center"
                          />
                          <ThemedButton
                            label={attended ? 'Attended' : 'Mark'}
                            variant={attended ? 'primary' : 'outline'}
                            style={styles.attendanceAction}
                            onPress={() => setAttendanceValue(user.id, eventId, !attended)}
                          />
                        </View>
                      </View>
                    )
                  })}
              </ThemedCard>
            ) : lockedMode !== 'attendance' && events.length > 0 ? (
              <ThemedCard style={styles.eventCard}>
                <Text style={styles.hintText}>Tap an event banner above to take attendance.</Text>
              </ThemedCard>
            ) : null}
          </>
        )}
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
      paddingBottom: SPACING['4xl'],
    },
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
    tabRow: {
      marginBottom: SPACING.xl,
    },
    sectionTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginBottom: SPACING.md,
    },
    input: {
      borderColor: theme.borderColor,
      borderWidth: 1.5,
      borderRadius: RADIUS.md,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      color: theme.textColor,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      fontFamily: theme.regularFont,
      marginBottom: SPACING.md,
    },
    eventCard: {
      marginTop: SPACING.md,
    },
    eventTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    eventMeta: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      marginTop: SPACING.xs,
      marginBottom: SPACING.md,
    },
    userRow: {
      marginTop: SPACING.sm,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      padding: SPACING.sm,
      gap: SPACING.sm,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    userRowControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    attendanceAction: {
      flexShrink: 0,
    },
    userText: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    searchWrap: {
      borderColor: theme.borderColor,
      borderWidth: 1.5,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    searchInput: {
      flex: 1,
      color: theme.textColor,
      marginLeft: SPACING.sm,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      paddingVertical: 0,
    },
    attendanceBannerList: {
      marginTop: SPACING.sm,
    },
    attendanceBannerPressable: {
      marginBottom: SPACING.md,
      borderRadius: RADIUS.lg,
    },
    attendanceBannerPressed: {
      opacity: 0.92,
    },
    attendanceBannerInner: {
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    attendanceBannerInnerSelected: {
      borderColor: theme.tintColor,
    },
    attendanceBannerMedia: {
      minHeight: 100,
      overflow: 'hidden',
    },
    attendanceBannerTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.38)',
    },
    attendanceBannerFallbackBg: {
      backgroundColor: theme.tintColor,
    },
    attendanceBannerLabelWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    attendanceBannerTitleOnImg: {
      color: theme.tintTextColor ?? BRAND.onImageText,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    attendanceBannerTitleFallback: {
      color: theme.tintTextColor ?? BRAND.onImageText,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
    },
    attendanceBannerTierOnImg: {
      marginTop: 2,
      color: theme.tintTextColor ?? BRAND.onImageText,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      opacity: 0.92,
    },
    attendanceBannerTierFallback: {
      marginTop: 2,
      color: theme.tintTextColor ?? BRAND.onImageText,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      opacity: 0.9,
    },
    selectedEventTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginBottom: SPACING.xs,
    },
    selectedEventMeta: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.lg,
    },
    peopleSectionLabel: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.sm,
    },
    emptyEventsText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'center',
    },
    hintText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
    },
    fieldLabel: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.xs,
    },
    fieldHint: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.md,
    },
    bannerPreviewWrap: {
      marginBottom: SPACING.md,
    },
    bannerPreview: {
      width: '100%',
      height: 100,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.sm,
      backgroundColor: theme.buttonBackground,
    },
    bannerRemove: {
      marginBottom: SPACING.sm,
    },
    saveEvent: {
      marginTop: SPACING.md,
    },
    tierTabs: {
      marginBottom: SPACING.xs,
    },
  })

type AdminScreenStyles = ReturnType<typeof getStyles>

function AttendanceEventBanner({
  event,
  selected,
  styles,
}: {
  event: Event
  selected: boolean
  styles: AdminScreenStyles
}) {
  const hasBanner = Boolean(event.bannerImageUrl)
  return (
    <View style={[styles.attendanceBannerInner, selected && styles.attendanceBannerInnerSelected]}>
      <View style={styles.attendanceBannerMedia}>
        {hasBanner ? (
          <>
            <Image
              source={{ uri: event.bannerImageUrl! }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={styles.attendanceBannerTint} pointerEvents="none" />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.attendanceBannerFallbackBg]} />
        )}
        <View style={styles.attendanceBannerLabelWrap}>
          <Text
            numberOfLines={2}
            style={hasBanner ? styles.attendanceBannerTitleOnImg : styles.attendanceBannerTitleFallback}
          >
            {event.title}
          </Text>
          <Text
            numberOfLines={1}
            style={
              hasBanner ? styles.attendanceBannerTierOnImg : styles.attendanceBannerTierFallback
            }
          >
            {formatEventTierLabel(event.eventTier)}
          </Text>
        </View>
      </View>
    </View>
  )
}

