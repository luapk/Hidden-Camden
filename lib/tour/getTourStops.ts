import { asc, eq } from 'drizzle-orm'
import {
  LAUNCH_ROUTE,
  STOP_ACCENTS,
  STOP_IMAGES,
  type TourStop,
} from './launchRoute'

/**
 * Loads the live route's stops as TourStop[].
 *
 * DB-first; if the database is unreachable, unconfigured, or empty, falls
 * back to the static launch route so the consumer app always has a tour.
 * Used by both the tour page and GET /api/tour.
 */
export async function getTourStops(): Promise<TourStop[]> {
  try {
    const { db } = await import('@/lib/db')
    const { routes, routeStops } = await import('@/lib/db/schema')

    const route = await db.query.routes.findFirst({
      where: eq(routes.status, 'live'),
      with: {
        routeStops: {
          orderBy: [asc(routeStops.position)],
          with: { venue: true, reward: true },
        },
      },
    })

    if (!route || route.routeStops.length === 0) {
      return LAUNCH_ROUTE
    }

    return route.routeStops.map((stop, i) => {
      const fallback = LAUNCH_ROUTE[i] as TourStop | undefined
      return {
        position: stop.position,
        name: stop.venue.name,
        subtitle: fallback?.subtitle ?? '',
        lat: stop.venue.lat,
        lng: stop.venue.lng,
        radiusM: stop.venue.geofence_radius_m,
        rewardLabel: stop.reward.sku_label,
        rewardWindow: `${stop.reward.window_start} to ${stop.reward.window_end}`,
        runtimeS: stop.runtime_s ?? fallback?.runtimeS ?? 135,
        isFree: stop.is_free,
        accent: STOP_ACCENTS[i % STOP_ACCENTS.length],
        image: fallback?.image ?? STOP_IMAGES[i % STOP_IMAGES.length],
        transcript: stop.transcript ?? fallback?.transcript ?? '',
        audioUrl: stop.audio_url,
      }
    })
  } catch {
    return LAUNCH_ROUTE
  }
}
