import { useContext, useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { pickImageWithSource } from '../utils/pickImageWithSource'
import { AppContext, ThemeContext } from '../context'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { RainSpinner, RemoteImage, HomeStoreTabs, ThemedButton, ThemedCard } from '../components'
import { apiRequest, apiUrl, readJsonResponse } from '../api'
import { type HomeStore } from '../constants/stores'
import type { User } from '../../types'

function resolvedHomeStore(user: User | null): HomeStore {
  const s = user?.homeStore
  return s === 'glendower' || s === 'rosebank' ? s : 'glendower'
}

function storedHomeStore(user: User | null): HomeStore | null {
  const s = user?.homeStore
  return s === 'glendower' || s === 'rosebank' ? s : null
}

export function AccountManagement() {
  const { theme } = useContext(ThemeContext)
  const { currentUser, setCurrentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [nameField, setNameField] = useState('')
  const [emailField, setEmailField] = useState('')
  const [homeStore, setHomeStore] = useState<HomeStore>('glendower')
  const [storeSaving, setStoreSaving] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    setNameField(currentUser.name || '')
    setEmailField(currentUser.email || '')
    setHomeStore(resolvedHomeStore(currentUser))
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.homeStore])

  function applyUserUpdate(user: User) {
    setCurrentUser((prev) => (prev ? { ...prev, ...user } : user))
  }

  async function pickAndUploadProfile() {
    if (!currentUser) return
    const pickResult = await pickImageWithSource({
      quality: 0.85,
    })
    if (!pickResult) return

    try {
      setPhotoLoading(true)
      const file = pickResult
      const formData = new FormData()
      formData.append('file', {
        uri: file.uri,
        name: file.fileName || `profile-${Date.now()}.jpg`,
        type: file.mimeType || 'image/jpeg',
      } as any)
      formData.append('userId', String(currentUser.id))

      const uploadUrl = apiUrl('/auth/profile-image')
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })
      const uploadData = await readJsonResponse<{ user: User; error?: string }>(
        uploadResponse,
        uploadUrl
      )
      if (!uploadResponse.ok) {
        throw new Error(uploadData?.error || 'Profile image upload failed')
      }

      applyUserUpdate(uploadData.user)
      Alert.alert('Success', 'Profile picture updated')
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Please try again')
    } finally {
      setPhotoLoading(false)
    }
  }

  async function persistHomeStore(next: HomeStore) {
    if (!currentUser) return
    const current = storedHomeStore(currentUser)
    if (current === next) {
      setHomeStore(next)
      return
    }
    try {
      setStoreSaving(true)
      setHomeStore(next)
      const updateResult = await apiRequest<{ user: User }>('/auth/profile', {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser.id, homeStore: next }),
      })
      applyUserUpdate(updateResult.user)
    } catch (err: any) {
      setHomeStore(resolvedHomeStore(currentUser))
      Alert.alert('Could not update store', err?.message || 'Please try again')
    } finally {
      setStoreSaving(false)
    }
  }

  async function saveProfile() {
    if (!currentUser) return
    const name = nameField.trim()
    const email = emailField.trim().toLowerCase()
    if (!name) {
      Alert.alert('Name required', 'Please enter your name.')
      return
    }
    if (!email) {
      Alert.alert('Email required', 'Please enter your email.')
      return
    }

    try {
      setProfileSaving(true)
      const body: {
        userId: number
        name?: string
        email?: string
        homeStore?: HomeStore
      } = { userId: currentUser.id }
      if (name !== currentUser.name) body.name = name
      if (email !== (currentUser.email || '').toLowerCase()) body.email = email
      if (storedHomeStore(currentUser) !== homeStore) body.homeStore = homeStore
      if (body.name === undefined && body.email === undefined && body.homeStore === undefined) {
        Alert.alert('No changes.', 'Update your name, email, or home store to save.')
        return
      }

      const updateResult = await apiRequest<{ user: User }>('/auth/profile', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      applyUserUpdate(updateResult.user)
      Alert.alert('Success', 'Profile updated')
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Please try again')
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />

      <View style={styles.surface}>
        <ThemedCard>
          <Text style={styles.sectionTitle}>Profile</Text>

          <Pressable
            onPress={pickAndUploadProfile}
            disabled={photoLoading}
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
            style={({ pressed }) => [
              styles.avatarPressable,
              pressed && styles.avatarPressed,
              photoLoading && styles.avatarDisabled,
            ]}
          >
            {photoLoading ? (
              <View style={[styles.avatarFallback, styles.avatarLoadingWrap]}>
                <RainSpinner size={22} color={theme.textColor} />
              </View>
            ) : currentUser?.profileImageUrl ? (
              <RemoteImage
                uri={currentUser.profileImageUrl}
                style={styles.avatar}
                spinnerSize={20}
                spinnerColor={theme.textColor}
                fallback={
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {(currentUser?.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                }
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {(currentUser?.name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={nameField}
            onChangeText={setNameField}
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={theme.mutedForegroundColor}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={emailField}
            onChangeText={setEmailField}
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={theme.mutedForegroundColor}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Home store</Text>
          <HomeStoreTabs
            style={styles.storeTabs}
            value={homeStore}
            onChange={persistHomeStore}
            disabled={storeSaving}
          />

          <ThemedButton
            label={profileSaving ? 'Saving...' : 'Save profile'}
            onPress={saveProfile}
            disabled={profileSaving}
          />
        </ThemedCard>
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
    surface: {
      marginTop: -SPACING.xl,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
    },
    sectionTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginBottom: SPACING.md,
    },
    avatarPressable: {
      alignSelf: 'center',
      marginBottom: SPACING.lg,
    },
    avatarPressed: {
      opacity: 0.85,
    },
    avatarDisabled: {
      opacity: 0.7,
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    avatarFallback: {
      width: 84,
      height: 84,
      borderRadius: 42,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.buttonBackground,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    avatarLoadingWrap: {
      minHeight: 84,
      minWidth: 84,
    },
    avatarInitial: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
    },
    label: {
      color: '#fff',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      marginBottom: SPACING.sm,
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
    storeTabs: {
      marginBottom: SPACING.lg,
    },
  })
