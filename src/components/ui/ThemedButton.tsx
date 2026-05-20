import { ReactNode, useContext } from 'react'
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native'
import { ThemeContext } from '../../context'
import { RADIUS, SPACING, TYPOGRAPHY } from '../../constants/layout'
import { PremiumRim } from './PremiumRim'

interface ThemedButtonProps {
  label: string
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  style?: StyleProp<ViewStyle>
  leftIcon?: ReactNode
  disabled?: boolean
  premiumRim?: boolean
}

export function ThemedButton({
  label,
  onPress,
  variant = 'primary',
  style,
  leftIcon,
  disabled,
  premiumRim = true,
}: ThemedButtonProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  const innerBg =
    variant === 'primary'
      ? theme.tintColor
      : variant === 'secondary'
        ? theme.buttonBackground
        : 'transparent'

  const buttonEl = (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        premiumRim && styles.buttonFullWidth,
        disabled && styles.disabled,
      ]}
    >
      {leftIcon}
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.primaryLabel,
          variant !== 'primary' && styles.secondaryLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )

  if (!premiumRim) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          variant === 'primary' && styles.primary,
          variant === 'secondary' && styles.secondary,
          variant === 'outline' && styles.outline,
          disabled && styles.disabled,
          style,
        ]}
      >
        {leftIcon}
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.primaryLabel,
            variant !== 'primary' && styles.secondaryLabel,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <PremiumRim
      borderRadius={RADIUS.full}
      accentColor={theme.tintColor}
      innerBackgroundColor={innerBg}
      style={style}
    >
      {buttonEl}
    </PremiumRim>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    button: {
      borderRadius: RADIUS.full,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    primary: {
      backgroundColor: theme.tintColor,
      borderColor: theme.tintColor,
    },
    secondary: {
      backgroundColor: theme.buttonBackground,
      borderColor: theme.borderColor,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.borderColor,
    },
    buttonNoBorder: {
      borderWidth: 0,
    },
    buttonFullWidth: {
      width: '100%',
      alignSelf: 'stretch',
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.boldFont,
    },
    primaryLabel: {
      color: theme.tintTextColor,
    },
    secondaryLabel: {
      color: theme.textColor,
    },
  })
