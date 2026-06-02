import { useCallback, useContext, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { AppContext, ThemeContext } from '../context'
import { BadgeVectorIcon, ThemedCard } from '../components'
import {
  BADGE_AWARD_TEXT,
  BADGE_CATALOG_ORDER,
  BADGE_DISPLAY_TITLE,
  type BadgeId,
} from '../data/badgesCatalog'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type EarnedBadge = {
  badgeId: BadgeId
}

export function BadgesCatalog() {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const [earnedIds, setEarnedIds] = useState<Set<BadgeId>>(new Set())

  const loadEarned = useCallback(async () => {
    if (!currentUser?.id) {
      setEarnedIds(new Set())
      return
    }
    try {
      const res = await apiRequest<{ badges?: EarnedBadge[] }>(`/admin/users/${currentUser.id}/details`)
      const next = new Set<BadgeId>()
      for (const b of res.badges ?? []) {
        if (b?.badgeId) next.add(b.badgeId as BadgeId)
      }
      setEarnedIds(next)
    } catch {
      setEarnedIds(new Set())
    }
  }, [currentUser?.id])

  useFocusEffect(
    useCallback(() => {
      loadEarned()
    }, [loadEarned])
  )

  const rows = useMemo(
    () =>
      BADGE_CATALOG_ORDER.map((id) => ({
        id,
        title: BADGE_DISPLAY_TITLE[id],
        blurb: BADGE_AWARD_TEXT[id],
        earned: earnedIds.has(id),
      })),
    [earnedIds]
  )

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {rows.map((row, index) => (
        <ThemedCard key={row.id} style={index === rows.length - 1 ? styles.cardLast : styles.card}>
          <View style={styles.rowMain}>
            <View style={styles.rowLeft}>
              <Text style={styles.title}>{row.title}</Text>
              <Text style={styles.subtitle}>{row.blurb}</Text>
            </View>
            <View style={styles.iconWrap}>
              <BadgeVectorIcon
                badgeId={row.id}
                size={44}
                color={row.earned ? theme.tintColor : theme.mutedForegroundColor}
                opacity={row.earned ? 1 : 0.4}
              />
            </View>
          </View>
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
      paddingTop: SPACING.lg,
      paddingBottom: SPACING['3xl'],
    },
    card: {
      marginBottom: SPACING.md,
    },
    cardLast: {
      marginBottom: 0,
    },
    rowMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    rowLeft: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.body,
      lineHeight: TYPOGRAPHY.body * 1.25,
    },
    subtitle: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: Math.round(TYPOGRAPHY.caption * 1.45),
    },
    iconWrap: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
