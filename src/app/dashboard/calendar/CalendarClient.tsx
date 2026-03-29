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
  attendance?: 'present' | 'absent'
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
  const [refreshKey, setRefreshKey] = useState(0)

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
        // Support both schemas: proId and pro_id
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebaseClient')

        const bookingsQueries = [
          query(collection(db, 'bookings'), where('proId', '==', proId)),
          query(collection(db, 'bookings'), where('pro_id', '==', proId)),
        ]

        const snapshots = await Promise.allSettled(
          bookingsQueries.map((q) => getDocs(q))
        )
        
        const bookingsById = new Map<string, Booking>()
        
        for (const res of snapshots) {
          if (res.status !== 'fulfilled') continue
          res.value.forEach((doc) => {
            const data = doc.data()
            const bookingDate = data.date

            // Filtrer côté client pour la plage de dates
            if (bookingDate >= range.start && bookingDate <= range.end) {
              // Éviter les doublons si les deux requêtes retournent le même booking
              if (!bookingsById.has(doc.id)) {
                bookingsById.set(doc.id, {
                  id: doc.id,
                  date: bookingDate,
                  start_time: data.start_time,
                  end_time: data.end_time,
                  duration: data.duration || 60,
                  serviceName: data.serviceName || 'Service',
                  client_name: data.client_name || 'Client',
                  client_email: data.client_email,
                  status: data.status || 'pending',
                  attendance: data.attendance,
                })
              }
            }
          })
        }

        const loadedBookings = Array.from(bookingsById.values())

        setBookings(loadedBookings)
      } catch (error) {
        console.error('[Calendar] Error loading bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [proId, view, currentWeekStart, currentMonth, refreshKey])

  // Callback pour rafraîchir les bookings après mise à jour d'attendance
  const handleBookingUpdate = () => {
    setRefreshKey((prev) => prev + 1)
  }

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
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Calendrier
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">
          Mon agenda
        </h1>
        <p className="text-sm text-[#8a7a92]">
          Visualisez tous vos rendez-vous de la semaine ou du mois.
        </p>
      </div>

      {/* Controls bar */}
      <div className="bg-white rounded-[22px] border border-primary/8 shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Toggle Semaine / Mois */}
        <div className="flex bg-[#F5F0F7] rounded-full p-1">
          <button
            onClick={() => setView('week')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              view === 'week'
                ? 'bg-white text-[#2A1F2D] shadow-sm'
                : 'text-[#8a7a92] hover:text-[#2A1F2D]'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              view === 'month'
                ? 'bg-white text-[#2A1F2D] shadow-sm'
                : 'text-[#8a7a92] hover:text-[#2A1F2D]'
            }`}
          >
            Mois
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className="w-9 h-9 rounded-[10px] border border-[#EDE8F0] hover:border-primary/20 hover:bg-secondary/30 flex items-center justify-center text-[#7A6B80] transition-all"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-full text-xs font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={goToNext}
            className="w-9 h-9 rounded-[10px] border border-[#EDE8F0] hover:border-primary/20 hover:bg-secondary/30 flex items-center justify-center text-[#7A6B80] transition-all"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-[22px] overflow-hidden border border-primary/8 shadow-[0_4px_20px_rgba(20,0,50,0.04)]">
        {loading ? (
          <div className="p-12 md:p-16">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader />
              <span className="text-sm text-[#8a7a92] font-medium">Chargement des rendez-vous…</span>
            </div>
          </div>
        ) : view === 'week' ? (
          <div className="p-4 md:p-6">
            <WeeklyCalendar
              weekStart={currentWeekStart}
              bookings={bookings}
              proId={proId}
              onBookingUpdate={handleBookingUpdate}
            />
          </div>
        ) : (
          <div className="p-4 md:p-6">
            <MonthlyCalendar
              month={currentMonth}
              bookings={bookings}
              proId={proId}
              onBookingUpdate={handleBookingUpdate}
            />
          </div>
        )}
      </div>
    </div>
  )
}

