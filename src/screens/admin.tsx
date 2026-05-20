import { useContext, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { pickImageWithSource } from '../utils/pickImageWithSource'
import { BlurView } from 'expo-blur'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ThemeContext } from '../context'
import { EventDateField, ThemedButton, ThemedCard } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'
import { DOMAIN } from '../../constants'
import { getAdminPassHeaders } from '../adminSession'
import {
  canPlacementDown,
  canPlacementUp,
  getTakenPlacements,
  nextPlacementDown,
  nextPlacementUp,
} from '../utils/placementUtils'

type User = { id: number; name: string; email: string }
type Event = {
  id: number
  title: string
  eventDate: string | null
  location: string | null
  bannerImageUrl?: string | null
}
type Attendance = { userId: number; eventId: number; attended: boolean; placement?: number | null }

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

  async function bumpPlacement(userId: number, eventId: number, delta: -1 | 1) {
    const key = `${userId}:${eventId}`
    const raw = placementMap[key]
    const cur = raw == null || raw < 1 ? null : raw
    const eventRows = attendance
      .filter((row) => row.eventId === eventId)
      .map((row) => ({
        userId: row.userId,
        placement: placementMap[`${row.userId}:${eventId}`] ?? null,
      }))
    const taken = getTakenPlacements(eventRows, userId)
    const next = delta === -1 ? nextPlacementDown(cur, taken) : nextPlacementUp(cur, taken)

    if (delta === -1 && cur != null && next === null) {
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
      }),
    })
    setTitle('')
    setEventDate('')
    setLocation('')
    setBannerImageUrl(null)
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
          <View style={styles.tabRow}>
            <ThemedButton
              label="Attendance"
              variant={tab === 'attendance' ? 'primary' : 'outline'}
              style={styles.tabButton}
              onPress={() => setTab('attendance')}
            />
            <ThemedButton
              label="Create Event"
              variant={tab === 'create' ? 'primary' : 'outline'}
              style={styles.tabButton}
              onPress={() => setTab('create')}
            />
          </View>
        ) : null}

        {tab === 'create' ? (
          <ThemedCard>
            <Text style={styles.sectionTitle}>Create Event</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder="Event title"
              placeholderTextColor={theme.mutedForegroundColor}
            />
            <EventDateField
              value={eventDate}
              onChange={setEventDate}
              label="Event date (optional)"
              optional
            />
            <TextInput
              value={location}
              onChangeText={setLocation}
              style={styles.input}
              placeholder="Location"
              placeholderTextColor={theme.mutedForegroundColor}
            />

            <Text style={styles.fieldLabel}>Event banner (optional)</Text>
            <Text style={styles.fieldHint}>
              Wide image works best. Shown on the Events tab with a blurred background.
            </Text>
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
                <Text style={styles.emptyEventsText}>Create an event to take attendance.</Text>
              </ThemedCard>
            ) : (
              <View style={styles.attendanceBannerList}>
                {events.map((event) => (
                  <Pressable
                    key={event.id}
                    onPress={() => {
                      if (lockedMode === 'attendance') {
                        navigation.navigate('AdminEventAttendance', { event })
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
                  {formatEventDateLabel(selectedEvent.eventDate)}
                  {selectedEvent.location?.trim()
                    ? ` · ${selectedEvent.location.trim()}`
                    : ''}
                </Text>
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
                    const eventId = selectedEvent.id
                    const key = `${user.id}:${eventId}`
                    const attended = attendanceMap[key] || false
                    const place = placementMap[key]
                    const placeNum = place == null || place < 1 ? null : place
                    const placeLabel = placeNum == null ? '—' : ordinalPlacement(placeNum)
                    const eventRows = attendance
                      .filter((row) => row.eventId === eventId)
                      .map((row) => ({
                        userId: row.userId,
                        placement: placementMap[`${row.userId}:${eventId}`] ?? null,
                      }))
                    const taken = getTakenPlacements(eventRows, user.id)
                    const canDecrement = canPlacementDown(placeNum, taken)
                    const canIncrement = canPlacementUp(placeNum, taken)
                    return (
                      <View key={user.id} style={styles.userRow}>
                        <View style={styles.userIdentity}>
                          <Text style={styles.userText}>{user.name}</Text>
                        </View>
                        <View style={styles.placementStepper}>
                          <Pressable
                            onPress={() => bumpPlacement(user.id, eventId, -1)}
                            disabled={!canDecrement}
                            style={({ pressed }) => [
                              styles.placementStepperBtn,
                              !canDecrement && styles.placementStepperBtnDimmed,
                              pressed && canDecrement && styles.placementStepperBtnPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Decrease placement"
                          >
                            <Ionicons
                              name="remove-outline"
                              size={22}
                              color={canDecrement ? theme.textColor : theme.mutedForegroundColor}
                            />
                          </Pressable>
                          <Text style={styles.placementStepperLabel}>{placeLabel}</Text>
                          <Pressable
                            onPress={() => bumpPlacement(user.id, eventId, 1)}
                            disabled={!canIncrement}
                            style={({ pressed }) => [
                              styles.placementStepperBtn,
                              !canIncrement && styles.placementStepperBtnDimmed,
                              pressed && canIncrement && styles.placementStepperBtnPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Increase placement"
                          >
                            <Ionicons
                              name="add-outline"
                              size={22}
                              color={canIncrement ? theme.textColor : theme.mutedForegroundColor}
                            />
                          </Pressable>
                        </View>
                        <ThemedButton
                          label={attended ? 'Attended' : 'Mark attended'}
                          variant={attended ? 'primary' : 'outline'}
                          style={styles.attendanceAction}
                          onPress={() => setAttendanceValue(user.id, eventId, !attended)}
                        />
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
      flexDirection: 'row',
      gap: SPACING.md,
      marginBottom: SPACING.xl,
    },
    tabButton: {
      flex: 1,
    },
    sectionTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginBottom: SPACING.md,
    },
    input: {
      borderColor: theme.borderColor,
      borderWidth: 1,
      borderRadius: RADIUS.md,
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
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      paddingTop: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    placementStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      backgroundColor: theme.cardBackground,
      overflow: 'hidden',
      flexShrink: 0,
    },
    placementStepperBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placementStepperBtnDimmed: {
      opacity: 0.45,
    },
    placementStepperBtnPressed: {
      opacity: 0.75,
    },
    placementStepperLabel: {
      minWidth: 48,
      paddingHorizontal: SPACING.xs,
      textAlign: 'center',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      color: theme.textColor,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.borderColor,
      lineHeight: 40,
    },
    attendanceAction: {
      flexShrink: 0,
    },
    userIdentity: {
      flex: 1,
      paddingRight: SPACING.md,
      justifyContent: 'center',
      minHeight: 40,
    },
    userText: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    searchWrap: {
      borderColor: theme.borderColor,
      borderWidth: 1,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
      backgroundColor: theme.cardBackground,
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
      color: '#fff',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    attendanceBannerTitleFallback: {
      color: theme.tintTextColor ?? '#fff',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
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
        </View>
      </View>
    </View>
  )
}

