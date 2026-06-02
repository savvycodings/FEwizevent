import { useContext } from 'react'
import { View, type TextInputProps } from 'react-native'
import { ThemeContext } from '../../context'
import { cn } from '@/lib/utils'
import { controlSurfaceClass, controlSurfaceInsetClass } from '@/constants/controlSurface'
import { ToolbarRow } from '@/components/layout/ToolbarRow'
import { rowGrow } from '@/components/layout/PressableRow'
import { Input } from './input'
import { AppIcon } from './app-icon'

type SearchFieldProps = TextInputProps & {
  containerClassName?: string
}

export function SearchField({
  className,
  containerClassName,
  ...props
}: SearchFieldProps) {
  const { theme } = useContext(ThemeContext)

  return (
    <View className={cn(controlSurfaceClass, controlSurfaceInsetClass, containerClassName)}>
      <ToolbarRow>
        <AppIcon name="search" size={18} color={theme.mutedForegroundColor} />
        <Input
          className={cn(
            'h-10 min-h-0 border-0 bg-transparent px-0 py-0 shadow-none',
            className
          )}
          style={rowGrow.text}
          {...props}
        />
      </ToolbarRow>
    </View>
  )
}
