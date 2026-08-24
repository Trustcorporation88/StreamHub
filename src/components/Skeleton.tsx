import { useTheme } from "../context/ThemeContext"

/**
 * Placeholder blocks shown while content loads. Preferred over a centred
 * spinner for lists: the page keeps its shape, so nothing jumps when the real
 * rows arrive, and the wait reads as shorter than it is.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  const { theme } = useTheme()
  const base = theme === "dark" ? "bg-white/5" : "bg-slate-200/70"
  return <div className={`animate-pulse rounded-lg ${base} ${className}`} />
}

export function ChannelRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/5" />
      </div>
      <Skeleton className="h-6 w-12 shrink-0 rounded-full" />
    </div>
  )
}

export function ChannelListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-1" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <ChannelRowSkeleton key={i} />
      ))}
    </div>
  )
}
