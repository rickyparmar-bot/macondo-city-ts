import { NextResponse } from 'next/server'
import { generateCity } from '@/lib/city-generator'
import { DEMO_PROJECTS } from '@/lib/constants'

export async function GET() {
  return NextResponse.json(generateCity(DEMO_PROJECTS))
}
