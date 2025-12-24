export type ExportPeriod = '7d' | '30d' | { start: Date; end: Date }

export interface RevenueByServiceItem {
  serviceName: string
  bookingsCount: number
  revenue: number
}

export interface RevenueByClientItem {
  clientIdentifier: string // clientName or email
  bookingsCount: number
  revenue: number
}

export interface RevenueByMonthItem {
  month: string // YYYY-MM
  revenue: number
}

export interface VatData {
  vatRate: number
  vatAmount: number
  revenueExclVat: number
  revenueInclVat: number
}

export interface AccountingExportData {
  totalRevenue: number
  revenueByService: RevenueByServiceItem[]
  revenueByClient: RevenueByClientItem[]
  revenueByMonth: RevenueByMonthItem[]
  workedHours: number
  vat: VatData
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

function getPeriodRange(period: ExportPeriod): { start: string; end: string } {
  if (typeof period === 'object') {
    // Custom date range
    return {
      start: toISODateUTC(period.start),
      end: toISODateUTC(period.end),
    }
  }
  // 7d or 30d
  const endDate = new Date()
  const days = period === '7d' ? 7 : 30
  const startDate = addDaysUTC(endDate, -(days - 1))
  return { start: toISODateUTC(startDate), end: toISODateUTC(endDate) }
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

function getBookingServiceId(data: FirestoreDocData): string | null {
  return (data?.serviceId ?? data?.service_id ?? null) as string | null
}

/**
 * Calculate hours difference between two time strings (HH:mm format)
 * Returns hours as float
 */
function calculateHoursBetween(startTime: string, endTime: string): number {
  try {
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    
    if (!Number.isFinite(startH) || !Number.isFinite(startM) || 
        !Number.isFinite(endH) || !Number.isFinite(endM)) {
      return 0
    }
    
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    
    // Handle case where endTime is next day (e.g., 22:00 to 02:00)
    let diffMinutes = endMinutes - startMinutes
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60 // Add 24 hours
    }
    
    return diffMinutes / 60 // Convert to hours (float)
  } catch {
    return 0
  }
}

/**
 * Extract month from date string (YYYY-MM-DD) and return YYYY-MM
 */
function extractMonth(dateStr: string): string {
  return dateStr.slice(0, 7) // YYYY-MM
}

/**
 * Get accounting export data for a professional user.
 *
 * STRICT:
 * - Read-only Firestore access
 * - Do not store computed data
 * - Premium feature only (no gating here, just logic)
 */
export async function getAccountingExportData(
  userId: string,
  period: ExportPeriod
): Promise<AccountingExportData> {
  const empty: AccountingExportData = {
    totalRevenue: 0,
    revenueByService: [],
    revenueByClient: [],
    revenueByMonth: [],
    workedHours: 0,
    vat: {
      vatRate: 0,
      vatAmount: 0,
      revenueExclVat: 0,
      revenueInclVat: 0,
    },
  }

  if (!userId) return empty

  try {
    const [{ db }, { collection, doc, getDoc, getDocs, query, where }] =
      await Promise.all([import('@/lib/firebaseClient'), import('firebase/firestore')])

    const { start, end } = getPeriodRange(period)

    // Fetch bookings for this pro
    const bookingsCol = collection(db, 'bookings')
    const q1 = query(bookingsCol, where('proId', '==', userId))
    const q2 = query(bookingsCol, where('pro_id', '==', userId))

    const snapshots = await Promise.allSettled([getDocs(q1), getDocs(q2)])

    const bookingsById = new Map<string, FirestoreDocData>()
    for (const res of snapshots) {
      if (res.status !== 'fulfilled') continue
      res.value.forEach((snap) => bookingsById.set(snap.id, snap.data()))
    }

    // Filter confirmed & paid bookings in range
    let totalRevenue = 0
    const serviceAgg = new Map<string, { bookingsCount: number; revenue: number }>()
    const clientAgg = new Map<string, { bookingsCount: number; revenue: number; identifier: string }>()
    const monthAgg = new Map<string, number>()
    let totalWorkedHours = 0

    for (const data of bookingsById.values()) {
      const proId = getBookingProId(data)
      if (proId !== userId) continue

      const status = data?.status
      if (status !== 'confirmed') continue

      const paid = data?.paid === true
      if (!paid) continue

      const date = normalizeBookingDate(data?.date)
      if (!date) continue
      if (date < start || date > end) continue

      const price = toNumberOrZero(data?.price)
      totalRevenue += price

      // revenueByService
      const serviceId = getBookingServiceId(data)
      if (serviceId) {
        const agg = serviceAgg.get(serviceId) ?? { bookingsCount: 0, revenue: 0 }
        agg.bookingsCount += 1
        agg.revenue += price
        serviceAgg.set(serviceId, agg)
      }

      // revenueByClient
      const clientId = data?.clientId ?? null
      const clientEmail = data?.clientEmail ?? data?.client_email ?? null
      const clientName = data?.clientName ?? data?.client_name ?? null
      
      const clientKey = clientId ?? clientEmail ?? 'unknown'
      const clientIdentifier = clientName ?? clientEmail ?? 'Client'
      
      const clientAggItem = clientAgg.get(clientKey) ?? { bookingsCount: 0, revenue: 0, identifier: clientIdentifier }
      clientAggItem.bookingsCount += 1
      clientAggItem.revenue += price
      clientAgg.set(clientKey, clientAggItem)

      // revenueByMonth
      const month = extractMonth(date)
      monthAgg.set(month, (monthAgg.get(month) ?? 0) + price)

      // workedHours (requires startTime and endTime)
      const startTime = data?.startTime ?? data?.start_time ?? null
      const endTime = data?.endTime ?? data?.end_time ?? null
      
      if (startTime && endTime && typeof startTime === 'string' && typeof endTime === 'string') {
        const hours = calculateHoursBetween(startTime, endTime)
        totalWorkedHours += hours
      }
    }

    // Join services to get names
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

    const revenueByService: RevenueByServiceItem[] = serviceIds
      .map((serviceId) => {
        const agg = serviceAgg.get(serviceId)!
        return {
          serviceName: serviceNameById.get(serviceId) ?? 'Service',
          bookingsCount: agg.bookingsCount,
          revenue: agg.revenue,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)

    const revenueByClient: RevenueByClientItem[] = Array.from(clientAgg.values())
      .map((item) => ({
        clientIdentifier: item.identifier,
        bookingsCount: item.bookingsCount,
        revenue: item.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const revenueByMonth: RevenueByMonthItem[] = Array.from(monthAgg.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }))

    // VAT calculation (default vatRate = 0)
    const vatRate = 0
    const revenueInclVat = totalRevenue
    const vatAmount = (revenueInclVat * vatRate) / (1 + vatRate)
    const revenueExclVat = revenueInclVat - vatAmount

    return {
      totalRevenue,
      revenueByService,
      revenueByClient,
      revenueByMonth,
      workedHours: totalWorkedHours,
      vat: {
        vatRate,
        vatAmount,
        revenueExclVat,
        revenueInclVat,
      },
    }
  } catch (error) {
    console.error('[getAccountingExportData] Error computing export data:', error)
    return empty
  }
}

