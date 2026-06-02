import { useContext } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import { RADIUS, SPACING, TYPOGRAPHY } from '../../constants/layout'

export type SegmentedTabOption<T extends string> = {
  value: T
  label: string
}

type SegmentedTabsProps<T extends string> = {
  options: SegmentedTabOption<T>[]
  value: T
  onChange: (value: T) => void
  style?: StyleProp<ViewStyle>
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedTabsProps<T>) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={[styles.shell, style]}>
      {options.map((opt, index) => {
        const active = opt.value === value
        const showDivider = index > 0
        return (
          <View key={opt.value} style={styles.segmentSlot}>
            {showDivider ? <View style={styles.divider} accessibilityElementsHidden /> : null}
            <Pressable
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [
                styles.segment,
                active ? styles.segmentActive : styles.segmentInactive,
                pressed && styles.segmentPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  active ? styles.segmentLabelActive : styles.segmentLabelInactive,
                ]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    shell: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.xl,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      padding: SPACING.xs,
      gap: 0,
    },
    segmentSlot: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
      minWidth: 0,
    },
    divider: {
      width: 1,
      alignSelf: 'stretch',
      marginVertical: SPACING.xs,
      backgroundColor: theme.borderColor,
    },
    segment: {
      flex: 1,
      minHeight: 44,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
    },
    segmentInactive: {
      borderColor: theme.borderColor,
      backgroundColor: theme.backgroundColor,
    },
    segmentActive: {
      borderColor: theme.tintColor,
      backgroundColor: theme.tintColor,
    },
    segmentPressed: {
      opacity: 0.9,
    },
    segmentLabel: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.semiBoldFont,
      textAlign: 'center',
    },
    segmentLabelInactive: {
      color: theme.textColor,
    },
    segmentLabelActive: {
      color: theme.tintTextColor ?? theme.backgroundColor,
    },
  })
