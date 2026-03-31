'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { checkSubscriptionStatus } from '@/lib/subscription'
import { AvailabilitySkeleton } from '@/components/ui/skeleton'

const DAY_LABELS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
]

const DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

interface DayAvailability {
  dayOfWeek: number
  isEnabled: boolean
  slots: { start: string; end: string }[]
}

const DEFAULT_SLOT = { start: '09:00', end: '18:00' }

export default function AvailabilityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [proId, setProId] = useState<string | null>(null)
  const [days, setDays] = useState<DayAvailability[]>(() =>
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isEnabled: false,
      slots: [],
    }))
  )

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const currentUser = await getCurrentUser()
        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }
        if (currentUser.profile.role !== 'pro') {
          router.push('/')
          return
        }

        const sub = await checkSubscriptionStatus(currentUser.user.uid)
        if (!sub.hasActiveSubscription) {
          router.push('/dashboard/settings/subscription')
          return
        }

        const uid = currentUser.user.uid
        setProId(uid)

        const res = await fetch(`/api/availability/get?proId=${uid}`)
        if (!res.ok) throw new Error('Impossible de charger les disponibilités')

        const data = await res.json()
        if (Array.isArray(data.days)) {
          setDays(
            data.days.map((d: any) => ({
              dayOfWeek: d.dayOfWeek,
              isEnabled: Boolean(d.isEnabled),
              slots: Array.isArray(d.slots) && d.slots.length > 0
                ? d.slots
                : d.isEnabled ? [{ ...DEFAULT_SLOT }] : [],
            }))
          )
        }
      } catch (err: any) {
        console.error('[Availability] load error:', err)
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const toggleDay = useCallback((dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d
        const isEnabled = !d.isEnabled
        return {
          ...d,
          isEnabled,
          slots: isEnabled && d.slots.length === 0 ? [{ ...DEFAULT_SLOT }] : d.slots,
        }
      })
    )
  }, [])

  const updateSlot = useCallback(
    (dayOfWeek: number, slotIndex: number, field: 'start' | 'end', value: string) => {
      setDays((prev) =>
        prev.map((d) => {
          if (d.dayOfWeek !== dayOfWeek) return d
          const slots = d.slots.map((s, i) =>
            i === slotIndex ? { ...s, [field]: value } : s
          )
          return { ...d, slots }
        })
      )
    },
    []
  )

  const addSlot = useCallback((dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d
        return { ...d, slots: [...d.slots, { ...DEFAULT_SLOT }] }
      })
    )
  }, [])

  const removeSlot = useCallback((dayOfWeek: number, slotIndex: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d
        const slots = d.slots.filter((_, i) => i !== slotIndex)
        return { ...d, slots }
      })
    )
  }, [])

  const saveDay = async (dayOfWeek: number) => {
    if (!proId) return
    const day = days.find((d) => d.dayOfWeek === dayOfWeek)
    if (!day) return

    try {
      setSaving(dayOfWeek)
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/availability/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proId,
          dayOfWeek,
          isEnabled: day.isEnabled,
          slots: day.isEnabled ? day.slots : [],
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      setSuccess(`${DAY_LABELS[dayOfWeek]} enregistré`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('[Availability] save error:', err)
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <AvailabilitySkeleton />
  }

  const enabledCount = days.filter(d => d.isEnabled).length

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Planning
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Disponibilités</h1>
        <p className="text-sm text-[#8a7a92]">
          Définissez vos horaires de travail pour chaque jour de la semaine.
        </p>
      </motion.div>

      {/* Mini week overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="flex items-center gap-2 flex-wrap"
      >
        {DAY_ORDER.map((dayOfWeek) => {
          const day = days.find((d) => d.dayOfWeek === dayOfWeek)
          return (
            <div
              key={dayOfWeek}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                day?.isEnabled
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                  : 'bg-[#F5F0F7] text-[#B5A8BE] border border-[#EDE8F0]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${day?.isEnabled ? 'bg-emerald-400' : 'bg-[#D5CCD9]'}`} />
              {DAY_SHORT[dayOfWeek]}
            </div>
          )
        })}
        <span className="text-xs text-[#8a7a92] ml-1">{enabledCount}/7 jours actifs</span>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-red-50/80 border border-red-200/60 text-red-700 rounded-[16px] text-sm flex items-center gap-3 backdrop-blur-sm"
          >
            <div className="w-8 h-8 rounded-[8px] bg-red-100 flex items-center justify-center shrink-0 text-xs">⚠️</div>
            <p className="text-xs">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-emerald-50/80 border border-emerald-200/60 text-emerald-700 rounded-[16px] text-sm flex items-center gap-3 backdrop-blur-sm"
          >
            <div className="w-8 h-8 rounded-[8px] bg-emerald-100 flex items-center justify-center shrink-0 text-xs">✅</div>
            <p className="text-xs font-medium">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day cards */}
      <div className="space-y-3">
        {DAY_ORDER.map((dayOfWeek, index) => {
          const day = days.find((d) => d.dayOfWeek === dayOfWeek)
          if (!day) return null

          return (
            <motion.div
              key={dayOfWeek}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className={`bg-white rounded-[20px] border transition-all duration-300 ${
                day.isEnabled
                  ? 'border-primary/12 shadow-[0_4px_20px_rgba(20,0,50,0.05)]'
                  : 'border-[#EDE8F0] hover:border-[#D5CCD9]'
              } p-5`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-xs font-bold transition-all ${
                    day.isEnabled
                      ? 'bg-gradient-to-br from-primary/10 to-secondary text-primary'
                      : 'bg-[#F5F0F7] text-[#B5A8BE]'
                  }`}>
                    {DAY_SHORT[dayOfWeek]}
                  </div>
                  <div>
                    <h2 className={`text-sm font-bold ${day.isEnabled ? 'text-[#2A1F2D]' : 'text-[#8a7a92]'}`}>
                      {DAY_LABELS[dayOfWeek]}
                    </h2>
                    <p className="text-[11px] text-[#B5A8BE]">
                      {day.isEnabled ? `${day.slots.length} plage${day.slots.length > 1 ? 's' : ''} horaire${day.slots.length > 1 ? 's' : ''}` : 'Fermé'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => saveDay(dayOfWeek)}
                    disabled={saving === dayOfWeek}
                    className={`text-xs font-semibold px-4 py-2 rounded-full transition-all disabled:opacity-50 ${
                      day.isEnabled
                        ? 'text-primary border border-primary/20 hover:bg-primary/5 hover:border-primary/30'
                        : 'text-[#8a7a92] border border-[#EDE8F0] hover:border-[#D5CCD9]'
                    }`}
                  >
                    {saving === dayOfWeek ? 'Sauvegarde…' : 'Enregistrer'}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleDay(dayOfWeek)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      day.isEnabled ? 'bg-primary' : 'bg-[#EDE8F0]'
                    }`}
                    aria-label={`${day.isEnabled ? 'Désactiver' : 'Activer'} ${DAY_LABELS[dayOfWeek]}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        day.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Time slots */}
              {day.isEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-3 border-t border-[#EDE8F0]/60"
                >
                  <div className="space-y-2.5">
                    {day.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1 bg-[#FDFBFE] rounded-[14px] border border-[#EDE8F0] p-2">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateSlot(dayOfWeek, slotIndex, 'start', e.target.value)}
                            className="flex-1 px-3 py-2 rounded-[10px] border border-[#EDE8F0] bg-white text-sm text-[#2A1F2D] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                          />
                          <div className="flex items-center gap-1.5 px-2">
                            <svg className="w-3.5 h-3.5 text-[#B5A8BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </div>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateSlot(dayOfWeek, slotIndex, 'end', e.target.value)}
                            className="flex-1 px-3 py-2 rounded-[10px] border border-[#EDE8F0] bg-white text-sm text-[#2A1F2D] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                          />
                        </div>
                        {day.slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlot(dayOfWeek, slotIndex)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            aria-label="Supprimer cette plage"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSlot(dayOfWeek)}
                    className="mt-3 text-xs text-primary hover:text-[#9C44AF] font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">+</span>
                    Ajouter une plage horaire
                  </button>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
