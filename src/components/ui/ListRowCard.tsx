import { StyleProp, View, ViewStyle } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../../context'
import { ToolbarRow } from '@/components/layout/ToolbarRow'
import { rowGrow } from '@/components/layout/PressableRow'
import { cn } from '@/lib/utils'
import { Card } from './card'
import { Text } from './text'
import { Pressable } from 'react-native'
import { AppIcon, type AppIconName } from './app-icon'

interface ListRowCardProps {
  title: string
  subtitle?: string
  iconName?: AppIconName
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  className?: string
}

export function ListRowCard({
  title,
  subtitle,
  iconName = 'chevron-right',
  onPress,
  style,
  className,
}: ListRowCardProps) {
  const { theme } = useContext(ThemeContext)

  return (
    <Pressable
      onPress={onPress}
      className={cn('mb-3 w-full active:opacity-80', className)}
      style={style}
    >
      <Card className="border px-4 py-4">
        <ToolbarRow>
          <View style={rowGrow.slot}>
            <Text className="font-semibold" numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="muted" className="mt-1" numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={rowGrow.end}>
            <AppIcon name={iconName} size={18} color={theme.mutedForegroundColor} />
          </View>
        </ToolbarRow>
      </Card>
    </Pressable>
  )
}
