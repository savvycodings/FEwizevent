import { useCallback, useContext, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { Divider, Section, Surface, ThemedCard } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type SnapshotUser = {
  id: number
  name: string
  email: string
  profileImageUrl?: string | null
  xp: number
  rank: string
}

type PlayerSnapshotStats = {
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  winRatioPercent: number
  firstPlace: number
  secondPlace: number
  thirdPlace: number
  topFiveFinishes: number
  eventsAttended: number
}

type SnapshotResponse = {
  user: SnapshotUser
  snapshot: PlayerSnapshotStats
}

const RANK_BADGE: Record<string, number> = {
  Bronze: require('../../assets/ranked/bronze.png'),
  Silver: require('../../assets/ranked/silver.png'),
  Gold: require('../../assets/ranked/gold.png'),
  Platinum: require('../../assets/ranked/platnuim.png'),
  Diamond: require('../../assets/ranked/diomand.png'),
  Champion: require('../../assets/ranked/champion.png'),
}

function StatTile({
  label,
  value,
  styles,
  accent,
}: {
  label: string
  value: string | number
  styles: ReturnType<typeof getStyles>
  accent?: boolean
}) {
  return (
    <Surface style={[styles.statTile, accent && styles.statTileAccent]} padding="md">
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Surface>
  )
}

export function PlayerSnapshot() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const userId = Number(route.params?.userId)

  const [user, setUser] = useState<SnapshotUser | null>(null)
  const [snapshot, setSnapshot] = useState<PlayerSnapshotStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setError('Missing player')
      setLoading(false)
      return
    }
    try {
      setError(null)
      setLoading(true)
      const res = await apiRequest<SnapshotResponse>(`/admin/users/${userId}/snapshot`)
      setUser(res.user)
      setSnapshot(res.snapshot)
    } catch {
      setError('Could not load player snapshot')
      setUser(null)
      setSnapshot(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const rankKey = user?.rank && RANK_BADGE[user.rank] ? user.rank : 'Bronze'
  const displayName =
    (typeof route.params?.userName === 'string' && route.params.userName.trim()) ||
    user?.name ||
    'Player'

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <View style={styles.titleRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back-outline" size={22} color="#000" />
            </Pressable>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {displayName}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.surface}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && user && snapshot ? (
          <>
            <ThemedCard premiumRim style={styles.rankCard}>
              <View style={styles.rankRow}>
                <Image source={RANK_BADGE[rankKey]} style={styles.rankBadge} resizeMode="contain" />
                <View style={styles.rankTextCol}>
                  <Text style={styles.rankTitle}>{user.rank}</Text>
                  <Text style={styles.rankXp}>{user.xp} XP</Text>
                </View>
              </View>
            </ThemedCard>

            <Section title="Win ratio" compactTopSpacing>
              <ThemedCard premiumRim>
                <Text style={styles.winRatioValue}>{snapshot.winRatioPercent}%</Text>
              </ThemedCard>
            </Section>

            <Section title="Match record" compactTopSpacing>
              <View style={styles.statGrid}>
                <StatTile label="Games played" value={snapshot.gamesPlayed} styles={styles} accent />
                <StatTile label="Wins" value={snapshot.wins} styles={styles} />
                <StatTile label="Losses" value={snapshot.losses} styles={styles} />
                <StatTile label="Draws" value={snapshot.draws} styles={styles} />
              </View>
            </Section>

            <Section title="Placements" compactTopSpacing>
              <ThemedCard>
                <View style={styles.placementGrid}>
                  <View style={styles.placementCell}>
                    <Text style={styles.placementValue}>{snapshot.firstPlace}</Text>
                    <Text style={styles.placementLabel}>1st place</Text>
                  </View>
                  <View style={[styles.placementCell, styles.placementCellBorder]}>
                    <Text style={styles.placementValue}>{snapshot.secondPlace}</Text>
                    <Text style={styles.placementLabel}>2nd place</Text>
                  </View>
                  <View style={styles.placementCell}>
                    <Text style={styles.placementValue}>{snapshot.thirdPlace}</Text>
                    <Text style={styles.placementLabel}>3rd place</Text>
                  </View>
                </View>
                <Divider faint spacing="md" />
                <View style={styles.topFiveRow}>
                  <Text style={styles.topFiveLabel}>Top 5 finishes</Text>
                  <Text style={styles.topFiveValue}>{snapshot.topFiveFinishes}</Text>
                </View>
              </ThemedCard>
            </Section>
          </>
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
      paddingBottom: SPACING['4xl'],
    },
    hero: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING['3xl'],
    },
    heroContent: {
      gap: SPACING.xs,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    titleRow: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButton: {
      position: 'absolute',
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.xs,
    },
    heroTitle: {
      color: '#000',
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
      flexShrink: 1,
      textAlign: 'center',
    },
    surface: {
      marginTop: -SPACING['2xl'],
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.xl,
    },
    errorText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.md,
    },
    rankCard: {
      marginBottom: SPACING.sm,
    },
    rankRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    rankBadge: {
      width: 56,
      height: 56,
    },
    rankTextCol: {
      flex: 1,
    },
    rankTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    rankXp: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    winRatioValue: {
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: 48,
      lineHeight: 52,
      textAlign: 'center',
    },
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.md,
      justifyContent: 'space-between',
    },
    statTile: {
      width: '48%',
      minHeight: 88,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statTileAccent: {
      borderColor: theme.tintColor,
      borderWidth: 1,
    },
    statValue: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
    },
    statLabel: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      textAlign: 'center',
    },
    placementGrid: {
      flexDirection: 'row',
    },
    placementCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING.sm,
    },
    placementCellBorder: {
      borderLeftWidth: StyleSheet.hairlineWidth * 2,
      borderRightWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.borderColor,
    },
    placementValue: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
    },
    placementLabel: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      textAlign: 'center',
    },
    topFiveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.sm,
    },
    topFiveLabel: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.body,
    },
    topFiveValue: {
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
    },
  })
