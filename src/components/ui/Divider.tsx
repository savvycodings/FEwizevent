import { View } from 'react-native'
import { cn } from '@/lib/utils'
import { SPACING } from '../../constants/layout'
import { Separator } from './separator'

type DividerProps = {
  spacing?: keyof typeof SPACING
  inset?: number
  faint?: boolean
}

const spacingClass: Partial<Record<keyof typeof SPACING, string>> = {
  xs: 'my-1',
  sm: 'my-2',
  md: 'my-3',
  lg: 'my-4',
  xl: 'my-5',
  '2xl': 'my-6',
  sectionGap: 'my-6',
  sectionTitleBottom: 'my-3',
  cardPadding: 'my-4',
  containerPadding: 'my-4',
  headerPadding: 'my-3',
}

export function Divider({ spacing = 'md', inset = 0, faint = false }: DividerProps) {
  return (
    <View
      style={inset ? { marginHorizontal: inset } : undefined}
      className={cn('self-stretch', spacingClass[spacing] ?? spacingClass.md)}
    >
      <Separator className={cn(faint && 'opacity-45')} />
    </View>
  )
}
