import * as THREE from 'three'

function mulberry32(a: number) {
  return function () {
    a |= 0; a = a + 0x6d2b79f5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function createGlassGrid(w: number, h: number, seed: number): THREE.CanvasTexture {
  const rng = mulberry32(seed + 57)
  const cols = Math.max(4, Math.round(w / 0.09))
  const rows = Math.max(6, Math.round(h / 0.11))
  const cw = 256
  const ch = 256
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, cw, ch)

  const stepX = cw / cols
  const stepY = ch / rows

  ctx.fillStyle = 'rgba(20,25,35,0.3)'
  for (let i = 1; i < cols; i++) {
    ctx.fillRect(Math.round(i * stepX), 0, 1, ch)
  }
  for (let i = 1; i < rows; i++) {
    ctx.fillRect(0, Math.round(i * stepY), cw, 1)
  }

  ctx.fillStyle = 'rgba(20,25,35,0.15)'
  for (let i = 0; i < rows; i += 4) {
    const y = Math.round(i * stepY)
    ctx.fillRect(0, y - 1, cw, 2)
  }
  for (let i = 0; i < cols; i += 5) {
    const x = Math.round(i * stepX)
    ctx.fillRect(x - 1, 0, 2, ch)
  }

  return new THREE.CanvasTexture(canvas)
}
