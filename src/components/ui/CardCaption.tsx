import { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from './text'
import { Divider } from './Divider'

type CardCaptionProps = {
  children: ReactNode
  caption?: string
}

export function CardCaption({ children, caption }: CardCaptionProps) {
  if (!caption) {
    return <View className="self-stretch">{children}</View>
  }

  return (
    <View className="self-stretch">
      <View className="self-stretch">{children}</View>
      <Divider spacing="sm" faint />
      <Text variant="muted" className="mt-1 text-left text-xs leading-5">
        {caption}
      </Text>
    </View>
  )
}
