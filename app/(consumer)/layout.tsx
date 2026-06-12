export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-ink text-cream">
      <div className="mx-auto max-w-md px-4 py-6">{children}</div>
    </div>
  )
}
