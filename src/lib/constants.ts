export const GLASS_COLORS = [
  0x00FFFF, 0xFF00FF, 0x0055FF, 0x00FF00,
  0xFF6600, 0xFFD700, 0xFF0055, 0x00FFAA,
] as const

export const COLOR_NAMES = [
  'cyan', 'hot pink', 'electric blue', 'neon green',
  'orange', 'gold', 'ruby', 'mint',
]

export const FRUIT_COLORS: Record<string, string> = {
  Mango: '#FFD700', Guava: '#FFD700',
  Pineapple: '#FF8C00', Coconut: '#FF8C00',
  Papaya: '#FF2D7B', Watermelon: '#FF2D7B',
  Cocoa: '#8B5CF6', Avocado: '#8B5CF6',
}
export const DEFAULT_COLOR = '#888888'

export const DEMO_PROJECTS = [
  { name: 'Macondo City', owner: 'you', type: 'software', fruit: 'Papaya', level: 3, project_streak_days: 10, upvote_count: 42, created_at: '2026-05-16T00:00:00Z', has_shipped: true },
  { name: 'Discord Bot', owner: 'you', type: 'software', fruit: 'Pineapple', level: 2, project_streak_days: 8, upvote_count: 15, created_at: '2026-05-14T00:00:00Z', has_shipped: true },
  { name: 'Portfolio Site', owner: 'you', type: 'software', fruit: 'Mango', level: 1, project_streak_days: 5, upvote_count: 7, created_at: '2026-05-12T00:00:00Z', has_shipped: true },
  { name: 'Game Jam Entry', owner: 'you', type: 'software', fruit: 'Cocoa', level: 4, project_streak_days: 15, upvote_count: 38, created_at: '2026-05-10T00:00:00Z', has_shipped: true },
  { name: 'CLI Tool', owner: 'you', type: 'software', fruit: 'Mango', level: 1, project_streak_days: 3, upvote_count: 5, created_at: '2026-05-08T00:00:00Z', has_shipped: true },
  { name: 'Weather App', owner: 'you', type: 'software', fruit: 'Pineapple', level: 2, project_streak_days: 6, upvote_count: 12, created_at: '2026-05-06T00:00:00Z', has_shipped: true },
  { name: '3D Renderer', owner: 'you', type: 'software', fruit: 'Cocoa', level: 4, project_streak_days: 20, upvote_count: 55, created_at: '2026-05-04T00:00:00Z', has_shipped: true },
  { name: 'USB Hub', owner: 'you', type: 'hardware', fruit: 'Guava', level: 1, project_streak_days: 4, upvote_count: 9, created_at: '2026-05-02T00:00:00Z', has_shipped: true },
  { name: 'LED Matrix', owner: 'you', type: 'hardware', fruit: 'Coconut', level: 2, project_streak_days: 7, upvote_count: 14, created_at: '2026-04-30T00:00:00Z', has_shipped: true },
  { name: 'Cat Puzzle Game', owner: 'you', type: 'software', fruit: 'Pineapple', level: 2, project_streak_days: 12, upvote_count: 22, created_at: '2026-04-28T00:00:00Z', has_shipped: true },
  { name: 'Keyboard PCB', owner: 'you', type: 'hardware', fruit: 'Watermelon', level: 3, project_streak_days: 9, upvote_count: 31, created_at: '2026-04-26T00:00:00Z', has_shipped: true },
  { name: 'Markdown Previewer', owner: 'you', type: 'software', fruit: 'Mango', level: 1, project_streak_days: 2, upvote_count: 3, created_at: '2026-04-24T00:00:00Z', has_shipped: true },
]
