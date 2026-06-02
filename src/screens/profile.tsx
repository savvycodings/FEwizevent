import { useCallback, useContext, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppIcon } from '../components'
import { AppContext, ThemeContext } from '../context'
import {
  EmptyState,
  SearchField,
  Section,
  Text,
  RankSummaryRow,
  ScreenHero,
  ScreenSurface,
  ThemedButton,
  ThemedCard,
} from '../components'
import { RankGrowthChart, type RankChartPoint } from '../components/charts/RankGrowthChart'
import { DeckProfileSection } from '../components/content/DeckProfileSection'
import type { CompareXpTotals } from '../components/charts/rankChartTypes'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest, apiUrl } from '../api'
import { fetchAndCachePlayerStats } from '../state/fetchPlayerStats'
import { getCachedPlayerStats, setCachedPlayerStats } from '../state/playerStatsCache'

type RankProgressSeries = {
  userId: number
  name: string
  points: RankChartPoint[]
  xpGainedInRange: number
  eventsInRange: number
}

type RankProgressResponse = {
  month: string
  chartScope?: 'month' | 'all-time'
  primary: RankProgressSeries
  compare: RankProgressSeries | null
  lifetime?: { xp: number; rank: string; name: string }
  summary: {
    rankStart: string
    rankEnd: string
    xpGained: number
    events: number
  }
}

