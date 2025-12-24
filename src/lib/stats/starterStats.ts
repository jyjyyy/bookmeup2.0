export interface StarterStats {
  totalBookings: number
  totalRevenue: number
  upcomingBookings: number
  activeServices: number
}

type FirestoreDocData = Record<string, any>

function isFirestoreTimestampLike(value: any): value is { toDate: () => Date } {
  return Boolean(value && typeof value === 'object' && typeof value.toDate === 'function')
}

function toNumberOrZero(value: any): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function getTodayISODate(): string {
  // YYYY-MM-DD (UTC). This matches the common storage format used elsewhere in the app.
  return new Date().toISOString().slice(0, 10)
}

/**
 * Compute Starter dashboard stats for a professional user.
 *
 * STRICT: read-only, no writes to Firestore.
 */
export async function getStarterStats(userId: string): Promise<StarterStats> {
  const empty: StarterStats = {
    totalBookings: 0,
    totalRevenue: 0,
    upcomingBookings: 0,
    activeServices: 0,
  }

  if (!userId) return empty

  try {
    const [{ db }, { collection, getDocs, query, where }] = await Promise.all([
      import('@/lib/firebaseClient'),
      import('firebase/firestore'),
    ])

    const today = getTodayISODate()

    // -------------------------
    // Bookings (confirmed only)
    // -------------------------
    const bookingsCol = collection(db, 'bookings')

    // Support both schemas:
    // - proId / status (as described)
    // - pro_id / status (used elsewhere in the repo)
    const bookingQueries = [
      query(bookingsCol, where('proId', '==', userId), where('status', '==', 'confirmed')),
      query(bookingsCol, where('pro_id', '==', userId), where('status', '==', 'confirmed')),
    ]

    const bookingSnapshots = await Promise.allSettled(
      bookingQueries.map((q) => getDocs(q))
    )

    const bookingsById = new Map<string, FirestoreDocData>()
    for (const res of bookingSnapshots) {
      if (res.status !== 'fulfilled') continue
      res.value.forEach((docSnap) => {
        bookingsById.set(docSnap.id, docSnap.data())
      })
    }

    let totalBookings = 0
    let totalRevenue = 0
    let upcomingBookings = 0

    totalBookings = bookingsById.size

    for (const data of bookingsById.values()) {
      // Revenue: only confirmed (already filtered) AND paid === true
      const paid = data?.paid === true
      if (paid) {
        totalRevenue += toNumberOrZero(data?.price)
      }

      // Upcoming bookings: confirmed AND booking.date > now
      const dateValue = data?.date
      if (typeof dateValue === 'string') {
        if (dateValue > today) upcomingBookings += 1
      } else if (dateValue instanceof Date) {
        if (dateValue.getTime() > Date.now()) upcomingBookings += 1
      } else if (isFirestoreTimestampLike(dateValue)) {
        if (dateValue.toDate().getTime() > Date.now()) upcomingBookings += 1
      }
    }

    // -------------------------
    // Services (active only)
    // -------------------------
    const servicesCol = collection(db, 'services')

    // Support both schemas:
    // - proId / active (as described)
    // - proId / isActive (used elsewhere in the repo)
    // Also tolerate pro_id if present.
    const serviceQueries = [
      query(servicesCol, where('proId', '==', userId), where('active', '==', true)),
      query(servicesCol, where('proId', '==', userId), where('isActive', '==', true)),
      query(servicesCol, where('pro_id', '==', userId), where('active', '==', true)),
      query(servicesCol, where('pro_id', '==', userId), where('isActive', '==', true)),
    ]

    const serviceSnapshots = await Promise.allSettled(
      serviceQueries.map((q) => getDocs(q))
    )

    const servicesById = new Map<string, FirestoreDocData>()
    for (const res of serviceSnapshots) {
      if (res.status !== 'fulfilled') continue
      res.value.forEach((docSnap) => {
        servicesById.set(docSnap.id, docSnap.data())
      })
    }

    const activeServices = servicesById.size

    return {
      totalBookings,
      totalRevenue,
      upcomingBookings,
      activeServices,
    }
  } catch (error) {
    console.error('[getStarterStats] Error computing stats:', error)
    return empty
  }
}


