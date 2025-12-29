'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'

interface Booking {
  id: string
  date: string | Date | { toDate: () => Date } // Firestore Timestamp, Date, or string
  start_time: string
  end_time: string
  serviceName: string
  servicePrice?: number
  proName: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'cancelled_by_client' | 'no_show'
  isPast: boolean
  duration: number | null
  startAt?: string // ISO date string if available
}

export default function AccountPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to load
      if (authLoading) {
        return
      }

      try {
        // Vérifier l'authentification
        if (!user) {
          router.push('/auth/login?redirect=/account')
          return
        }

        // Vérifier que c'est un client
        if (user.role !== 'client') {
          router.push('/search')
          return
        }

        if (!user.email) {
          setError('Email non disponible')
          setLoading(false)
          return
        }

        // Fetch bookings directly from Firestore "bookings" collection
        const normalizedEmail = user.email.trim().toLowerCase()
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('client_email', '==', normalizedEmail)
        )
        
        const bookingsSnapshot = await getDocs(bookingsQuery)
        
        const fetchedBookings = []
        
        for (const bookingDoc of bookingsSnapshot.docs) {
          const bookingData = bookingDoc.data()
          
          // Fetch service data
          let serviceName = 'Service'
          let servicePrice: number | undefined = undefined
          
          try {
            const serviceDoc = await getDoc(doc(db, 'services', bookingData.service_id))
            if (serviceDoc.exists()) {
              const serviceData = serviceDoc.data()
              serviceName = serviceData?.name || 'Service'
              servicePrice = serviceData?.price || undefined
            }
          } catch (error) {
            console.error('[Account] Error fetching service:', error)
          }

          // Fetch pro data
          let proName = 'Professionnel'
          
          try {
            // Try profiles first
            const proProfileDoc = await getDoc(doc(db, 'profiles', bookingData.pro_id))
            if (proProfileDoc.exists()) {
              const proProfileData = proProfileDoc.data()
              proName = proProfileData?.name || proName
            }

            // Try pros collection for business_name
            const prosDoc = await getDoc(doc(db, 'pros', bookingData.pro_id))
            if (prosDoc.exists()) {
              const prosData = prosDoc.data()
              if (prosData?.business_name) {
                proName = prosData.business_name
              }
            }
          } catch (error) {
            console.error('[Account] Error fetching pro:', error)
          }

          fetchedBookings.push({
            id: bookingDoc.id,
            date: bookingData.date,
            start_time: bookingData.start_time,
            end_time: bookingData.end_time,
            serviceName,
            servicePrice,
            proName,
            status: bookingData.status || 'confirmed',
            isPast: false, // Will be recalculated on frontend
            duration: bookingData.duration || null,
          })
        }

        // TEMPORARY debug log
        console.log('🔥 BOOKINGS FROM FIRESTORE', fetchedBookings)

        setBookings(fetchedBookings)
      } catch (err: any) {
        console.error('[Account] Error loading bookings:', err)
        setError(err.message || 'Erreur lors du chargement des rendez-vous')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, user, authLoading])

  const formatDate = (dateInput: string | Date | { toDate: () => Date }) => {
    try {
      // Handle Firestore Timestamp, Date, or string
      const dateObj =
        dateInput instanceof Date
          ? dateInput
          : dateInput?.toDate
          ? dateInput.toDate()
          : new Date(dateInput + 'T00:00:00')
      
      if (isNaN(dateObj.getTime())) {
        return String(dateInput)
      }
      
      return dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return String(dateInput)
    }
  }

  // Robust helper function to get booking start date/time
  // Handles Firestore Timestamp, Date object, or string for booking.date
  const getBookingStartDate = (booking: Booking): Date | null => {
    try {
      if (!booking.date || !booking.start_time) {
        return null
      }

      // Handle Firestore Timestamp, Date, or string
      const dateObj =
        booking.date instanceof Date
          ? booking.date
          : booking.date?.toDate
          ? booking.date.toDate()
          : new Date(booking.date)

      if (isNaN(dateObj.getTime())) {
        return null
      }

      // Parse start_time ("HH:mm") and set hours/minutes
      const [hours, minutes] = booking.start_time.split(':').map(Number)
      dateObj.setHours(hours || 0, minutes || 0, 0, 0)

      return dateObj
    } catch (error) {
      console.error('[getBookingStartDate] Error parsing date:', error, booking)
      return null
    }
  }

  // Get current time for comparison
  const now = new Date()

  // Separate upcoming and past appointments
  // Upcoming: start >= now AND status IN ["confirmed", "pending"]
  const upcomingBookings = bookings.filter((booking) => {
    const start = getBookingStartDate(booking)
    
    // TEMPORARY debug log
    console.log({
      id: booking.id,
      date: booking.date,
      start_time: booking.start_time,
      parsedDate: start,
      now,
      status: booking.status,
    })

    if (!start) {
      return false
    }

    return (
      start >= now &&
      ['confirmed', 'pending'].includes(booking.status)
    )
  })

  // Past: start < now
  const pastBookings = bookings.filter((booking) => {
    const start = getBookingStartDate(booking)
    
    if (!start) {
      return false
    }
    
    return start < now
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader />
          <p>Chargement de vos rendez-vous…</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'client') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes rendez-vous</h1>
          <p className="text-gray-600">Gérez vos rendez-vous passés et à venir</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[32px] text-sm mb-6">
            {error}
          </div>
        )}

        {/* Rendez-vous à venir */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rendez-vous à venir</h2>
          
          {upcomingBookings.length === 0 ? (
            <div className="bg-white rounded-[32px] p-8 text-center border border-gray-200">
              <p className="text-gray-500">Vous n'avez aucun rendez-vous à venir.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-[32px] p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-primary/10 rounded-[16px] flex items-center justify-center">
                            <span className="text-2xl">📅</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{booking.serviceName}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Date :</span> {formatDate(booking.date)}
                            </p>
                            <p>
                              <span className="font-medium">Heure :</span> {booking.start_time}
                              {booking.duration && ` (${booking.duration} min)`}
                            </p>
                            <p>
                              <span className="font-medium">Professionnel :</span> {booking.proName}
                            </p>
                            {booking.servicePrice && (
                              <p>
                                <span className="font-medium">Prix :</span> {booking.servicePrice.toFixed(2).replace('.', ',')} €
                              </p>
                            )}
                            <p>
                              <span className="font-medium">Statut :</span>{' '}
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.status === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {booking.status === 'confirmed'
                                  ? 'Confirmé'
                                  : booking.status === 'pending'
                                  ? 'En attente'
                                  : booking.status === 'cancelled_by_client'
                                  ? 'Annulé par vous'
                                  : booking.status === 'no_show'
                                  ? 'Absence'
                                  : 'Annulé'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 md:flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement modify logic
                          console.log('Modify booking:', booking.id)
                        }}
                        className="w-full md:w-auto"
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement cancel logic
                          console.log('Cancel booking:', booking.id)
                        }}
                        className="w-full md:w-auto"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Rendez-vous passés */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rendez-vous passés</h2>
          
          {pastBookings.length === 0 ? (
            <div className="bg-white rounded-[32px] p-8 text-center border border-gray-200">
              <p className="text-gray-500">Vous n'avez aucun rendez-vous passé.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-[32px] p-6 border border-gray-200 shadow-sm opacity-75"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-[16px] flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{booking.serviceName}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Date :</span> {formatDate(booking.date)}
                        </p>
                        <p>
                          <span className="font-medium">Heure :</span> {booking.start_time}
                          {booking.duration && ` (${booking.duration} min)`}
                        </p>
                        <p>
                          <span className="font-medium">Professionnel :</span> {booking.proName}
                        </p>
                        {booking.servicePrice && (
                          <p>
                            <span className="font-medium">Prix :</span> {booking.servicePrice.toFixed(2).replace('.', ',')} €
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Statut :</span>{' '}
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-700'
                                : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {booking.status === 'confirmed'
                              ? 'Confirmé'
                              : booking.status === 'pending'
                              ? 'En attente'
                              : 'Annulé'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

