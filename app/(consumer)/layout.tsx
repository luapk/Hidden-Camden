import BottomNav from './BottomNav'

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <div className="mx-auto max-w-md px-4 pb-24 pt-5">{children}</div>
      <BottomNav />
    </div>
  )
}
