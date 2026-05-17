import { CityProject, CityData, CityBlock, CityLayout, RoadSeg, Intersection, MacondoProject } from '@/lib/types'
import { FRUIT_COLORS, DEFAULT_COLOR } from '@/lib/constants'

function mulberry32(a: number) {
  return function () {
    a |= 0; a = a + 0x6d2b79f5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function getFruitColor(fruit: string): string {
  return FRUIT_COLORS[fruit] || DEFAULT_COLOR
}

/* ── Block grid with organic sizing ── */

function generateBlockGrid(rng: () => number, numProjects: number): {
  blocks: CityBlock[]; gridCols: number; gridRows: number
} {
  const numParks = Math.max(1, Math.floor(numProjects / 12))
  const buildingBlocks = Math.ceil(numProjects / 3)
  const totalBlocks = buildingBlocks + numParks
  const gridCols = Math.max(2, Math.ceil(Math.sqrt(totalBlocks * 1.3)))
  const gridRows = Math.max(2, Math.ceil(totalBlocks / gridCols))
  const centerCol = (gridCols - 1) / 2
  const centerRow = (gridRows - 1) / 2

  const blocks: CityBlock[] = []
  let id = 0

  // Block widths/depths vary per column/row
  const colWidths: number[] = []
  const rowDepths: number[] = []
  for (let c = 0; c < gridCols; c++) {
    const distFromCenter = Math.abs(c - centerCol) / Math.max(1, centerCol)
    colWidths.push(6 + distFromCenter * 4 + rng() * 2) // downtown blocks smaller, suburbs larger
  }
  for (let r = 0; r < gridRows; r++) {
    const distFromCenter = Math.abs(r - centerRow) / Math.max(1, centerRow)
    rowDepths.push(6 + distFromCenter * 4 + rng() * 2)
  }

  // Road widths between columns/rows
  const MAIN_ROAD = 3.5
  const SIDE_ROAD = 2.5
  const mainCol = Math.floor(centerCol)
  const mainRow = Math.floor(centerRow)

  // Compute cumulative positions
  const colX: number[] = [0]
  for (let c = 1; c < gridCols; c++) {
    const roadW = (c === mainCol + 1 || c === mainCol) ? MAIN_ROAD : SIDE_ROAD
    colX.push(colX[c - 1] + colWidths[c - 1] + roadW)
  }
  const rowZ: number[] = [0]
  for (let r = 1; r < gridRows; r++) {
    const roadW = (r === mainRow + 1 || r === mainRow) ? MAIN_ROAD : SIDE_ROAD
    rowZ.push(rowZ[r - 1] + rowDepths[r - 1] + roadW)
  }

  // Select park indices (prefer non-center blocks)
  const parkIndices = new Set<number>()
  const candidates: number[] = []
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const dist = Math.sqrt(Math.pow(c - centerCol, 2) + Math.pow(r - centerRow, 2))
      if (dist > 0.8) candidates.push(r * gridCols + c)
    }
  }
  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  for (let i = 0; i < numParks && i < candidates.length; i++) {
    parkIndices.add(candidates[i])
  }

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const linearIdx = r * gridCols + c
      const dist = Math.sqrt(Math.pow(c - centerCol, 2) + Math.pow(r - centerRow, 2))
      const maxDist = Math.sqrt(centerCol * centerCol + centerRow * centerRow) || 1
      const normDist = dist / maxDist

      let zone: CityBlock['zone'] = 'suburban'
      if (normDist < 0.35) zone = 'downtown'
      else if (normDist < 0.65) zone = 'midtown'

      blocks.push({
        id: id++,
        cx: colX[c] + colWidths[c] / 2,
        cz: rowZ[r] + rowDepths[r] / 2,
        w: colWidths[c],
        d: rowDepths[r],
        type: parkIndices.has(linearIdx) ? 'park' : 'buildings',
        zone,
      })
    }
  }

  return { blocks, gridCols, gridRows }
}

