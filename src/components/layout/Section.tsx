import { ReactNode } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { cn } from '@/lib/utils'
import { Text } from '@/components/ui/text'
import { Divider } from '../ui/Divider'
import { ToolbarRow } from './ToolbarRow'
import { rowGrow } from './PressableRow'

interface SectionProps {
  title: string
  subtitle?: string
  onPressSeeAll?: () => void
  /** Trailing control on the title row (e.g. help button). Shown when `onPressSeeAll` is not set. */
  headerTrailing?: ReactNode
  children: ReactNode
  compactTopSpacing?: boolean
  /** When false, no rule under the header (e.g. tight stacks). Default true. */
  showDivider?: boolean
  /** Uses h3 sizing instead of default h4. */
  largeTitle?: boolean
  /** No top margin; parent controls vertical rhythm (e.g. surface gap). */
  embedded?: boolean
}

export function Section({
  title,
  subtitle,
  onPressSeeAll,
  headerTrailing,
  children,
  compactTopSpacing = false,
  showDivider = true,
  largeTitle = false,
  embedded = false,
}: SectionProps) {
  return (
    <View
      className={cn(
        !embedded && (compactTopSpacing ? 'mt-4' : 'mt-6'),
        embedded && 'mt-0'
      )}
    >
      <View className="mb-3">
        <ToolbarRow>
          <Text
            variant={largeTitle ? 'h3' : 'h4'}
            style={rowGrow.text}
            className="text-foreground"
            numberOfLines={1}
          >
            {title}
          </Text>
          {onPressSeeAll ? (
            <TouchableOpacity onPress={onPressSeeAll} style={rowGrow.end}>
              <Text variant="muted" className="underline">
                View All
              </Text>
            </TouchableOpacity>
          ) : headerTrailing ? (
            <View style={rowGrow.end}>{headerTrailing}</View>
          ) : null}
        </ToolbarRow>
        {subtitle ? (
          <Text variant="muted" className="mt-1">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showDivider ? <Divider spacing="sm" /> : null}
      {children}
    </View>
  )
}
