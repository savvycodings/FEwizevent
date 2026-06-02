import { useContext, useMemo } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import { AppIcon } from '../ui/app-icon'
import { deckIconForId } from '@/constants/deckIcons'

type DeckIconProps = {
  deckId: string | null | undefined
  size?: number
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

export function DeckIcon({ deckId, size = 28, style, accessibilityLabel }: DeckIconProps) {
  const { theme } = useContext(ThemeContext)
  const Icon = useMemo(() => deckIconForId(deckId), [deckId])

  if (!Icon) {
    return (
      <View
        style={[styles.fallback, { width: size, height: size, borderRadius: size / 4 }, style]}
        accessibilityLabel={accessibilityLabel ?? 'Deck'}
      >
        <AppIcon name="layout-grid" size={Math.round(size * 0.55)} color={theme.mutedForegroundColor} />
      </View>
    )
  }

  return (
    <View
      style={[styles.box, { width: size, height: size }, style]}
      accessibilityLabel={accessibilityLabel}
    >
      <Icon width={size} height={size} />
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
})
