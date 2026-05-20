import { useContext, useEffect, useState } from 'react'
import {
  ActivityIndicator,
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
import { AppContext, ThemeContext } from '../context'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { ThemedButton, ThemedCard } from '../components'
import { DOMAIN } from '../../constants'
import { apiRequest } from '../api'

export function AccountManagement() {
  const { theme } = useContext(ThemeContext)
  const { currentUser, setCurrentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [nameField, setNameField] = useState('')
  const [emailField, setEmailField] = useState('')

  useEffect(() => {
    if (!currentUser) return
    setNameField(currentUser.name || '')
    setEmailField(currentUser.email || '')
  }, [currentUser?.id, currentUser?.name, currentUser?.email])

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

      const uploadResponse = await fetch(`${DOMAIN}/auth/upload-profile`, {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadResponse.json()
      if (!uploadResponse.ok) {
        throw new Error(uploadData?.error || 'Profile image upload failed')
      }

      const updateResult = await apiRequest<{ user: any }>('/auth/profile-image', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser.id,
          imageUrl: uploadData.imageUrl,
        }),
      })
      setCurrentUser(updateResult.user)
      Alert.alert('Success', 'Profile picture updated')
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Please try again')
    } finally {
      setPhotoLoading(false)
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
      const body: { userId: number; name?: string; email?: string } = { userId: currentUser.id }
      if (name !== currentUser.name) body.name = name
      if (email !== (currentUser.email || '').toLowerCase()) body.email = email
      if (body.name === undefined && body.email === undefined) {
        Alert.alert('No changes', 'Update your name or email to save.')
        return
      }

      const updateResult = await apiRequest<{ user: any }>('/auth/profile', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setCurrentUser(updateResult.user)
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
                <ActivityIndicator color={theme.textColor} />
              </View>
            ) : currentUser?.profileImageUrl ? (
              <Image source={{ uri: currentUser.profileImageUrl }} style={styles.avatar} />
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
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.xs,
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
  })
