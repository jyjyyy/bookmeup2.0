'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { motion } from 'framer-motion'
import { isLessThan24Hours } from '@/lib/bookingUtils'

interface Booking {
  id: string
  date: string
  start_time: string
  end_time?: string
  duration?: number
  serviceName?: string
  client_name?: string
  client_email?: string
  status?: 'pending' | 'confirmed' | 'cancelled' | 'cancelled_by_client' | 'no_show'
  attendance?: 'present' | 'absent'
}

interface WeeklyCalendarProps {
  weekStart: Date
  bookings: Booking[]
  proId: string
}

export function WeeklyCalendar({ weekStart, bookings, proId }: WeeklyCalendarProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [loadingClientStatus, setLoadingClientStatus] = useState(false)
  const [unblocking, setUnblocking] = useState(false)
  const [unblockSuccess, setUnblockSuccess] = useState(false)
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [attendanceError, setAttendanceError] = useState('')
  const [attendanceSuccess, setAttendanceSuccess] = useState('')
  const [absentConfirmModalOpen, setAbsentConfirmModalOpen] = useState(false)

  // Fonction pour obtenir le lundi d'une semaine
  const getMonday = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  // Générer les jours de la semaine (Lundi à Dimanche)
  const getWeekDays = (): Date[] => {
    const monday = getMonday(weekStart)
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Générer les heures (08:00 à 20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8 à 20

  // Convertir heure en minutes depuis minuit (heure locale)
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  // Formater une date en YYYY-MM-DD en heure locale (pas UTC)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Obtenir les bookings pour un jour donné
  const getBookingsForDay = (date: Date): Booking[] => {
    const dateStr = formatDateLocal(date)
    return bookings.filter((b) => b.date === dateStr)
  }

  // Calculer la position et hauteur d'un booking
  const getBookingStyle = (booking: Booking) => {
    const startMinutes = timeToMinutes(booking.start_time)
    const duration = booking.duration || 60
    
    // Calendrier: 8h à 20h (13 heures affichées)
    // Hauteur totale: 832px, donc chaque heure = 832 / 13 ≈ 64px
    const startHour = 8
    const endHour = 20
    const totalHours = endHour - startHour + 1 // 13 heures
    const containerHeight = 832 // px (h-[832px])
    const hourHeight = containerHeight / totalHours // ≈ 64px par heure
    
    // Position en pixels depuis le haut du conteneur
    const minutesFromStart = startMinutes - (startHour * 60)
    const topPx = (minutesFromStart / 60) * hourHeight
    
    // Hauteur en pixels
    const heightPx = (duration / 60) * hourHeight
    
    // Convertir en pourcentage de la hauteur du conteneur
    const topPercent = (topPx / containerHeight) * 100
    const heightPercent = (heightPx / containerHeight) * 100

    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
    }
  }

  // Charger le statut du client quand une réservation est sélectionnée
  useEffect(() => {
    if (selectedBooking?.client_email) {
      setLoadingClientStatus(true)
      setClientId(null)
      setIsBlocked(false)
      setUnblockSuccess(false)
      
      fetch(`/api/clients/status?email=${encodeURIComponent(selectedBooking.client_email)}`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.clientId) {
            setClientId(data.clientId)
            setIsBlocked(data.isBlocked === true)
          }
        })
        .catch((error) => {
          console.error('[WeeklyCalendar] Error loading client status:', error)
        })
        .finally(() => {
          setLoadingClientStatus(false)
        })
    } else {
      setClientId(null)
      setIsBlocked(false)
    }
  }, [selectedBooking])

  // Helper function to check if booking start time has passed
  const isBookingInPast = (booking: Booking): boolean => {
    try {
      const bookingStartDate = new Date(`${booking.date}T${booking.start_time}`)
      if (isNaN(bookingStartDate.getTime())) {
        return false
      }
      return bookingStartDate <= new Date()
    } catch {
      return false
    }
  }

  // Helper function to check if attendance can be marked
  const canMarkAttendance = (booking: Booking): boolean => {
    // Must be in the past
    if (!isBookingInPast(booking)) {
      return false
    }
    // Must not be cancelled
    if (booking.status === 'cancelled' || booking.status === 'cancelled_by_client') {
      return false
    }
    // Must not already have attendance marked
    if (booking.attendance === 'present' || booking.attendance === 'absent') {
      return false
    }
    return true
  }

  const handleMarkAttendanceClick = (attendance: 'present' | 'absent') => {
    if (attendance === 'absent') {
      // Show confirmation modal for absence
      setAbsentConfirmModalOpen(true)
    } else {
      // Directly mark as present (no penalty)
      handleMarkAttendance('present')
    }
  }

  const handleMarkAttendance = async (attendance: 'present' | 'absent') => {
    if (!selectedBooking || markingAttendance) {
      return
    }

    // Validate required fields
    if (!selectedBooking.id) {
      setAttendanceError('ID de réservation manquant')
      return
    }

    if (!proId) {
      setAttendanceError('ID professionnel manquant')
      return
    }

    // Close confirmation modal if open
    setAbsentConfirmModalOpen(false)

    setMarkingAttendance(true)
    setAttendanceError('')
    setAttendanceSuccess('')

    // Prepare payload
    const payload = {
      bookingId: selectedBooking.id,
      pro_id: proId,
      attendance: attendance,
    }

    // Temporary console.log for debugging
    console.log('ATTENDANCE PAYLOAD', payload)

    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la confirmation de présence')
      }

      setAttendanceSuccess(
        attendance === 'present' 
          ? 'Présence confirmée avec succès' 
          : 'Absence enregistrée avec succès'
      )

      // Update booking in local state
      setSelectedBooking({
        ...selectedBooking,
        attendance,
        status: attendance === 'absent' ? 'no_show' : selectedBooking.status,
      })

      // Reload page after 1.5 seconds to refresh bookings list
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setAttendanceError(err.message || 'Erreur lors de la confirmation de présence')
      setMarkingAttendance(false)
    }
  }

  const handleUnblock = async () => {
    if (!clientId) return

    setUnblocking(true)
    setUnblockSuccess(false)

    try {
      const response = await fetch('/api/clients/unblock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ clientId }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsBlocked(false)
        setUnblockSuccess(true)
        // Réinitialiser le message de succès après 3 secondes
        setTimeout(() => setUnblockSuccess(false), 3000)
      } else {
        console.error('[WeeklyCalendar] Unblock error:', data.error)
        alert(data.error || 'Erreur lors du déblocage')
      }
    } catch (error) {
      console.error('[WeeklyCalendar] Unblock error:', error)
      alert('Erreur lors du déblocage')
    } finally {
      setUnblocking(false)
    }
  }

  const weekDays = getWeekDays()
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const today = new Date()
  const todayStr = formatDateLocal(today)

  return (
    <>
      <Card className="rounded-[32px] p-6 overflow-hidden">
        <div className="grid grid-cols-8 gap-2">
          {/* Colonne des heures */}
          <div className="col-span-1">
            <div className="h-12"></div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 flex items-start justify-end pr-2 text-xs text-slate-500"
              >
                {hour}h
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {weekDays.map((day, dayIndex) => {
            const dateStr = formatDateLocal(day)
            const isToday = dateStr === todayStr
            const dayBookings = getBookingsForDay(day)

            return (
              <div key={dayIndex} className="col-span-1 relative">
                {/* En-tête du jour */}
                <div
                  className={`h-12 flex flex-col items-center justify-center rounded-[24px] mb-2 ${
                    isToday
                      ? 'bg-primary text-white'
                      : 'bg-secondary/30 text-[#2A1F2D]'
                  }`}
                >
                  <div className="text-xs font-medium">{dayNames[dayIndex]}</div>
                  <div className="text-sm font-bold">{day.getDate()}</div>
                </div>

                {/* Colonne des créneaux horaires */}
                <div className="relative h-[832px] border border-gray-100 rounded-[24px] bg-white">
                  {dayBookings.map((booking) => {
                    const style = getBookingStyle(booking)
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setSelectedBooking(booking)}
                        className="absolute left-1 right-1 rounded-[16px] bg-primary text-white p-2 cursor-pointer hover:bg-primaryDark transition-colors shadow-bookmeup-sm z-10"
                        style={style}
                      >
                        <div className="text-xs font-semibold truncate flex items-center gap-1">
                          {booking.attendance === 'present' && <span className="text-green-300">✔</span>}
                          {booking.attendance === 'absent' && <span className="text-red-300">❌</span>}
                          <span className="truncate">{booking.serviceName}</span>
                        </div>
                        <div className="text-xs opacity-90 truncate">
                          {booking.start_time}
                          {booking.end_time && ` - ${booking.end_time}`}
                        </div>
                        <div className="text-xs opacity-75 truncate mt-1">
                          {booking.client_name}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Modal de détails du booking */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="rounded-[32px] p-6 max-w-md">
              <h3 className="text-xl font-bold text-[#2A1F2D] mb-4">
                Détails du rendez-vous
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Service</span>
                  <span className="font-semibold text-[#2A1F2D]">
                    {selectedBooking.serviceName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Client</span>
                  <span className="font-semibold text-[#2A1F2D]">
                    {selectedBooking.client_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Date</span>
                  <span className="font-semibold text-[#2A1F2D]">
                    {new Date(selectedBooking.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Heure</span>
                  <span className="font-semibold text-[#2A1F2D]">
                    {selectedBooking.start_time}
                    {selectedBooking.end_time && ` - ${selectedBooking.end_time}`}
                  </span>
                </div>
                {selectedBooking.duration && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Durée</span>
                    <span className="font-semibold text-[#2A1F2D]">
                      {selectedBooking.duration} minutes
                    </span>
                  </div>
                )}
                {selectedBooking.status && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Statut</span>
                    <span
                      className={`font-semibold ${
                        selectedBooking.status === 'confirmed'
                          ? 'text-green-600'
                          : selectedBooking.status === 'cancelled'
                          ? 'text-red-600'
                          : 'text-primary'
                      }`}
                    >
                      {selectedBooking.status === 'confirmed'
                        ? 'Confirmé'
                        : selectedBooking.status === 'cancelled'
                        ? 'Annulé'
                        : 'En attente'}
                    </span>
                  </div>
                )}
                {selectedBooking.client_email && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Email</span>
                    <span className="font-semibold text-[#2A1F2D] text-sm">
                      {selectedBooking.client_email}
                    </span>
                  </div>
                )}
                {loadingClientStatus && (
                  <div className="text-xs text-slate-500 mt-2">
                    Chargement du statut...
                  </div>
                )}
                {!loadingClientStatus && isBlocked && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-[24px]">
                    <div className="text-sm font-semibold text-red-700 mb-2">
                      ⚠️ Client bloqué
                    </div>
                    <button
                      onClick={handleUnblock}
                      disabled={unblocking}
                      className="w-full px-4 py-2 rounded-[24px] bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {unblocking ? 'Déblocage...' : 'Débloquer ce client'}
                    </button>
                    {unblockSuccess && (
                      <div className="mt-2 text-xs text-green-600 font-medium">
                        ✓ Client débloqué avec succès
                      </div>
                    )}
                  </div>
                )}

                {/* Attendance status display */}
                {selectedBooking && (selectedBooking.attendance === 'present' || selectedBooking.attendance === 'absent') && (
                  <div className={`mt-4 p-4 rounded-[24px] border ${
                    selectedBooking.attendance === 'present' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`text-sm font-semibold flex items-center gap-2 ${
                      selectedBooking.attendance === 'present' 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {selectedBooking.attendance === 'present' ? (
                        <>
                          <span className="text-lg">✔</span>
                          <span>Client présent</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg">❌</span>
                          <span>Client absent</span>
                        </>
                      )}
                    </div>
                    <div className={`text-xs mt-1 ${
                      selectedBooking.attendance === 'present' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      Présence confirmée
                    </div>
                  </div>
                )}

                {/* Attendance confirmation section */}
                {selectedBooking && canMarkAttendance(selectedBooking) && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-[24px]">
                    <div className="text-sm font-semibold text-blue-900 mb-3">
                      Confirmer la présence
                    </div>
                    {attendanceError && (
                      <div className="mb-3 text-xs text-red-600 font-medium">
                        {attendanceError}
                      </div>
                    )}
                    {attendanceSuccess && (
                      <div className="mb-3 text-xs text-green-600 font-medium">
                        {attendanceSuccess}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleMarkAttendanceClick('present')}
                        disabled={markingAttendance || selectedBooking.attendance !== undefined}
                        className="flex-1 rounded-[24px] bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {markingAttendance ? '...' : '✓ Client présent'}
                      </Button>
                      <Button
                        onClick={() => handleMarkAttendanceClick('absent')}
                        disabled={markingAttendance || selectedBooking.attendance !== undefined || selectedBooking.attendance === 'absent'}
                        className="flex-1 rounded-[24px] bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {markingAttendance ? '...' : '✗ Client absent'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedBooking(null)
                    setClientId(null)
                    setIsBlocked(false)
                    setUnblockSuccess(false)
                    setAttendanceError('')
                    setAttendanceSuccess('')
                    setAbsentConfirmModalOpen(false)
                  }}
                  className="px-4 py-2 rounded-[32px] bg-primary text-white hover:bg-primaryDark transition-colors"
                >
                  Fermer
                </button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Absence Confirmation Modal */}
      <Modal
        isOpen={absentConfirmModalOpen}
        onClose={() => {
          if (!markingAttendance) {
            setAbsentConfirmModalOpen(false)
          }
        }}
        title="Confirmer l'absence"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-[24px] text-sm">
            <p className="font-semibold mb-1">Attention :</p>
            <p>Confirmer l'absence du client ?</p>
            <p className="mt-1">Cette action ajoutera une pénalité.</p>
          </div>

          {selectedBooking && (
            <div className="text-sm text-gray-700 space-y-1">
              <p><span className="font-medium">Client :</span> {selectedBooking.client_name}</p>
              <p><span className="font-medium">Service :</span> {selectedBooking.serviceName}</p>
              <p><span className="font-medium">Date :</span> {new Date(selectedBooking.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
              <p><span className="font-medium">Heure :</span> {selectedBooking.start_time}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbsentConfirmModalOpen(false)}
              disabled={markingAttendance}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => handleMarkAttendance('absent')}
              disabled={markingAttendance}
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              {markingAttendance ? 'Enregistrement...' : 'Confirmer l\'absence'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

