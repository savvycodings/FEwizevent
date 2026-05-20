import { useContext } from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'

type EmptyStateProps = {
  message: string
  title?: string
  /** Optional muted band behind copy — single surface, no second stroke. */
  variant?: 'plain' | 'mutedBand'
  style?: StyleProp<ViewStyle>
}

export function EmptyState({
  message,
  title,
  variant = 'plain',
  style,
}: EmptyStateProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, variant)

  return (
    <View style={[styles.wrap, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

function getStyles(theme: any, variant: 'plain' | 'mutedBand') {
  const band =
    variant === 'mutedBand'
      ? {
          backgroundColor: theme.surfaceMuted ?? theme.buttonBackground,
          borderRadius: 12,
          paddingVertical: SPACING.xl,
          paddingHorizontal: SPACING.lg,
        }
      : {
          paddingVertical: SPACING.lg,
          paddingHorizontal: 0,
        }

  return StyleSheet.create({
    wrap: {
      alignSelf: 'stretch',
      ...band,
    },
    title: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.sm,
      lineHeight: TYPOGRAPHY.bodySmall * 1.35,
      textAlign: 'left',
    },
    message: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'left',
      lineHeight: TYPOGRAPHY.body * 1.45,
    },
  })
}
