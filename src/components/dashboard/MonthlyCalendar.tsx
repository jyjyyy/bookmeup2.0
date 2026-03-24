'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface Booking {
  id: string
  date: string
  start_time: string
  end_time?: string
  duration?: number
  serviceName?: string
  client_name?: string
  client_email?: string
  status?: 'pending' | 'confirmed' | 'cancelled'
  attendance?: 'present' | 'absent'
}

interface MonthlyCalendarProps {
  month: Date
  bookings: Booking[]
  proId: string
  onBookingUpdate?: () => void
}

export function MonthlyCalendar({ month, bookings, proId, onBookingUpdate }: MonthlyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [loadingClientStatus, setLoadingClientStatus] = useState(false)
  const [unblocking, setUnblocking] = useState(false)
  const [unblockSuccess, setUnblockSuccess] = useState(false)
  const [updatingAttendance, setUpdatingAttendance] = useState(false)

  // Obtenir le premier jour du mois et le nombre de jours
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Obtenir le jour de la semaine du premier jour (0 = Dimanche, 1 = Lundi, etc.)
  // Convertir pour que Lundi = 0
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7 // Convertir Dimanche=0 → 6, Lundi=1 → 0

  // Générer les jours du mois
  const days: (number | null)[] = []
  // Ajouter des cases vides pour les jours avant le 1er
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null)
  }
  // Ajouter les jours du mois
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  // Obtenir les bookings pour un jour donné
  const getBookingsForDay = (day: number): Booking[] => {
    const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return bookings.filter((b) => b.date === dateStr)
  }

  // Vérifier si c'est aujourd'hui
  const isToday = (day: number): boolean => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month.getMonth() === today.getMonth() &&
      month.getFullYear() === today.getFullYear()
    )
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
          console.error('[MonthlyCalendar] Error loading client status:', error)
        })
        .finally(() => {
          setLoadingClientStatus(false)
        })
    } else {
      setClientId(null)
      setIsBlocked(false)
    }
  }, [selectedBooking])

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
        setTimeout(() => setUnblockSuccess(false), 3000)
      } else {
        console.error('[MonthlyCalendar] Unblock error:', data.error)
        alert(data.error || 'Erreur lors du déblocage')
      }
    } catch (error) {
      console.error('[MonthlyCalendar] Unblock error:', error)
      alert('Erreur lors du déblocage')
    } finally {
      setUnblocking(false)
    }
  }

  // Vérifier si un booking est dans le passé
  const isPastBooking = (booking: Booking): boolean => {
    const dateValue = booking.date
    const startTime = booking.start_time

    if (!dateValue || !startTime) return false

    try {
      const bookingDateTime = new Date(`${dateValue}T${startTime}:00`)
      const now = new Date()
      return bookingDateTime.getTime() < now.getTime()
    } catch (e) {
      // Si le parsing échoue, vérifier juste la date
      try {
        const bookingDate = new Date(dateValue)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        bookingDate.setHours(0, 0, 0, 0)
        return bookingDate.getTime() < today.getTime()
      } catch (e2) {
        return false
      }
    }
  }

  const handleAttendanceUpdate = async (attendance: 'present' | 'absent') => {
    if (!selectedBooking || !isPastBooking(selectedBooking)) return

    setUpdatingAttendance(true)
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendance, proId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Mettre à jour le booking localement
        setSelectedBooking({ ...selectedBooking, attendance })
        // Notifier le parent pour recharger les bookings
        if (onBookingUpdate) {
          onBookingUpdate()
        }
        // Notifier le dashboard pour rafraîchir les stats
        // localStorage triggers storage events in OTHER tabs/windows
        localStorage.setItem('bookingAttendanceUpdated', Date.now().toString())
        // Custom event for same-window updates
        window.dispatchEvent(new CustomEvent('bookingAttendanceUpdated'))
      } else {
        console.error('[MonthlyCalendar] Attendance update error:', data.error)
        alert(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('[MonthlyCalendar] Attendance update error:', error)
      alert('Erreur lors de la mise à jour')
    } finally {
      setUpdatingAttendance(false)
    }
  }

  const monthName = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const selectedBookings = selectedDate ? getBookingsForDay(parseInt(selectedDate)) : []

  return (
    <div className="space-y-6">
      {/* Calendrier */}
      <Card className="rounded-[32px] p-6">
        <h2 className="text-xl font-bold text-[#2A1F2D] mb-6 text-center capitalize">
          {monthName}
        </h2>

        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((dayName) => (
            <div
              key={dayName}
              className="text-center text-sm font-semibold text-slate-600 py-2"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-24"></div>
            }

            const dayBookings = getBookingsForDay(day)
            const isTodayDate = isToday(day)
            const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => setSelectedDate(dayBookings.length > 0 ? String(day) : null)}
                className={`h-24 rounded-[24px] bg-white border-2 p-2 text-left transition-all hover:shadow-bookmeup-sm ${
                  isTodayDate
                    ? 'border-primary bg-secondary/30'
                    : selectedDate === String(day)
                    ? 'border-primary shadow-bookmeup'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-semibold ${
                      isTodayDate ? 'text-primary' : 'text-[#2A1F2D]'
                    }`}
                  >
                    {day}
                  </span>
                  {isTodayDate && (
                    <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                      Aujourd'hui
                    </span>
                  )}
                </div>
                {dayBookings.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        className="w-full h-1.5 bg-primary rounded-full"
                      />
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-xs text-primary font-medium">
                        +{dayBookings.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </Card>

      {/* Liste des bookings du jour sélectionné */}
      {selectedDate && selectedBookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="rounded-[32px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#2A1F2D]">
                Rendez-vous du {selectedDate} {month.toLocaleDateString('fr-FR', { month: 'long' })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-slate-500 hover:text-[#2A1F2D]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {selectedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-secondary/30 rounded-[24px] p-4 border border-primary/10 cursor-pointer hover:shadow-bookmeup-sm transition-shadow"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-[#2A1F2D] mb-1">
                        {booking.serviceName}
                      </div>
                      <div className="text-sm text-slate-600">
                        {booking.start_time}
                        {booking.end_time && ` - ${booking.end_time}`}
                      </div>
                    </div>
                    {booking.status && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {booking.status === 'confirmed'
                          ? 'Confirmé'
                          : booking.status === 'cancelled'
                          ? 'Annulé'
                          : 'En attente'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">
                    <div>👤 {booking.client_name}</div>
                    {booking.client_email && (
                      <div className="text-xs mt-1">{booking.client_email}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Modal de détails du booking */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedBooking(null)
            setClientId(null)
            setIsBlocked(false)
            setUnblockSuccess(false)
          }}
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
                {/* Contrôles d'attendance pour les rendez-vous passés */}
                {selectedBooking && isPastBooking(selectedBooking) && selectedBooking.status !== 'cancelled' && (
                  <div className="mt-4 p-3 bg-secondary/30 border border-primary/20 rounded-[24px]">
                    <div className="text-sm font-semibold text-[#2A1F2D] mb-3">
                      Présence client
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAttendanceUpdate('present')}
                        disabled={updatingAttendance || selectedBooking.attendance === 'present'}
                        className={`flex-1 px-4 py-2 rounded-[24px] text-sm font-medium transition-colors ${
                          selectedBooking.attendance === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updatingAttendance && selectedBooking.attendance !== 'present'
                          ? 'Mise à jour...'
                          : '✓ Client présent'}
                      </button>
                      <button
                        onClick={() => handleAttendanceUpdate('absent')}
                        disabled={updatingAttendance || selectedBooking.attendance === 'absent'}
                        className={`flex-1 px-4 py-2 rounded-[24px] text-sm font-medium transition-colors ${
                          selectedBooking.attendance === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updatingAttendance && selectedBooking.attendance !== 'absent'
                          ? 'Mise à jour...'
                          : '✕ Client absent'}
                      </button>
                    </div>
                    {selectedBooking.attendance && (
                      <div className="mt-2 text-xs text-slate-600">
                        Statut: {selectedBooking.attendance === 'present' ? 'Présent' : 'Absent'}
                      </div>
                    )}
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
    </div>
  )
}

