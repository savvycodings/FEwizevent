import { useCallback, useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { ThemeContext } from '../context'
import { Input, Label, RainSpinner, ThemedButton } from '../components'
import { apiRequest } from '../api'
import { hydrateAdminPass } from '../adminSession'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'

type SeasonRow = {
  id: number
  name: string
  seasonType: string
  startDate: string
  endDate: string
  status: string
}

function ConfigCard({
  children,
  style,
  cardStyle,
}: {
  children: ReactNode
  style?: object
  cardStyle: ReturnType<typeof getStyles>['cardBox']
}) {
  return <View style={[cardStyle, style]}>{children}</View>
}

export function AdminLeagueConfig({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seasons, setSeasons] = useState<SeasonRow[]>([])
  const [activeSeason, setActiveSeason] = useState<SeasonRow | null>(null)
  const [veteranEnabled, setVeteranEnabled] = useState(true)
  const [veteranWeeks, setVeteranWeeks] = useState('4')
  const [minEventSize, setMinEventSize] = useState('4')
  const [newSeasonName, setNewSeasonName] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      await hydrateAdminPass()
      const res = await apiRequest<{
        activeSeason: SeasonRow | null
        seasons?: SeasonRow[]
        veteranGrace: { enabled: boolean; weeks: number }
        antiFarm: { minEventSize: number }
      }>('/admin/league/config')
      setActiveSeason(res.activeSeason ?? null)
      setSeasons(Array.isArray(res.seasons) ? res.seasons : [])
      setVeteranEnabled(res.veteranGrace?.enabled ?? true)
      setVeteranWeeks(String(res.veteranGrace?.weeks ?? 4))
      setMinEventSize(String(res.antiFarm?.minEventSize ?? 4))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load league config'
      Alert.alert('Error', message)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function saveConfig() {
    try {
      setSaving(true)
      await apiRequest('/admin/league/config', {
        method: 'PATCH',
        body: JSON.stringify({
          veteranGrace: { enabled: veteranEnabled, weeks: Number(veteranWeeks) || 4 },
          antiFarm: {
            minEventSize: Number(minEventSize) || 4,
            minEventSizeXpMultiplier: 0.5,
            dailyFullXpEvents: 1,
            additionalEventXpMultiplier: 0.25,
            diminishingOpponentBonusEnabled: true,
          },
        }),
      })
      Alert.alert('Saved', 'League settings updated')
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function endSeason() {
    if (!activeSeason) return
    Alert.alert('End season', `Archive "${activeSeason.name}" and start a new season?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End season',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/admin/league/seasons/${activeSeason.id}/end`, { method: 'POST' })
            await load()
            Alert.alert('Done', 'Season archived. A new active season was created if needed.')
          } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed')
          }
        },
      },
    ])
  }

  async function createSeason() {
    if (!newSeasonName.trim()) return
    const year = new Date().getFullYear()
    try {
      const res = await apiRequest<{ season: SeasonRow }>('/admin/league/seasons', {
        method: 'POST',
        body: JSON.stringify({
          name: newSeasonName.trim(),
          seasonType: 'main',
          startDate: `${year}-09-01`,
          endDate: `${year + 1}-06-15`,
        }),
      })
      await apiRequest(`/admin/league/seasons/${res.season.id}/activate`, { method: 'POST' })
      setNewSeasonName('')
      await load()
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed')
    }
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.hero} />
        <View style={[styles.surface, styles.center]}>
          <RainSpinner size={32} color={theme.tintColor} />
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />
      <View style={styles.surface}>
        <ConfigCard cardStyle={styles.cardBox}>
          <Text style={styles.cardTitle}>Active season</Text>
          {activeSeason ? (
            <>
              <Text style={styles.bodyText}>{activeSeason.name}</Text>
              <Pressable style={styles.dangerBtn} onPress={endSeason}>
                <Text style={styles.dangerBtnText}>End and archive season</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.muted}>No active season</Text>
          )}
        </ConfigCard>

        <ConfigCard cardStyle={styles.cardBox}>
          <Text style={styles.cardTitle}>Anti-farming</Text>
          <View style={styles.field}>
            <Label nativeID="min-event-size">Minimum event size (players)</Label>
            <Input
              value={minEventSize}
              onChangeText={setMinEventSize}
              keyboardType="number-pad"
              aria-labelledby="min-event-size"
            />
            <Text style={styles.hint}>
              Events below this size award 50% XP. Only one full-XP event per day.
            </Text>
          </View>
        </ConfigCard>

        <ConfigCard cardStyle={styles.cardBox}>
          <Text style={styles.cardTitle}>Veteran grace</Text>
          <View style={styles.field}>
            <Label nativeID="grace-weeks">Grace weeks</Label>
            <Input
              value={veteranWeeks}
              onChangeText={setVeteranWeeks}
              keyboardType="number-pad"
              aria-labelledby="grace-weeks"
            />
            <Text style={styles.hint}>
              Carries prior season reward tier only, not XP or rank.
            </Text>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enabled</Text>
            <Switch value={veteranEnabled} onValueChange={setVeteranEnabled} />
          </View>
          <ThemedButton
            label={saving ? 'Saving' : 'Save settings'}
            onPress={saveConfig}
            disabled={saving}
            style={styles.cardAction}
          />
        </ConfigCard>

        <ConfigCard cardStyle={styles.cardBox}>
          <Text style={styles.cardTitle}>New season</Text>
          <View style={styles.field}>
            <Label nativeID="season-name">Season name</Label>
            <Input
              value={newSeasonName}
              onChangeText={setNewSeasonName}
              placeholder="Season name"
              aria-labelledby="season-name"
            />
          </View>
          <ThemedButton
            label="Create and activate"
            variant="outline"
            onPress={createSeason}
            style={styles.cardAction}
          />
        </ConfigCard>

        {seasons.length > 0 ? (
          <ConfigCard cardStyle={styles.cardBox}>
            <Text style={styles.cardTitle}>All seasons</Text>
            <View style={styles.seasonList}>
              {seasons.map((s) => (
                <Text key={s.id} style={styles.seasonRow}>
                  {s.name}, {s.status}, {s.startDate}
                </Text>
              ))}
            </View>
          </ConfigCard>
        ) : null}
      </View>
    </ScrollView>
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
      gap: SPACING.md,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
    cardBox: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    cardTitle: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.body,
      marginBottom: SPACING.sm,
    },
    bodyText: {
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.sm,
    },
    muted: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    field: {
      gap: SPACING.xs,
    },
    hint: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: TYPOGRAPHY.caption * 1.45,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: SPACING.xs,
    },
    switchLabel: {
      flex: 1,
      paddingRight: SPACING.sm,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    cardAction: {
      marginTop: SPACING.sm,
    },
    seasonList: {
      gap: SPACING.xs,
    },
    seasonRow: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: TYPOGRAPHY.caption * 1.45,
    },
    dangerBtn: {
      borderWidth: 1.5,
      borderColor: '#c0392b',
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.sm,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerBtnText: {
      color: '#c0392b',
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
  })
