import { StyleSheet, View } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../../context'
import { SPACING } from '../../constants/layout'
import { ThemedCard } from '../ui/ThemedCard'
import { Text } from '../ui/text'

export type MetricColumnItem = {
  id: string
  label: string
  value: string | number
}

type MetricColumnsProps = {
  items: MetricColumnItem[]
  premiumRim?: boolean
  referenceLabel?: string
}

export function MetricColumns({ items, premiumRim = false, referenceLabel }: MetricColumnsProps) {
  const { theme } = useContext(ThemeContext)

  return (
    <ThemedCard premiumRim={premiumRim}>
      {referenceLabel ? (
        <Text variant="muted" className="mb-3 text-xs">
          {referenceLabel}
        </Text>
      ) : null}
      <View style={styles.row}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.cell,
              index > 0
                ? {
                    borderLeftWidth: StyleSheet.hairlineWidth * 2,
                    borderLeftColor: theme.dividerColor ?? theme.borderColor,
                    paddingLeft: SPACING.sm,
                  }
                : { paddingRight: SPACING.sm },
            ]}
          >
            <Text variant="muted" className="text-xs" numberOfLines={2}>
              {item.label}
            </Text>
            <Text className="mt-1 text-lg font-bold text-foreground">{String(item.value)}</Text>
          </View>
        ))}
      </View>
    </ThemedCard>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  cell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
})