/* ── Road network from block grid ── */

function generateRoadNetwork(
  blocks: CityBlock[],
  gridCols: number,
  gridRows: number,
): { roads: RoadSeg[]; intersections: Intersection[] } {
  const roads: RoadSeg[] = []
  const intersections: Intersection[] = []
  let roadId = 0

  // Find bounding extent
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const b of blocks) {
    minX = Math.min(minX, b.cx - b.w / 2)
    maxX = Math.max(maxX, b.cx + b.w / 2)
    minZ = Math.min(minZ, b.cz - b.d / 2)
    maxZ = Math.max(maxZ, b.cz + b.d / 2)
  }
  const margin = 6
  const extMinX = minX - margin
  const extMaxX = maxX + margin
  const extMinZ = minZ - margin
  const extMaxZ = maxZ + margin

  const centerCol = (gridCols - 1) / 2
  const centerRow = (gridRows - 1) / 2

  // Horizontal roads between rows
  for (let r = 0; r < gridRows - 1; r++) {
    const topBlock = blocks[r * gridCols]
    const botBlock = blocks[(r + 1) * gridCols]
    const roadZ = (topBlock.cz + topBlock.d / 2 + botBlock.cz - botBlock.d / 2) / 2
    const roadW = (botBlock.cz - botBlock.d / 2) - (topBlock.cz + topBlock.d / 2)
    const isMain = Math.abs(r - centerRow + 0.5) < 1

    roads.push({
      id: roadId++,
      x1: extMinX, z1: roadZ, x2: extMaxX, z2: roadZ,
      cx: (extMinX + extMaxX) / 2, cz: roadZ,
      length: extMaxX - extMinX,
      width: Math.max(2, roadW),
      direction: 'h',
      isMainRoad: isMain,
    })
  }

  // Vertical roads between columns
  for (let c = 0; c < gridCols - 1; c++) {
    const leftBlock = blocks[c]
    const rightBlock = blocks[c + 1]
    const roadX = (leftBlock.cx + leftBlock.w / 2 + rightBlock.cx - rightBlock.w / 2) / 2
    const roadW = (rightBlock.cx - rightBlock.w / 2) - (leftBlock.cx + leftBlock.w / 2)
    const isMain = Math.abs(c - centerCol + 0.5) < 1

    roads.push({
      id: roadId++,
      x1: roadX, z1: extMinZ, x2: roadX, z2: extMaxZ,
      cx: roadX, cz: (extMinZ + extMaxZ) / 2,
      length: extMaxZ - extMinZ,
      width: Math.max(2, roadW),
      direction: 'v',
      isMainRoad: isMain,
    })
  }

  // Intersections where horizontal and vertical roads cross
  const hRoads = roads.filter(r => r.direction === 'h')
  const vRoads = roads.filter(r => r.direction === 'v')
  for (const hr of hRoads) {
    for (const vr of vRoads) {
      intersections.push({
        x: vr.cx,
        z: hr.cz,
        size: Math.max(hr.width, vr.width) + 0.5,
      })
    }
  }

  return { roads, intersections }
}

/* ── Main generator ── */

