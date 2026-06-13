import { getStaffContext } from '@/lib/staff/auth'

export const dynamic = 'force-dynamic'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getStaffContext()

  return (
    <div className="min-h-screen bg-night text-label-1">
      <div className="mx-auto max-w-md px-4 pb-16">
        <header className="flex items-center justify-between border-b border-white/10 py-5">
          <div className="min-w-0">
            <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
              Behind the bar
            </div>
            <h1 className="mt-1 truncate font-jost text-xl font-bold uppercase leading-none tracking-tight text-label-1">
              {ctx?.venue.name ?? 'Camden Crawl'}
            </h1>
          </div>
          <span className="shrink-0 rounded-full border border-acid/40 px-2.5 py-1 font-grotesk text-[10px] uppercase tracking-[0.2em] text-acid">
            Staff
          </span>
        </header>
        {children}
      </div>
    </div>
  )
}
