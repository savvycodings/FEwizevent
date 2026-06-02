import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'

type RankSummaryRowProps = {
  badgeSource: ImageSourcePropType
  title: string
  subtitle: string
  trailingValue?: string
  trailingLabel?: string
  badgeSize?: number
}

export function RankSummaryRow({
  badgeSource,
  title,
  subtitle,
  trailingValue,
  trailingLabel = 'XP',
  badgeSize = 48,
}: RankSummaryRowProps) {
  return (
    <View style={styles.row}>
      <Image
        source={badgeSource}
        style={{ width: badgeSize, height: badgeSize }}
        resizeMode="contain"
      />
      <View style={styles.copy}>
        <Text className="text-lg font-bold text-foreground">{title}</Text>
        <Text variant="muted" className="mt-1">
          {subtitle}
        </Text>
      </View>
      {trailingValue != null ? (
        <View style={styles.trailing}>
          <Text className="text-xl font-bold text-primary" style={styles.trailingValue}>
            {trailingValue}
          </Text>
          <Text variant="muted" className="text-xs" style={styles.trailingLabel}>
            {trailingLabel}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  trailing: {
    alignItems: 'center',
    minWidth: 56,
  },
  trailingValue: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  trailingLabel: {
    alignSelf: 'stretch',
    textAlign: 'center',
    marginTop: 2,
  },
})
