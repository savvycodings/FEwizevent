# Slop audit — Wizards XP (React Native)

**Last run:** 2026-06-01 (deep IA pass)  
**Genre:** mobile tournament app — not marketing-site Hallmark

Pre-emit: `P4 H4 E3 S5 R3 V4` — **Execution (E)** pulled down by mixed typography systems (StyleSheet vs `Text` variants) until screens share patterns.

---

## What we actually did (first pass)

| Layer | Done? | Where |
|-------|--------|--------|
| Single icon library | Yes | `AppIcon` on tab screens + stack |
| Colour tokens | Partial | `brandColors.ts`; Home/Profile still bespoke rgba |
| Shared hero/surface shell | Partial | **Events, Play, Menu, News, Attended events** use `ScreenHero` + `ScreenSurface` |
| Chart/compare UX | Yes | Profile chart (timeline, toolbar, no double anim) |
| Information architecture | **Not yet** | No shared `StatTile`, `SummaryStrip`, `FeedCard` |
| Typography system | **Not yet** | Home/Play = `StyleSheet` + `TYPOGRAPHY`; Profile = `@/components/ui/text` |

**Home and Profile were not migrated to `ScreenHero` / `ScreenSurface` on purpose** — Home has a custom identity hero; Profile uses a minimal title strip. That is fine for slop gate 9 (variety) but hurts **consistency (gate C)** until we extract shared *content* components, not copy-paste heroes.

---

## Per-screen: purpose · layout · text · gaps

### Home (`home.tsx`)

**Purpose (A):** “Where am I in my climb, and what just happened?” — dashboard, not marketing.

**Macrostructure:** Custom hero band → **2-up stat row** → vertical **sections** (rank card, badge grid, activity feed). Not hero→3 icon tiles→CTA (gate 9 ✓).

| Zone | Layout | Primary text | Secondary | Tertiary |
|------|--------|--------------|-----------|----------|
| Hero | **Row:** avatar \| column (greeting, name+search **row**, rank pill) | Name (`h2`) | “Welcome back” (caps) | Rank · XP pill |
| Stats | **Row:** 2× flex columns (streak, badges) | Stat number | Label under | — |
| Rank progress | **Card:** row badge \| copy \| (implicit in copy) + progress **row** | Tier name | XP to next | % label |
| Badges | **Grid:** 3 columns (image cells) | — | — | Empty copy |
| Activity | **Column** of cards | Event title | “Marked attended” | Time (top-right) |

**Slop gates:** 3 ✓ (2 stats, not 3 icon features). 53 ✓ (search breaks center axis). 10 ⚠️ (“Badges earned” sits outside `Section`). 58 ⚠️ (many `StyleSheet` colours, not `Text` variants).

**Better structure:**
- `ScreenSurface` for sheet (same overlap as other tabs)
- `StatTile` — column: value → label (stats row)
- `RankProgressCard` — shared with Profile summary
- `FeedEventCard` — replace inline `ThemedCard` feed markup
- Wrap badges in `Section title="Badges earned"`

---

### Profile (`profile.tsx`)

**Purpose (A):** “How did my XP climb this month, and how do I compare?” — analytic, not social profile.

**Macrostructure:** Title hero → summary **card** → chart **column** → explainer card.

| Zone | Layout | Primary | Secondary | Tertiary |
|------|--------|---------|-----------|----------|
| Hero | **Column:** title, subtitle | “Profile” | “Rank growth · {month}” | — |
| Summary | **Row:** rank image \| copy \| XP pill (right) | Rank end | Rank start / copy | +XP |
| Chart | **Column:** toolbar **row**, legend **row**, chart | — | Section title | Legend names |
| How it works | Card, prose | — | `muted` body | — |

**Slop gates:** 4 ✓ (no card around chart). 66 ✓ (`Section` stacks title/subtitle). 10 ✓. **C ⚠️** hero looks different from Events/Play (no tint band; uses `HOME_HERO` padding only).

**Better structure:**
- `RankSummaryCard` (same row pattern as Home rank header — one component, two screens)
- `ComparePlayerSheet` already modal — OK
- Drop “How it works” to `Section` subtitle or collapsible — full card is heavy (gate E restraint)
- Align hero with `ScreenHero` **or** document “Profile = inset header” pattern

---

### Events (`events.tsx`)

**Purpose (A):** Find and open tournaments.

**Macrostructure:** `ScreenHero` → `ScreenSurface` → search → **column** of banner cards. ✓ shell consistency.

| Zone | Layout | Primary | Secondary | Tertiary |
|------|--------|---------|-----------|----------|
| Hero | `ScreenHero` column | “Event Locator” | — | — |
| Search | Full-width pill | Placeholder | — | — |
| Featured | **Column** of tall banners | Event title | Date, location (stacked) | — |
| Upcoming | `EmptyState` | — | Message | — |

