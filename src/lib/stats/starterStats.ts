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
    // Bookings
    // -------------------------
    const bookingsCol = collection(db, 'bookings')

    // Support both schemas: proId and pro_id
    const bookingQueries = [
      query(bookingsCol, where('proId', '==', userId)),
      query(bookingsCol, where('pro_id', '==', userId)),
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
    const now = new Date()

    for (const data of bookingsById.values()) {
      const status = data?.status
      const dateValue = data?.date
      const startTime = data?.start_time || data?.startTime
      
      // Skip cancelled or no-show bookings
      if (
        status === 'cancelled' ||
        status === 'no-show' ||
        status === 'no_show' ||
        status === 'cancelled_by_client' ||
        status === 'cancelled_by_pro'
      ) {
        continue
      }

      // Parse booking date and time to check if appointment has passed
      let bookingDateTime: Date | null = null
      if (typeof dateValue === 'string' && startTime && typeof startTime === 'string') {
        try {
          bookingDateTime = new Date(`${dateValue}T${startTime}:00`)
        } catch (e) {
          // Invalid date/time format, try date only
        }
      } else if (dateValue instanceof Date && startTime && typeof startTime === 'string') {
        try {
          const [hours, minutes] = startTime.split(':').map(Number)
          bookingDateTime = new Date(dateValue)
          bookingDateTime.setHours(hours, minutes, 0, 0)
        } catch (e) {
          // Invalid time format, use date only
          bookingDateTime = dateValue
        }
      } else if (isFirestoreTimestampLike(dateValue) && startTime && typeof startTime === 'string') {
        try {
          const date = dateValue.toDate()
          const [hours, minutes] = startTime.split(':').map(Number)
          bookingDateTime = new Date(date)
          bookingDateTime.setHours(hours, minutes, 0, 0)
        } catch (e) {
          // Invalid time format, use date only
          bookingDateTime = dateValue.toDate()
        }
      }

      // Fallback: if no valid bookingDateTime yet, try using date only
      if (!bookingDateTime && dateValue) {
        if (typeof dateValue === 'string') {
          try {
            bookingDateTime = new Date(dateValue)
          } catch (e) {
            // Skip
          }
        } else if (dateValue instanceof Date) {
          bookingDateTime = dateValue
        } else if (isFirestoreTimestampLike(dateValue)) {
          bookingDateTime = dateValue.toDate()
        }
      }

      // Check if booking has passed (date + time < now)
      const hasPassed = bookingDateTime && bookingDateTime.getTime() < now.getTime()

      // Count total bookings (all non-cancelled/non-no-show)
      totalBookings += 1

      // Revenue calculation: include only if appointment has passed AND attendance === "present" AND pricing.price exists
      if (hasPassed) {
        const attendance = data?.attendance
        // Only include if attendance is explicitly "present"
        if (attendance === 'present') {
          // Use pricing.price ONLY (immutable snapshot from booking creation)
          const pricing = data?.pricing
          if (pricing && typeof pricing === 'object' && typeof pricing.price === 'number') {
            const price = toNumberOrZero(pricing.price)
            if (price > 0) {
              totalRevenue += price
            }
          }
          // If pricing.price is missing, exclude booking from revenue (backward compatibility)
        }
        // If attendance is null/undefined or "absent", exclude from revenue
      }

      // Upcoming bookings: confirmed AND booking date/time > now
      if (status === 'confirmed') {
        if (bookingDateTime && bookingDateTime.getTime() > now.getTime()) {
          upcomingBookings += 1
        } else {
          // Fallback: if no time info, check date only
          if (typeof dateValue === 'string') {
            if (dateValue > today) upcomingBookings += 1
          } else if (dateValue instanceof Date) {
            if (dateValue.getTime() > Date.now()) upcomingBookings += 1
          } else if (isFirestoreTimestampLike(dateValue)) {
            if (dateValue.toDate().getTime() > Date.now()) upcomingBookings += 1
          }
        }
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


