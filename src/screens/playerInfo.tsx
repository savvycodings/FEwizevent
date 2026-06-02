import { useCallback, useContext, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { AppIcon, RainSpinner } from '../components'
import { ThemeContext } from '../context'
import { ThemedCard, CardCaption } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type Player = {
  id: number
  name: string
  email: string
  profileImageUrl?: string | null
  profile_image_url?: string | null
  isAdmin?: boolean
  createdAt?: string
}

export function PlayerInfo({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [players, setPlayers] = useState<Player[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPlayers = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const res = await apiRequest<{ users: Player[] }>('/admin/users')
      setPlayers(Array.isArray(res.users) ? res.users : [])
    } catch {
      setError('Could not load player info')
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadPlayers()
    }, [loadPlayers])
  )

  const q = query.trim().toLowerCase()
  const filtered = players.filter((p) => {
    if (!q) return true
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
  })

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />
      <View style={styles.surface}>
        <View style={styles.searchWrap}>
          <AppIcon name="search" size={18} color={theme.mutedForegroundColor} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            placeholder="Search players"
            placeholderTextColor={theme.mutedForegroundColor}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {loading ? <RainSpinner size={22} color={theme.tintColor} style={styles.loader} /> : null}
        {!loading &&
          filtered.map((player, pi) => (
          <Pressable
            key={player.id}
            style={styles.playerPressable}
            onPress={() => navigation.navigate('PlayerInfoDetail', { player })}
          >
            <ThemedCard premiumRim={pi === 0} style={styles.playerCard}>
              <CardCaption caption={player.email}>
                <View style={styles.playerRow}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <AppIcon name="chevron-right" size={18} color={theme.mutedForegroundColor} />
                </View>
              </CardCaption>
            </ThemedCard>
          </Pressable>
          ))}
        {!loading && !error && filtered.length === 0 ? (
          <ThemedCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>No players found.</Text>
          </ThemedCard>
        ) : null}
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
    searchWrap: {
      borderColor: theme.borderColor,
      borderWidth: 1,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.md,
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
    errorText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    },
    loader: {
      paddingVertical: SPACING.lg,
    },
    playerPressable: {
      marginBottom: SPACING.md,
    },
    playerCard: {},
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    playerName: {
      flex: 1,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'left',
    },
    emptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.lg,
    },
    emptyText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'left',
    },
  })
