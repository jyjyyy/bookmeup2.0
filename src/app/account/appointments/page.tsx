'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { isLessThan24Hours } from '@/lib/bookingUtils'

interface Booking {
  id: string
  date: string | Date | { toDate: () => Date } // Firestore Timestamp, Date, or string
  start_time: string
  end_time: string
  serviceName: string
  servicePrice?: number
  proName: string
  proId?: string // Add proId to interface
  serviceId?: string // Add serviceId to interface
  status: 'pending' | 'confirmed' | 'cancelled' | 'cancelled_by_client' | 'no_show'
  isPast: boolean
  duration: number | null
  startAt?: string // ISO date string if available
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const loadBookings = async () => {
      // Wait for auth to load
      if (authLoading) {
        return
      }

      try {
        // Restrict access to authenticated clients only
        if (!user) {
          router.push('/auth/login?redirect=/account/appointments')
          return
        }

        // Verify user is a client
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
            console.error('[Appointments] Error fetching service:', error)
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
            console.error('[Appointments] Error fetching pro:', error)
          }

          fetchedBookings.push({
            id: bookingDoc.id,
            date: bookingData.date,
            start_time: bookingData.start_time,
            end_time: bookingData.end_time,
            serviceName,
            servicePrice,
            proName,
            proId: bookingData.pro_id,
            serviceId: bookingData.service_id,
            status: bookingData.status || 'confirmed',
            isPast: false, // Will be recalculated on frontend
            duration: bookingData.duration || null,
          })
        }

        // TEMPORARY debug log
        console.log('🔥 BOOKINGS FROM FIRESTORE', fetchedBookings)

        setBookings(fetchedBookings)
      } catch (err: any) {
        console.error('[Appointments] Error loading bookings:', err)
        setError(err.message || 'Erreur lors du chargement des rendez-vous')
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
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

  // Check if booking can be modified (<24h check)
  const canModifyBooking = (booking: Booking): boolean => {
    const bookingStartDate = getBookingStartDate(booking)
    if (!bookingStartDate) return false
    return !isLessThan24Hours(bookingStartDate)
  }

  // Handle modify button click
  const handleModifyClick = async (booking: Booking) => {
    // Compute bookingStartDate using getBookingStartDate
    const bookingStartDate = getBookingStartDate(booking)
    
    if (!bookingStartDate) {
      setError('Impossible de déterminer la date du rendez-vous')
      return
    }

    // Call isLessThan24Hours(bookingStartDate)
    if (isLessThan24Hours(bookingStartDate)) {
      // Modification NOT allowed - show exact message
      setError('Vous ne pouvez plus modifier ce rendez-vous.\nVeuillez annuler votre rendez-vous ou contacter le professionnel.')
      return
    }

    // Modification allowed - redirect to booking page with editBookingId
    if (!booking.proId) {
      setError('Impossible de trouver le professionnel')
      return
    }

    // Fetch pro slug from Firestore
    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebaseClient')
      
      // Try pros collection first
      const prosDoc = await getDoc(doc(db, 'pros', booking.proId))
      let proSlug: string | null = null
      
      if (prosDoc.exists()) {
        const prosData = prosDoc.data()
        proSlug = prosData.slug || null
      }
      
      // Fallback to profiles
      if (!proSlug) {
        const profileDoc = await getDoc(doc(db, 'profiles', booking.proId))
        if (profileDoc.exists()) {
          const profileData = profileDoc.data()
          proSlug = profileData.slug || null
        }
      }
      
      if (!proSlug) {
        setError('Impossible de trouver la page du professionnel')
        return
      }

      // Redirect to booking page with editBookingId
      router.push(`/booking/${proSlug}?editBookingId=${booking.id}&service_id=${booking.serviceId || ''}`)
    } catch (err: any) {
      console.error('[Modify] Error fetching pro slug:', err)
      setError('Erreur lors de la redirection vers la page de modification')
    }
  }

  // Handle cancel button click
  const handleCancelClick = (booking: Booking) => {
    setCancelBooking(booking)
    setCancelModalOpen(true)
    setError('')
  }

  // Handle cancel confirmation
  const handleCancelConfirm = async () => {
    if (!cancelBooking || !user?.email) {
      return
    }

    setCancelLoading(true)
    setError('')

    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: cancelBooking.id,
          client_email: user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation')
      }

      // Success - close modal and reload
      setCancelModalOpen(false)
      setCancelBooking(null)
      setSuccessMessage('Rendez-vous annulé avec succès')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
      
      // Reload data
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation')
      setCancelLoading(false)
    }
  }


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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[32px] text-sm mb-6 whitespace-pre-line">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-[32px] text-sm mb-6">
            {successMessage}
          </div>
        )}

        {/* Upcoming appointments section */}
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
                    {/* Action buttons for upcoming appointments only */}
                    <div className="flex gap-2 md:flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModifyClick(booking)}
                        disabled={!canModifyBooking(booking)}
                        className="w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!canModifyBooking(booking) ? 'Modification impossible moins de 24h avant le rendez-vous' : ''}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => handleCancelClick(booking)}
                        disabled={cancelLoading}
                        className="w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Past appointments section */}
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
                  {/* Past appointments: display details only, no action buttons */}
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

      {/* Cancel Booking Confirmation Modal */}
      {cancelModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => {
            if (!cancelLoading) {
              setCancelModalOpen(false)
              setCancelBooking(null)
              setError('')
            }
          }}
        >
          <div 
            className="bg-white rounded-[32px] p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-primary">Confirmer l'annulation</h2>
              <button
                onClick={() => {
                  if (!cancelLoading) {
                    setCancelModalOpen(false)
                    setCancelBooking(null)
                    setError('')
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={cancelLoading}
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {cancelBooking && (() => {
                const bookingStartDate = getBookingStartDate(cancelBooking)
                const isLate = bookingStartDate ? isLessThan24Hours(bookingStartDate) : false
                
                return (
                  <>
                    {isLate && (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-[32px] text-sm">
                        <p className="font-semibold mb-1">Attention :</p>
                        <p>Annuler ce rendez-vous moins de 24h avant entraînera une pénalité.</p>
                      </div>
                    )}
                    
                    <p className="text-gray-700">
                      Êtes-vous sûr de vouloir annuler ce rendez-vous ?
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Service :</span> {cancelBooking.serviceName}</p>
                      <p><span className="font-medium">Date :</span> {formatDate(cancelBooking.date)}</p>
                      <p><span className="font-medium">Heure :</span> {cancelBooking.start_time}</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCancelModalOpen(false)
                          setCancelBooking(null)
                          setError('')
                        }}
                        disabled={cancelLoading}
                        className="flex-1"
                      >
                        Retour
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCancelConfirm}
                        disabled={cancelLoading}
                        className="flex-1"
                        variant={isLate ? "default" : "subtle"}
                      >
                        {cancelLoading ? 'Annulation...' : 'Confirmer l\'annulation'}
                      </Button>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

