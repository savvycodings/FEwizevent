import { useContext, useState } from 'react'
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { AppIcon } from './app-icon'
import { PressableRow, rowGrow } from '@/components/layout/PressableRow'
import { ThemeContext } from '../../context'
import { RADIUS, SPACING, TYPOGRAPHY } from '../../constants/layout'

export function dateToApiString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function apiStringToDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const iso = trimmed.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatPickerLabel(value: string): string {
  const d = apiStringToDate(value)
  if (!d) return 'Choose a date'
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

type EventDateFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  optional?: boolean
  containerStyle?: StyleProp<ViewStyle>
}

export function EventDateField({
  value,
  onChange,
  label = 'Event date',
  optional = true,
  containerStyle,
}: EventDateFieldProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [showAndroidPicker, setShowAndroidPicker] = useState(false)

  const pickerDate = apiStringToDate(value) ?? new Date()

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false)
    }
    if (event.type === 'dismissed' || !selected) {
      return
    }
    onChange(dateToApiString(selected))
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(true)
    }
  }

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'ios' ? (
        <View style={styles.iosPickerShell}>
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="inline"
            themeVariant="dark"
            onChange={onPickerChange}
            style={styles.iosPicker}
          />
        </View>
      ) : (
        <>
          <PressableRow
            style={styles.trigger}
            onPress={openPicker}
            accessibilityRole="button"
            accessibilityLabel="Choose event date"
          >
            <AppIcon name="calendar" size={20} color={theme.tintColor} />
            <Text
              style={[rowGrow.text, styles.triggerText, !value && styles.triggerPlaceholder]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formatPickerLabel(value)}
            </Text>
            <View style={rowGrow.end}>
              <AppIcon name="chevron-down" size={18} color={theme.mutedForegroundColor} />
            </View>
          </PressableRow>
          {showAndroidPicker ? (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="calendar"
              onChange={onPickerChange}
            />
          ) : null}
        </>
      )}
      {optional ? (
        <Pressable
          onPress={() => onChange('')}
          disabled={!value}
          style={styles.clearBtn}
          accessibilityRole="button"
        >
          <Text style={[styles.clearText, !value && styles.clearTextDisabled]}>Clear date</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    wrap: {
      marginBottom: SPACING.md,
    },
    label: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.bodySmall,
      marginBottom: SPACING.xs,
    },
    trigger: {
      borderColor: theme.borderColor,
      borderWidth: 1.5,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      backgroundColor: theme.cardBackground ?? theme.backgroundColor,
    },
    triggerText: {
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
    },
    triggerPlaceholder: {
      color: theme.mutedForegroundColor,
    },
    iosPickerShell: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: RADIUS.md,
      overflow: 'hidden',
      backgroundColor: theme.backgroundColor,
    },
    iosPicker: {
      alignSelf: 'stretch',
    },
    clearBtn: {
      alignSelf: 'flex-start',
      marginTop: SPACING.sm,
      paddingVertical: SPACING.xs,
    },
    clearText: {
      color: theme.tintColor,
      fontFamily: theme.mediumFont,
      fontSize: TYPOGRAPHY.bodySmall,
    },
    clearTextDisabled: {
      color: theme.mutedForegroundColor,
      opacity: 0.5,
    },
  })
