import { useContext } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppContext, ThemeContext } from '../context'
import { Divider, ListRowCard, Section, Surface } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { menuGroups } from '../data/mockData'

export function Menu({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const { currentUser, setCurrentUser } = useContext(AppContext)
  const styles = getStyles(theme)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Menu</Text>
        <Text style={styles.heroSubtitle}>Shortcuts, settings, and account.</Text>
      </View>

      <View style={styles.surface}>
        <Surface variant="muted" padding="lg">
          <Text style={styles.accountName}>{currentUser?.name || 'Guest'}</Text>
          {currentUser?.email ? (
            <Text style={styles.accountEmail}>{currentUser.email}</Text>
          ) : (
            <Text style={styles.accountEmail}>Not signed in</Text>
          )}
        </Surface>

        <Divider faint spacing="lg" />

        {menuGroups.map((group, gi) => (
          <Section
            key={group.id}
            title={group.title}
            compactTopSpacing={gi === 0}
          >
            <View style={styles.groupStack}>
              {group.items.map((item, ii) => {
                const onPress =
                  item.id === 'account' ? () => navigation.navigate('AccountManagement') : undefined
                const isLast = ii === group.items.length - 1
                return (
                  <ListRowCard
                    key={item.id}
                    title={item.title}
                    onPress={onPress}
                    style={isLast ? styles.rowLast : undefined}
                  />
                )
              })}
            </View>
          </Section>
        ))}

        {currentUser?.isAdmin ? (
          <Section title="Admin" subtitle="Organizer tools and attendance." compactTopSpacing>
            <ListRowCard
              title="Admin hub"
              subtitle="Manage attendance and events"
              onPress={() => navigation.navigate('Admin')}
              style={styles.rowLast}
            />
          </Section>
        ) : null}

        <Section title="Session" compactTopSpacing>
          <ListRowCard
            title="Log Out"
            subtitle={currentUser?.email || 'End this session'}
            onPress={() => setCurrentUser(null)}
            style={styles.rowLast}
          />
        </Section>
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
      paddingBottom: SPACING['3xl'],
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
    },
    accountName: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      lineHeight: TYPOGRAPHY.h4 * 1.2,
    },
    accountEmail: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
    },
    groupStack: {
      gap: 0,
    },
    rowLast: {
      marginBottom: 0,
    },
  })
