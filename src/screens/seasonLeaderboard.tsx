import { useContext, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { SeasonLeaderboard } from '../components/content/SeasonLeaderboard'
import { ScreenHero, ScreenSurface, SearchField } from '../components'
import { ThemeContext } from '../context'
import { SPACING } from '../constants/layout'

export function SeasonLeaderboardScreen() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [query, setQuery] = useState('')

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHero
        title="Season ladder"
        subtitle="Full season standings for all players."
      />

      <ScreenSurface style={{ gap: SPACING.md }}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search players"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          containerClassName="rounded-xl border border-border bg-card px-3"
        />
        <SeasonLeaderboard mode="combined" searchQuery={query} />
      </ScreenSurface>
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
  })
