import { useContext } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import { RADIUS, SPACING, TYPOGRAPHY } from '../../constants/layout'

export type ConnectedTabOption<T extends string> = {
  value: T
  label: string
}

type ConnectedTabPillsProps<T extends string> = {
  options: ConnectedTabOption<T>[]
  value: T
  onChange: (value: T) => void
  style?: StyleProp<ViewStyle>
  accessibilityLabelPrefix?: string
}

/** Connected pill strip — matches Manage Event (Players / Board / Awards / Setup). */
export function ConnectedTabPills<T extends string>({
  options,
  value,
  onChange,
  style,
  accessibilityLabelPrefix = 'Select',
}: ConnectedTabPillsProps<T>) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={[styles.row, style]}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${accessibilityLabelPrefix} ${opt.label}`}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.full,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      padding: 2,
    },
    pill: {
      flex: 1,
      minHeight: 36,
      borderRadius: 0,
      borderWidth: 0,
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.xs,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      position: 'relative',
      overflow: 'visible',
    },
    pillInactive: {
      borderColor: 'transparent',
      zIndex: 1,
    },
    pillActive: {
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: RADIUS.full,
      marginHorizontal: 1,
      backgroundColor: theme.tintColor,
      zIndex: 2,
      elevation: 2,
    },
    pillText: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    pillTextActive: {
      color: '#000',
    },
  })
