'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { AppointmentsSkeleton } from '@/components/ui/skeleton'

interface Booking {
  id: string
  proId?: string // Make optional
  pro_id?: string // Add for legacy data
  serviceId?: string // Make optional
  service_id?: string // Add for legacy data
  client_name: string
  client_email: string
  client_phone?: string
  date: string
  start_time: string
  end_time: string
  status:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'completed'
    | 'no-show'
    | 'cancelled_by_client'
    | 'cancelled_by_pro'
  created_at?: any
}

interface BookingWithPro extends Booking {
  proName?: string
  serviceName?: string
}

export default function ClientAppointmentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingWithPro[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true)
        const currentUser = await getCurrentUser()

        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login?redirect=/account/appointments')
          return
        }

        if (currentUser.profile.role !== 'client') {
          router.push('/')
          return
        }

        setUserId(currentUser.user.uid)
        const userEmail = currentUser.user.email

        if (!userEmail) {
          console.error('User email is missing for client appointments.')
          setLoading(false)
          return
        }

        // Query bookings by client_email
        // Note: Firestore requires an index for compound queries with multiple orderBy
        // We'll query and sort in memory to avoid index requirements
        const bookingsRef = collection(db, 'bookings')
        const bookingsQuery = query(
          bookingsRef,
          where('client_email', '==', userEmail.toLowerCase())
        )

        const bookingsSnapshot = await getDocs(bookingsQuery)
        const allBookings: BookingWithPro[] = []

        for (const docSnap of bookingsSnapshot.docs) {
          const data = docSnap.data() as Booking
          allBookings.push({
            ...data,
            id: docSnap.id,
          })
        }

        // Load pro names and service names
        const bookingsWithDetails = await Promise.all(
          allBookings.map(async (booking) => {
            try {
              // Determine the correct proId field (proId or pro_id)
              const actualProId = booking.proId || booking.pro_id
              let proName = 'Professionnel'

              // Defensive check: only call getDoc if proId exists and is a string
              if (
                actualProId &&
                typeof actualProId === 'string' &&
                actualProId.trim() !== ''
              ) {
                try {
                  const prosDoc = await getDoc(doc(db, 'pros', actualProId))
                  if (prosDoc.exists()) {
                    const prosData = prosDoc.data()
                    proName = prosData.business_name || 'Professionnel'
                  } else {
                    // Fallback to profiles if not found in pros (for older data)
                    const proDoc = await getDoc(doc(db, 'profiles', actualProId))
                    if (proDoc.exists()) {
                      const proData = proDoc.data()
                      proName = proData.name || proData.business_name || 'Professionnel'
                    }
                  }
                } catch (err) {
                  console.error('Error loading pro name:', err)
                }
              }

              // Determine the correct serviceId field (serviceId or service_id)
              const actualServiceId = booking.serviceId || booking.service_id
              let serviceName = 'Service'

              // Defensive check: only call getDoc if serviceId exists and is a string
              if (
                actualServiceId &&
                typeof actualServiceId === 'string' &&
                actualServiceId.trim() !== ''
              ) {
                try {
                  const serviceDoc = await getDoc(doc(db, 'services', actualServiceId))
                  if (serviceDoc.exists()) {
                    const serviceData = serviceDoc.data()
                    serviceName = serviceData.name || 'Service'
                  }
                } catch (err) {
                  console.error('Error loading service name:', err)
                }
              }

              return {
                ...booking,
                proName,
                serviceName,
              }
            } catch (err) {
              console.error('Error loading booking details:', err)
              return {
                ...booking,
                proName: 'Professionnel',
                serviceName: 'Service',
              }
            }
          })
        )

        // Sort bookings
        bookingsWithDetails.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.start_time}`)
          const dateB = new Date(`${b.date}T${b.start_time}`)
          return dateA.getTime() - dateB.getTime()
        })

        setBookings(bookingsWithDetails)
      } catch (error) {
        console.error('Error loading client appointments:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
  }, [router])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingBookings = bookings.filter((booking) => {
    const bookingDate = new Date(`${booking.date}T${booking.start_time}`)
    return (
      bookingDate >= today &&
      (booking.status === 'confirmed' || booking.status === 'pending')
    )
  })

  const pastBookings = bookings
    .filter((booking) => {
      const bookingDate = new Date(`${booking.date}T${booking.start_time}`)
      return (
        bookingDate < today ||
        (booking.status !== 'confirmed' && booking.status !== 'pending')
      )
    })
    .sort((a, b) => {
      // Sort past bookings by date descending
      const dateA = new Date(`${a.date}T${a.start_time}`)
      const dateB = new Date(`${b.date}T${b.start_time}`)
      return dateB.getTime() - dateA.getTime()
    })

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(`${dateString}T${timeString}`)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadgeClass = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'cancelled_by_client':
      case 'cancelled_by_pro':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'no-show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé'
      case 'pending':
        return 'En attente'
      case 'cancelled':
      case 'cancelled_by_client':
      case 'cancelled_by_pro':
        return 'Annulé'
      case 'completed':
        return 'Terminé'
      case 'no-show':
        return 'Non-présenté'
      default:
        return 'Inconnu'
    }
  }

  if (loading) {
    return <AppointmentsSkeleton />
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00`)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">
          Mes rendez-vous
        </h2>
        <p className="text-sm text-[#7A6B80]">
          Gérez vos rendez-vous à venir et consultez votre historique.
        </p>
      </div>

      {/* Upcoming Appointments — cards with full details */}
      <section>
        <h3 className="text-xs font-bold text-[#7A6B80] uppercase tracking-widest mb-4">
          À venir
        </h3>
        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-[20px] p-5 text-center text-[#7A6B80] text-sm border border-primary/10">
            Aucun rendez-vous à venir.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-[20px] p-4 border border-primary/10 shadow-[0_4px_16px_rgba(20,0,50,0.04)] flex items-center gap-4"
              >
                {/* Date block */}
                <div className="flex-shrink-0 w-14 h-14 rounded-[14px] bg-secondary flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-primary leading-none">
                    {new Date(`${booking.date}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-extrabold text-[#2A1F2D] leading-tight">
                    {new Date(`${booking.date}T00:00:00`).getDate()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-bold text-[#2A1F2D] truncate">{booking.serviceName}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${getStatusBadgeClass(booking.status)}`}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A6B80] truncate">
                    {booking.proName} · {booking.start_time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Appointments — compact table-like rows */}
      <section>
        <h3 className="text-xs font-bold text-[#7A6B80] uppercase tracking-widest mb-4">
          Historique
        </h3>
        {pastBookings.length === 0 ? (
          <div className="bg-white rounded-[20px] p-5 text-center text-[#7A6B80] text-sm border border-primary/10">
            Aucun rendez-vous passé.
          </div>
        ) : (
          <div className="bg-white rounded-[20px] border border-primary/10 overflow-hidden divide-y divide-[#EDE8F0]">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
              >
                {/* Date compact */}
                <span className="text-xs text-[#7A6B80] w-20 flex-shrink-0 font-medium">
                  {formatDateShort(booking.date)}
                </span>

                {/* Service + pro */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#2A1F2D] truncate">{booking.serviceName}</span>
                  <span className="text-xs text-[#7A6B80] truncate hidden sm:inline">· {booking.proName}</span>
                </div>

                {/* Time */}
                <span className="text-xs text-[#7A6B80] flex-shrink-0">{booking.start_time}</span>

                {/* Status badge */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${getStatusBadgeClass(booking.status)}`}
                >
                  {getStatusLabel(booking.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  )
}


