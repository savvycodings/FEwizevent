import { ReactNode, useContext } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'
import { Divider } from './Divider'

type CardCaptionProps = {
  children: ReactNode
  /** Lower line: soft white / muted caption, left-aligned, after a faint rule. */
  caption?: string
}

export function CardCaption({ children, caption }: CardCaptionProps) {
  const { theme } = useContext(ThemeContext)
  if (!caption) {
    return (
      <View style={styles.bodyOnly}>
        {children}
      </View>
    )
  }
  const footColor = theme.footerCaptionColor ?? theme.mutedForegroundColor
  return (
    <View style={styles.wrap}>
      <View style={styles.body}>{children}</View>
      <Divider spacing="sm" faint />
      <Text style={[styles.caption, { color: footColor, fontFamily: theme.mediumFont }]}>
        {caption}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  body: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  bodyOnly: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  caption: {
    textAlign: 'left',
    fontSize: TYPOGRAPHY.caption,
    lineHeight: Math.round(TYPOGRAPHY.caption * 1.4),
    marginTop: SPACING.xs,
  },
})
