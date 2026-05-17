'use client'

import { CityProject, CityStats } from '@/lib/types'
import { COLOR_NAMES, GLASS_COLORS } from '@/lib/constants'

export function HUD({ stats }: { stats: CityStats }) {
  return (
    <div className="fixed top-0 left-0 z-10 p-6 pointer-events-none">
      <h1 className="text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tight">
        Macondo City
      </h1>
      <p className="text-sm text-white/70 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        {stats.total_projects} projects · {stats.total_hours} hours
      </p>
    </div>
  )
}

export function Legend({ stats }: { stats: CityStats }) {
  return (
    <div className="fixed top-0 right-0 z-10 p-6">
      <div className="bg-black/40 backdrop-blur-md rounded-lg border border-white/10 px-4 py-3">
        <div className="text-[10px] font-semibold text-white/60 tracking-widest mb-2">
          {stats.total_projects} PROJECTS
        </div>
        <div className="flex flex-col gap-1">
          {COLOR_NAMES.map((name, i) => {
            const hex = '#' + GLASS_COLORS[i % GLASS_COLORS.length].toString(16).padStart(6, '0')
            return (
              <div key={name} className="flex items-center gap-2 text-[11px] text-white/70">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: hex }} />
                {name}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function InfoPanel({ project, onClose }: { project: CityProject | null; onClose: () => void }) {
  if (!project) return null
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-white/15 px-6 py-4 shadow-2xl min-w-[280px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">{project.name}</h3>
            <p className="text-sm text-white/60">by {project.owner}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-white/75">
          <span className="capitalize">{project.type}</span>
          <span>L{project.level} {project.fruit}</span>
          <span>{project.streak_days}d streak</span>
          <span>{project.upvotes} upvotes</span>
        </div>
      </div>
    </div>
  )
}

export function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#7ec8e3]">
      <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mb-4" />
      <p className="text-white/80 text-sm font-medium">Planting your city...</p>
    </div>
  )
}

export function ErrorOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 px-8 py-6 max-w-md text-center">
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-white/70 text-sm">{message}</p>
      </div>
    </div>
  )
}

export function RotateButton({ autoRotate, onToggle }: { autoRotate: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-6 right-6 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:bg-black/60 transition-all text-lg"
      title="Toggle auto-rotate"
    >
      {autoRotate ? '⟳' : '⟳'}
    </button>
  )
}

export function ControlsHint() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 text-[11px] text-white/40 pointer-events-none select-none">
      Scroll to zoom · Drag to orbit · Click a building
    </div>
  )
}
