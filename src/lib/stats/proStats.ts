export type ProStatsPeriod = '7d' | '30d'

export interface BookingsByDateItem {
  date: string // YYYY-MM-DD
  count: number
}

export interface RevenueByDateItem {
  date: string // YYYY-MM-DD
  revenue: number
}

export interface StatsByServiceItem {
  serviceId: string
  serviceName: string
  bookings: number
  revenue: number
}

export interface ProStats {
  bookingsByDate: BookingsByDateItem[]
  revenueByDate: RevenueByDateItem[]
  statsByService: StatsByServiceItem[]
}

type FirestoreDocData = Record<string, any>

function isFirestoreTimestampLike(value: any): value is { toDate: () => Date } {
  return Boolean(value && typeof value === 'object' && typeof value.toDate === 'function')
}

function toNumberOrZero(value: any): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function toISODateUTC(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function getPeriodRange(period: ProStatsPeriod): { start: string; end: string } {
  const endDate = new Date()
  const days = period === '7d' ? 7 : 30
  const startDate = addDaysUTC(endDate, -(days - 1))
  return { start: toISODateUTC(startDate), end: toISODateUTC(endDate) }
}

function normalizeBookingDate(value: any): string | null {
  if (!value) return null
  if (typeof value === 'string') {
    // Accept "YYYY-MM-DD" directly; if it's an ISO datetime string, take the date part.
    if (value.length >= 10) return value.slice(0, 10)
    return null
  }
  if (value instanceof Date) return toISODateUTC(value)
  if (isFirestoreTimestampLike(value)) return toISODateUTC(value.toDate())
  return null
}

function getBookingProId(data: FirestoreDocData): string | null {
  return (data?.proId ?? data?.pro_id ?? null) as string | null
}

function getBookingServiceId(data: FirestoreDocData): string | null {
  return (data?.serviceId ?? data?.service_id ?? null) as string | null
}

/**
 * Compute PRO dashboard stats for charts and analysis.
 *
 * STRICT:
 * - Read-only Firestore access
 * - Do not store stats
 * - Do not modify Starter stats
 */
export async function getProStats(
  userId: string,
  period: ProStatsPeriod
): Promise<ProStats> {
  const empty: ProStats = {
    bookingsByDate: [],
    revenueByDate: [],
    statsByService: [],
  }

  if (!userId) return empty

  try {
    const [{ db }, { collection, doc, getDoc, getDocs, query, where }] =
      await Promise.all([import('@/lib/firebaseClient'), import('firebase/firestore')])

    const { start, end } = getPeriodRange(period)

    // We intentionally keep queries simple (avoid composite indexes).
    // Support both schemas: proId and pro_id.
    const bookingsCol = collection(db, 'bookings')
    const q1 = query(bookingsCol, where('proId', '==', userId))
    const q2 = query(bookingsCol, where('pro_id', '==', userId))

    const snapshots = await Promise.allSettled([getDocs(q1), getDocs(q2)])

    const bookingsById = new Map<string, FirestoreDocData>()
    for (const res of snapshots) {
      if (res.status !== 'fulfilled') continue
      res.value.forEach((snap) => bookingsById.set(snap.id, snap.data()))
    }

    // Filter confirmed bookings in range, and build aggregates.
    const bookingsByDateMap = new Map<string, number>()
    const revenueByDateMap = new Map<string, number>()
    const serviceAgg = new Map<
      string,
      { bookings: number; revenue: number }
    >()

    for (const data of bookingsById.values()) {
      // Enforce required fields per spec
      const proId = getBookingProId(data)
      if (proId !== userId) continue

      const status = data?.status
      if (status !== 'confirmed') continue

      const date = normalizeBookingDate(data?.date)
      if (!date) continue
      if (date < start || date > end) continue

      // 1) bookingsByDate
      bookingsByDateMap.set(date, (bookingsByDateMap.get(date) ?? 0) + 1)

      // 2) revenueByDate (paid only)
      const paid = data?.paid === true
      const price = paid ? toNumberOrZero(data?.price) : 0
      if (paid) {
        revenueByDateMap.set(date, (revenueByDateMap.get(date) ?? 0) + price)
      }

      // 3) statsByService
      const serviceId = getBookingServiceId(data)
      if (serviceId) {
        const agg = serviceAgg.get(serviceId) ?? { bookings: 0, revenue: 0 }
        agg.bookings += 1
        if (paid) agg.revenue += price
        serviceAgg.set(serviceId, agg)
      }
    }

    // If there's no data in-range, return empty arrays as requested.
    if (bookingsByDateMap.size === 0 && revenueByDateMap.size === 0 && serviceAgg.size === 0) {
      return empty
    }

    const bookingsByDate: BookingsByDateItem[] = Array.from(bookingsByDateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))

    const revenueByDate: RevenueByDateItem[] = Array.from(revenueByDateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }))

    // Join services to get names (only for services that have bookings).
    const serviceIds = Array.from(serviceAgg.keys())

    const serviceDocs = await Promise.all(
      serviceIds.map(async (serviceId) => {
        try {
          const snap = await getDoc(doc(db, 'services', serviceId))
          return { serviceId, data: snap.exists() ? snap.data() : null }
        } catch {
          return { serviceId, data: null }
        }
      })
    )

    const serviceNameById = new Map<string, string>()
    for (const s of serviceDocs) {
      const name = (s.data?.name ?? null) as string | null
      if (name) serviceNameById.set(s.serviceId, name)
    }

    const statsByService: StatsByServiceItem[] = serviceIds
      .map((serviceId) => {
        const agg = serviceAgg.get(serviceId)!
        return {
          serviceId,
          serviceName: serviceNameById.get(serviceId) ?? 'Service',
          bookings: agg.bookings,
          revenue: agg.revenue,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)

    return {
      bookingsByDate,
      revenueByDate,
      statsByService,
    }
  } catch (error) {
    console.error('[getProStats] Error computing pro stats:', error)
    return empty
  }
}


