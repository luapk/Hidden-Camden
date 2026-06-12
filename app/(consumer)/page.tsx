import { getTourStops } from '@/lib/tour/getTourStops'
import TourScreen from './TourScreen'

export const dynamic = 'force-dynamic'

export default async function TourPage() {
  const stops = await getTourStops()
  return <TourScreen stops={stops} />
}
