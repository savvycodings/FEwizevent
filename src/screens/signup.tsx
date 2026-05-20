import { useContext, useState } from 'react'
import { Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppContext, ThemeContext } from '../context'
import { ThemedButton, ThemedCard } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest, readJsonResponse } from '../api'
import { pickImageWithSource } from '../utils/pickImageWithSource'
import { DOMAIN } from '../../constants'

export function Signup() {
  const { theme } = useContext(ThemeContext)
  const { setCurrentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profileImage, setProfileImage] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function pickProfileImage() {
    const asset = await pickImageWithSource({
      quality: 0.8,
    })
    if (asset) setProfileImage(asset)
  }

  async function uploadProfileImageIfAny() {
    if (!profileImage) return null
    const formData = new FormData()
    formData.append('file', {
      uri: profileImage.uri,
      name: profileImage.fileName || `profile-${Date.now()}.jpg`,
      type: profileImage.mimeType || 'image/jpeg',
    } as any)

    const response = await fetch(`${DOMAIN}/auth/upload-profile`, {
      method: 'POST',
      body: formData,
    })
    const data = await readJsonResponse<{ imageUrl?: string; error?: string }>(response)
    if (!response.ok) {
      throw new Error(data?.error || 'Profile upload failed')
    }
    return data.imageUrl as string
  }

  async function onSignup() {
    try {
      setLoading(true)
      const profileImageUrl = await uploadProfileImageIfAny()
      const result = await apiRequest<{ user: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, profileImageUrl }),
      })
      setCurrentUser(result.user)
    } catch (err: any) {
      Alert.alert('Sign up failed', err?.message || 'Please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Create Account</Text>
        <Text style={styles.heroSubtitle}>Sign up with name, email, and password.</Text>
      </View>

      <View style={styles.surface}>
        <ThemedCard premiumRim>
          <Text style={styles.title}>Sign Up</Text>
          <ThemedButton
            label={profileImage ? 'Change profile picture' : 'Add profile picture'}
            variant="outline"
            style={styles.imageButton}
            onPress={pickProfileImage}
          />
          {profileImage ? <Image source={{ uri: profileImage.uri }} style={styles.preview} /> : null}
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={theme.mutedForegroundColor}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.mutedForegroundColor}
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.mutedForegroundColor}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <ThemedButton label={loading ? 'Creating...' : 'Sign Up'} onPress={onSignup} />
        </ThemedCard>
      </View>
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    hero: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING['4xl'],
      paddingBottom: SPACING['4xl'],
    },
    heroTitle: {
      color: theme.backgroundColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
    },
    heroSubtitle: {
      color: theme.backgroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginTop: SPACING.sm,
      opacity: 0.9,
    },
    surface: {
      flex: 1,
      marginTop: -SPACING.xl,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
    },
    title: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
      marginBottom: SPACING.lg,
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
    imageButton: {
      marginBottom: SPACING.md,
    },
    preview: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: SPACING.md,
      alignSelf: 'center',
    },
  })
