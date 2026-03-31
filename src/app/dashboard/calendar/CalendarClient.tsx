'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  })
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const getMonday = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  const getSunday = (date: Date): Date => {
    const monday = getMonday(date)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return sunday
  }

  const getWeekRange = (date: Date): { start: string; end: string } => {
    const monday = getMonday(date)
    const sunday = getSunday(date)
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    }
  }

  const getMonthRange = (date: Date): { start: string; end: string } => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    }
  }

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true)
      try {
        const range = view === 'week'
          ? getWeekRange(currentWeekStart)
          : getMonthRange(currentMonth)

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

            if (bookingDate >= range.start && bookingDate <= range.end) {
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

  const handleBookingUpdate = () => {
    setRefreshKey((prev) => prev + 1)
  }

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

  // Current period label
  const getPeriodLabel = () => {
    if (view === 'week') {
      const sunday = getSunday(currentWeekStart)
      const startStr = currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      const endStr = sunday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      return `${startStr} — ${endStr}`
    } else {
      return currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Calendrier
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">
          Mon agenda
        </h1>
        <p className="text-sm text-[#8a7a92]">
          Visualisez tous vos rendez-vous de la semaine ou du mois.
        </p>
      </motion.div>

      {/* Controls bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="bg-white rounded-[20px] border border-primary/8 shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
      >
        {/* Toggle */}
        <div className="flex bg-[#F5F0F7] rounded-full p-1">
          <button
            onClick={() => setView('week')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
              view === 'week'
                ? 'bg-white text-[#2A1F2D] shadow-[0_2px_8px_rgba(20,0,50,0.06)]'
                : 'text-[#8a7a92] hover:text-[#2A1F2D]'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
              view === 'month'
                ? 'bg-white text-[#2A1F2D] shadow-[0_2px_8px_rgba(20,0,50,0.06)]'
                : 'text-[#8a7a92] hover:text-[#2A1F2D]'
            }`}
          >
            Mois
          </button>
        </div>

        {/* Period label + Navigation */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#2A1F2D] capitalize hidden md:block">
            {getPeriodLabel()}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToPrevious}
              className="w-9 h-9 rounded-full border border-[#EDE8F0] hover:border-primary/20 hover:bg-primary/5 flex items-center justify-center text-[#8a7a92] hover:text-primary transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 rounded-full text-xs font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all min-w-[120px]"
            >
              {getPeriodLabel()}
            </button>
            <button
              onClick={goToNext}
              className="w-9 h-9 rounded-full border border-[#EDE8F0] hover:border-primary/20 hover:bg-primary/5 flex items-center justify-center text-[#8a7a92] hover:text-primary transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-white rounded-[22px] overflow-hidden border border-primary/8 shadow-[0_4px_24px_rgba(20,0,50,0.04)]"
      >
        {loading ? (
          <div className="p-16">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center">
                <Loader />
              </div>
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
      </motion.div>
    </div>
  )
}
