import { useContext } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { ThemeContext } from '../context'
import { Divider, Surface, ThemedCard } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { getNewsPost, type NewsPost } from '../data/newsPosts'

export function NewsPostScreen() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const route = useRoute<any>()
  const post = (route.params?.post as NewsPost | undefined) ?? getNewsPost(route.params?.postId)

  if (!post) {
    return (
      <View style={styles.missingWrap}>
        <Text style={styles.missingText}>This post could not be found.</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{post.category}</Text>
        </View>
        <Text style={styles.heroTitle}>{post.title}</Text>
        <Text style={styles.heroDate}>{post.dateLabel}</Text>
      </View>

      <View style={styles.surface}>
        {post.highlights && post.highlights.length > 0 ? (
          <ThemedCard premiumRim style={styles.highlightsCard}>
            <Text style={styles.highlightsHeading}>At a glance</Text>
            {post.highlights.map((line) => (
              <View key={line} style={styles.highlightRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.highlightText}>{line}</Text>
              </View>
            ))}
          </ThemedCard>
        ) : null}

        <Text style={styles.bodyHeading}>Details</Text>
        {post.body.map((paragraph, i) => (
          <Text key={`${post.id}-p-${i}`} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <Divider faint spacing="lg" />
        <Surface variant="muted" padding="lg" style={styles.footerBox}>
          <Text style={styles.footerNote}>
            Questions? Ask staff in store or check the Events tab for related tournaments.
          </Text>
        </Surface>
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
      paddingTop: SPACING.xl,
      paddingBottom: SPACING['3xl'],
    },
    categoryPill: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      marginBottom: SPACING.md,
    },
    categoryText: {
      color: theme.backgroundColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.caption,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    heroTitle: {
      color: theme.backgroundColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h2,
      lineHeight: TYPOGRAPHY.h2 * 1.15,
    },
    heroDate: {
      marginTop: SPACING.sm,
      color: theme.backgroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.body,
      opacity: 0.95,
    },
    surface: {
      marginTop: -SPACING['2xl'],
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.xl,
    },
    highlightsCard: {
      marginBottom: SPACING.lg,
    },
    highlightsHeading: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.sm,
    },
    highlightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.sm,
      marginTop: SPACING.xs,
    },
    bullet: {
      color: theme.tintColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      lineHeight: TYPOGRAPHY.body * 1.45,
    },
    highlightText: {
      flex: 1,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.45,
    },
    bodyHeading: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginBottom: SPACING.md,
    },
    paragraph: {
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
      lineHeight: TYPOGRAPHY.body * 1.5,
      marginBottom: SPACING.md,
    },
    footerBox: {
      alignSelf: 'stretch',
      width: '100%',
      marginTop: SPACING.xs,
    },
    footerNote: {
      alignSelf: 'stretch',
      width: '100%',
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.5,
      textAlign: 'left',
    },
    missingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
      padding: SPACING.containerPadding,
    },
    missingText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.body,
    },
  })
