'use client'

import { useEffect, useState, useCallback } from 'react'
import { CityData, CityProject } from '@/lib/types'
import CityCanvas from '@/components/CityCanvas'
import { HUD, Legend, InfoPanel, Loading, ErrorOverlay, RotateButton, ControlsHint } from '@/components/Overlay'

export default function CityClient() {
  const [data, setData] = useState<CityData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<CityProject | null>(null)
  const [hovered, setHovered] = useState<CityProject | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)

  useEffect(() => {
    async function load() {
      let cityData: CityData | null = null
      try {
        const res = await fetch('/api/macondo-projects')
        if (res.ok) {
          const json = await res.json()
          if (json.projects && json.projects.length > 0) {
            cityData = json as CityData
          }
        }
      } catch { /* fall through */ }

      if (!cityData || !cityData.projects?.length) {
        try {
          const res = await fetch('/api/demo-data')
          if (res.ok) {
            const json = await res.json()
            if (json.projects?.length) {
              cityData = json as CityData
            }
          }
        } catch { /* fall through */ }
      }

      if (cityData?.projects?.length) {
        setData(cityData)
      } else {
        setError('No city data available.')
      }
    }
    load()
  }, [])

  const handleSelect = useCallback((p: CityProject | null) => {
    setSelected(p)
  }, [])

  const handleHover = useCallback((p: CityProject | null) => {
    setHovered(p)
    document.body.style.cursor = p ? 'pointer' : 'default'
  }, [])

  if (error) return <ErrorOverlay message={error} />
  if (!data) return <Loading />

  return (
    <div className="w-full h-screen relative">
      <CityCanvas
        data={data}
        selected={selected}
        hovered={hovered}
        onSelect={handleSelect}
        onHover={handleHover}
        autoRotate={autoRotate}
      />
      <HUD stats={data.stats} />
      <Legend stats={data.stats} />
      <InfoPanel project={selected} onClose={() => setSelected(null)} />
      <RotateButton autoRotate={autoRotate} onToggle={() => setAutoRotate(a => !a)} />
      <ControlsHint />
    </div>
  )
}
