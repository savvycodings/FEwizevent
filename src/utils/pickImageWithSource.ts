import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

export type PickImageWithSourceOptions = {
  quality?: number
  allowsEditing?: boolean
  aspect?: [number, number]
}

/**
 * Opens the photo library only (no in-app camera), so Android can omit CAMERA permission.
 */
export async function pickImageWithSource(
  opts: PickImageWithSourceOptions = {}
): Promise<ImagePicker.ImagePickerAsset | null> {
  const quality = opts.quality ?? 0.85
  const allowsEditing = opts.allowsEditing ?? true
  const aspect = opts.aspect

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (perm.status !== 'granted') {
    Alert.alert('Permission needed', 'Photo library access is required to choose an image.')
    return null
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing,
    ...(aspect != null ? { aspect } : {}),
    quality,
  })
  if (result.canceled || !result.assets?.[0]) return null
  return result.assets[0]
}
