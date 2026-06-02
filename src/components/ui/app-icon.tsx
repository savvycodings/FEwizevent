/**
 * Single icon entry point for the app (slop gate 32).
 *
 * @aliimam/icons ships React DOM SVG components (web only). On React Native we use
 * lucide-react-native — same stroke weight and grid as Ali Imam / Lucide families.
 */
import type { LucideIcon } from 'lucide-react-native'
import {
  Activity,
  ArrowLeft,
  Award,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  CircleX,
  LayoutGrid,
  ListChecks,
  Menu,
  Minus,
  Plus,
  Search,
  Shield,
  TrendingUp,
  Trophy,
  User,
  Users,
  Home,
} from 'lucide-react-native'

export type AppIconName =
  | 'arrow-back'
  | 'search'
  | 'users'
  | 'x-circle'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'user'
  | 'calendar'
  | 'award'
  | 'activity'
  | 'trophy'
  | 'minus'
  | 'plus'
  | 'layout-grid'
  | 'home'
  | 'shield'
  | 'trending-up'
  | 'menu'
  | 'list-checks'
  /** Chosen item in lists, pickers, admin selections (Lucide CircleCheck). */
  | 'circle-check'
  | 'selected'

const ICONS: Record<AppIconName, LucideIcon> = {
  'arrow-back': ArrowLeft,
  search: Search,
  users: Users,
  'x-circle': CircleX,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  user: User,
  calendar: Calendar,
  award: Award,
  activity: Activity,
  trophy: Trophy,
  minus: Minus,
  plus: Plus,
  'layout-grid': LayoutGrid,
  home: Home,
  shield: Shield,
  'trending-up': TrendingUp,
  menu: Menu,
  'list-checks': ListChecks,
  'circle-check': CircleCheck,
  selected: CircleCheck,
}

/** Use for deck picker, admin/player picks, earned badges, etc. */
export const SELECTION_ICON_NAME = 'circle-check' as const satisfies AppIconName

export type AppIconProps = {
  name: AppIconName
  size?: number
  color?: string
  strokeWidth?: number
}

export function AppIcon({ name, size = 24, color, strokeWidth = 1.75 }: AppIconProps) {
  const Icon = ICONS[name]
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />
}
