'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { CityData, CityProject, CityBlock, RoadSeg, Intersection } from '@/lib/types'
import { GLASS_COLORS } from '@/lib/constants'
import { createEnvTexture } from '@/lib/env-texture'
import { createBuildingTexture } from '@/lib/building-texture'
import { initCars, updateCars, CarState } from '@/lib/traffic-system'

const UP = new THREE.Vector3(0, 1, 0)
const ONE = new THREE.Vector3(1, 1, 1)

/* ── Camera intro ── */
function CameraIntro({ target }: { target: THREE.Vector3 }) {
  const { camera } = useThree()
  const endPos = useMemo(() => new THREE.Vector3(target.x * 1.1, target.y * 0.6, target.z * 1.0), [target])
  const progress = useRef(0)
  useEffect(() => {
    camera.position.set(target.x * 1.1, target.y * 1.8, target.z * 1.5)
  }, [camera, target])
  useFrame((_, delta) => {
    if (progress.current < 1) {
      progress.current = Math.min(progress.current + delta / 2.5, 1)
      const t = 1 - Math.pow(1 - progress.current, 3)
      camera.position.lerp(endPos, t * 0.08)
    }
  })
  return null
}

/* ── Building ── */
interface BuildingProps {
  project: CityProject; idx: number; envTex: THREE.CanvasTexture
  onClick: (p: CityProject) => void; onHover: (p: CityProject | null) => void; isHovered: boolean
}
function Building({ project, idx, envTex, onClick, onHover, isHovered }: BuildingProps) {
  const { height: h, width: w, depth: d } = project
  const color = GLASS_COLORS[idx % GLASS_COLORS.length]
  const facadeTex = useMemo(() => createBuildingTexture(w, h, idx * 7 + 13, color), [w, h, idx, color])
  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({
    color, map: facadeTex, envMap: envTex, envMapIntensity: 1.4, metalness: 0.85, roughness: 0.15,
  }), [color, facadeTex, envTex])
  useEffect(() => {
    baseMat.color.setHex(isHovered ? 0xffffff : color)
    baseMat.emissive.setHex(isHovered ? color : 0x000000)
    baseMat.emissiveIntensity = isHovered ? 0.3 : 0
  }, [isHovered, baseMat, color])
  const ev = { onClick: () => onClick(project), onPointerOver: () => onHover(project), onPointerOut: () => onHover(null) }
  const roofMat = <meshStandardMaterial color={0x445566} roughness={0.6} metalness={0.4} />
  const shape = idx % 4
  // Share material via material={baseMat} instead of cloning
  if (shape === 0 && h > 4) {
    const bh = h * 0.7, th = h * 0.3, tw = w * 0.75, td = d * 0.75
    return (<group>
      <mesh position={[project.x, bh / 2, project.z]} material={baseMat} castShadow receiveShadow {...ev}><boxGeometry args={[w, bh, d]} /></mesh>
      <mesh position={[project.x, bh + th / 2, project.z]} material={baseMat} castShadow receiveShadow {...ev}><boxGeometry args={[tw, th, td]} /></mesh>
      <mesh position={[project.x, bh + th + 0.04, project.z]} castShadow><boxGeometry args={[w * 0.4, 0.06, d * 0.4]} />{roofMat}</mesh>
    </group>)
  }
  if (shape === 1 && h > 3) {
    const gw = w * 0.6, gd = d * 0.6
    return (<group>
      <mesh position={[project.x, h * 0.35, project.z - gd * 0.2]} material={baseMat} castShadow receiveShadow {...ev}><boxGeometry args={[w, h * 0.7, gd]} /></mesh>
      <mesh position={[project.x + w * 0.2, h * 0.35, project.z + d * 0.2]} material={baseMat} castShadow receiveShadow {...ev}><boxGeometry args={[gw, h * 0.7, d]} /></mesh>
      <mesh position={[project.x, h * 0.85, project.z]} material={baseMat} castShadow receiveShadow {...ev}><boxGeometry args={[w, h * 0.3, d]} /></mesh>
      <mesh position={[project.x, h + 0.04, project.z]} castShadow><boxGeometry args={[w * 0.5, 0.06, d * 0.5]} />{roofMat}</mesh>
    </group>)
  }
  return (<group>
    <mesh position={[project.x, h / 2, project.z]} material={baseMat} castShadow receiveShadow {...ev}><boxGeometry args={[w, h, d]} /></mesh>
    <mesh position={[project.x, h + 0.04, project.z]} castShadow><boxGeometry args={[w * 0.5, 0.06, d * 0.5]} />{roofMat}</mesh>
  </group>)
}

