# Slop test → components (Wizards XP / React Native)

Map Hallmark gates to **what we already have** and **what screens should use**.

## Pre-emit axes (per screen)

Before shipping a screen, score 1–5: **Philosophy, Hierarchy, Execution, Specificity, Restraint, Variety**. Revise anything &lt; 3.

## Component playbook

| Gate(s) | Use this | Not this |
|--------|----------|----------|
| 8, 58 Tokens | `theme.*`, `BRAND.*`, `HOME_HERO_TOP_COLOR` | Raw `#000`, `#fff`, one-off hex in screens |
| 10 Section rhythm | `Section` + `Divider` | Only `marginTop: 24` repeated with no rule |
| 32 Icons | `AppIcon` | Mixing Ionicons + Feather + Lucide |
| 38 Toolbars | `ToolbarRow` + `alignItems: 'center'` | Icon + text rows without vertical centering |
| 51–54 Hero | `ScreenHero` + `ScreenSurface` | Copy-pasted hero `View` styles per file |
| 4 Cards | One of `ThemedCard`, `Surface`, `ListRowCard` per block | `ThemedCard` wrapping another `ThemedCard` |
| 41–45 Inputs | `SearchField`, `Input` (`h-10`), `ThemedButton` | Custom `TextInput` heights beside 44px buttons |
| 56 Honest copy | Real API data, `EmptyState` | Fake “10k users” stats |
| 59 Tab labels | Short tab titles in `main.tsx` | Long wrapping CTA strings |
| 60 Icons | `AppIcon` | Emoji as feature icons |
| 63 Long titles | `numberOfLines={1}` + `minWidth: 0` on flex children | Unbounded hero names |

## Screen inventory

| Screen | Macrostructure | Hero | Status / notes |
|--------|----------------|------|----------------|
| **Home** | Dashboard + feed | Custom (avatar row) | Stats 3-up uses **rank art**, not generic icon tiles ✓ |
| **Events** | List + search | `ScreenHero` candidate | Banner text → `BRAND.onImageText` |
| **Play** | Profile strip + 3-col stats | Tint hero | 3-col is **points table**, not icon features ✓ |
| **Profile** | Summary + chart | Light hero strip | Chart: no nested card around chart ✓ |
| **Menu** | Grouped list rows | Tint hero | `ListRowCard` ✓ |
| **News** | Article cards | Tint hero | `Surface` cards ✓ |
| **AttendedEvents** | List | Stack header | Migrate to `ScreenHero` |
| **PlayerSearch** | Search results | In-stack | `SearchField` ✓ |
| **EventPage** | Detail + gradient bar | Back + hero | Placement gradient = **data viz**, not marketing blob |
| **Admin hub** | Action list | Tint band | Icon rows centred ✓ |
| **Admin / attendance** | Forms + tables | Tint / nested | Watch nested `ThemedCard` depth |
| **Ranking** | Leaderboard | Gradient header | Same as event detail pattern |

## N/A on native (skip or adapt)

- 21–23 CSS macrostructure stamps → use comment in screen file if needed
- 36, 62 `overflow-x: clip` → web only; RN: `flex: 1`, no horizontal `ScrollView` unless intentional
- 11–19 Web hover/focus → use `Pressable` `pressed` + `accessibilityRole`
- 29 `prefers-reduced-motion` → prefer static UI; avoid chart double-animations

## Checklist before merge

1. All icons via `AppIcon`
2. No new raw hex in screens (add to `brandColors` or theme)
3. Hero uses `ScreenHero` or documents why custom (Home)
4. `Section` for titled blocks; `EmptyState` for zero data
5. Run `SLOP_AUDIT.md` gate row — all **no** for shipped screens
