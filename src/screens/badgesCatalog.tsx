import { useCallback, useContext, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { AppContext, ThemeContext } from '../context'
import { BadgeVectorIcon, ThemedCard } from '../components'
import type { BadgeId } from '../data/badgesCatalog'
import { parseActiveSeasonBadges, type BadgeDefinitionRow } from '../utils/badgeDefinitions'
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/layout'
import { apiRequest } from '../api'

type BadgeDef = BadgeDefinitionRow

type EarnedBadge = { badgeId: BadgeId }

export function BadgesCatalog() {
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const styles = getStyles(theme)
  const [earnedIds, setEarnedIds] = useState<Set<BadgeId>>(new Set())
  const [definitions, setDefinitions] = useState<BadgeDef[]>([])

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

  const loadDefinitions = useCallback(async () => {
    try {
      const res = await apiRequest<{ badges?: BadgeDef[] }>('/auth/league/active-season')
      setDefinitions(parseActiveSeasonBadges(res.badges))
    } catch {
      setDefinitions(parseActiveSeasonBadges(undefined))
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadEarned()
      loadDefinitions()
    }, [loadEarned, loadDefinitions])
  )

  const rows = useMemo(
    () =>
      definitions.map((def) => ({
        id: def.id as BadgeId,
        title: def.title,
        blurb: def.description,
        xpReward: def.xpReward,
        earned: earnedIds.has(def.id as BadgeId),
      })),
    [definitions, earnedIds]
  )

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {rows.map((row, index) => (
        <ThemedCard key={row.id} style={index === rows.length - 1 ? styles.cardLast : styles.card}>
          <View style={styles.rowMain}>
            <View style={styles.rowLeft}>
              <Text style={styles.title}>{row.title}</Text>
              <Text style={styles.subtitle}>{row.blurb}</Text>
              {row.xpReward > 0 ? (
                <Text style={styles.xpNote}>+{row.xpReward} XP (one-time)</Text>
              ) : null}
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
    xpNote: {
      marginTop: SPACING.xs,
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    iconWrap: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
