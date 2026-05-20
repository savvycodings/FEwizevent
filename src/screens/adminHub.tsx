import { useContext } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { ThemedCard, CardCaption } from '../components'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'

export function AdminHub({ navigation }: { navigation: any }) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero} />
      <View style={styles.surface}>
        <Text style={styles.sectionTitle}>Manage</Text>

        <Pressable onPress={() => navigation.navigate('AdminCreate')} style={styles.actionPressable}>
          <ThemedCard premiumRim style={styles.actionCard}>
            <CardCaption caption="Add new events and banners">
              <View style={styles.actionRow}>
                <View style={styles.actionIconWrap}>
                  <Ionicons name="calendar-outline" size={22} color={theme.tintColor} />
                </View>
                <View style={styles.actionBody}>
                  <Text style={styles.actionTitle}>Create events</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={theme.mutedForegroundColor} />
              </View>
            </CardCaption>
          </ThemedCard>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('AdminAttendance')} style={styles.actionPressable}>
          <ThemedCard style={styles.actionCard}>
            <CardCaption caption="Take attendance and placements">
              <View style={styles.actionRow}>
                <View style={styles.actionIconWrap}>
                  <Ionicons name="checkmark-done-outline" size={22} color={theme.tintColor} />
                </View>
                <View style={styles.actionBody}>
                  <Text style={styles.actionTitle}>Attendance</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={theme.mutedForegroundColor} />
              </View>
            </CardCaption>
          </ThemedCard>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('PlayerInfo')} style={styles.actionPressable}>
          <ThemedCard style={styles.actionCard}>
            <CardCaption caption="View player account details">
              <View style={styles.actionRow}>
                <View style={styles.actionIconWrap}>
                  <Ionicons name="people-outline" size={22} color={theme.tintColor} />
                </View>
                <View style={styles.actionBody}>
                  <Text style={styles.actionTitle}>Player info</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={theme.mutedForegroundColor} />
              </View>
            </CardCaption>
          </ThemedCard>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('RankingLeaderboard')} style={styles.actionPressable}>
          <ThemedCard style={styles.actionCard}>
            <CardCaption caption="View rank tiers and XP standings">
              <View style={styles.actionRow}>
                <View style={styles.actionIconWrap}>
                  <Ionicons name="trophy-outline" size={22} color={theme.tintColor} />
                </View>
                <View style={styles.actionBody}>
                  <Text style={styles.actionTitle}>Ranked leaderboard</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={theme.mutedForegroundColor} />
              </View>
            </CardCaption>
          </ThemedCard>
        </Pressable>
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
    },
    sectionTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginBottom: SPACING.md,
    },
    actionPressable: {
      marginBottom: SPACING.md,
    },
    actionCard: {
      alignItems: 'stretch',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    actionIconWrap: {
      width: 38,
      height: 38,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: theme.borderColor,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
    },
    actionBody: {
      flex: 1,
    },
    actionTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      textAlign: 'left',
    },
  })
