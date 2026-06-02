import { useContext } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import {
  HOME_STORE_LABEL,
  HOME_STORE_ORDER,
  type HomeStore,
} from '../../constants/stores'
import { RADIUS, SPACING, TYPOGRAPHY } from '../../constants/layout'

type HomeStoreTabsProps = {
  value: HomeStore
  onChange: (store: HomeStore) => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function HomeStoreTabs({ value, onChange, disabled, style }: HomeStoreTabsProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={[styles.row, style]}>
      {HOME_STORE_ORDER.map((store) => {
        const active = value === store
        return (
          <Pressable
            key={store}
            disabled={disabled}
            onPress={() => onChange(store)}
            style={[
              styles.btn,
              active ? styles.btnActive : styles.btnInactive,
              disabled && styles.btnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: !!disabled }}
            accessibilityLabel={`Select ${HOME_STORE_LABEL[store]}`}
          >
            <Text
              style={[styles.label, active ? styles.labelActive : styles.labelInactive]}
              numberOfLines={1}
            >
              {HOME_STORE_LABEL[store]}
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
      gap: SPACING.sm,
    },
    btn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
      borderRadius: RADIUS.full,
      borderWidth: 1.5,
    },
    btnActive: {
      backgroundColor: theme.tintColor,
      borderColor: theme.tintColor,
    },
    btnInactive: {
      backgroundColor: 'transparent',
      borderColor: theme.borderColor,
    },
    btnDisabled: {
      opacity: 0.55,
    },
    label: {
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    labelActive: {
      color: '#000',
    },
    labelInactive: {
      color: theme.textColor,
    },
  })
