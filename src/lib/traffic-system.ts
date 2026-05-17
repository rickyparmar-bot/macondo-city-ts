import { RoadSeg, Intersection } from '@/lib/types'

export interface CarState {
  id: number
  roadIndex: number
  t: number           // 0→1 position along road
  speed: number       // current speed (units/sec)
  maxSpeed: number
  direction: 1 | -1   // travel direction along segment
  lane: number         // lateral offset from center (+right, -left)
  color: number
  worldX: number
  worldZ: number
  heading: number
  braking: boolean
}

const CAR_COLORS = [0xe63946, 0x457b9d, 0xf4a261, 0x2a9d8f, 0x264653, 0xe9c46a, 0xf77f00, 0x9b5de5, 0xd62828, 0x023e8a]
const STOP_DIST = 1.2
const SLOW_DIST = 3.5
const INTERSECTION_ZONE = 2.5
const LANE_OFFSET = 0.45

function seededRng(seed: number) {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

/** Get world position for a car on a road segment */
function getWorldPos(road: RoadSeg, t: number, lane: number, dir: 1 | -1): { x: number; z: number; heading: number } {
  const clampT = Math.max(0, Math.min(1, t))
  if (road.direction === 'h') {
    const x = road.x1 + (road.x2 - road.x1) * clampT
    const z = road.cz + lane * dir  // lane offset perpendicular
    return { x, z, heading: dir > 0 ? 0 : Math.PI }
  } else {
    const z = road.z1 + (road.z2 - road.z1) * clampT
    const x = road.cx + lane * dir
    return { x, z, heading: dir > 0 ? Math.PI / 2 : -Math.PI / 2 }
  }
}

/** Distance along road between two t values, in world units */
function distAlongRoad(road: RoadSeg, t1: number, t2: number): number {
  return Math.abs(t2 - t1) * road.length
}

/** Check if a position is near any intersection */
function nearIntersection(x: number, z: number, intersections: Intersection[]): Intersection | null {
  for (const ix of intersections) {
    if (Math.abs(x - ix.x) < ix.size / 2 + 0.5 && Math.abs(z - ix.z) < ix.size / 2 + 0.5) {
      return ix
    }
  }
  return null
}

/** Initialize car fleet across all road segments */
export function initCars(roads: RoadSeg[], seed = 99): CarState[] {
  const rng = seededRng(seed)
  const cars: CarState[] = []
  let id = 0

  for (let ri = 0; ri < roads.length; ri++) {
    const road = roads[ri]
    const count = Math.max(1, Math.floor(road.length / 10))

    for (let c = 0; c < count; c++) {
      const dir: 1 | -1 = rng() > 0.5 ? 1 : -1
      const t = c / count + rng() * 0.08
      const maxSpeed = 1.5 + rng() * 2.0
      const lane = LANE_OFFSET
      const pos = getWorldPos(road, t, lane, dir)

      cars.push({
        id: id++,
        roadIndex: ri,
        t,
        speed: maxSpeed * (0.6 + rng() * 0.4),
        maxSpeed,
        direction: dir,
        lane,
        color: CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)],
        worldX: pos.x,
        worldZ: pos.z,
        heading: pos.heading,
        braking: false,
      })
    }
  }

  return cars
}

/** Advance all cars by delta seconds. Mutates car states in place. */
export function updateCars(
  cars: CarState[],
  roads: RoadSeg[],
  intersections: Intersection[],
  delta: number,
): void {
  const dt = Math.min(delta, 0.05) // cap to avoid jumps

  // Group cars by road for efficient neighbor lookup
  const byRoad = new Map<number, CarState[]>()
  for (const car of cars) {
    let arr = byRoad.get(car.roadIndex)
    if (!arr) { arr = []; byRoad.set(car.roadIndex, arr) }
    arr.push(car)
  }

  for (const car of cars) {
    const road = roads[car.roadIndex]
    if (!road) continue

    let targetSpeed = car.maxSpeed

    // ── 1. Same-road collision avoidance ──
    const neighbors = byRoad.get(car.roadIndex) || []
    let closestAheadDist = Infinity

    for (const other of neighbors) {
      if (other.id === car.id || other.direction !== car.direction) continue
      // "Ahead" means: in the car's travel direction, the other car has a higher t (if dir=1) or lower t (if dir=-1)
      const diff = (other.t - car.t) * car.direction
      if (diff > 0) {
        const dist = diff * road.length
        if (dist < closestAheadDist) closestAheadDist = dist
      }
    }

    if (closestAheadDist < STOP_DIST) {
      targetSpeed = 0
    } else if (closestAheadDist < SLOW_DIST) {
      const ratio = (closestAheadDist - STOP_DIST) / (SLOW_DIST - STOP_DIST)
      targetSpeed = car.maxSpeed * ratio * 0.7
    }

    // ── 2. Intersection yielding ──
    const pos = getWorldPos(road, car.t, car.lane, car.direction)
    const ix = nearIntersection(pos.x, pos.z, intersections)

    if (ix) {
      // Check for cross-traffic in the intersection
      for (const other of cars) {
        if (other.id === car.id || other.roadIndex === car.roadIndex) continue
        const otherRoad = roads[other.roadIndex]
        if (!otherRoad) continue
        // Only check perpendicular roads
        if (otherRoad.direction === road.direction) continue

        const otherPos = getWorldPos(otherRoad, other.t, other.lane, other.direction)
        const dx = pos.x - otherPos.x
        const dz = pos.z - otherPos.z
        const dist = Math.sqrt(dx * dx + dz * dz)

        if (dist < INTERSECTION_ZONE && other.speed > 0.3) {
          // Yield: lower-ID roads have priority (simple priority rule)
          if (car.roadIndex > other.roadIndex) {
            targetSpeed = 0
            break
          }
        }
      }
    }

    // ── 3. Smooth speed change ──
    car.braking = targetSpeed < car.speed * 0.5
    const accel = targetSpeed > car.speed ? 3.0 : 6.0 // accelerate slower, brake faster
    if (car.speed < targetSpeed) {
      car.speed = Math.min(car.speed + accel * dt, targetSpeed)
    } else {
      car.speed = Math.max(car.speed - accel * dt, targetSpeed)
    }

    // ── 4. Move ──
    const tDelta = (car.speed * dt) / road.length
    car.t += tDelta * car.direction

    // Wrap around
    if (car.t > 1) car.t -= 1
    if (car.t < 0) car.t += 1

    // ── 5. Update world position ──
    const newPos = getWorldPos(road, car.t, car.lane, car.direction)
    car.worldX = newPos.x
    car.worldZ = newPos.z
    car.heading = newPos.heading
  }
}
