import { useContext } from 'react'
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { RADIUS, SPACING, TYPOGRAPHY } from '../../constants/layout'

interface ListRowCardProps {
  title: string
  subtitle?: string
  iconName?: keyof typeof Ionicons.glyphMap
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

export function ListRowCard({
  title,
  subtitle,
  iconName = 'chevron-forward',
  onPress,
  style,
}: ListRowCardProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <TouchableOpacity style={[styles.row, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name={iconName} size={18} color={theme.mutedForegroundColor} />
    </TouchableOpacity>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    row: {
      backgroundColor: theme.surfaceMuted ?? theme.cardBackground,
      borderColor: theme.borderColor,
      borderWidth: 1,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.cardPadding,
      paddingVertical: SPACING.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    left: {
      flex: 1,
      paddingRight: SPACING.md,
    },
    title: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.body,
    },
    subtitle: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      marginTop: SPACING.xs,
      fontSize: TYPOGRAPHY.bodySmall,
    },
  })
