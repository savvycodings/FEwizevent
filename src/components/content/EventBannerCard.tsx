import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useContext } from 'react'
import { BlurView } from 'expo-blur'
import { ThemeContext } from '../../context'
import { BRAND } from '../../constants/brandColors'
import { RADIUS, SPACING, TYPOGRAPHY } from '../../constants/layout'

export type EventBannerCardProps = {
  title: string
  dateLabel: string
  locationLabel: string
  bannerImageUrl?: string | null
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

export function EventBannerCard({
  title,
  dateLabel,
  locationLabel,
  bannerImageUrl,
  onPress,
  style,
}: EventBannerCardProps) {
  const { theme } = useContext(ThemeContext)
  const hasBanner = Boolean(bannerImageUrl)

  return (
    <Pressable
      style={[styles.outer, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
    >
      {hasBanner ? (
        <>
          <Image
            source={{ uri: bannerImageUrl! }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.scrim} pointerEvents="none" />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.tintColor }]} />
      )}
      <View style={styles.content}>
        <Text style={hasBanner ? styles.titleOnImage : styles.titleFallback}>
          {title}
        </Text>
        <Text style={hasBanner ? styles.metaOnImage : styles.metaFallback}>{dateLabel}</Text>
        <Text style={hasBanner ? styles.metaOnImage : styles.metaFallback}>{locationLabel}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    minHeight: 128,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'transparent',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.imageScrim,
  },
  content: {
    flex: 1,
    minHeight: 128,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    justifyContent: 'flex-end',
  },
  titleOnImage: {
    color: BRAND.onImageText,
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  titleFallback: {
    color: BRAND.onImageText,
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
  },
  metaOnImage: {
    marginTop: SPACING.xs,
    color: BRAND.onImageTextMuted,
    fontSize: TYPOGRAPHY.bodySmall,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaFallback: {
    marginTop: SPACING.xs,
    color: BRAND.onImageTextMuted,
    fontSize: TYPOGRAPHY.bodySmall,
  },
})
