import { useContext, useState } from 'react'
import { Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppContext, ThemeContext } from '../context'
import { ThemedButton, ThemedCard, HomeStoreTabs } from '../components'
import { DeckPicker } from '../components/content/DeckPicker'
import { type HomeStore } from '../constants/stores'
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
  const [homeStore, setHomeStore] = useState<HomeStore>('glendower')
  const [deckId, setDeckId] = useState<string | null>(null)
  const [popId, setPopId] = useState('')
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
    const popTrim = popId.trim()
    if (!name.trim() || !email.trim() || !password || !deckId || !/^\d{5,10}$/.test(popTrim)) {
      Alert.alert(
        'Missing fields',
        'Name, email, password, Player ID (5–10 digits), home store, and deck are required.'
      )
      return
    }
    try {
      setLoading(true)
      const profileImageUrl = await uploadProfileImageIfAny()
      const result = await apiRequest<{ user: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          profileImageUrl,
          homeStore,
          deckId,
          popId: popTrim,
        }),
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
      </View>

      <View style={styles.surface}>
        <ThemedCard>
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
            placeholder="Player ID (POP / TCG Live)"
            placeholderTextColor={theme.mutedForegroundColor}
            keyboardType="number-pad"
            maxLength={10}
            value={popId}
            onChangeText={setPopId}
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
          <Text style={styles.storeLabel}>Home store</Text>
          <HomeStoreTabs style={styles.storeTabs} value={homeStore} onChange={setHomeStore} />
          <Text style={styles.storeLabel}>Current deck</Text>
          <View style={styles.deckField}>
            <DeckPicker
              variant="field"
              value={deckId}
              onChange={setDeckId}
              showFieldLabel={false}
              placeholder="Tap to choose a deck"
            />
          </View>
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
      borderWidth: 1.5,
      borderRadius: RADIUS.md,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      color: theme.textColor,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      fontFamily: theme.regularFont,
      marginBottom: SPACING.md,
    },
    imageButton: {
      marginBottom: SPACING.md,
    },
    storeLabel: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginTop: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    storeTabs: {
      marginBottom: SPACING.md,
    },
    deckField: {
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
