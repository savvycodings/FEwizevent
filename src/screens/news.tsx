import { useContext } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { ThemeContext } from '../context'
import { ThemedCard, CardCaption } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { news } from '../data/mockData'

export function News() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {news.map((item, index) => (
        <ThemedCard key={item.id} premiumRim={index === 0} style={styles.card}>
          <CardCaption caption={item.date}>
            <View style={styles.rowTop}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
            </View>
            <View style={styles.imageStub}>
              <Text style={styles.imageText}>Play! Pokemon News</Text>
            </View>
          </CardCaption>
        </ThemedCard>
      ))}
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
      paddingHorizontal: SPACING.containerPadding,
      paddingVertical: SPACING.lg,
      gap: SPACING.lg,
      paddingBottom: SPACING['3xl'],
    },
    card: {
      marginBottom: SPACING.lg,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.md,
    },
    title: {
      flex: 1,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      lineHeight: TYPOGRAPHY.h4 + 4,
      textAlign: 'left',
    },
    tag: {
      backgroundColor: theme.infoBackground,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    tagText: {
      color: theme.infoTextColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    imageStub: {
      marginTop: SPACING.lg,
      backgroundColor: theme.heroBackground,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING['3xl'],
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    imageText: {
      color: theme.tintTextColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h3,
    },
  })