export function generateCity(macondoItems: MacondoProject[]): CityData {
  const rng = mulberry32(42)
  const projects: CityProject[] = []

  for (const item of macondoItems) {
    if (!item.has_shipped) continue
    const level = item.level ?? 1
    const streak = item.project_streak_days ?? 0
    const fruit = item.fruit || 'Mango'
    const name = item.name || 'Unnamed'
    const owner = typeof item.owner === 'object' && item.owner !== null
      ? (item.owner as { username: string }).username || 'unknown'
      : String(item.owner || 'unknown')

    projects.push({
      name, owner,
      type: item.type || 'software',
      fruit, level, streak_days: streak,
      upvotes: item.upvote_count || 0,
      x: 0, z: 0, height: 0, width: 0, depth: 0, color: '#888',
    })
  }

  if (projects.length === 0) {
    return {
      projects: [],
      stats: { total_projects: 0, total_hours: 0, city_size: 1 },
      layout: { blocks: [], roads: [], intersections: [] },
    }
  }

  // Sort by "importance" — high importance goes to downtown
  projects.sort((a, b) => {
    const ia = a.level * 3 + a.streak_days * 0.5 + a.upvotes * 0.1
    const ib = b.level * 3 + b.streak_days * 0.5 + b.upvotes * 0.1
    return ib - ia // descending
  })

  // Generate block grid
  const { blocks, gridCols, gridRows } = generateBlockGrid(rng, projects.length)

  // Assign projects to building blocks (downtown first)
  const buildingBlocks = blocks
    .filter(b => b.type === 'buildings')
    .sort((a, b) => {
      const zoneOrder = { downtown: 0, midtown: 1, suburban: 2 }
      return zoneOrder[a.zone] - zoneOrder[b.zone]
    })

  const heightMultiplier: Record<string, number> = {
    downtown: 1.6,
    midtown: 1.0,
    suburban: 0.65,
  }

  let projIdx = 0
  for (const block of buildingBlocks) {
    if (projIdx >= projects.length) break
    const perBlock = Math.min(4, projects.length - projIdx)
    const cols = perBlock <= 2 ? perBlock : 2
    const rows = Math.ceil(perBlock / cols)
    const spacingX = block.w / (cols + 1)
    const spacingZ = block.d / (rows + 1)

    for (let r = 0; r < rows && projIdx < projects.length; r++) {
      for (let c = 0; c < cols && projIdx < projects.length; c++) {
        const proj = projects[projIdx]
        const localX = (c + 1) * spacingX - block.w / 2
        const localZ = (r + 1) * spacingZ - block.d / 2

        const zoneMult = heightMultiplier[block.zone]
        const baseH = proj.level * 3 + proj.streak_days * 0.15
        const h = baseH * zoneMult + rng() * 1.5

        const w = 0.8 + Math.min(proj.streak_days, 15) * 0.04 + rng() * 0.2
        const d = 0.8 + Math.min(proj.streak_days, 12) * 0.04 + rng() * 0.2

        proj.x = Math.round((block.cx + localX + (rng() - 0.5) * 0.3) * 100) / 100
        proj.z = Math.round((block.cz + localZ + (rng() - 0.5) * 0.3) * 100) / 100
        proj.height = Math.round(Math.max(1.5, h) * 100) / 100
        proj.width = Math.round(Math.max(0.5, w) * 100) / 100
        proj.depth = Math.round(Math.max(0.5, d) * 100) / 100
        proj.color = getFruitColor(proj.fruit)

        projIdx++
      }
    }
  }

  // Remove unplaced projects
  const placed = projects.slice(0, projIdx)

  // Center everything
  if (placed.length > 0) {
    const cx = placed.reduce((s, p) => s + p.x, 0) / placed.length
    const cz = placed.reduce((s, p) => s + p.z, 0) / placed.length
    for (const p of placed) { p.x -= cx; p.z -= cz }
    for (const b of blocks) { b.cx -= cx; b.cz -= cz }
  }

  // Generate road network from centered blocks
  const { roads, intersections } = generateRoadNetwork(blocks, gridCols, gridRows)

  const maxExtent = Math.max(
    ...placed.map(p => Math.max(Math.abs(p.x), Math.abs(p.z))),
    ...blocks.map(b => Math.max(Math.abs(b.cx) + b.w / 2, Math.abs(b.cz) + b.d / 2))
  )

  return {
    projects: placed,
    stats: {
      total_projects: placed.length,
      total_hours: Math.round(placed.reduce((s, p) => s + p.level * 5 + p.streak_days, 0) * 10) / 10,
      city_size: Math.ceil(maxExtent / 5) * 5 + 10,
    },
    layout: { blocks, roads, intersections },
  }
}
