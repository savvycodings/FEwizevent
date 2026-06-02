import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { RainSpinner } from './rain-spinner'

export type LoadingNameProps = {
  loading: boolean
  name?: string | null
  placeholder?: string
  spinnerSize?: number
  spinnerColor?: string
  style?: StyleProp<TextStyle>
  containerStyle?: StyleProp<ViewStyle>
  numberOfLines?: number
}

/** Shows RainSpinner while a name is being fetched; otherwise renders the label text. */
export function LoadingName({
  loading,
  name,
  placeholder = '—',
  spinnerSize = 16,
  spinnerColor = '#fff',
  style,
  containerStyle,
  numberOfLines,
}: LoadingNameProps) {
  const trimmed = name?.trim()
  if (loading && !trimmed) {
    return (
      <View style={containerStyle}>
        <RainSpinner size={spinnerSize} color={spinnerColor} />
      </View>
    )
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {trimmed || placeholder}
    </Text>
  )
}
