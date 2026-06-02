import { useCallback, useContext, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { DeckRadarChart } from '@/components/charts/DeckRadarChart'
import type { DeckRadarStat } from '@/components/charts/deckRadarAxes'
import { ThemeContext } from '../../context'
import { apiRequest } from '@/api'
import { SPACING } from '@/constants/layout'

type DeckMetaResponse = {
  stats: DeckRadarStat[]
  totalEvents: number
}

export function CommunityDeckMetaSection() {
  const { theme } = useContext(ThemeContext)
  const [stats, setStats] = useState<DeckRadarStat[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiRequest<DeckMetaResponse>('/auth/deck-meta')
      setStats(Array.isArray(res.stats) ? res.stats : [])
    } catch {
      setStats([])
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  if (loading) {
    return <ActivityIndicator color={theme.tintColor} style={{ paddingVertical: SPACING.xl }} />
  }

  return (
    <View>
      <DeckRadarChart stats={stats} variant="community" color={theme.tintColor} />
    </View>
  )
}