type PlayerPick = {
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

export function Profile() {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RankProgressResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [comparePlayer, setComparePlayer] = useState<PlayerPick | null>(null)
  const [compareTotals, setCompareTotals] = useState<CompareXpTotals | null>(null)
  const [lifetimeXp, setLifetimeXp] = useState<{ xp: number; rank: string } | null>(null)
  const [compareModal, setCompareModal] = useState(false)
  const [playerQuery, setPlayerQuery] = useState('')
  const [playerHits, setPlayerHits] = useState<PlayerPick[]>([])
  const [playerSearchLoading, setPlayerSearchLoading] = useState(false)

  const beginCompare = useCallback(
    (picked: PlayerPick) => {
      if (!currentUser?.id) return
      setCachedPlayerStats(picked.id, {
        xp: picked.xp,
        rank: picked.rank,
        name: picked.name,
      })
      const cached = getCachedPlayerStats(currentUser.id)
      setComparePlayer(picked)
      setCompareTotals({
        primary: cached
          ? { name: cached.name, xp: cached.xp, rank: cached.rank }
          : { name: currentUser.name, xp: null, rank: null },
        compare: { name: picked.name, xp: picked.xp, rank: picked.rank },
        primaryLoading: !cached,
      })
      setCompareModal(false)
      setPlayerQuery('')
    },
    [currentUser?.id, currentUser?.name]
  )

  const clearCompare = useCallback(() => {
    setComparePlayer(null)
    setCompareTotals(null)
  }, [])

  useEffect(() => {
    if (!comparePlayer || !currentUser?.id || !compareTotals?.primaryLoading) return

    let cancelled = false
    fetchAndCachePlayerStats(currentUser.id, currentUser.name)
      .then((primary) => {
        if (cancelled) return
        setCompareTotals((prev) =>
          prev
            ? {
                ...prev,
                primary: { name: primary.name, xp: primary.xp, rank: primary.rank },
                primaryLoading: false,
              }
            : null
        )
      })
      .catch(() => {
        if (!cancelled) {
          setCompareTotals((prev) => (prev ? { ...prev, primaryLoading: false } : null))
        }
      })

    return () => {
      cancelled = true
    }
  }, [comparePlayer?.id, currentUser?.id, currentUser?.name, compareTotals?.primaryLoading])

  const refreshLifetime = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const stats = await fetchAndCachePlayerStats(currentUser.id, currentUser.name, {
        force: true,
      })
      setLifetimeXp({ xp: stats.xp, rank: stats.rank })
    } catch {
      const cached = getCachedPlayerStats(currentUser.id)
      if (cached) setLifetimeXp({ xp: cached.xp, rank: cached.rank })
    }
  }, [currentUser?.id, currentUser?.name])

  const loadProgress = useCallback(async () => {
    if (!currentUser?.id) {
      setData(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const path = `/auth/rank-progress?userId=${currentUser.id}`
      const url = apiUrl(path)
      const res = await apiRequest<RankProgressResponse>(path)
      if (res.lifetime) {
        const { xp, rank, name } = res.lifetime
        setLifetimeXp({ xp, rank })
        setCachedPlayerStats(currentUser.id, { xp, rank, name })
      }
      if (__DEV__) {
        console.log('[Profile/chart] rank-progress OK', {
          url,
          points: res.primary?.points?.length ?? 0,
          events: res.summary?.events,
          lifetimeXp: res.lifetime?.xp,
        })
      }
      setData({ ...res, compare: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load rank progress'
      if (__DEV__) {
        console.error('[Profile/chart] rank-progress failed', {
          url: apiUrl(`/auth/rank-progress?userId=${currentUser.id}`),
          userId: currentUser.id,
          message,
        })
      }
      setError(message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, currentUser?.name])

  useFocusEffect(
    useCallback(() => {
      refreshLifetime()
      loadProgress()
    }, [refreshLifetime, loadProgress])
  )

  const searchPlayers = useCallback(async (q: string) => {
    const path =
      q.trim().length >= 2
        ? `/auth/players?q=${encodeURIComponent(q.trim())}`
        : '/auth/players'
    try {
      setPlayerSearchLoading(true)
      const res = await apiRequest<{ players: PlayerPick[] }>(path)
      const list = (res.players ?? []).filter((p) => p.id !== currentUser?.id)
      setPlayerHits(list)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Player search failed'
      if (__DEV__) {
        console.error('[Profile/chart] compare-players search failed', { path, message })
      }
      setPlayerHits([])
    } finally {
      setPlayerSearchLoading(false)
    }
  }, [currentUser?.id])

  const cached = currentUser?.id ? getCachedPlayerStats(currentUser.id) : null
  const displayRank =
    lifetimeXp?.rank ?? data?.lifetime?.rank ?? cached?.rank ?? data?.summary.rankEnd ?? 'Bronze'
  const displayXp =
    lifetimeXp?.xp ?? data?.lifetime?.xp ?? cached?.xp ?? 0
  const monthXpGained = data?.summary.xpGained ?? 0
  const rankBadge = RANK_BADGE[displayRank] ?? RANK_BADGE.Bronze
  const summarySubtitle =
    monthXpGained > 0
      ? `+${monthXpGained} XP this month`
      : data?.summary.rankStart !== data?.summary.rankEnd
        ? `Up from ${data?.summary.rankStart} this month`
        : 'Lifetime rank from events'

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING['3xl'] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHero title="Profile" />

        <ScreenSurface style={{ gap: SPACING.sectionGap }}>
        {!currentUser ? (
          <EmptyState message="Sign in to track your rank climb and compare with friends." />
        ) : (
          <>
            <ThemedCard style={styles.summaryCard}>
              <RankSummaryRow
                badgeSource={rankBadge}
                title={displayRank}
                subtitle={summarySubtitle}
                trailingValue={String(displayXp)}
                trailingLabel="XP"
              />
            </ThemedCard>

            <Section title="Rank growth" embedded>
              {loading ? (
                <ActivityIndicator color={theme.tintColor} style={styles.chartLoader} />
              ) : error ? (
                <EmptyState message={error} />
              ) : data ? (
                <RankGrowthChart
                  primary={data.primary.points}
                  primaryColor={theme.tintColor}
                />
              ) : null}

              <View style={styles.compareBlock}>
                {comparePlayer && compareTotals ? (
                  <>
                    <View style={styles.compareHeader}>
                      <Text style={styles.compareTitle} numberOfLines={1}>
                        Compare · {comparePlayer.name}
                      </Text>
                      <Pressable
                        hitSlop={12}
                        onPress={clearCompare}
                        style={({ pressed }) => [
                          styles.clearCompare,
                          pressed && styles.clearComparePressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Clear comparison"
                      >
                        <Text style={styles.clearCompareText}>Clear</Text>
                      </Pressable>
                    </View>
                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: theme.tintColor }]} />
                        <Text variant="small" className="text-foreground">
                          You
                        </Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[styles.legendDot, { backgroundColor: theme.mutedForegroundColor }]}
                        />
                        <Text variant="small" className="text-muted-foreground" numberOfLines={1}>
                          {comparePlayer.name}
                        </Text>
                      </View>
                    </View>
                    <RankGrowthChart
                      primary={[]}
                      compareTotals={compareTotals}
                      compareName={comparePlayer.name}
                      primaryColor={theme.tintColor}
                      compareColor={theme.mutedForegroundColor}
                    />
                  </>
                ) : (
                  <ThemedButton
                    variant="outline"
                    label="Compare player"
                    leftIcon={<AppIcon name="users" size={18} color={theme.tintColor} />}
                    onPress={() => {
                      setCompareModal(true)
                      searchPlayers('')
                    }}
                  />
                )}
              </View>
            </Section>

            {currentUser?.id ? (
              <View className="mt-6">
                <DeckProfileSection userId={currentUser.id} />
              </View>
            ) : null}
          </>
        )}
        </ScreenSurface>
      </ScrollView>

      <Modal visible={compareModal} animationType="slide" transparent onRequestClose={() => setCompareModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCompareModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text variant="h4" className="mb-3 text-foreground">
              Compare player
            </Text>
            <SearchField
              value={playerQuery}
              onChangeText={(t) => {
                setPlayerQuery(t)
                searchPlayers(t)
              }}
              placeholder="Search players"
              autoCapitalize="none"
              containerClassName="mb-3 rounded-lg border border-border bg-card px-3"
            />
            {playerSearchLoading ? (
              <ActivityIndicator color={theme.tintColor} />
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {playerHits.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => beginCompare(p)}
                    style={({ pressed }) => [styles.pickRow, pressed && { opacity: 0.8 }]}
                  >
                    <Text className="font-medium text-foreground">{p.name}</Text>
                    <Text variant="muted" className="text-xs">
                      {p.rank} · {p.xp} XP
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
    },
    summaryCard: {
      marginBottom: 0,
    },
    chartLoader: {
      paddingVertical: SPACING.xl,
    },
    compareBlock: {
      marginTop: SPACING.lg,
      paddingTop: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
    },
    compareHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    compareTitle: {
      flex: 1,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    clearCompare: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
    },
    clearComparePressed: {
      opacity: 0.75,
    },
    clearCompareText: {
      color: theme.tintColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xl,
      marginBottom: SPACING.sm,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      flexShrink: 1,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: theme.cardBackground,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      padding: SPACING.lg,
      paddingBottom: SPACING['2xl'],
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.borderColor,
    },
    pickRow: {
      paddingVertical: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth * 2,
      borderBottomColor: theme.borderColor,
    },
  })