/* ── Building label ── */
function BuildingLabel({ project, height }: { project: CityProject; height: number }) {
  const name = project.name.length > 18 ? project.name.slice(0, 16) + '..' : project.name
  return (
    <Html position={[project.x, height + 0.6, project.z]} center>
      <div className="px-2 py-0.5 text-[10px] text-white/85 bg-black/60 rounded-sm border border-white/10 whitespace-nowrap backdrop-blur-sm tracking-wide font-sans">{name}</div>
    </Html>
  )
}

/* ── Ground ── */
function Ground({ size, envTex }: { size: number; envTex: THREE.CanvasTexture }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256
    const cx = c.getContext('2d')!
    cx.fillStyle = '#1a3820'; cx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 8000; i++) {
      const g = 30 + Math.random() * 35
      cx.fillStyle = `rgb(${Math.round(g * 0.5)},${g},${Math.round(g * 0.4)})`
      cx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(size / 5, size / 5)
    return t
  }, [size])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={tex} roughness={0.85} metalness={0.05} envMap={envTex} envMapIntensity={0.15} />
    </mesh>
  )
}

/* ── Shared road textures ── */
function makeAsphaltTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64
  const cx = c.getContext('2d')!
  cx.fillStyle = '#333338'; cx.fillRect(0, 0, 64, 64)
  for (let i = 0; i < 600; i++) {
    const v = 28 + Math.random() * 28
    cx.fillStyle = `rgba(${v},${v},${v},0.1)`
    cx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

function makeDashTex(color: string): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 64; c.height = 4
  const cx = c.getContext('2d')!
  cx.clearRect(0, 0, 64, 4)
  cx.fillStyle = color
  cx.fillRect(0, 0, 32, 4)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/* ── Roads (shared materials) ── */
function Roads({ roads }: { roads: RoadSeg[] }) {
  const asphaltMat = useMemo(() => {
    const tex = makeAsphaltTex()
    tex.repeat.set(6, 6)
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.02 })
  }, [])
  const whiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xffffff }), [])
  const yellowDashTex = useMemo(() => makeDashTex('#dddd33'), [])
  const whiteDashTex = useMemo(() => makeDashTex('#cccccc'), [])

  return (
    <group>
      {roads.map((road) => {
        const isH = road.direction === 'h'
        const geoArgs: [number, number] = isH ? [road.length, road.width] : [road.width, road.length]
        const dashTex = (road.isMainRoad ? yellowDashTex : whiteDashTex).clone()
        const dashRepeats = road.length / 3
        if (isH) dashTex.repeat.set(dashRepeats, 1)
        else dashTex.repeat.set(1, dashRepeats)
        const clGeo: [number, number] = isH ? [road.length, 0.1] : [0.1, road.length]
        const edgeGeo: [number, number] = isH ? [road.length, 0.08] : [0.08, road.length]
        const halfW = road.width / 2 - 0.06
        const e1: [number, number, number] = isH ? [road.cx, 0.025, road.cz - halfW] : [road.cx - halfW, 0.025, road.cz]
        const e2: [number, number, number] = isH ? [road.cx, 0.025, road.cz + halfW] : [road.cx + halfW, 0.025, road.cz]
        return (
          <group key={road.id}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[road.cx, 0.01, road.cz]} material={asphaltMat} receiveShadow><planeGeometry args={geoArgs} /></mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[road.cx, 0.025, road.cz]}><planeGeometry args={clGeo} /><meshStandardMaterial map={dashTex} transparent alphaTest={0.1} /></mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={e1} material={whiteMat}><planeGeometry args={edgeGeo} /></mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={e2} material={whiteMat}><planeGeometry args={edgeGeo} /></mesh>
          </group>
        )
      })}
    </group>
  )
}

