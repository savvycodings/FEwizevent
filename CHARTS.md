# Charts in the mobile app vs web ideas repo

## Do we use Motion / Reanimated / Worklets for charts?

**No.**

| Layer | Web (`websiteshadcnideasforoutapp`) | Mobile (`app/`) |
|-------|--------------------------------------|-----------------|
| Chart library | **visx** (`AreaClosed`, scales) | **react-native-svg** + **d3-shape** (`RankAreaChart`) |
| Animation | **Motion** (`motion/react`) — clip reveal, tweens | **ChartMotionView** (RN `Animated`) — LTR `scaleX` reveal (~1100ms) |
| Patterns | SVG `<PatternLines>` + `PatternArea` + stroke `Area` | SVG `<Pattern>` diagonal hatch + stroke `Path` (same idea) |
| Styling | CSS variables (`var(--chart-1)`) | Theme tint colors + NativeWind on tooltip wrapper |
| Data | Static or server-fed records in page | `GET /auth/rank-progress` → `RankGrowthChart` on Profile tab |

Reanimated/worklets in this app are only for **@gorhom/bottom-sheet** in `App.tsx`, not charts.

## Web API shape (reference)

```tsx
<AreaChart data={chartData}>
  <PatternLines id="area-pattern" stroke="var(--chart-1)" ... />
  <PatternArea dataKey="desktop" fill="url(#area-pattern)" />
  <Area dataKey="desktop" fillOpacity={0} strokeWidth={2} />
  <XAxis />
  <ChartTooltip />
</AreaChart>
```

Composable children, visx scales, Motion enter transition — **web-only** (DOM + SVG).

## Mobile equivalent

- **Screen:** `src/screens/profile.tsx`
- **Components:** `RankGrowthChart.tsx` → `RankAreaChart.tsx` (pattern area + ease reveal)
- **Drag/tap** chart for tooltip; **custom indicators** (`RankChartIndicators`) — rising lines + crosshair (bklit Custom Indicator pattern)
- **API:** `GET /auth/rank-progress?userId=&compareUserId=&month=YYYY-MM`
- **Compare search:** `GET /auth/players?q=`

Empty chart (&lt; 2 points): user message in `RankGrowthChart`, not an error.

## Debugging chart issues

### Server (grep `[charts]`)

Every rank-progress call logs:

- `[charts] rank-progress request` — incoming params
- `[charts] rank-progress OK` — point counts, XP, ranks
- `[charts] rank-progress FAILED` — `httpStatus`, `message`, `stack`

Compare-player search failures: `[charts] compare-players FAILED`.

### Client (Metro)

In dev, Profile logs:

- `[Profile/chart] rank-progress failed` — userId, compare id, message
- `[Profile/chart] compare-players search failed` — query, message

### Common failures

| Symptom | Likely cause |
|---------|----------------|
| “Could not load rank progress” / HTML 404 | Wrong API host (often **production** without `rank-progress` deployed). Use `http://10.0.2.2:3060` on Android emulator + `pnpm dev` in `server/`. Metro logs `[api] DOMAIN=`. |
| Empty state, no error | Fewer than 2 placement events this month (expected) |
| Chart flat at “Start” | Only month baseline, no in-month placements |
| Compare line missing | Compare user has no data; primary still shows |

## Porting more web chart polish later

To get closer to the bklit-style web chart on native without Motion:

1. Chart motion uses **`ChartMotionView`** (built-in `Animated`) — no extra native module.
2. Full composable `<AreaChart><PatternLines/>…` API from web is not ported; `RankAreaChart` matches the visual for rank data.

See `websiteshadcnideasforoutapp/ideasforwizardapp/components/charts/` for visual reference only.
