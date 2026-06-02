import { ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { cn } from '@/lib/utils'
import { Card } from './card'

type SurfaceVariant = 'default' | 'muted' | 'ghost'
type SurfacePadding = 'default' | 'none' | 'sm' | 'lg'

type SurfaceProps = {
  children: ReactNode
  variant?: SurfaceVariant
  style?: StyleProp<ViewStyle>
  padding?: SurfacePadding
  className?: string
}

const paddingClass: Record<SurfacePadding, string> = {
  none: 'gap-0 p-0',
  sm: 'gap-0 p-3',
  default: 'gap-0 p-4',
  lg: 'gap-0 p-5',
}

export function Surface({
  children,
  variant = 'default',
  style,
  padding = 'default',
  className,
}: SurfaceProps) {
  return (
    <Card
      className={cn(
        paddingClass[padding],
        variant === 'muted' && 'border-border bg-card border',
        variant === 'ghost' && 'border-0 bg-transparent shadow-none',
        className
      )}
      style={style}
    >
      {children}
    </Card>
  )
}
