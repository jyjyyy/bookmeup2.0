'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Card } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-12 text-center">
          <Loader />
          <p className="mt-4 text-gray-600">
            Chargement de vos rendez-vous...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Mes rendez-vous
        </h2>
        <p className="text-gray-600">
          Gérez vos rendez-vous à venir et consultez votre historique.
        </p>
      </div>

      {/* Upcoming Appointments */}
      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4">
          À venir
        </h3>
        {upcomingBookings.length === 0 ? (
          <Card className="p-6 text-center text-gray-500 rounded-[32px]">
            Aucun rendez-vous à venir.
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <Card
                key={booking.id}
                className="p-6 rounded-[32px] shadow-bookmeup"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-primary">
                    {booking.serviceName}
                  </h4>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      booking.status
                    )}`}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </div>
                <p className="text-gray-700 mb-1">
                  Avec:{' '}
                  <span className="font-medium">
                    {booking.proName}
                  </span>
                </p>
                <p className="text-gray-600 text-sm">
                  Le {formatDateTime(booking.date, booking.start_time)}
                </p>
                {/* TODO: Add "Modifier" and "Annuler" buttons */}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Past Appointments */}
      <section>
        <h3 className="text-xl font-semibold text-slate-800 mb-4">
          Passés
        </h3>
        {pastBookings.length === 0 ? (
          <Card className="p-6 text-center text-gray-500 rounded-[32px]">
            Aucun rendez-vous passé.
          </Card>
        ) : (
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <Card
                key={booking.id}
                className="p-6 rounded-[32px] shadow-bookmeup"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-primary">
                    {booking.serviceName}
                  </h4>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      booking.status
                    )}`}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </div>
                <p className="text-gray-700 mb-1">
                  Avec:{' '}
                  <span className="font-medium">
                    {booking.proName}
                  </span>
                </p>
                <p className="text-gray-600 text-sm">
                  Le {formatDateTime(booking.date, booking.start_time)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  )
}


