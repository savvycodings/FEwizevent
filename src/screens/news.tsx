import { useContext } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { Surface } from '../components'
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
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>News</Text>
        <Text style={styles.heroSubtitle}>Launches, restocks, and tournaments at the shop.</Text>
      </View>

      <View style={styles.surface}>
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
              <View style={styles.readRow}>
                <Text style={styles.readMore}>Read article</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.tintColor} />
              </View>
            </Surface>
          </Pressable>
        ))}
      </View>
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
    hero: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING['2xl'],
      paddingBottom: SPACING['3xl'],
    },
    heroTitle: {
      color: theme.backgroundColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
    },
    heroSubtitle: {
      marginTop: SPACING.sm,
      color: theme.backgroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      opacity: 0.92,
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
    },
    surface: {
      marginTop: -SPACING['2xl'],
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
      gap: SPACING.md,
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
    readRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    readMore: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
  })
