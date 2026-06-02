import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import type { BadgeId } from '@/data/badgesCatalog'
import type { BadgeVectorIconProps } from './BadgeVectorIcon'
import { BadgeVectorIcon } from './BadgeVectorIcon'

const CYCLE_MS = 16_000
const ROTATE_DEG = 4
const PULSE_AMOUNT = 0.032

function phaseDelayMs(badgeId: BadgeId): number {
  let h = 0
  for (let i = 0; i < badgeId.length; i++) {
    h = (h * 31 + badgeId.charCodeAt(i)) | 0
  }
  return Math.abs(h % 5000)
}

export type MotionBadgeIconProps = BadgeVectorIconProps & {
  /** Gentle idle motion (respects reduce motion). Default on. */
  animate?: boolean
}

/**
 * Badge icon with a very slow center wobble + soft pulse (low CPU; native driver).
 */
export function MotionBadgeIcon({
  animate = true,
  badgeId,
  ...props
}: MotionBadgeIconProps) {
  const progress = useSharedValue(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => sub.remove()
  }, [])

  const motionOn = animate && !reduceMotion

  useEffect(() => {
    if (!motionOn) {
      cancelAnimation(progress)
      progress.value = 0
      return
    }

    const delay = badgeId ? phaseDelayMs(badgeId) : 0
    progress.value = 0
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: CYCLE_MS,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    )

    return () => {
      cancelAnimation(progress)
    }
  }, [motionOn, badgeId, progress])

  const animatedStyle = useAnimatedStyle(() => {
    'worklet'
    const t = progress.value * Math.PI * 2
    const rotate = Math.sin(t) * ROTATE_DEG
    const scale = 1 + PULSE_AMOUNT * (0.5 + 0.5 * Math.sin(t + Math.PI / 2))
    return {
      transform: [{ rotate: `${rotate}deg` }, { scale }],
    }
  })

  return (
    <BadgeVectorIcon
      badgeId={badgeId}
      {...props}
      animatedStyle={motionOn ? animatedStyle : undefined}
    />
  )
}
