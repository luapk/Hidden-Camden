import RouteFlythrough from './RouteFlythrough'

export const metadata = {
  title: 'Route flythrough · Hidden Camden',
}

// Full-screen 3D flythrough of the route. Sits outside the consumer chrome
// (no bottom nav, no width cap) but still behind the app password gate in
// the root layout.
export default function PreviewPage() {
  return <RouteFlythrough />
}