/* ── Crosswalks ── */
function Crosswalks({ intersections }: { intersections: Intersection[] }) {
  const ixMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x333338, roughness: 0.92, metalness: 0.02 }), [])
  const cwMat = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128
    const cx = c.getContext('2d')!
    cx.fillStyle = '#333338'; cx.fillRect(0, 0, 128, 128)
    cx.fillStyle = '#eeeeee'
    for (let x = 10; x < 128; x += 24) cx.fillRect(x, 8, 14, 112)
    return new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: 0.9, transparent: true, opacity: 0.9 })
  }, [])
  return (
    <group>
      {intersections.map((ix, i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ix.x, 0.02, ix.z]} material={ixMat}><planeGeometry args={[ix.size, ix.size]} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ix.x, 0.04, ix.z - ix.size / 2]} material={cwMat}><planeGeometry args={[ix.size * 0.6, 0.8]} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ix.x, 0.04, ix.z + ix.size / 2]} material={cwMat}><planeGeometry args={[ix.size * 0.6, 0.8]} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ix.x + ix.size / 2, 0.04, ix.z]} material={cwMat}><planeGeometry args={[0.8, ix.size * 0.6]} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ix.x - ix.size / 2, 0.04, ix.z]} material={cwMat}><planeGeometry args={[0.8, ix.size * 0.6]} /></mesh>
        </group>
      ))}
    </group>
  )
}

/* ── Sidewalks (shared materials) ── */
function Sidewalks({ blocks }: { blocks: CityBlock[] }) {
  const platMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.85, metalness: 0.05 }), [])
  const curbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 }), [])
  return (
    <group>
      {blocks.map((b) => {
        const h = 0.12, pad = 0.3, w = b.w + pad * 2, d = b.d + pad * 2
        return (
          <group key={b.id}>
            <mesh position={[b.cx, h / 2 - 0.01, b.cz]} material={platMat} receiveShadow castShadow><boxGeometry args={[w, h, d]} /></mesh>
            <mesh position={[b.cx, h - 0.01, b.cz]} material={curbMat} receiveShadow><boxGeometry args={[w + 0.08, 0.03, d + 0.08]} /></mesh>
          </group>
        )
      })}
    </group>
  )
}

/* ── Parks (grass overlay + trees via parent AllTrees) ── */
function ParkGrass({ blocks }: { blocks: CityBlock[] }) {
  const grassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x2d6a2d, roughness: 0.95 }), [])
  const parkBlocks = useMemo(() => blocks.filter(b => b.type === 'park'), [blocks])
  return (
    <group>
      {parkBlocks.map(b => (
        <mesh key={b.id} rotation={[-Math.PI / 2, 0, 0]} position={[b.cx, 0.13, b.cz]} material={grassMat}>
          <planeGeometry args={[b.w * 0.9, b.d * 0.9]} />
        </mesh>
      ))}
    </group>
  )
}

/* ── All Trees via InstancedMesh (4 draw calls for ALL trees) ── */
function AllTrees({ positions }: { positions: [number, number, number][] }) {
  const count = positions.length
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.06, 0.09, 0.8, 5), [])
  const f1Geo = useMemo(() => new THREE.SphereGeometry(0.45, 5, 4), [])
  const f2Geo = useMemo(() => new THREE.SphereGeometry(0.3, 5, 3), [])
  const f3Geo = useMemo(() => new THREE.SphereGeometry(0.22, 4, 3), [])
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 }), [])
  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.1, 0.5, 0.12), roughness: 0.85 }), [])
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const f1Ref = useRef<THREE.InstancedMesh>(null)
  const f2Ref = useRef<THREE.InstancedMesh>(null)
  const f3Ref = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    const m = new THREE.Matrix4()
    for (let i = 0; i < count; i++) {
      const [x, y, z] = positions[i]
      m.makeTranslation(x, y + 0.4, z); trunkRef.current?.setMatrixAt(i, m)
      m.makeTranslation(x, y + 1.1, z); f1Ref.current?.setMatrixAt(i, m)
      m.makeTranslation(x + 0.15, y + 1.35, z + 0.1); f2Ref.current?.setMatrixAt(i, m)
      m.makeTranslation(x - 0.1, y + 1.45, z - 0.08); f3Ref.current?.setMatrixAt(i, m)
    }
    for (const ref of [trunkRef, f1Ref, f2Ref, f3Ref])
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  }, [positions, count])

  if (count === 0) return null
  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, count]} castShadow />
      <instancedMesh ref={f1Ref} args={[f1Geo, leafMat, count]} castShadow />
      <instancedMesh ref={f2Ref} args={[f2Geo, leafMat, count]} castShadow />
      <instancedMesh ref={f3Ref} args={[f3Geo, leafMat, count]} castShadow />
    </group>
  )
}

