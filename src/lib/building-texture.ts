import * as THREE from 'three'

function mulberry32(a: number) {
  return function () {
    a |= 0; a = a + 0x6d2b79f5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

/** Generate a rich facade texture with windows, panels, and structural details */
export function createBuildingTexture(
  w: number,
  h: number,
  seed: number,
  baseColor: number,
): THREE.CanvasTexture {
  const rng = mulberry32(seed)
  const res = 256
  const canvas = document.createElement('canvas')
  canvas.width = res
  canvas.height = res
  const ctx = canvas.getContext('2d')!

  // Extract base color channels
  const r = (baseColor >> 16) & 0xff
  const g = (baseColor >> 8) & 0xff
  const b = baseColor & 0xff

  // Fill with a slightly muted version of the base color as the facade
  ctx.fillStyle = `rgb(${Math.round(r * 0.15)},${Math.round(g * 0.15)},${Math.round(b * 0.15)})`
  ctx.fillRect(0, 0, res, res)

  // Facade panel grid
  const cols = Math.max(3, Math.round(w / 0.22))
  const rows = Math.max(4, Math.round(h / 0.25))
  const cellW = res / cols
  const cellH = res / rows
  const windowPad = 3
  const mullionW = 2

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellW
      const y = row * cellH

      // Panel frame (structural mullions)
      ctx.fillStyle = `rgba(${Math.round(r * 0.2)},${Math.round(g * 0.2)},${Math.round(b * 0.2)},0.8)`
      ctx.fillRect(x, y, cellW, mullionW) // top
      ctx.fillRect(x, y, mullionW, cellH) // left

      // Window pane
      const wx = x + windowPad
      const wy = y + windowPad
      const ww = cellW - windowPad * 2 - mullionW
      const wh = cellH - windowPad * 2 - mullionW

      if (ww > 2 && wh > 2) {
        const lit = rng() > 0.35
        if (lit) {
          // Lit window — warm or cool tint
          const warmth = rng()
          if (warmth > 0.5) {
            const intensity = 0.4 + rng() * 0.5
            ctx.fillStyle = `rgba(${Math.round(255 * intensity)},${Math.round(240 * intensity)},${Math.round(180 * intensity)},${0.6 + rng() * 0.4})`
          } else {
            const intensity = 0.3 + rng() * 0.4
            ctx.fillStyle = `rgba(${Math.round(r * intensity)},${Math.round(g * intensity)},${Math.round(b * intensity)},${0.5 + rng() * 0.4})`
          }
        } else {
          // Dark window — deep reflection
          ctx.fillStyle = `rgba(15,20,35,${0.5 + rng() * 0.3})`
        }
        ctx.fillRect(wx, wy, ww, wh)

        // Window cross mullion
        if (ww > 10 && rng() > 0.4) {
          ctx.fillStyle = `rgba(${Math.round(r * 0.12)},${Math.round(g * 0.12)},${Math.round(b * 0.12)},0.6)`
          ctx.fillRect(wx + ww / 2 - 0.5, wy, 1, wh)
        }
        if (wh > 12 && rng() > 0.5) {
          ctx.fillStyle = `rgba(${Math.round(r * 0.12)},${Math.round(g * 0.12)},${Math.round(b * 0.12)},0.6)`
          ctx.fillRect(wx, wy + wh / 2 - 0.5, ww, 1)
        }

        // Subtle window reflection highlight
        if (lit && rng() > 0.6) {
          const hlGrad = ctx.createLinearGradient(wx, wy, wx + ww * 0.4, wy + wh * 0.4)
          hlGrad.addColorStop(0, 'rgba(255,255,255,0.15)')
          hlGrad.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = hlGrad
          ctx.fillRect(wx, wy, ww * 0.5, wh * 0.5)
        }
      }
    }
  }

  // Horizontal floor lines (structural bands)
  for (let row = 0; row <= rows; row += 3) {
    const y = Math.round(row * cellH)
    ctx.fillStyle = `rgba(${Math.round(r * 0.25)},${Math.round(g * 0.25)},${Math.round(b * 0.25)},0.5)`
    ctx.fillRect(0, y - 1, res, 3)
  }

  // Vertical structural columns
  for (let col = 0; col <= cols; col += Math.max(2, Math.floor(cols / 3))) {
    const x = Math.round(col * cellW)
    ctx.fillStyle = `rgba(${Math.round(r * 0.2)},${Math.round(g * 0.2)},${Math.round(b * 0.2)},0.35)`
    ctx.fillRect(x - 1, 0, 3, res)
  }

  // Noise overlay for material grain
  for (let i = 0; i < 1500; i++) {
    const nx = rng() * res
    const ny = rng() * res
    const v = rng() * 30
    ctx.fillStyle = `rgba(${v},${v},${v},0.06)`
    ctx.fillRect(nx, ny, 1.5, 1.5)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}
