import { ReactNode, useContext } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from './button'
import { Text } from './text'
import { PremiumRim } from './PremiumRim'
import { RADIUS } from '../../constants/layout'

interface ThemedButtonProps {
  label: string
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  style?: StyleProp<ViewStyle>
  leftIcon?: ReactNode
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg'
  /** When false, button sizes to label instead of stretching full width. */
  fullWidth?: boolean
  /** Gradient accent rim — off by default; use standard bordered black fill. */
  premiumRim?: boolean
}

const variantMap: Record<
  NonNullable<ThemedButtonProps['variant']>,
  NonNullable<ButtonProps['variant']>
> = {
  primary: 'outline',
  secondary: 'secondary',
  outline: 'outline',
}

export function ThemedButton({
  label,
  onPress,
  variant = 'primary',
  style,
  leftIcon,
  disabled,
  size = 'default',
  fullWidth = true,
  premiumRim = false,
}: ThemedButtonProps) {
  const { theme } = useContext(ThemeContext)
  const buttonVariant = variantMap[variant]

  const button = (
    <Button
      onPress={onPress}
      disabled={disabled}
      variant={premiumRim ? 'ghost' : buttonVariant}
      size={size}
      className={cn(
        fullWidth ? 'w-full' : 'w-auto shrink-0',
        'border-border bg-card',
        premiumRim && 'border-0 bg-transparent shadow-none'
      )}
      style={!premiumRim ? style : undefined}
    >
      {leftIcon}
      <Text
        className={cn(
          variant === 'primary' && !premiumRim && 'font-semibold text-primary',
          premiumRim && variant === 'primary' && 'text-primary-foreground',
          premiumRim && variant !== 'primary' && 'text-foreground'
        )}
      >
        {label}
      </Text>
    </Button>
  )

  if (!premiumRim) {
    return button
  }

  const innerBg =
    variant === 'primary'
      ? theme.tintColor
      : variant === 'secondary'
        ? theme.buttonBackground
        : 'transparent'

  return (
    <PremiumRim
      borderRadius={RADIUS.full}
      accentColor={theme.tintColor}
      innerBackgroundColor={innerBg}
      style={style}
    >
      {button}
    </PremiumRim>
  )
}
