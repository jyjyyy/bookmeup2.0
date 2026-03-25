import { cn } from '@/lib/utils'

// Bloc de base animé
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-primary/8 rounded-2xl animate-pulse',
        className
      )}
    />
  )
}

// ─── Skeletons par page ──────────────────────────────────────────────────────

/** Dashboard — grille de stats + graphiques */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonBlock className="h-9 w-56" />
        <SkeletonBlock className="h-5 w-80" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonBlock key={i} className="h-24 rounded-[24px]" />
        ))}
      </div>
      <SkeletonBlock className="h-64 rounded-[32px]" />
    </div>
  )
}

/** Services — header + grille de cards */
export function ServicesSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-9 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-11 w-44 rounded-[32px]" />
      </div>
      <div className="space-y-4">
        {[...Array(2)].map((_, g) => (
          <div key={g} className="border border-slate-100 rounded-[24px] overflow-hidden">
            <div className="px-6 py-4 bg-white">
              <SkeletonBlock className="h-6 w-40" />
            </div>
            <div className="px-6 pb-6 pt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-[32px] border border-slate-100 p-6 space-y-4 bg-white">
                  <div className="flex justify-between items-start">
                    <SkeletonBlock className="h-6 w-32" />
                    <SkeletonBlock className="h-5 w-14 rounded-full" />
                  </div>
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-3/4" />
                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <SkeletonBlock className="h-8 w-20" />
                    <SkeletonBlock className="h-8 w-20" />
                  </div>
                  <div className="flex gap-3">
                    <SkeletonBlock className="h-10 flex-1 rounded-[32px]" />
                    <SkeletonBlock className="h-10 flex-1 rounded-[32px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Clients bloqués — liste */
export function ClientsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonBlock className="h-9 w-52" />
        <SkeletonBlock className="h-4 w-80" />
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[32px] border border-slate-100 bg-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-36" />
                <SkeletonBlock className="h-4 w-48" />
              </div>
            </div>
            <SkeletonBlock className="h-9 w-28 rounded-[32px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Disponibilités — jours de la semaine */
export function AvailabilitySkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonBlock className="h-9 w-56" />
        <SkeletonBlock className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="rounded-[32px] border border-slate-100 bg-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="w-10 h-6 rounded-full" />
              <SkeletonBlock className="h-5 w-24" />
            </div>
            <SkeletonBlock className="h-9 w-40 rounded-[32px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Paramètres compte — formulaire */
export function AccountSettingsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonBlock className="h-9 w-52" />
        <SkeletonBlock className="h-4 w-64" />
      </div>
      <div className="rounded-[32px] border border-slate-100 bg-white p-8 space-y-6">
        <SkeletonBlock className="h-6 w-40" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-11 w-full rounded-[24px]" />
          </div>
        ))}
        <SkeletonBlock className="h-11 w-36 rounded-[32px] mt-4" />
      </div>
    </div>
  )
}

/** Rendez-vous client — liste de cartes */
export function AppointmentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-9 w-52" />
        <SkeletonBlock className="h-4 w-72" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-[32px] border border-slate-100 bg-white p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-6 w-40" />
              <SkeletonBlock className="h-4 w-56" />
            </div>
            <SkeletonBlock className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex gap-4 pt-2 border-t border-slate-100">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Recherche — grille de pros */
export function SearchSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SkeletonBlock className="h-12 w-full rounded-[32px]" />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonBlock key={i} className="h-9 w-24 rounded-[32px]" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-[32px] border border-slate-100 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-14 h-14 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonBlock className="h-5 w-36" />
                <SkeletonBlock className="h-4 w-24" />
              </div>
            </div>
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-10 w-full rounded-[32px]" />
          </div>
        ))}
      </div>
    </div>
  )
}
