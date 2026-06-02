import { useContext } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ThemeContext } from '../context'
import { AppIcon, ToolbarRow } from '../components'
import { rowGrow } from '../components/layout/PressableRow'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'

const ACTIONS = [
  { route: 'AdminCreate', icon: 'calendar' as const, title: 'Create events' },
  { route: 'AdminAttendance', icon: 'list-checks' as const, title: 'Manage events' },
  { route: 'AdminRedeem', icon: 'award' as const, title: 'Redeem prizes' },
  { route: 'PlayerInfo', icon: 'users' as const, title: 'Player info' },
  { route: 'RankingLeaderboard', icon: 'trophy' as const, title: 'Ranked leaderboard' },
]

export function AdminHub({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />
      <View style={styles.surface}>
        <Text style={styles.sectionTitle}>Admin</Text>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.route}
            onPress={() => navigation.navigate(action.route)}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
          >
            <ToolbarRow>
              <View style={styles.actionIconWrap}>
                <AppIcon name={action.icon} size={20} color={theme.tintColor} />
              </View>
              <Text style={[rowGrow.text, styles.actionTitle]} numberOfLines={1}>
                {action.title}
              </Text>
              <View style={rowGrow.end}>
                <AppIcon name="chevron-right" size={18} color={theme.mutedForegroundColor} />
              </View>
            </ToolbarRow>
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
      paddingBottom: SPACING['3xl'],
    },
    hero: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING['2xl'],
      paddingBottom: SPACING['3xl'],
    },
    surface: {
      marginTop: -SPACING.xl,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      backgroundColor: theme.backgroundColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.xl,
      gap: SPACING.sm,
    },
    sectionTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginBottom: SPACING.sm,
    },
    actionRow: {
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      minHeight: 52,
    },
    actionRowPressed: {
      opacity: 0.85,
    },
    actionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      backgroundColor: theme.surfaceMuted ?? theme.cardBackground ?? theme.backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionTitle: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.body,
    },
  })