/* ── Traffic via InstancedMesh (2 draw calls for ALL cars) ── */
function TrafficSystem({ roads, intersections }: { roads: RoadSeg[]; intersections: Intersection[] }) {
  const [configs] = useState<CarState[]>(() => initCars(roads))
  const statesRef = useRef<CarState[]>(configs)
  const count = configs.length
  const bodyGeo = useMemo(() => new THREE.BoxGeometry(0.7, 0.2, 0.35), [])
  const cabinGeo = useMemo(() => new THREE.BoxGeometry(0.35, 0.15, 0.3), [])
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.6 }), [])
  const cabinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x88bbdd, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.7 }), [])
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const cabinRef = useRef<THREE.InstancedMesh>(null)

  // Set per-instance body colors once
  useEffect(() => {
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      c.setHex(configs[i].color); bodyRef.current?.setColorAt(i, c)
    }
    if (bodyRef.current?.instanceColor) bodyRef.current.instanceColor.needsUpdate = true
  }, [configs, count])

  // Reusable matrix objects (no allocation per frame)
  const _mat = useMemo(() => new THREE.Matrix4(), [])
  const _loc = useMemo(() => new THREE.Matrix4(), [])
  const _out = useMemo(() => new THREE.Matrix4(), [])
  const _quat = useMemo(() => new THREE.Quaternion(), [])
  const _pos = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    updateCars(statesRef.current, roads, intersections, delta)
    for (let i = 0; i < count; i++) {
      const car = statesRef.current[i]
      _quat.setFromAxisAngle(UP, car.heading)
      _pos.set(car.worldX, 0.18, car.worldZ)
      _mat.compose(_pos, _quat, ONE)
      bodyRef.current?.setMatrixAt(i, _mat)
      _loc.makeTranslation(0.02, 0.15, 0)
      _out.multiplyMatrices(_mat, _loc)
      cabinRef.current?.setMatrixAt(i, _out)
    }
    if (bodyRef.current) bodyRef.current.instanceMatrix.needsUpdate = true
    if (cabinRef.current) cabinRef.current.instanceMatrix.needsUpdate = true
  })

  if (count === 0) return null
  return (
    <group>
      <instancedMesh ref={bodyRef} args={[bodyGeo, bodyMat, count]} castShadow />
      <instancedMesh ref={cabinRef} args={[cabinGeo, cabinMat, count]} castShadow />
    </group>
  )
}

/* ── Lights (reduced shadow map) ── */
function SceneLights() {
  return (<>
    <ambientLight intensity={0.65} />
    <hemisphereLight args={[0x7ec8e3, 0x5a4a3a, 0.55]} />
    <directionalLight position={[30, 35, 25]} intensity={1.8} color={0xfff5e0} castShadow
      shadow-mapSize-width={2048} shadow-mapSize-height={2048}
      shadow-camera-left={-80} shadow-camera-right={80} shadow-camera-top={80} shadow-camera-bottom={-80}
      shadow-camera-near={1} shadow-camera-far={120} />
    <directionalLight position={[-20, 10, -30]} intensity={0.2} color={0x8899cc} />
  </>)
}

