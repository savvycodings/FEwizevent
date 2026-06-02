import { ReactNode, useContext } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { ThemeContext } from '../../context'
import { cn } from '@/lib/utils'
import { Card } from './card'
import { PremiumRim } from './PremiumRim'
import { RADIUS, SPACING } from '../../constants/layout'

interface ThemedCardProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  premiumRim?: boolean
}

export function ThemedCard({ children, style, premiumRim = false }: ThemedCardProps) {
  const { theme } = useContext(ThemeContext)

  if (premiumRim) {
    return (
      <PremiumRim
        borderRadius={RADIUS.lg}
        accentColor={theme.tintColor}
        innerBackgroundColor={theme.cardBackground}
        style={style}
      >
        <Card className="gap-0 border-0 bg-transparent py-0 shadow-none">
          <View style={{ padding: SPACING.cardPadding }}>{children}</View>
        </Card>
      </PremiumRim>
    )
  }

  return (
    <Card className={cn('gap-0')} style={style}>
      <View style={{ padding: SPACING.cardPadding }}>{children}</View>
    </Card>
  )
}
