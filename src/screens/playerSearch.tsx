import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { Surface } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type PlayerSearchRow = {
  id: number
  name: string
  rank: string
  xp: number
  profileImageUrl?: string | null
}

const RANK_BADGE: Record<string, number> = {
  Bronze: require('../../assets/ranked/bronze.png'),
  Silver: require('../../assets/ranked/silver.png'),
  Gold: require('../../assets/ranked/gold.png'),
  Platinum: require('../../assets/ranked/platnuim.png'),
  Diamond: require('../../assets/ranked/diomand.png'),
  Champion: require('../../assets/ranked/champion.png'),
}

export function PlayerSearch({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [players, setPlayers] = useState<PlayerSearchRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPlayers = useCallback(async (search: string) => {
    try {
      setLoading(true)
      setError(null)
      const q = encodeURIComponent(search.trim())
      const path = q ? `/auth/players?q=${q}` : '/auth/players'
      const res = await apiRequest<{ players: PlayerSearchRow[] }>(path)
      setPlayers(Array.isArray(res.players) ? res.players : [])
    } catch {
      setError('Could not load players')
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      setQuery('')
      loadPlayers('')
    }, [loadPlayers])
  )

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length === 0) {
      loadPlayers('')
      return
    }
    if (trimmed.length < 2) {
      setPlayers([])
      return
    }
    const t = setTimeout(() => loadPlayers(trimmed), 250)
    return () => clearTimeout(t)
  }, [query, loadPlayers])

  const hint = useMemo(() => {
    const trimmed = query.trim()
    if (trimmed.length === 1) return 'Type at least 2 characters to search.'
    if (!loading && !error && trimmed.length >= 2 && players.length === 0) {
      return 'No players found.'
    }
    return null
  }, [query, loading, error, players.length])

  function openPlayer(player: PlayerSearchRow) {
    navigation.navigate('PlayerSnapshot', {
      userId: player.id,
      userName: player.name,
    })
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero} />

      <View style={styles.surface}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={theme.mutedForegroundColor} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            placeholder="Search players"
            placeholderTextColor={theme.mutedForegroundColor}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
        {loading ? <ActivityIndicator color={theme.tintColor} style={styles.loader} /> : null}

        {!loading &&
          players.map((player, index) => {
            const rankBadge = RANK_BADGE[player.rank] ?? RANK_BADGE.Bronze
            return (
              <Pressable
                key={player.id}
                onPress={() => openPlayer(player)}
                style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
                accessibilityRole="button"
                accessibilityLabel={`View stats for ${player.name}`}
              >
                <Surface style={[styles.card, index === 0 && query.trim().length >= 2 ? styles.cardFeatured : null]} padding="lg">
                  <View style={styles.cardRow}>
                    {player.profileImageUrl ? (
                      <Image source={{ uri: player.profileImageUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>{player.name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={styles.cardMain}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {player.name}
                      </Text>
                      <Text style={styles.playerMeta}>
                        {player.rank} · {player.xp} XP
                      </Text>
                    </View>
                    <Image source={rankBadge} style={styles.rankIcon} resizeMode="contain" />
                    <Ionicons name="chevron-forward" size={18} color={theme.mutedForegroundColor} />
                  </View>
                </Surface>
              </Pressable>
            )
          })}
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
      marginTop: -SPACING['2xl'],
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
      gap: SPACING.md,
      minHeight: 200,
    },
    searchWrap: {
      borderColor: theme.borderColor,
      borderWidth: 1,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      marginBottom: SPACING.xs,
    },
    searchInput: {
      flex: 1,
      color: theme.textColor,
      marginLeft: SPACING.sm,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
      paddingVertical: 0,
    },
    loader: {
      marginVertical: SPACING.lg,
    },
    errorText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    hintText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.sm,
    },
    cardPressable: {
      marginBottom: SPACING.sm,
    },
    cardPressed: {
      opacity: 0.88,
    },
    card: {
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    cardFeatured: {
      borderColor: theme.tintColor,
      borderWidth: 1.5,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarFallback: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#000',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
    },
    cardMain: {
      flex: 1,
      minWidth: 0,
    },
    playerName: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
    },
    playerMeta: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
    },
    rankIcon: {
      width: 28,
      height: 28,
    },
  })
