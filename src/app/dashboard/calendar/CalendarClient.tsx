'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { WeeklyCalendar } from '@/components/dashboard/WeeklyCalendar'
import { MonthlyCalendar } from '@/components/dashboard/MonthlyCalendar'
import { Card } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'

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

interface CalendarClientProps {
  proId: string
}

export function CalendarClient({ proId }: CalendarClientProps) {
  const [view, setView] = useState<'week' | 'month'>('week')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // Commencer par le lundi de la semaine actuelle
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Ajuster pour lundi
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  })
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Commencer par le 1er jour du mois actuel
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  // Fonction utilitaire pour obtenir le lundi d'une semaine
  const getMonday = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  // Fonction utilitaire pour obtenir le dimanche d'une semaine
  const getSunday = (date: Date): Date => {
    const monday = getMonday(date)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return sunday
  }

  // Fonction utilitaire pour obtenir la plage de dates d'une semaine
  const getWeekRange = (date: Date): { start: string; end: string } => {
    const monday = getMonday(date)
    const sunday = getSunday(date)
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    }
  }

  // Fonction utilitaire pour obtenir la plage de dates d'un mois
  const getMonthRange = (date: Date): { start: string; end: string } => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    }
  }

  // Charger les bookings
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true)
      try {
        const range = view === 'week' 
          ? getWeekRange(currentWeekStart)
          : getMonthRange(currentMonth)

        // Charger les bookings depuis Firestore
        // Note: Firestore ne supporte pas >= et <= sur le même champ dans une requête
        // On charge tous les bookings du pro et on filtre côté client
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebaseClient')

        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('pro_id', '==', proId)
        )

        const snapshot = await getDocs(bookingsQuery)
        const loadedBookings: Booking[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          const bookingDate = data.date

          // Filtrer côté client pour la plage de dates
          if (bookingDate >= range.start && bookingDate <= range.end) {
            loadedBookings.push({
              id: doc.id,
              date: bookingDate,
              start_time: data.start_time,
              end_time: data.end_time,
              duration: data.duration || 60,
              serviceName: data.serviceName || 'Service',
              client_name: data.client_name || 'Client',
              client_email: data.client_email,
              status: data.status || 'pending',
            })
          }
        })

        setBookings(loadedBookings)
      } catch (error) {
        console.error('[Calendar] Error loading bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [proId, view, currentWeekStart, currentMonth])

  // Navigation
  const goToToday = () => {
    const today = new Date()
    if (view === 'week') {
      setCurrentWeekStart(getMonday(today))
    } else {
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    }
  }

  const goToPrevious = () => {
    if (view === 'week') {
      const prevWeek = new Date(currentWeekStart)
      prevWeek.setDate(prevWeek.getDate() - 7)
      setCurrentWeekStart(prevWeek)
    } else {
      const prevMonth = new Date(currentMonth)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      setCurrentMonth(prevMonth)
    }
  }

  const goToNext = () => {
    if (view === 'week') {
      const nextWeek = new Date(currentWeekStart)
      nextWeek.setDate(nextWeek.getDate() + 7)
      setCurrentWeekStart(nextWeek)
    } else {
      const nextMonth = new Date(currentMonth)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      setCurrentMonth(nextMonth)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header avec contrôles amélioré */}
      <Card className="rounded-[32px] p-6 md:p-8 shadow-bookmeup border border-white/70 bg-white/90">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2A1F2D] mb-3">
              Mon agenda
            </h1>
            <p className="text-base text-slate-600">
              Visualisez tous vos rendez-vous de la semaine ou du mois.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Toggle Semaine / Mois amélioré */}
            <div className="flex bg-secondary/30 rounded-[32px] p-1.5 shadow-inner">
              <button
                onClick={() => setView('week')}
                className={`px-5 py-2.5 rounded-[32px] text-sm font-semibold transition-all ${
                  view === 'week'
                    ? 'bg-primary text-white shadow-bookmeup-sm'
                    : 'text-[#2A1F2D] hover:bg-secondary/50'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-5 py-2.5 rounded-[32px] text-sm font-semibold transition-all ${
                  view === 'month'
                    ? 'bg-primary text-white shadow-bookmeup-sm'
                    : 'text-[#2A1F2D] hover:bg-secondary/50'
                }`}
              >
                Mois
              </button>
            </div>

            {/* Navigation améliorée */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                className="rounded-[32px] px-4 py-2 hover:bg-secondary transition-colors"
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="rounded-[32px] px-5 py-2 hover:bg-secondary transition-colors font-medium"
              >
                Aujourd&apos;hui
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                className="rounded-[32px] px-4 py-2 hover:bg-secondary transition-colors"
              >
                →
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendrier dans conteneur arrondi */}
      <div className="rounded-[32px] overflow-hidden shadow-bookmeup border border-white/70 bg-white/90">
        {loading ? (
          <div className="p-12 md:p-16">
            <div className="flex items-center justify-center">
              <Loader />
              <span className="ml-4 text-slate-600 font-medium">Chargement des rendez-vous...</span>
            </div>
          </div>
        ) : view === 'week' ? (
          <div className="p-4 md:p-6">
            <WeeklyCalendar
              weekStart={currentWeekStart}
              bookings={bookings}
              proId={proId}
            />
          </div>
        ) : (
          <div className="p-4 md:p-6">
            <MonthlyCalendar
              month={currentMonth}
              bookings={bookings}
              proId={proId}
            />
          </div>
        )}
      </div>
    </div>
  )
}

