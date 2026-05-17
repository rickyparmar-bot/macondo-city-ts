export interface MacondoProject {
  name: string
  owner: string | { username: string }
  type: string
  fruit: string
  level: number
  created_at: string
  has_shipped?: boolean
  project_streak_days?: number
  upvote_count?: number
}

export interface CityProject {
  name: string
  owner: string
  type: string
  fruit: string
  level: number
  streak_days: number
  upvotes: number
  x: number
  z: number
  height: number
  width: number
  depth: number
  color: string
}

export interface CityStats {
  total_projects: number
  total_hours: number
  city_size: number
}

/* ── Layout types ── */

export interface CityBlock {
  id: number
  cx: number; cz: number
  w: number; d: number
  type: 'buildings' | 'park'
  zone: 'downtown' | 'midtown' | 'suburban'
}

export interface RoadSeg {
  id: number
  x1: number; z1: number
  x2: number; z2: number
  cx: number; cz: number
  length: number
  width: number
  direction: 'h' | 'v'
  isMainRoad: boolean
}

export interface Intersection {
  x: number; z: number
  size: number
}

export interface CityLayout {
  blocks: CityBlock[]
  roads: RoadSeg[]
  intersections: Intersection[]
}

export interface CityData {
  projects: CityProject[]
  stats: CityStats
  layout: CityLayout
}
