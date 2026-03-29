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
      className="max-w-3xl mx-auto px-4 py-6 space-y-10"
    >
      {/* Page header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-sm font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Mes rendez-vous
        </div>
        <h2 className="text-3xl font-extrabold text-[#2A1F2D] mb-2">
          Vos rendez-vous
        </h2>
        <p className="text-base text-[#8a7a92] max-w-md mx-auto">
          Suivez vos prochains rendez-vous et consultez votre historique.
        </p>
      </div>

      {/* ── UPCOMING ─────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-primary to-[#9C44AF] flex items-center justify-center">
            <span className="text-white text-sm">📅</span>
          </div>
          <h3 className="text-lg font-bold text-[#2A1F2D]">À venir</h3>
          {upcomingBookings.length > 0 && (
            <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {upcomingBookings.length}
            </span>
          )}
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 text-center border border-primary/10 shadow-[0_4px_24px_rgba(20,0,50,0.04)]">
            <div className="w-14 h-14 rounded-[16px] bg-secondary flex items-center justify-center text-2xl mx-auto mb-4">📭</div>
            <p className="text-sm text-[#8a7a92] font-medium">Aucun rendez-vous à venir.</p>
            <p className="text-xs text-[#b5a8bc] mt-1">Réservez chez un professionnel pour voir apparaître vos prochains rendez-vous ici.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking, i) => {
              const d = new Date(`${booking.date}T00:00:00`)
              const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' })
              const dayNum = d.getDate()
              const month = d.toLocaleDateString('fr-FR', { month: 'short' })

              return (
                <motion.div
                  suppressHydrationWarning
                  key={booking.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="bg-white rounded-[24px] p-5 border border-primary/10 shadow-[0_8px_32px_rgba(20,0,50,0.06)] hover:shadow-[0_12px_40px_rgba(20,0,50,0.1)] transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Date block */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-[16px] bg-gradient-to-br from-primary/10 to-secondary flex flex-col items-center justify-center border border-primary/15">
                      <span className="text-[10px] font-bold text-primary uppercase leading-none tracking-wide">
                        {dayName.slice(0, 3)}
                      </span>
                      <span className="text-2xl font-extrabold text-[#2A1F2D] leading-tight">
                        {dayNum}
                      </span>
                      <span className="text-[10px] font-semibold text-[#8a7a92] uppercase leading-none">
                        {month}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h4 className="text-base font-bold text-[#2A1F2D] truncate">{booking.serviceName}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ${getStatusBadgeClass(booking.status)}`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#64576b]">
                          <span className="text-primary/60 text-xs">👤</span>
                          {booking.proName}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#64576b]">
                          <span className="text-primary/60 text-xs">🕐</span>
                          {booking.start_time} — {booking.end_time}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── PAST / HISTORY ───────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-[#EDE8F0] flex items-center justify-center">
            <span className="text-sm">🕘</span>
          </div>
          <h3 className="text-lg font-bold text-[#2A1F2D]">Historique</h3>
          {pastBookings.length > 0 && (
            <span className="ml-auto text-xs font-bold text-[#8a7a92] bg-[#EDE8F0] px-2.5 py-1 rounded-full">
              {pastBookings.length}
            </span>
          )}
        </div>

        {pastBookings.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 text-center border border-primary/10 shadow-[0_4px_24px_rgba(20,0,50,0.04)]">
            <div className="w-14 h-14 rounded-[16px] bg-[#EDE8F0] flex items-center justify-center text-2xl mx-auto mb-4">📋</div>
            <p className="text-sm text-[#8a7a92] font-medium">Aucun rendez-vous passé.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastBookings.map((booking, i) => {
              const d = new Date(`${booking.date}T00:00:00`)
              const dayNum = d.getDate()
              const month = d.toLocaleDateString('fr-FR', { month: 'short' })
              const year = d.getFullYear()

              return (
                <motion.div
                  suppressHydrationWarning
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="bg-white rounded-[20px] px-5 py-4 border border-[#EDE8F0] hover:border-primary/15 shadow-[0_2px_12px_rgba(20,0,50,0.03)] hover:shadow-[0_4px_20px_rgba(20,0,50,0.06)] transition-all flex items-center gap-4"
                >
                  {/* Date circle */}
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#F5F0F7] flex flex-col items-center justify-center">
                    <span className="text-sm font-extrabold text-[#64576b] leading-none">{dayNum}</span>
                    <span className="text-[9px] font-semibold text-[#b5a8bc] uppercase leading-none">{month}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2A1F2D] truncate">{booking.serviceName}</p>
                    <p className="text-xs text-[#8a7a92] truncate">{booking.proName} · {booking.start_time}</p>
                  </div>

                  {/* Status */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${getStatusBadgeClass(booking.status)}`}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>
    </motion.div>
  )
}


