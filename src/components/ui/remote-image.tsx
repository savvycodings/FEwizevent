import { useEffect, useState } from 'react'
import {
  Image,
  StyleSheet,
  View,
  type ImageProps,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { RainSpinner } from './rain-spinner'

export type RemoteImageProps = Omit<ImageProps, 'source'> & {
  uri: string | null | undefined
  style?: StyleProp<ImageStyle>
  containerStyle?: StyleProp<ViewStyle>
  spinnerSize?: number
  spinnerColor?: string
  fallback?: React.ReactNode
}

export function RemoteImage({
  uri,
  style,
  containerStyle,
  spinnerSize = 18,
  spinnerColor = '#fff',
  fallback = null,
  onLoadStart,
  onLoad,
  onError,
  ...rest
}: RemoteImageProps) {
  const [loading, setLoading] = useState(Boolean(uri))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoading(Boolean(uri))
    setFailed(false)
  }, [uri])

  if (!uri || failed) {
    return <>{fallback}</>
  }

  return (
    <View style={[styles.container, containerStyle, style as StyleProp<ViewStyle>]}>
      <Image
        {...rest}
        source={{ uri }}
        style={[StyleSheet.absoluteFillObject, style]}
        onLoadStart={(event) => {
          setLoading(true)
          setFailed(false)
          onLoadStart?.(event)
        }}
        onLoad={(event) => {
          setLoading(false)
          onLoad?.(event)
        }}
        onError={(event) => {
          setLoading(false)
          setFailed(true)
          onError?.(event)
        }}
      />
      {loading ? (
        <View style={[StyleSheet.absoluteFillObject, styles.spinnerLayer]}>
          <RainSpinner size={spinnerSize} color={spinnerColor} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  spinnerLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
})
