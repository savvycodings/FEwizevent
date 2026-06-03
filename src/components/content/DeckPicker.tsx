import { useContext, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { ThemeContext } from '../../context'
import { DeckIcon } from '../decks/DeckIcon'
import { PressableRow, rowGrow } from '../layout/PressableRow'
import { AppIcon, SELECTION_ICON_NAME } from '../ui/app-icon'
import { BRAND } from '@/constants/brandColors'
import { DECK_CATALOG, deckShortLabelForId } from '@/constants/deckCatalog'
import { RADIUS, SPACING, TYPOGRAPHY } from '@/constants/layout'

type DeckPickerProps = {
  value: string | null
  onChange: (deckId: string) => void
  /** Small label above the button (optional). */
  label?: string
  showFieldLabel?: boolean
  compact?: boolean
  disabled?: boolean
  /** Shown on the button when no deck is selected. */
  placeholder?: string
  /** Profile: inline label + icon, one bordered capsule around the control. */
  /** Hero: compact pill on home header (matches rank pill). */
  /** Hero icon: deck glyph only, inline beside the player name. */
  variant?: 'default' | 'profile' | 'hero' | 'heroIcon' | 'field'
  /** Profile deck hint when event deck is not set yet (admin UI only; not saved until picked). */
  suggestedDeckId?: string | null
}

export function DeckPicker({
  value,
  onChange,
  label = 'Deck',
  showFieldLabel = true,
  compact = false,
  disabled = false,
  placeholder = 'Select deck',
  variant = 'default',
  suggestedDeckId = null,
}: DeckPickerProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [open, setOpen] = useState(false)
  const selected = DECK_CATALOG.find((d) => d.id === value)
  const modalTitle = label || 'Select deck'
  const isProfile = variant === 'profile'
  const isHero = variant === 'hero'
  const isHeroIcon = variant === 'heroIcon'
  const isField = variant === 'field'

  const profileLabel = label.trim().replace(/:+$/, '')
  const suggested = DECK_CATALOG.find((d) => d.id === suggestedDeckId)
  const resolvedPlaceholder =
    !selected && suggested
      ? `Suggested: ${deckShortLabelForId(suggested.id) || suggested.label}`
      : placeholder
  const deckName = selected?.label ?? resolvedPlaceholder
  const heroDeckLine = selected
    ? deckShortLabelForId(selected.id) || selected.label
    : placeholder
  const profileLine = `${profileLabel}: ${deckName}`
  const fieldLine = selected?.label ?? resolvedPlaceholder

  const trigger = (
    <PressableRow
      disabled={disabled}
      onPress={() => setOpen(true)}
      accessibilityRole="button"
      accessibilityLabel={
        isHeroIcon
          ? selected
            ? `Deck: ${selected.label}. Change deck`
            : placeholder
          : isHero
            ? selected
              ? `Deck: ${selected.label}. Change deck`
              : placeholder
            : isProfile
            ? selected
              ? `${profileLabel}: ${selected.label}. Change deck`
              : placeholder
            : isField
              ? selected
                ? `Deck: ${selected.label}. Change deck`
                : placeholder
            : selected
              ? `Deck: ${selected.label}. Change deck`
              : placeholder
      }
      accessibilityState={{ expanded: open }}
      style={({ pressed }) => [
        isHeroIcon
          ? styles.heroIconTrigger
          : isHero
          ? styles.heroTrigger
          : isProfile
            ? styles.profileTrigger
            : isField
              ? styles.fieldTrigger
              : styles.trigger,
        !isProfile && !isHero && !isHeroIcon && !isField && compact && styles.triggerCompact,
        disabled && styles.triggerDisabled,
        pressed && !disabled && styles.triggerPressed,
      ]}
    >
      {isHeroIcon ? (
        <DeckIcon deckId={value} size={28} />
      ) : isHero ? (
        <>
          <DeckIcon deckId={value} size={18} />
          <Text style={[rowGrow.text, styles.heroPillText]} numberOfLines={1} ellipsizeMode="tail">
            {heroDeckLine}
          </Text>
          <View style={rowGrow.end}>
            <AppIcon name="chevron-down" size={14} color={BRAND.heroInk} />
          </View>
        </>
      ) : isProfile ? (
        <>
          <DeckIcon deckId={value} size={22} />
          <Text
            style={[rowGrow.text, styles.profileLineText]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {profileLine}
          </Text>
          <View style={rowGrow.end}>
            <AppIcon name="chevron-down" size={18} color={theme.mutedForegroundColor} />
          </View>
        </>
      ) : isField ? (
        <>
          <DeckIcon deckId={value} size={22} />
          <Text
            style={[
              rowGrow.text,
              styles.fieldLineText,
              !selected && styles.fieldPlaceholder,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {fieldLine}
          </Text>
          <View style={rowGrow.end}>
            <AppIcon name="chevron-down" size={18} color={theme.mutedForegroundColor} />
          </View>
        </>
      ) : (
        <>
          <DeckIcon deckId={value} size={22} />
          <Text
            style={[rowGrow.text, styles.triggerText, !selected && styles.triggerPlaceholder]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {deckName}
          </Text>
          <View style={rowGrow.end}>
            <AppIcon name="chevron-down" size={18} color={theme.mutedForegroundColor} />
          </View>
        </>
      )}
    </PressableRow>
  )

  return (
    <>
      <View style={[styles.wrap, compact && styles.wrapCompact, isHero && styles.wrapHero, isHeroIcon && styles.wrapHeroIcon]}>
        {!isProfile && !isHero && !isHeroIcon && !isField && showFieldLabel && !compact ? (
          <Text style={styles.fieldLabel}>{label}</Text>
        ) : null}
        {trigger}
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{modalTitle}</Text>
            <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
              {DECK_CATALOG.map((deck) => {
                const active = deck.id === value
                return (
                  <PressableRow
                    key={deck.id}
                    onPress={() => {
                      onChange(deck.id)
                      setOpen(false)
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      active && styles.optionActive,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <DeckIcon deckId={deck.id} size={32} />
                    <Text
                      style={[rowGrow.text, styles.optionText, active && styles.optionTextActive]}
                      numberOfLines={1}
                    >
                      {deck.label}
                    </Text>
                    {active ? (
                      <View style={rowGrow.end}>
                        <AppIcon name={SELECTION_ICON_NAME} size={18} color={theme.tintColor} />
                      </View>
                    ) : (
                      <View style={rowGrow.end} />
                    )}
                  </PressableRow>
                )
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
    },
    wrapCompact: {
      flex: 1,
      minWidth: 0,
    },
    wrapHero: {
      width: undefined,
      alignSelf: 'flex-start',
    },
    wrapHeroIcon: {
      width: undefined,
      alignSelf: 'center',
      flexShrink: 0,
    },
    heroIconTrigger: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIUS.full,
      backgroundColor: 'rgba(0,0,0,0.12)',
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },
    heroTrigger: {
      alignSelf: 'flex-start',
      minHeight: 0,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: 'rgba(0,0,0,0.12)',
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },
    heroPillText: {
      color: BRAND.heroInk,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
    fieldLabel: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.xs,
    },
    profileTrigger: {
      width: '100%',
      alignSelf: 'stretch',
      minHeight: 48,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.xl,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    profileLineText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    fieldTrigger: {
      width: '100%',
      alignSelf: 'stretch',
      minHeight: 48,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    fieldLineText: {
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
    },
    fieldPlaceholder: {
      color: theme.mutedForegroundColor,
    },
    trigger: {
      minHeight: 48,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.surfaceMuted ?? theme.cardBackground ?? theme.backgroundColor,
    },
    triggerCompact: {
      minHeight: 44,
      paddingVertical: SPACING.sm,
    },
    triggerDisabled: {
      opacity: 0.5,
    },
    triggerPressed: {
      opacity: 0.88,
    },
    triggerText: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    triggerPlaceholder: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
    },
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'transparent',
    },
    sheet: {
      maxHeight: '70%',
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.borderColor,
      backgroundColor: theme.cardBackground,
      paddingHorizontal: SPACING.containerPadding,
      paddingBottom: SPACING.xl,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: RADIUS.full,
      backgroundColor: theme.borderColor,
      marginTop: SPACING.sm,
      marginBottom: SPACING.md,
    },
    sheetTitle: {
      color: theme.textColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
      marginBottom: SPACING.md,
    },
    sheetList: {
      maxHeight: 360,
    },
    option: {
      borderWidth: 1.5,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      marginBottom: SPACING.sm,
    },
    optionActive: {
      borderColor: theme.tintColor,
    },
    optionPressed: {
      opacity: 0.88,
    },
    optionText: {
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
    },
    optionTextActive: {
      fontFamily: theme.semiBoldFont,
      color: theme.tintColor,
    },
  })
