import { NextResponse } from 'next/server'
import { getTourStops } from '@/lib/tour/getTourStops'

export const dynamic = 'force-dynamic'

/** Returns the live tour as TourStop[]. DB-first with static fallback. */
export async function GET() {
  const stops = await getTourStops()
  return NextResponse.json(stops)
}
