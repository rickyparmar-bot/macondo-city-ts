import { NextResponse } from 'next/server'
import { generateCity } from '@/lib/city-generator'
import { DEMO_PROJECTS } from '@/lib/constants'
import { MacondoProject } from '@/lib/types'

const MACONDO_API = 'https://macondo.hackclub.com/api/explore/projects'

export async function GET() {
  try {
    const allItems: MacondoProject[] = []
    let cursor: string | null = null

    while (true) {
      const url: string = cursor ? `${MACONDO_API}?cursor=${cursor}` : MACONDO_API
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MacondoCity/1.0' },
        next: { revalidate: 60 },
      })
      if (res.status === 429) break
      if (!res.ok) throw new Error(`Macondo API error: ${res.status}`)
      const data = await res.json()
      const items = data.items || []
      if (items.length === 0) break
      allItems.push(...items)
      if (!data.next_cursor) break
      cursor = data.next_cursor
    }

    if (allItems.length === 0) {
      return NextResponse.json(generateCity(DEMO_PROJECTS))
    }

    return NextResponse.json(generateCity(allItems))
  } catch (err) {
    const e = err as Error
    return NextResponse.json(
      { error: e.message, demo: true, ...generateCity(DEMO_PROJECTS) },
      { status: 502 }
    )
  }
}
