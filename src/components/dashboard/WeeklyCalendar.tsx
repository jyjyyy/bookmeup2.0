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
                        <div className="text-xs font-semibold truncate">
                          {booking.serviceName}
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
    </>
  )
}

