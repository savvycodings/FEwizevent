import { useCallback, useContext, useState } from 'react'
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { ThemeContext } from '../context'
import { ThemedCard, CardCaption } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type RankingRow = {
  id: number
  name: string
  rank: string
  xp: number
}

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
        <Text style={[style, stylesForGradient.hidden]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  )
}

const stylesForGradient = StyleSheet.create({
  hidden: { opacity: 0 },
})

export function RankingLeaderboard() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const navigation = useNavigation<any>()
  const [rows, setRows] = useState<RankingRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const res = await apiRequest<{ rankings: RankingRow[] }>('/admin/rankings')
      setRows(Array.isArray(res.rankings) ? res.rankings : [])
    } catch {
      setError('Could not load rankings')
      setRows([])
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />
      <View style={styles.surface}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {rows.map((row, index) => (
          <Pressable
            key={row.id}
            onPress={() =>
              navigation.navigate('PlayerSnapshot', { userId: row.id, userName: row.name })
            }
            style={({ pressed }) => [pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel={`View stats for ${row.name}`}
          >
          <ThemedCard premiumRim={index < 3} style={styles.rowCard}>
            <CardCaption caption={`${row.rank} · ${row.xp} XP`}>
              <View style={styles.rowInner}>
                <MedalGradientText
                  place={index + 1}
                  text={`#${index + 1}`}
                  style={[styles.place, index < 3 ? styles.topPlace : null]}
                />
                <View style={styles.rowMain}>
                  <MedalGradientText
                    place={index + 1}
                    text={row.name}
                    style={[styles.name, index < 3 ? styles.topName : null]}
                  />
                </View>
              </View>
            </CardCaption>
          </ThemedCard>
          </Pressable>
        ))}
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
    errorText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    },
    rowCard: { marginBottom: SPACING.md },
    rowPressed: { opacity: 0.88 },
    rowInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    place: { color: theme.tintColor, fontFamily: theme.boldFont, fontSize: TYPOGRAPHY.h4, minWidth: 34 },
    topPlace: {
      fontSize: Math.round(TYPOGRAPHY.h4 * 1.1),
      textShadowColor: 'rgba(255,255,255,0.22)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 6,
    },
    rowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: SPACING.md,
    },
    name: { color: theme.textColor, fontFamily: theme.boldFont, fontSize: TYPOGRAPHY.body, textAlign: 'left', flex: 1 },
    topName: {
      fontSize: Math.round(TYPOGRAPHY.body * 1.1),
      textShadowColor: 'rgba(255,255,255,0.2)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 5,
    },
  })
