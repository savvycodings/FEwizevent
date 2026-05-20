import { ReactNode, useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'
import { Divider } from '../ui/Divider'

interface SectionProps {
  title: string
  subtitle?: string
  onPressSeeAll?: () => void
  children: ReactNode
  compactTopSpacing?: boolean
  /** When false, no rule under the header (e.g. tight stacks). Default true. */
  showDivider?: boolean
}

export function Section({
  title,
  subtitle,
  onPressSeeAll,
  children,
  compactTopSpacing = false,
  showDivider = true,
}: SectionProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={[styles.section, compactTopSpacing && styles.sectionCompact]}>
      <View style={styles.headerBlock}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          {onPressSeeAll ? (
            <TouchableOpacity onPress={onPressSeeAll}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {showDivider ? <Divider spacing="sm" /> : null}
      {children}
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    section: {
      marginTop: SPACING.sectionGap,
    },
    sectionCompact: {
      marginTop: SPACING.lg,
    },
    headerBlock: {
      marginBottom: SPACING.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    title: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      flex: 1,
      paddingRight: SPACING.md,
      lineHeight: TYPOGRAPHY.h4 * 1.2,
    },
    subtitle: {
      marginTop: SPACING.xs,
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
      lineHeight: TYPOGRAPHY.bodySmall * 1.4,
    },
    seeAll: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      textDecorationLine: 'underline',
    },
  })