**Slop gates:** 32 ✓. 56 ✓ (no fake events). **B ⚠️** “Featured” vs “Upcoming” — second section empty; hierarchy unclear until data exists.

**Better structure:**
- `EventBannerCard` → move to `components/events/` (reused on Home if needed)
- Wire search to filter list (purpose match)
- Merge sections if upcoming unused, or hide section until API ready

---

### Play (`play.tsx`)

**Purpose (A):** Reference for championship points + your recent attended events.

**Macrostructure:** `ScreenHero` → profile strip → **two** 3-column stat tables → event list.

| Zone | Layout | Primary | Secondary | Tertiary |
|------|--------|---------|-----------|----------|
| Hero | `ScreenHero` | “Play!” | — | — |
| Identity | Column | Name | Email | — |
| Points / tiers | **Row:** 3 cells with vertical rules | Point value | Label (wrap 2 lines) | — |
| Recent events | Column of `ThemedCard` | Event title | Date caption | — |

**Slop gates:** 3 ✓ (table, not icon tiles). 9 ✓ (different from Home). **E ⚠️** duplicate `threeColRow` block — should be `MetricColumns` component.

---

### Menu · News · Attended events

Shell: `ScreenHero` + `ScreenSurface` ✓  
Content: `ListRowCard` / `Surface` cards ✓  
Purpose-clear navigation and lists.

---

## Row vs column rules (for this app)

| Pattern | Use column | Use row |
|---------|------------|---------|
| Screen body | Default scroll **column** | — |
| Hero identity | Greeting → name → meta **stacked** | Avatar **beside** text column (Home) |
| Summary KPI | — | Badge \| story \| stat pill (Profile, Home rank) |
| Comparable metrics | Stack section titles | 2–3 stats with equal flex (Home stats, Play tables) |
| Lists | Event feed, news, menu | — |
| Toolbars | — | Compare button \| clear (Profile) |
| Card interior | Title → subtitle → chip | Icon bubble \| timestamp (feed header) |

**Rule of thumb:** If it scans as one “sentence” (rank + XP + badge), use a **row** with `alignItems: 'center'` (`ToolbarRow` or `flex-row items-center`). If it scans as a “paragraph”, use a **column**.

---

## Components we have vs should add

| Have | Use for | Missing (recommended) |
|------|---------|------------------------|
| `ScreenHero` / `ScreenSurface` | Tint pages (Events, Play, …) | Home: custom hero OK; Profile: pick one header pattern |
| `Section` | Titled blocks + divider | — |
| `ThemedCard` | Primary content blocks | Don’t nest cards |
| `Surface` | Lighter cards (news, attended) | — |
| `ListRowCard` | Menu/settings rows | — |
| `SearchField` | Search UIs | — |
| `EmptyState` | Zero data | — |
| `Text` variants | Profile, NativeWind screens | Home/Play still on raw `Text` + `TYPOGRAPHY` |
| `AppIcon` | All icons | — |
| `ToolbarRow` | Icon+button rows | — |
| — | — | **`StatTile`** (value + label, column) |
| — | — | **`RankSummaryRow`** (badge + copy + XP pill) |
| — | — | **`MetricColumns`** (Play 3-up with dividers) |
| — | — | **`FeedEventCard`** (activity feed) |

---

## Gate sweep (active tabs) — honest

| Gate | Home | Profile | Events | Play |
|------|------|---------|--------|------|
| 3 Icon grid | no | no | no | no |
| 4 Nested card | no | no | no | no |
| 9 Same fingerprint | no | no | no | no |
| 10 Section rhythm | **yes** (badges) | no | no | no |
| 32 Mixed icons | no | no | no | no |
| 53 Centred hero | no | no | no | no |
| 56 Fake metrics | no | no | no | **yes** (mock championship points) |
| 58 Token freestyle | **yes** (partial) | partial | no | partial |
| Typography consistency | **yes** | no | partial | **yes** |

**Stamp:** `· slop: pass (active) · components: StatTile, RankSummaryRow, RankProgressCard, FeedEventCard, MetricColumns, EventBannerCard · shell: ScreenHero+Surface`

---

## Recommended next pass (in order)

1. **`RankSummaryRow`** — Profile summary + Home rank card header (one row pattern).
2. **`StatTile`** — Home stats row (2-up).
3. **`FeedEventCard`** — Home activity + Play recent events.
4. **Home** → `ScreenSurface` for sheet; badges inside `Section`.
5. **Profile** → `RankSummaryRow`; trim “How it works”; unify `Text` variants on Home/Play.
6. **Play** → replace mock blocks with API or label “Reference” (gate 56).

See [`SLOP_COMPONENTS.md`](SLOP_COMPONENTS.md) for gate → component mapping.
