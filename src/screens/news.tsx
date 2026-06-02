import { useContext } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ThemeContext } from '../context'
import { AppIcon, ScreenHero, ScreenSurface, Surface, ToolbarRow } from '../components'
import { rowGrow } from '../components/layout/PressableRow'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { newsPosts, type NewsPost } from '../data/newsPosts'

export function News({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  function openPost(post: NewsPost) {
    navigation.navigate('NewsPost', { post })
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHero
        title="News"
        subtitle="Launches, restocks, and tournaments at the shop."
      />

      <ScreenSurface>
        {newsPosts.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => openPost(item)}
            style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Read ${item.title}`}
          >
            <Surface
              style={[styles.card, index === 0 ? styles.cardFeatured : null]}
              padding="lg"
            >
              <View style={styles.cardTop}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Text style={styles.dateText}>{item.dateLabel}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.excerpt} numberOfLines={2}>
                {item.excerpt}
              </Text>
              <ToolbarRow style={styles.readRow}>
                <Text style={[rowGrow.text, styles.readMore]} numberOfLines={1}>
                  Read article
                </Text>
                <View style={rowGrow.end}>
                  <AppIcon name="chevron-right" size={18} color={theme.tintColor} />
                </View>
              </ToolbarRow>
            </Surface>
          </Pressable>
        ))}
      </ScreenSurface>
    </ScrollView>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      paddingBottom: SPACING['4xl'],
    },
    cardPressable: {
      marginBottom: SPACING.sm,
    },
    cardPressed: {
      opacity: 0.88,
    },
    card: {
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    cardFeatured: {
      borderColor: theme.tintColor,
      borderWidth: 1.5,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.sm,
      gap: SPACING.sm,
    },
    categoryPill: {
      backgroundColor: theme.infoBackground ?? theme.surfaceMuted,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    categoryText: {
      color: theme.infoTextColor ?? theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.caption,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dateText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.caption,
      flexShrink: 1,
      textAlign: 'right',
    },
    title: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      lineHeight: TYPOGRAPHY.h4 * 1.2,
      marginBottom: SPACING.xs,
    },
    excerpt: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.45,
      marginBottom: SPACING.md,
    },
    readRow: {},
    readMore: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
  })
