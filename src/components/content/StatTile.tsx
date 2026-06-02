import type { ReactNode } from 'react'
import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../../context'
import { RADIUS, SPACING } from '../../constants/layout'
import { Text } from '../ui/text'

type StatTileProps = {
  label: string
  value: string
  icon?: ImageSourcePropType
  /** Vector or custom icon node (takes precedence over `icon`) */
  iconNode?: ReactNode
  accentColor?: string
  onPress?: () => void
  accessibilityLabel?: string
}

export function StatTile({
  label,
  value,
  icon,
  iconNode,
  accentColor,
  onPress,
  accessibilityLabel,
}: StatTileProps) {
  const { theme } = useContext(ThemeContext)
  const borderColor = accentColor ? `${accentColor}55` : theme.borderColor

  const inner = (
    <View
      style={[
        styles.inner,
        { borderColor, backgroundColor: theme.cardBackground ?? theme.backgroundColor },
      ]}
    >
      {iconNode ? (
        <View style={styles.iconSlot}>{iconNode}</View>
      ) : icon ? (
        <Image source={icon} style={styles.icon} resizeMode="contain" />
      ) : null}
      <Text className="w-full text-center text-2xl font-bold text-foreground">{value}</Text>
      <View style={styles.labelSlot}>
        <Text
          variant="small"
          className="text-center text-foreground"
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </View>
  )

  if (!onPress) {
    return <View style={styles.fill}>{inner}</View>
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.fill, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {inner}
    </Pressable>
  )
}

const TILE_MIN_HEIGHT = 116

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.92,
  },
  inner: {
    width: '100%',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    minHeight: TILE_MIN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 28,
    height: 28,
    marginBottom: SPACING.xs,
  },
  iconSlot: {
    width: 28,
    height: 28,
    marginBottom: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelSlot: {
    width: '100%',
    minHeight: 34,
    marginTop: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
