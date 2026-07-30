"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/shared/motion"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import type { Booking } from "@/lib/types"

const DAYS_HEADER = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

export default function CalendarPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    if (!user) return
    async function fetchBookings() {
      try {
        const startOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`
        const endOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-31`
        const q = query(
          collection(db, "bookings"),
          where("pro_id", "==", user!.uid),
          where("date", ">=", startOfMonth),
          where("date", "<=", endOfMonth)
        )
        const snap = await getDocs(q)
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)))
      } catch (err) {
        console.error("Fetch bookings error:", err)
      } finally {
        setLoading(false)
      }
    }
    setLoading(true)
    fetchBookings()
  }, [user, year, month])

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6 // Sunday -> 6

    const days: (number | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
    // Pad to full weeks
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [year, month])

  // Bookings per date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of bookings) {
      const arr = map.get(b.date) || []
      arr.push(b)
      map.set(b.date, arr)
    }
    return map
  }, [bookings])

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
    setSelectedBooking(null)
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
    setSelectedBooking(null)
  }

  function goToday() {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today.toISOString().split("T")[0])
    setSelectedBooking(null)
  }

  function selectDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
    setSelectedBooking(null)
  }

  async function updateBookingStatus(bookingId: string, status: "confirmed" | "cancelled") {
    setUpdatingStatus(true)
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status,
        ...(status === "cancelled" ? { cancelled_at: new Date().toISOString(), cancelled_by: "pro" } : {}),
      })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      )
      setSelectedBooking((prev) => prev && prev.id === bookingId ? { ...prev, status } : prev)
    } catch (err) {
      console.error("Update booking error:", err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const selectedDayBookings = selectedDate
    ? (bookingsByDate.get(selectedDate) || []).sort((a, b) => a.start_time.localeCompare(b.start_time))
    : []

  const todayStr = new Date().toISOString().split("T")[0]
  const monthLabel = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Calendrier
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>
              Aujourd&apos;hui
            </Button>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-[var(--text-primary)] min-w-[140px] text-center capitalize">
                {monthLabel}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <FadeIn delay={0.1} className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {/* Header row */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_HEADER.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-[var(--text-muted)] py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    if (day === null) {
                      return <div key={idx} className="aspect-square" />
                    }
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    const dayBookings = bookingsByDate.get(dateStr) || []
                    const isToday = dateStr === todayStr
                    const isSelected = dateStr === selectedDate
                    const hasBookings = dayBookings.length > 0
                    const pending = dayBookings.filter((b) => b.status === "pending").length

                    return (
                      <button
                        key={idx}
                        onClick={() => selectDay(day)}
                        className={`aspect-square rounded-[var(--radius-sm)] flex flex-col items-center justify-center gap-0.5 text-sm transition-colors relative ${
                          isSelected
                            ? "bg-terracotta text-white"
                            : isToday
                            ? "bg-terracotta/10 text-terracotta font-semibold"
                            : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                        }`}
                      >
                        <span>{day}</span>
                        {hasBookings && (
                          <div className="flex gap-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-terracotta"}`} />
                            {pending > 0 && (
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/50" : "bg-warning"}`} />
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Day detail */}
        <FadeIn delay={0.2}>
          <Card>
            <CardContent className="p-4">
              {selectedDate ? (
                <>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-4 capitalize">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>

                  {selectedDayBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-muted)]">Aucun RDV ce jour</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayBookings.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          className={`w-full text-left p-3 rounded-[var(--radius-md)] border transition-colors ${
                            selectedBooking?.id === b.id
                              ? "border-terracotta bg-terracotta/5"
                              : "border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                              {b.start_time} — {b.end_time}
                            </span>
                            <Badge
                              variant={
                                b.status === "confirmed"
                                  ? "success"
                                  : b.status === "cancelled"
                                  ? "error"
                                  : "default"
                              }
                            >
                              {b.status === "confirmed"
                                ? "Confirmé"
                                : b.status === "cancelled"
                                ? "Annulé"
                                : b.status === "completed"
                                ? "Terminé"
                                : "En attente"}
                            </Badge>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">{b.client_name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{b.pricing_snapshot?.label}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Booking detail */}
                  {selectedBooking && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-default)] space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Détails du RDV
                        </p>
                        <button
                          onClick={() => setSelectedBooking(null)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <User className="h-3.5 w-3.5" />
                          {selectedBooking.client_name}
                        </p>
                        <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <Clock className="h-3.5 w-3.5" />
                          {selectedBooking.start_time} — {selectedBooking.end_time}
                        </p>
                        <p className="text-[var(--text-muted)]">
                          {selectedBooking.pricing_snapshot?.label} · {selectedBooking.pricing_snapshot?.price} €
                        </p>
                      </div>

                      {selectedBooking.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(selectedBooking.id, "confirmed")}
                            disabled={updatingStatus}
                          >
                            {updatingStatus ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Confirmer
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                            disabled={updatingStatus}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Annuler
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">
                    Sélectionnez un jour pour voir les RDV
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
