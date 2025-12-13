'use client'

import { useState } from 'react'
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

interface MonthlyCalendarProps {
  month: Date
  bookings: Booking[]
  proId: string
}

export function MonthlyCalendar({ month, bookings, proId }: MonthlyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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
                  className="bg-secondary/30 rounded-[24px] p-4 border border-primary/10"
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
    </div>
  )
}

