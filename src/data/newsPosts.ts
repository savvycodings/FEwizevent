export type NewsCategory = 'Launch' | 'In store' | 'Tournament'

export type NewsPost = {
  id: string
  title: string
  dateLabel: string
  category: NewsCategory
  excerpt: string
  body: string[]
  highlights?: string[]
}

export const newsPosts: NewsPost[] = [
  {
    id: 'chaos-rising-launch',
    title: 'Chaos Rising Launch',
    dateLabel: '26 May · 2:00 PM',
    category: 'Launch',
    excerpt: 'Booster packs on sale, 60 boxes available, casual tournament on the day.',
    highlights: [
      'Booster packs for sale, first come, first serve',
      '60 boxes available',
      'Casual tournament running during the launch',
    ],
    body: [
      'Join us for the Chaos Rising launch on 26 May at 2:00 PM.',
      'Booster packs will be on sale at the counter. Stock is limited to 60 boxes, first come, first serve. No reservations.',
      'While you are here, jump into our casual tournament. Friendly Swiss-style games, open to all trainers. Bring your deck and good vibes.',
      'Doors open at 1:30 PM so you can grab a spot in line. See you at the shop.',
    ],
  },
  {
    id: 'thursday-casual',
    title: 'Thursday Casual Tournament',
    dateLabel: 'Every Thursday · 6:30 PM',
    category: 'Tournament',
    excerpt: 'Weekly casual night. Free to enter, prizes for top finishers.',
    highlights: ['Free entry', 'Swiss rounds', 'Prize packs for top 4'],
    body: [
      'Our Thursday casual tournament is back every week at 6:30 PM.',
      'Three Swiss rounds, relaxed rules, and a great crowd. First-time players welcome; we will pair you with someone friendly.',
      'Top four finishers take home prize packs. Mark yourself attended in the app after the event so your streak and badges stay up to date.',
    ],
  },
  {
    id: 'weekend-restock',
    title: 'Weekend Restock & Singles',
    dateLabel: 'Sat 24 May · 10:00 AM',
    category: 'In store',
    excerpt: 'Fresh sealed product and new singles wall update this Saturday morning.',
    body: [
      'We are restocking sealed product and refreshing the singles wall this Saturday from 10:00 AM.',
      'Popular staples and a fresh batch of holos will be out on display. Ask staff if you are hunting something specific.',
    ],
  },
]

export function getNewsPost(id: string): NewsPost | undefined {
  return newsPosts.find((p) => p.id === id)
}
