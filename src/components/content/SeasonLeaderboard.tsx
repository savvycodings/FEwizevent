import { useCallback, useContext, useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  useWindowDimensions,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { AppContext, ThemeContext } from '../../context'
import { DeckLabel, Divider, SegmentedTabs, ThemedCard, Text as UiText } from '../index'
import { HOME_STORE_LABEL, type HomeStore } from '../../constants/stores'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'
import { apiRequest } from '../../api'

type LeaderboardRow = {
  id: number
  name: string
  rank: string
  seasonXp: number
  activeDeckId: string | null
  activeDeckLabel: string
}

type LeaderboardPayload = {
  seasonYear: number
  rows: LeaderboardRow[]
  challengeLeader: LeaderboardRow | null
  cupChampion: LeaderboardRow | null
}

export type SeasonLeaderboardMode = 'combined' | 'store-teams'

type SeasonLeaderboardProps = {
  /** Combined ladder (everyone) or store teams (Glendower / Rosebank tabs only). */
  mode: SeasonLeaderboardMode
  initialStore?: HomeStore
}

const COL = {
  place: 44,
  player: 156,
  deck: 140,
  xp: 72,
}

const TABLE_MIN_WIDTH = COL.place + COL.player + COL.deck + COL.xp + SPACING.xs * 3

const MEDAL_GRADIENTS: Record<1 | 2 | 3, [string, string, string]> = {
  1: ['#FFF5C2', '#FFD24A', '#B88300'],
  2: ['#F8FAFC', '#D9E1EA', '#9BA7B5'],
  3: ['#F4D2B8', '#C98956', '#8A4E23'],
}

function MedalGradientText({
  place,
  text,
  style,
}: {
  place: number
  text: string
  style: StyleProp<TextStyle>
}) {
  if (place !== 1 && place !== 2 && place !== 3) {
    return <Text style={style}>{text}</Text>
  }
  const colors = MEDAL_GRADIENTS[place]
  return (
    <MaskedView maskElement={<Text style={style}>{text}</Text>} style={{ alignSelf: 'flex-start' }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, medalStyles.hidden]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  )
}

const medalStyles = StyleSheet.create({
  hidden: { opacity: 0 },
})

function deckDisplay(label: string | null | undefined): string {
  if (!label || label === 'Unknown deck') return '—'
  return label
}

export function SeasonLeaderboard({ mode, initialStore = 'glendower' }: SeasonLeaderboardProps) {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const navigation = useNavigation<any>()
  const { width: windowWidth } = useWindowDimensions()
  const tableMinWidth = Math.max(TABLE_MIN_WIDTH, windowWidth - SPACING.containerPadding * 2)

  const [store, setStore] = useState<HomeStore>(initialStore)

  useEffect(() => {
    if (mode === 'store-teams') {
      setStore(initialStore)
    }
  }, [mode, initialStore])
  const [payload, setPayload] = useState<LeaderboardPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const path =
        mode === 'combined'
          ? '/auth/leaderboards/combined'
          : `/auth/leaderboards/store/${store}`
      const res = await apiRequest<LeaderboardPayload & { seasonYear: number }>(path)
      setPayload({
        seasonYear: res.seasonYear,
        rows: res.rows ?? [],
        challengeLeader: res.challengeLeader ?? null,
        cupChampion: res.cupChampion ?? null,
      })
    } catch {
      setError('Could not load leaderboard')
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }, [mode, store])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const rows = payload?.rows ?? []
  const col = COL

  return (
    <View>
      {mode === 'store-teams' ? (
        <SegmentedTabs<HomeStore>
          style={styles.tabs}
          value={store}
          onChange={setStore}
          options={[
            { value: 'glendower', label: 'Glendower' },
            { value: 'rosebank', label: 'Rosebank' },
          ]}
        />
      ) : null}

      {payload ? (
        <Text style={styles.seasonNote}>
          {mode === 'combined'
            ? `Season ${payload.seasonYear} — all players`
            : `${HOME_STORE_LABEL[store]} team · Season ${payload.seasonYear}`}
        </Text>
      ) : null}

      {mode === 'store-teams' && (payload?.challengeLeader || payload?.cupChampion) ? (
        <View style={styles.crownRow}>
          {payload.challengeLeader ? (
            <View style={styles.crownPill}>
              <Text style={styles.crownLabel}>Challenge</Text>
              <Text style={styles.crownName} numberOfLines={1}>
                {payload.challengeLeader.name}
              </Text>
            </View>
          ) : null}
          {payload.cupChampion ? (
            <View style={styles.crownPill}>
              <Text style={styles.crownLabel}>Cup</Text>
              <Text style={styles.crownName} numberOfLines={1}>
                {payload.cupChampion.name}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ThemedCard style={styles.emptyCard}>
          <UiText variant="muted">Loading leaderboard…</UiText>
        </ThemedCard>
      ) : rows.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
          <View style={[styles.tableInner, { minWidth: tableMinWidth }]}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { width: col.place }]}>#</Text>
              <Text style={[styles.th, { width: col.player }]}>Player</Text>
              <Text style={[styles.th, { width: col.deck }]}>Deck</Text>
              <Text style={[styles.th, { width: col.xp }]}>XP</Text>
            </View>
            <Divider faint spacing="sm" />
            {rows.map((row, index) => {
              const place = index + 1
              const isTop = place <= 3
              const isYou = currentUser?.id === row.id
              return (
                <Pressable
                  key={row.id}
                  onPress={() =>
                    navigation.navigate('PlayerSnapshot', { userId: row.id, userName: row.name })
                  }
                  style={({ pressed }) => [
                    pressed && styles.tableRowPressed,
                    isYou && styles.tableRowYou,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`View stats for ${row.name}`}
                >
                  <View style={styles.tableRow}>
                    <View style={[styles.tdPlace, { width: col.place }]}>
                      <MedalGradientText
                        place={place}
                        text={`${place}`}
                        style={[styles.placeText, isTop && styles.topRankPlace]}
                      />
                    </View>
                    <View style={[styles.tdPlayer, { width: col.player }]}>
                      <MedalGradientText
                        place={place}
                        text={row.name}
                        style={[styles.nameText, isTop && styles.topRankName]}
                      />
                      <Text style={styles.rankMicro} numberOfLines={1}>
                        {row.rank}
                      </Text>
                    </View>
                    <View style={[styles.tdDeckWrap, { width: col.deck }]}>
                      {row.activeDeckId || deckDisplay(row.activeDeckLabel) !== '—' ? (
                        <DeckLabel
                          deckId={row.activeDeckId}
                          label={row.activeDeckLabel}
                          iconSize={20}
                          numberOfLines={2}
                          textStyle={styles.tdDeckText}
                          mutedPrefix={false}
                        />
                      ) : (
                        <Text style={styles.tdDeckText}>—</Text>
                      )}
                    </View>
                    <Text style={[styles.tdXp, { width: col.xp }]}>{row.seasonXp}</Text>
                  </View>
                  <View style={styles.rowRule} />
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      ) : (
        <ThemedCard style={styles.emptyCard}>
          <UiText variant="muted">
            {mode === 'combined'
              ? 'No season points yet.'
              : currentUser?.id &&
                  currentUser.homeStore !== store &&
                  (currentUser.homeStore === 'glendower' ||
                    currentUser.homeStore === 'rosebank')
                ? `Your home store is ${HOME_STORE_LABEL[currentUser.homeStore]}. Switch tabs or update it in Account Management.`
                : 'No players at this store yet.'}
          </UiText>
        </ThemedCard>
      )}
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    tabs: { marginBottom: SPACING.sm },
    seasonNote: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    },
    crownRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    crownPill: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: 12,
      padding: SPACING.sm,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    crownLabel: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    crownName: {
      marginTop: 2,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    error: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    },
    tableInner: {
      paddingVertical: SPACING.xs,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingBottom: SPACING.xs,
      gap: SPACING.xs,
    },
    th: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      gap: SPACING.xs,
    },
    tableRowPressed: {
      opacity: 0.88,
      backgroundColor: theme.surfaceMuted ?? 'rgba(255,255,255,0.06)',
    },
    tableRowYou: {
      backgroundColor: `${theme.tintColor}14`,
    },
    rowRule: {
      height: StyleSheet.hairlineWidth * 2,
      backgroundColor: theme.dividerColor ?? theme.borderColor,
      opacity: 0.55,
    },
    tdPlace: { justifyContent: 'center' },
    placeText: {
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
    },
    topRankPlace: {
      fontSize: Math.round(TYPOGRAPHY.body * 1.08),
    },
    tdPlayer: { justifyContent: 'center' },
    nameText: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'left',
    },
    topRankName: {
      fontSize: Math.round(TYPOGRAPHY.bodySmall * 1.06),
    },
    rankMicro: {
      marginTop: 2,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
    },
    tdDeckWrap: {
      justifyContent: 'center',
      minWidth: 0,
    },
    tdDeckText: {
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: TYPOGRAPHY.caption * 1.35,
    },
    tdXp: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textAlign: 'center',
    },
    emptyCard: {
      alignItems: 'stretch',
      justifyContent: 'center',
      paddingVertical: SPACING.xl,
    },
  })
