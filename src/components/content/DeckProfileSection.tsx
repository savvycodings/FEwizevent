import { useCallback, useContext, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { DeckPieChart } from '@/components/charts/DeckPieChart'
import { deckPieColor } from '@/components/charts/deckPieColors'
import type { DeckRadarStat } from '@/components/charts/deckRadarAxes'
import { DeckPicker } from '@/components/content/DeckPicker'
import { RainSpinner } from '@/components/ui/rain-spinner'
import { Text } from '@/components/ui/text'
import { ThemeContext } from '../../context'
import { apiRequest } from '@/api'
import { SPACING } from '@/constants/layout'

type DeckProfileResponse = {
  activeDeckId: string | null
  activeDeckLabel: string | null
  catalog: { id: string; label: string }[]
  stats: DeckRadarStat[]
}

type DeckProfileSectionProps = {
  userId: number
}

export function DeckProfileSection({ userId }: DeckProfileSectionProps) {
  const { theme } = useContext(ThemeContext)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<DeckProfileResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiRequest<DeckProfileResponse>(`/auth/deck-profile?userId=${userId}`)
      setProfile(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load deck stats')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function saveDeck(deckId: string) {
    try {
      setSaving(true)
      const res = await apiRequest<DeckProfileResponse>('/auth/active-deck', {
        method: 'PATCH',
        body: JSON.stringify({ userId, deckId }),
      })
      setProfile(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save deck')
    } finally {
      setSaving(false)
    }
  }

  const pieSlices = useMemo(
    () =>
      (profile?.stats ?? [])
        .filter((s) => s.events > 0)
        .map((s, i) => ({
          label: s.label,
          value: s.events,
          color: deckPieColor(i),
        })),
    [profile?.stats]
  )

  if (loading) {
    return <RainSpinner size={24} color={theme.tintColor} style={{ paddingVertical: SPACING.xl }} />
  }

  if (error && !profile) {
    return (
      <Text variant="muted" className="text-center">
        {error}
      </Text>
    )
  }

  return (
    <View>
      <DeckPicker
        variant="profile"
        value={profile?.activeDeckId ?? null}
        onChange={saveDeck}
        label="Current deck"
        showFieldLabel={false}
        placeholder="Tap to choose deck"
        disabled={saving}
      />
      {saving ? (
        <RainSpinner size={22} color={theme.tintColor} style={{ marginTop: SPACING.md }} />
      ) : null}
      <DeckPieChart
        data={pieSlices}
        centerLabel="Events"
        className="mt-4"
      />
    </View>
  )
}
