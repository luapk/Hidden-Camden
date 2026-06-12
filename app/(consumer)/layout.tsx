import BottomNav from './BottomNav'

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-night font-jost text-label-1">
      <div className="mx-auto max-w-md px-4 pb-32 pt-5">{children}</div>
      <BottomNav />
    </div>
  )
}
