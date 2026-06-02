/**
 * Chart animations without react-native-ease (requires a native rebuild).
 * Uses RN Animated — works in the current dev client.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, type StyleProp, type ViewStyle } from 'react-native'

type MotionValues = {
  opacity?: number
  scaleX?: number
  scale?: number
  translateY?: number
}

type Transition =
  | { type: 'timing'; duration?: number; easing?: 'easeOut' | 'linear' }
  | { type: 'spring'; damping?: number; stiffness?: number; mass?: number }

type ChartMotionViewProps = {
  initialAnimate?: MotionValues
  animate: MotionValues
  transition?: Transition
  style?: StyleProp<ViewStyle>
  className?: string
  children?: ReactNode
}

function runTransition(
  value: Animated.Value,
  toValue: number,
  transition: Transition
) {
  if (transition.type === 'spring') {
    return Animated.spring(value, {
      toValue,
      damping: transition.damping ?? 18,
      stiffness: transition.stiffness ?? 280,
      mass: transition.mass ?? 0.8,
      useNativeDriver: true,
    })
  }
  return Animated.timing(value, {
    toValue,
    duration: transition.duration ?? 300,
    useNativeDriver: true,
  })
}

export function ChartMotionView({
  initialAnimate,
  animate,
  transition = { type: 'timing', duration: 300 },
  style,
  className,
  children,
}: ChartMotionViewProps) {
  const initial = initialAnimate ?? {}
  const opacity = useRef(new Animated.Value(initial.opacity ?? 1)).current
  const scaleX = useRef(new Animated.Value(initial.scaleX ?? 1)).current
  const scale = useRef(new Animated.Value(initial.scale ?? 1)).current
  const translateY = useRef(new Animated.Value(initial.translateY ?? 0)).current

  const targetOpacity = animate.opacity
  const targetScaleX = animate.scaleX
  const targetScale = animate.scale
  const targetTranslateY = animate.translateY

  useEffect(() => {
    const anims: Animated.CompositeAnimation[] = []
    if (targetOpacity != null) {
      anims.push(runTransition(opacity, targetOpacity, transition))
    }
    if (targetScaleX != null) {
      anims.push(runTransition(scaleX, targetScaleX, transition))
    }
    if (targetScale != null) {
      anims.push(runTransition(scale, targetScale, transition))
    }
    if (targetTranslateY != null) {
      anims.push(runTransition(translateY, targetTranslateY, transition))
    }
    if (anims.length > 0) {
      Animated.parallel(anims).start()
    }
  }, [targetOpacity, targetScaleX, targetScale, targetTranslateY, transition, opacity, scaleX, scale, translateY])

  return (
    <Animated.View
      className={className}
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scaleX }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}
