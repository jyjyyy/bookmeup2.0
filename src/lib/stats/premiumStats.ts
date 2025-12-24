export type PremiumStatsPeriod = '7d' | '30d'

export interface PeriodComparisonMetric {
  current: number
  previous: number
  changePercent: number
}

export interface PremiumStats {
  periodComparison: {
    bookings: PeriodComparisonMetric
    revenue: PeriodComparisonMetric
  }
  occupancyRate: number
  cancellations: {
    count: number
    rate: number
  }
  uniqueClients: number
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

function getPeriodDays(period: PremiumStatsPeriod): number {
  return period === '7d' ? 7 : 30
}

function getPeriodRange(period: PremiumStatsPeriod): { start: string; end: string; days: number } {
  const endDate = new Date()
  const days = getPeriodDays(period)
  const startDate = addDaysUTC(endDate, -(days - 1))
  return { start: toISODateUTC(startDate), end: toISODateUTC(endDate), days }
}

function getPreviousPeriodRange(period: PremiumStatsPeriod): { start: string; end: string; days: number } {
  const { start, end, days } = getPeriodRange(period)
  // start/end are ISO strings; convert to Date safely in UTC
  const startDate = new Date(`${start}T00:00:00Z`)
  const endDate = new Date(`${end}T00:00:00Z`)
  const prevStart = addDaysUTC(startDate, -days)
  const prevEnd = addDaysUTC(endDate, -days)
  return { start: toISODateUTC(prevStart), end: toISODateUTC(prevEnd), days }
}

function normalizeBookingDate(value: any): string | null {
  if (!value) return null
  if (typeof value === 'string') {
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

function getClientIdentifier(data: FirestoreDocData): string | null {
  const clientId = (data?.clientId ?? data?.client_id ?? null) as string | null
  if (clientId) return clientId
  const clientEmail = (data?.clientEmail ?? data?.client_email ?? null) as string | null
  if (clientEmail) return clientEmail
  return null
}

function computeChangePercent(current: number, previous: number): number {
  if (!previous || previous <= 0) return 0
  const pct = ((current - previous) / previous) * 100
  // Keep one decimal for readability; spec doesn't forbid rounding.
  return Math.round(pct * 10) / 10
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * PREMIUM stats (logic only, read-only Firestore).
 */
export async function getPremiumStats(
  userId: string,
  period: PremiumStatsPeriod
): Promise<PremiumStats> {
  const empty: PremiumStats = {
    periodComparison: {
      bookings: { current: 0, previous: 0, changePercent: 0 },
      revenue: { current: 0, previous: 0, changePercent: 0 },
    },
    occupancyRate: 0,
    cancellations: { count: 0, rate: 0 },
    uniqueClients: 0,
  }

  if (!userId) return empty

  try {
    const [{ db }, { collection, getDocs, query, where }] = await Promise.all([
      import('@/lib/firebaseClient'),
      import('firebase/firestore'),
    ])

    const currentRange = getPeriodRange(period)
    const previousRange = getPreviousPeriodRange(period)

    // Fetch bookings for pro (support both proId and pro_id without requiring composite indexes).
    const bookingsCol = collection(db, 'bookings')
    const q1 = query(bookingsCol, where('proId', '==', userId))
    const q2 = query(bookingsCol, where('pro_id', '==', userId))

    const snapshots = await Promise.allSettled([getDocs(q1), getDocs(q2)])
    const bookingsById = new Map<string, FirestoreDocData>()
    for (const res of snapshots) {
      if (res.status !== 'fulfilled') continue
      res.value.forEach((snap) => bookingsById.set(snap.id, snap.data()))
    }

    let confirmedCurrent = 0
    let revenueCurrent = 0
    let confirmedPrevious = 0
    let revenuePrevious = 0

    let cancellationsCount = 0
    let totalBookingsInPeriod = 0
    const uniqueClientSet = new Set<string>()

    for (const data of bookingsById.values()) {
      if (getBookingProId(data) !== userId) continue

      const date = normalizeBookingDate(data?.date)
      if (!date) continue

      const status = data?.status
      const paid = data?.paid === true
      const price = paid ? toNumberOrZero(data?.price) : 0

      const inCurrent = date >= currentRange.start && date <= currentRange.end
      const inPrevious = date >= previousRange.start && date <= previousRange.end

      if (inCurrent) {
        totalBookingsInPeriod += 1

        const clientKey = getClientIdentifier(data)
        if (clientKey) uniqueClientSet.add(clientKey)

        if (status === 'confirmed') {
          confirmedCurrent += 1
          if (paid) revenueCurrent += price
        } else if (status === 'cancelled') {
          cancellationsCount += 1
        }
      }

      if (inPrevious) {
        if (status === 'confirmed') {
          confirmedPrevious += 1
          if (paid) revenuePrevious += price
        }
      }
    }

    const bookingsChangePercent = computeChangePercent(confirmedCurrent, confirmedPrevious)
    const revenueChangePercent = computeChangePercent(revenueCurrent, revenuePrevious)

    // Occupancy: confirmedBookings / availableSlots * 100
    const slotsPerDay = 8
    const availableSlots = currentRange.days * slotsPerDay
    const occupancyRate =
      availableSlots > 0 ? round1((confirmedCurrent / availableSlots) * 100) : 0

    // Cancellations rate over total bookings
    const cancellationsRate =
      totalBookingsInPeriod > 0
        ? round1((cancellationsCount / totalBookingsInPeriod) * 100)
        : 0

    return {
      periodComparison: {
        bookings: {
          current: confirmedCurrent,
          previous: confirmedPrevious,
          changePercent: bookingsChangePercent,
        },
        revenue: {
          current: revenueCurrent,
          previous: revenuePrevious,
          changePercent: revenueChangePercent,
        },
      },
      occupancyRate,
      cancellations: {
        count: cancellationsCount,
        rate: cancellationsRate,
      },
      uniqueClients: uniqueClientSet.size,
    }
  } catch (error) {
    console.error('[getPremiumStats] Error computing premium stats:', error)
    return empty
  }
}