/* ── Collect all tree positions ── */
function collectTreePositions(blocks: CityBlock[]): [number, number, number][] {
  const result: [number, number, number][] = []
  // Park trees
  for (const b of blocks) {
    if (b.type !== 'park') continue
    const count = Math.floor(b.w * b.d / 5)
    for (let i = 0; i < count; i++) {
      const lx = (Math.sin(b.id * 1234.5 + i * 567.8) * 0.5 + 0.5 - 0.5) * (b.w * 0.8)
      const lz = (Math.sin(b.id * 2345.6 + i * 678.9) * 0.5 + 0.5 - 0.5) * (b.d * 0.8)
      result.push([b.cx + lx, 0.12, b.cz + lz])
    }
  }
  // Street trees along non-park blocks
  let s = 0
  for (const b of blocks) {
    if (b.type === 'park') continue
    for (let x = b.cx - b.w / 2 + 1; x < b.cx + b.w / 2; x += 3.5 + Math.sin(s++ * 1.3) * 0.8) {
      result.push([x, 0.12, b.cz - b.d / 2 - 0.2])
      result.push([x, 0.12, b.cz + b.d / 2 + 0.2])
    }
  }
  return result
}

/* ── Scene ── */
interface CitySceneProps {
  data: CityData; selected: CityProject | null; hovered: CityProject | null
  onSelect: (p: CityProject | null) => void; onHover: (p: CityProject | null) => void; autoRotate: boolean
}
function CityScene({ data, selected, hovered, onSelect, onHover, autoRotate }: CitySceneProps) {
  const envTex = useMemo(() => createEnvTexture(), [])
  const citySize = data.stats.city_size
  const groundSize = Math.max(60, citySize * 3)
  const controlsRef = useRef<any>(null)
  const camTarget = useMemo(() => new THREE.Vector3(0, 2, 0), [])
  const { blocks, roads, intersections } = data.layout
  const treePositions = useMemo(() => collectTreePositions(blocks), [blocks])

  useEffect(() => { if (controlsRef.current) controlsRef.current.autoRotate = autoRotate }, [autoRotate])

  return (<>
    <color attach="background" args={[0x7ec8e3]} />
    <fogExp2 attach="fog" args={[0x7ec8e3, 0.0025]} />
    <SceneLights />
    <Ground size={groundSize} envTex={envTex} />
    <Sidewalks blocks={blocks} />
    <Roads roads={roads} />
    <Crosswalks intersections={intersections} />
    <ParkGrass blocks={blocks} />
    <AllTrees positions={treePositions} />
    {roads.length > 0 && <TrafficSystem roads={roads} intersections={intersections} />}
    {data.projects.map((proj, i) => (
      <Building key={i} project={proj} idx={i} envTex={envTex}
        onClick={onSelect} onHover={onHover}
        isHovered={hovered?.name === proj.name && hovered?.owner === proj.owner} />
    ))}
    {data.projects.map((proj, i) => (
      <BuildingLabel key={`lbl-${i}`} project={proj} height={proj.height} />
    ))}
    <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05}
      minDistance={5} maxDistance={groundSize * 0.7} maxPolarAngle={Math.PI / 2.4}
      target={camTarget} autoRotate={false} autoRotateSpeed={0.8} />
    <CameraIntro target={camTarget} />
  </>)
}

/* ── Canvas wrapper ── */
interface CityCanvasProps {
  data: CityData; selected: CityProject | null; hovered: CityProject | null
  onSelect: (p: CityProject | null) => void; onHover: (p: CityProject | null) => void; autoRotate: boolean
}
export default function CityCanvas({ data, selected, hovered, onSelect, onHover, autoRotate }: CityCanvasProps) {
  return (
    <Canvas shadows dpr={[1, 1.5]}
      camera={{ position: [30, 40, 40], fov: 30, near: 0.1, far: 500 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.9, outputColorSpace: THREE.SRGBColorSpace, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}>
      <CityScene data={data} selected={selected} hovered={hovered} onSelect={onSelect} onHover={onHover} autoRotate={autoRotate} />
    </Canvas>
  )
}
