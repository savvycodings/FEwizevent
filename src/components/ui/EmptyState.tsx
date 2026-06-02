import { StyleProp, View, ViewStyle } from 'react-native'
import { cn } from '@/lib/utils'
import { Text } from './text'

type EmptyStateProps = {
  message: string
  title?: string
  variant?: 'plain' | 'mutedBand'
  style?: StyleProp<ViewStyle>
  className?: string
}

export function EmptyState({
  message,
  title,
  variant = 'plain',
  style,
  className,
}: EmptyStateProps) {
  return (
    <View
      className={cn(
        'self-stretch',
        variant === 'mutedBand' && 'bg-muted rounded-xl px-5 py-6',
        variant === 'plain' && 'py-4',
        className
      )}
      style={style}
    >
      {title ? (
        <Text variant="small" className="text-foreground mb-2">
          {title}
        </Text>
      ) : null}
      <Text variant="muted" className="leading-6">
        {message}
      </Text>
    </View>
  )
}
