import * as THREE from 'three'

export function createEnvTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, 0, 1024)
  grad.addColorStop(0, '#1a5fc9')
  grad.addColorStop(0.05, '#2a7fe0')
  grad.addColorStop(0.2, '#5aaff0')
  grad.addColorStop(0.35, '#8ac8ff')
  grad.addColorStop(0.5, '#b0d8ff')
  grad.addColorStop(0.6, '#c8e0f0')
  grad.addColorStop(0.75, '#b0c8d8')
  grad.addColorStop(0.9, '#8898a8')
  grad.addColorStop(1, '#5a6a7a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 2048, 1024)

  const sg = ctx.createRadialGradient(1640, 120, 10, 1640, 120, 250)
  sg.addColorStop(0, 'rgba(255,252,240,1)')
  sg.addColorStop(0.05, 'rgba(255,252,240,0.8)')
  sg.addColorStop(0.15, 'rgba(255,248,230,0.3)')
  sg.addColorStop(0.4, 'rgba(255,240,220,0.08)')
  sg.addColorStop(1, 'rgba(255,240,220,0)')
  ctx.fillStyle = sg
  ctx.fillRect(1390, 0, 500, 500)

  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (const [x, y, rx, ry, angle] of [[700, 300, 200, 35, 0], [750, 290, 160, 28, 0.1], [1100, 380, 180, 25, -0.15], [1060, 370, 130, 20, -0.05]] as const) {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(200,220,255,0.03)'
  ctx.beginPath()
  ctx.ellipse(400, 500, 300, 12, 0, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  return texture
}
