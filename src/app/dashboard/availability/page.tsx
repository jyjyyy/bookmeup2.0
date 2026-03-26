'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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

// Ordre d'affichage : Lundi → Dimanche (convention française)
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

      setSuccess(`${DAY_LABELS[dayOfWeek]} enregistré ✓`)
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

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Disponibilités</h1>
        <p className="text-sm text-[#7A6B80]">
          Définissez vos horaires de travail pour chaque jour de la semaine.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[16px] text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-[16px] text-sm">
          {success}
        </div>
      )}

      <div className="space-y-3">
        {DAY_ORDER.map((dayOfWeek) => {
          const day = days.find((d) => d.dayOfWeek === dayOfWeek)
          if (!day) return null

          return (
            <div key={dayOfWeek} className="bg-white rounded-[20px] border border-[#EDE8F0] shadow-bookmeup-sm p-5">
              {/* En-tête du jour */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDay(dayOfWeek)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      day.isEnabled ? 'bg-primary' : 'bg-[#EDE8F0]'
                    }`}
                    aria-label={`${day.isEnabled ? 'Désactiver' : 'Activer'} ${DAY_LABELS[dayOfWeek]}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        day.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <h2 className={`text-sm font-bold ${day.isEnabled ? 'text-[#2A1F2D]' : 'text-[#7A6B80]'}`}>
                    {DAY_LABELS[dayOfWeek]}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => saveDay(dayOfWeek)}
                  disabled={saving === dayOfWeek}
                  className="text-xs font-semibold text-primary hover:text-primaryDark border border-primary/30 hover:border-primary rounded-[10px] px-3 py-1.5 transition-all disabled:opacity-50"
                >
                  {saving === dayOfWeek ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>

              {/* Plages horaires */}
              {day.isEnabled ? (
                <div className="space-y-2">
                  {day.slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateSlot(dayOfWeek, slotIndex, 'start', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-[12px] border border-[#EDE8F0] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <span className="text-[#C9BBD0] text-sm">→</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateSlot(dayOfWeek, slotIndex, 'end', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-[12px] border border-[#EDE8F0] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                      {day.slots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlot(dayOfWeek, slotIndex)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50"
                          aria-label="Supprimer cette plage"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addSlot(dayOfWeek)}
                    className="text-xs text-primary hover:underline mt-1 font-semibold"
                  >
                    + Ajouter une plage
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#C9BBD0]">Fermé ce jour-là</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
