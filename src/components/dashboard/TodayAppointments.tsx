'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface TodayBooking {
  id: string
  start_time: string
  end_time?: string
  serviceName?: string
  client_name?: string
  status?: string
  attendance?: string
}

interface TodayAppointmentsProps {
  proId: string | null
}

export function TodayAppointments({ proId }: TodayAppointmentsProps) {
  const [bookings, setBookings] = useState<TodayBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!proId) {
      setLoading(false)
      return
    }

    let unsubscribes: (() => void)[] = []

    const setup = async () => {
      try {
        const { db } = await import('@/lib/firebaseClient')
        const { collection, query, where, onSnapshot } = await import('firebase/firestore')

        const today = new Date().toISOString().split('T')[0]
        const byId = new Map<string, TodayBooking>()

        const processSnapshot = (snapshot: any) => {
          snapshot.forEach((doc: any) => {
            const data = doc.data()
            if (data.date === today && data.status !== 'cancelled') {
              byId.set(doc.id, {
                id: doc.id,
                start_time: data.start_time || '00:00',
                end_time: data.end_time,
                serviceName: data.serviceName || 'Service',
                client_name: data.client_name || 'Client',
                status: data.status || 'pending',
                attendance: data.attendance,
              })
            } else {
              byId.delete(doc.id)
            }
          })

          const sorted = Array.from(byId.values()).sort((a, b) => a.start_time.localeCompare(b.start_time))
          setBookings(sorted)
          setLoading(false)
        }

        const q1 = query(collection(db, 'bookings'), where('proId', '==', proId))
        const q2 = query(collection(db, 'bookings'), where('pro_id', '==', proId))

        const unsub1 = onSnapshot(q1, processSnapshot, () => setLoading(false))
        const unsub2 = onSnapshot(q2, processSnapshot, () => setLoading(false))

        unsubscribes = [unsub1, unsub2]
      } catch (error) {
        console.error('[TodayAppointments] Error:', error)
        setLoading(false)
      }
    }

    setup()

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [proId])

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const getStatusStyle = (booking: TodayBooking) => {
    if (booking.attendance === 'absent') return { bg: 'bg-red-50', border: 'border-red-200/60', dot: 'bg-red-400', label: 'Absent' }
    if (booking.attendance === 'present') return { bg: 'bg-emerald-50', border: 'border-emerald-200/60', dot: 'bg-emerald-400', label: 'Terminé' }
    if (booking.start_time > currentTime) return { bg: 'bg-primary/5', border: 'border-primary/15', dot: 'bg-primary', label: 'À venir' }
    return { bg: 'bg-amber-50', border: 'border-amber-200/60', dot: 'bg-amber-400', label: 'En cours' }
  }

  return (
    <div className="rounded-[22px] border border-primary/8 bg-white p-6 shadow-[0_4px_20px_rgba(20,0,50,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-primary/15 to-secondary flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2A1F2D]">Rendez-vous du jour</h3>
            <p className="text-[11px] text-[#8a7a92]">
              {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/calendar"
          className="text-xs font-semibold text-primary hover:text-[#9C44AF] transition-colors flex items-center gap-1"
        >
          Voir tout
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-sm text-[#8a7a92]">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Chargement…
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-[16px] bg-[#F5F0F7] px-5 py-6 text-center">
          <div className="w-10 h-10 rounded-[12px] bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-[#B5A8BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
          <p className="text-xs text-[#8a7a92]">Aucun rendez-vous aujourd&apos;hui</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.slice(0, 5).map((booking, idx) => {
            const style = getStatusStyle(booking)
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-[14px] border ${style.bg} ${style.border}`}
              >
                <div className="text-sm font-bold text-[#2A1F2D] w-14 flex-shrink-0">
                  {booking.start_time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#2A1F2D] truncate">{booking.client_name}</p>
                  <p className="text-[11px] text-[#8a7a92] truncate">{booking.serviceName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span className="text-[10px] font-semibold text-[#8a7a92]">{style.label}</span>
                </div>
              </motion.div>
            )
          })}
          {bookings.length > 5 && (
            <p className="text-[11px] text-[#8a7a92] text-center pt-1">
              + {bookings.length - 5} autre{bookings.length - 5 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
