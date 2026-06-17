import { useCallback, useContext, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { ThemeContext } from '../context'
import { AppIcon, RainSpinner, SearchField, ThemedButton } from '../components'
import { RANK_ENTITLEMENT_REWARD, type EntitlementTier } from '../data/rankCatalog'
import type { EntitlementStatus, RankEntitlementItem } from '../data/rankEntitlements'
import { apiRequest } from '../api'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'

type PlayerPick = {
  id: number
  name: string
  rank: string
  xp: number
}

type EntitlementsPayload = {
  user: { id: number; name: string; xp: number; currentTier: string }
  entitlements: RankEntitlementItem[]
}

export function AdminRedeem() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  const [query, setQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [players, setPlayers] = useState<PlayerPick[]>([])
  const [selected, setSelected] = useState<PlayerPick | null>(null)
  const [entitlements, setEntitlements] = useState<RankEntitlementItem[]>([])
  const [loadingEntitlements, setLoadingEntitlements] = useState(false)
  const [redeemingTier, setRedeemingTier] = useState<string | null>(null)

  const searchPlayers = useCallback(async (q: string) => {
    try {
      setSearchLoading(true)
      const path =
        q.trim().length >= 2
          ? `/auth/players?q=${encodeURIComponent(q.trim())}`
          : '/auth/players'
      const res = await apiRequest<{ players: PlayerPick[] }>(path)
      setPlayers(res.players ?? [])
    } catch {
      setPlayers([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const loadEntitlements = useCallback(async (userId: number) => {
    try {
      setLoadingEntitlements(true)
      const res = await apiRequest<EntitlementsPayload>(`/admin/users/${userId}/entitlements`)
      setEntitlements(res.entitlements ?? [])
      setSelected({
        id: res.user.id,
        name: res.user.name,
        rank: res.user.currentTier,
        xp: res.user.xp,
      })
    } catch (err: unknown) {
      Alert.alert('Load failed', err instanceof Error ? err.message : 'Try again')
      setEntitlements([])
    } finally {
      setLoadingEntitlements(false)
    }
  }, [])

  async function redeemTier(tier: EntitlementTier) {
    if (!selected) return
    try {
      setRedeemingTier(tier)
      const res = await apiRequest<EntitlementsPayload>('/admin/entitlements/redeem', {
        method: 'POST',
        body: JSON.stringify({ userId: selected.id, tier }),
      })
      setEntitlements(res.entitlements ?? [])
      setSelected({
        id: res.user.id,
        name: res.user.name,
        rank: res.user.currentTier,
        xp: res.user.xp,
      })
    } catch (err: unknown) {
      Alert.alert('Redeem failed', err instanceof Error ? err.message : 'Try again')
    } finally {
      setRedeemingTier(null)
    }
  }

  const pending = entitlements.filter((e) => e.status === 'claimed')

  useFocusEffect(
    useCallback(() => {
      searchPlayers('')
    }, [searchPlayers])
  )

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />
      <View style={styles.surface}>
        <Text style={styles.hint}>
          Find a player, then redeem in-person prizes for any code they have claimed.
        </Text>

        <SearchField
          value={query}
          onChangeText={(t) => {
            setQuery(t)
            searchPlayers(t)
          }}
          placeholder="Search by name"
          containerClassName="mb-3 rounded-lg border border-border bg-card px-3"
        />

        {searchLoading ? (
          <RainSpinner size={22} color={theme.tintColor} style={styles.loader} />
        ) : null}

        {!selected ? (
          <View style={styles.playerList}>
            {players.slice(0, 12).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => loadEntitlements(p.id)}
                style={({ pressed }) => [styles.playerRow, pressed && styles.playerRowPressed]}
              >
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.playerMeta}>
                  {p.rank} · {p.xp} season XP
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedText}>
                <Text style={styles.selectedName}>{selected.name}</Text>
                <Text style={styles.selectedMeta}>
                  {selected.rank} · {selected.xp.toLocaleString()} season XP
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setSelected(null)
                  setEntitlements([])
                }}
                hitSlop={8}
              >
                <Text style={styles.changePlayer}>Change</Text>
              </Pressable>
            </View>

            {loadingEntitlements ? (
              <RainSpinner size={24} color={theme.tintColor} style={styles.loader} />
            ) : (
              <>
                {pending.length === 0 ? (
                  <Text style={styles.emptyHint}>No codes waiting to redeem.</Text>
                ) : null}
                {entitlements.map((row) => (
                  <EntitlementRedeemRow
                    key={row.tier}
                    row={row}
                    styles={styles}
                    theme={theme}
                    busy={redeemingTier === row.tier}
                    onRedeem={() => redeemTier(row.tier)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  )
}

function EntitlementRedeemRow({
  row,
  styles,
  theme,
  busy,
  onRedeem,
}: {
  row: RankEntitlementItem
  styles: ReturnType<typeof getStyles>
  theme: { tintColor: string; mutedForegroundColor: string }
  busy: boolean
  onRedeem: () => void
}) {
  const canRedeem = row.status === 'claimed'
  const isRedeemed = row.status === 'redeemed'

  return (
    <View style={[styles.entitlementRow, isRedeemed && styles.entitlementRowRedeemed]}>
      <View style={styles.entitlementCopy}>
        <Text style={[styles.entitlementTier, isRedeemed && styles.textMuted]}>{row.tier}</Text>
        <Text style={[styles.entitlementReward, isRedeemed && styles.textMuted]}>
          {RANK_ENTITLEMENT_REWARD[row.tier]}
        </Text>
        {row.claimCode ? (
          <Text style={[styles.entitlementCode, isRedeemed && styles.codeRedeemed]}>
            {row.claimCode}
          </Text>
        ) : null}
        {isRedeemed ? <Text style={styles.redeemedLabel}>Redeemed</Text> : null}
        {row.status === 'claimable' ? (
          <Text style={styles.waitingHint}>Player has not claimed yet</Text>
        ) : null}
        {row.status === 'locked' ? (
          <Text style={styles.waitingHint}>Rank not reached</Text>
        ) : null}
      </View>
      {canRedeem ? (
        <ThemedButton
          label={busy ? '…' : 'Redeem'}
          onPress={onRedeem}
          disabled={busy}
          size="sm"
          fullWidth={false}
          style={styles.redeemBtn}
        />
      ) : isRedeemed ? (
        <View style={styles.redeemIcon}>
          <AppIcon name="list-checks" size={22} color={theme.mutedForegroundColor} />
        </View>
      ) : null}
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.backgroundColor },
    content: { paddingBottom: SPACING['3xl'] },
    hero: {
      backgroundColor: theme.tintColor,
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
    hint: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.45,
      marginBottom: SPACING.md,
    },
    playerList: { gap: SPACING.sm },
    playerRow: {
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    playerRowPressed: { opacity: 0.88 },
    playerName: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.body,
    },
    playerMeta: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    selectedHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.md,
      marginBottom: SPACING.md,
    },
    selectedText: { flex: 1 },
    selectedName: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    selectedMeta: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    changePlayer: {
      color: theme.tintColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    emptyHint: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.md,
    },
    entitlementRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.sm,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    entitlementRowRedeemed: {
      opacity: 0.65,
      backgroundColor: theme.cardBackground,
    },
    entitlementCopy: { flex: 1, minWidth: 0 },
    entitlementTier: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.body,
    },
    entitlementReward: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    entitlementCode: {
      marginTop: SPACING.xs,
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      letterSpacing: 3,
    },
    codeRedeemed: {
      color: theme.mutedForegroundColor,
      textDecorationLine: 'line-through',
    },
    redeemedLabel: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    waitingHint: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    textMuted: { color: theme.mutedForegroundColor },
    redeemBtn: { marginTop: 2 },
    redeemIcon: { marginTop: 4 },
    loader: {
      paddingVertical: SPACING.lg,
    },
  })
