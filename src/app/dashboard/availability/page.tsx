'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { checkSubscriptionStatus } from '@/lib/subscription'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Loader } from '@/components/ui/loader'

interface TimeSlot {
  start: string
  end: string
}

interface DayAvailability {
  isEnabled: boolean
  mode: 'full' | 'pause' | 'custom'
  step: number
  slots: TimeSlot[]
}

interface Exception {
  id: string
  date: string
  reason: string | null
  fullDay: boolean
}

const DAYS = [
  { key: 1, label: 'Lundi' },
  { key: 2, label: 'Mardi' },
  { key: 3, label: 'Mercredi' },
  { key: 4, label: 'Jeudi' },
  { key: 5, label: 'Vendredi' },
  { key: 6, label: 'Samedi' },
  { key: 0, label: 'Dimanche' },
]

export default function AvailabilityPage() {
  const router = useRouter()
  const [proId, setProId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState<
    Record<string, DayAvailability>
  >({})
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Exception form
  const [exceptionDate, setExceptionDate] = useState('')
  const [exceptionReason, setExceptionReason] = useState('')
  const [addingException, setAddingException] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser()

        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }

        if (currentUser.profile.role !== 'pro') {
          router.push('/')
          return
        }

        // Check subscription status
        const subscriptionStatus = await checkSubscriptionStatus(currentUser.user.uid)
        
        if (!subscriptionStatus.hasActiveSubscription) {
          router.push('/dashboard/settings/subscription')
          return
        }

        const uid = currentUser.user.uid
        setProId(uid)

        // Load availability
        const availabilityRes = await fetch(
          `/api/availability/get?proId=${uid}`
        )
        if (availabilityRes.ok) {
          const availabilityData = await availabilityRes.json()
          // Convert days array to record by dayOfWeek
          const availabilityRecord: Record<string, DayAvailability> = {}
          if (availabilityData.days) {
            availabilityData.days.forEach((day: any) => {
              availabilityRecord[day.dayOfWeek.toString()] = {
                isEnabled: day.isEnabled,
                mode: day.mode || 'custom',
                step: day.step || 30,
                slots: day.slots || [],
              }
            })
          }
          setAvailability(availabilityRecord)
        }

        // Load exceptions
        const exceptionsRes = await fetch(
          `/api/availability/exceptions/list?proId=${uid}`
        )
        if (exceptionsRes.ok) {
          const exceptionsData = await exceptionsRes.json()
          setExceptions(exceptionsData.exceptions || [])
        }
      } catch (error) {
        console.error('Error loading availability:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleModeChange = (dayOfWeek: number, mode: 'full' | 'pause' | 'custom') => {
    const dayKey = dayOfWeek.toString()
    
    let newSlots: TimeSlot[] = []
    
    if (mode === 'full') {
      newSlots = [{ start: '09:00', end: '18:00' }]
    } else if (mode === 'pause') {
      newSlots = [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '18:00' },
      ]
    }
    // custom: keep existing slots or empty array
    
    setAvailability((prev) => ({
      ...prev,
      [dayKey]: {
        isEnabled: true,
        mode,
        step: prev[dayKey]?.step || 30,
        slots: mode === 'custom' ? (prev[dayKey]?.slots || []) : newSlots,
      },
    }))
    
    // Clear error when changing mode
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[dayKey]
      return newErrors
    })
  }

  const handleDayToggle = (dayOfWeek: number, enabled: boolean) => {
    const dayKey = dayOfWeek.toString()
    const currentData = availability[dayKey]
    
    if (enabled && !currentData) {
      // First time enabling: default to full mode
      setAvailability((prev) => ({
        ...prev,
        [dayKey]: {
          isEnabled: true,
          mode: 'full',
          step: 30,
          slots: [{ start: '09:00', end: '18:00' }],
        },
      }))
    } else {
      setAvailability((prev) => ({
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          isEnabled: enabled,
          slots: enabled ? prev[dayKey]?.slots || [] : [],
        },
      }))
    }
    
    // Clear error when toggling
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[dayKey]
      return newErrors
    })
  }

  const handleAddSlot = (dayOfWeek: number) => {
    const dayKey = dayOfWeek.toString()
    const dayData = availability[dayKey] || { isEnabled: true, mode: 'custom', step: 30, slots: [] }
    
    // Calculate default slot: start from last slot's end, or default to 14:00-18:00
    let defaultStart = '14:00'
    let defaultEnd = '18:00'
    
    if (dayData.slots.length > 0) {
      const lastSlot = dayData.slots[dayData.slots.length - 1]
      const [lastEndHour, lastEndMin] = lastSlot.end.split(':').map(Number)
      const lastEndMinutes = lastEndHour * 60 + lastEndMin
      
      // Start new slot 1 hour after last slot ends, or default
      if (lastEndMinutes < 17 * 60) {
        const newStartMinutes = lastEndMinutes + 60
        defaultStart = `${Math.floor(newStartMinutes / 60).toString().padStart(2, '0')}:${(newStartMinutes % 60).toString().padStart(2, '0')}`
        defaultEnd = '18:00'
      }
    }

    setAvailability((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isEnabled: true,
        mode: 'custom',
        step: prev[dayKey]?.step || 30,
        slots: [...(prev[dayKey]?.slots || []), { start: defaultStart, end: defaultEnd }],
      },
    }))
  }

  const handleRemoveSlot = (dayOfWeek: number, slotIndex: number) => {
    const dayKey = dayOfWeek.toString()
    setAvailability((prev) => {
      const dayData = prev[dayKey] || { isEnabled: true, mode: 'custom', step: 30, slots: [] }
      const newSlots = dayData.slots.filter((_, index) => index !== slotIndex)
      return {
        ...prev,
        [dayKey]: {
          ...dayData,
          mode: 'custom', // Switch to custom when removing slots
          slots: newSlots,
        },
      }
    })
  }

  const handleSlotChange = (
    dayOfWeek: number,
    slotIndex: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const dayKey = dayOfWeek.toString()
    setAvailability((prev) => {
      const dayData = prev[dayKey] || { isEnabled: true, mode: 'custom', step: 30, slots: [] }
      const newSlots = [...dayData.slots]
      newSlots[slotIndex] = {
        ...newSlots[slotIndex],
        [field]: value,
      }
      
      // If modifying a full or pause mode, switch to custom
      let newMode = dayData.mode
      if (dayData.mode === 'full' || dayData.mode === 'pause') {
        newMode = 'custom'
      }
      
      return {
        ...prev,
        [dayKey]: {
          ...dayData,
          mode: newMode,
          slots: newSlots,
        },
      }
    })
    // Clear error when editing
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[dayKey]
      return newErrors
    })
  }

  const handleSaveDay = async (dayOfWeek: number) => {
    if (!proId) return

    const dayKey = dayOfWeek.toString()
    const dayData = availability[dayKey]

    if (!dayData) return

    setSaving((prev) => ({ ...prev, [dayKey]: true }))
    setSaved((prev) => ({ ...prev, [dayKey]: false }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[dayKey]
      return newErrors
    })

    try {
      const response = await fetch('/api/availability/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proId,
          dayOfWeek,
          isEnabled: dayData.isEnabled,
          mode: dayData.mode,
          step: dayData.step || 30,
          slots: dayData.isEnabled ? dayData.slots : [],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }

      setSaved((prev) => ({ ...prev, [dayKey]: true }))
      setTimeout(() => {
        setSaved((prev) => ({ ...prev, [dayKey]: false }))
      }, 2000)
    } catch (error: any) {
      console.error('Error saving day:', error)
      setErrors((prev) => ({
        ...prev,
        [dayKey]: error.message || 'Erreur lors de l\'enregistrement',
      }))
    } finally {
      setSaving((prev) => ({ ...prev, [dayKey]: false }))
    }
  }

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proId || !exceptionDate) return

    setAddingException(true)

    try {
      const response = await fetch('/api/availability/exceptions/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proId,
          date: exceptionDate,
          reason: exceptionReason || null,
        }),
      })

      if (response.ok) {
        setExceptionDate('')
        setExceptionReason('')
        // Reload exceptions
        const exceptionsRes = await fetch(
          `/api/availability/exceptions/list?proId=${proId}`
        )
        if (exceptionsRes.ok) {
          const exceptionsData = await exceptionsRes.json()
          setExceptions(exceptionsData.exceptions || [])
        }
      }
    } catch (error) {
      console.error('Error adding exception:', error)
    } finally {
      setAddingException(false)
    }
  }

  const handleDeleteException = async (exceptionId: string) => {
    if (!proId) return

    try {
      const response = await fetch('/api/availability/exceptions/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proId,
          exceptionId,
        }),
      })

      if (response.ok) {
        // Reload exceptions
        const exceptionsRes = await fetch(
          `/api/availability/exceptions/list?proId=${proId}`
        )
        if (exceptionsRes.ok) {
          const exceptionsData = await exceptionsRes.json()
          setExceptions(exceptionsData.exceptions || [])
        }
      }
    } catch (error) {
      console.error('Error deleting exception:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">
          Mes disponibilités
        </h1>
        <p className="text-gray-600">
          Gérez vos horaires de travail et vos jours de fermeture.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Availability Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="rounded-[32px] bg-white shadow-[0_15px_50px_rgba(20,0,50,0.06)] p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Horaires hebdomadaires
            </h2>

            <div className="space-y-4">
              {DAYS.map((day, index) => {
                const dayKey = day.key.toString()
                const dayData = availability[dayKey] || {
                  isEnabled: false,
                  mode: 'custom',
                  step: 30,
                  slots: [],
                }

                return (
                  <motion.div
                    key={day.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-200 rounded-[32px] p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">
                          {day.label}
                        </span>
                        <Switch
                          checked={dayData.isEnabled}
                          onChange={(e) =>
                            handleDayToggle(day.key, e.target.checked)
                          }
                        />
                      </div>
                      {saved[dayKey] && (
                        <span className="text-sm text-green-600">
                          Enregistré ✓
                        </span>
                      )}
                    </div>

                    {errors[dayKey] && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-[32px] text-xs">
                        {errors[dayKey]}
                      </div>
                    )}

                    {dayData.isEnabled && (
                      <div className="space-y-4 mt-3">
                        {/* Mode Selector */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleModeChange(day.key, 'full')}
                            variant={dayData.mode === 'full' ? 'primary' : 'outline'}
                            size="sm"
                            className={`rounded-[32px] text-xs flex-1 ${
                              dayData.mode === 'full'
                                ? 'bg-primary text-white'
                                : 'bg-white text-gray-700 hover:bg-primary/5'
                            }`}
                          >
                            Journée complète
                          </Button>
                          <Button
                            onClick={() => handleModeChange(day.key, 'pause')}
                            variant={dayData.mode === 'pause' ? 'primary' : 'outline'}
                            size="sm"
                            className={`rounded-[32px] text-xs flex-1 ${
                              dayData.mode === 'pause'
                                ? 'bg-primary text-white'
                                : 'bg-white text-gray-700 hover:bg-primary/5'
                            }`}
                          >
                            Avec pause
                          </Button>
                          <Button
                            onClick={() => handleModeChange(day.key, 'custom')}
                            variant={dayData.mode === 'custom' ? 'primary' : 'outline'}
                            size="sm"
                            className={`rounded-[32px] text-xs flex-1 ${
                              dayData.mode === 'custom'
                                ? 'bg-primary text-white'
                                : 'bg-white text-gray-700 hover:bg-primary/5'
                            }`}
                          >
                            Personnalisé
                          </Button>
                        </div>

                        {/* Mode: Full */}
                        {dayData.mode === 'full' && dayData.slots.length === 1 && (
                          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-[32px]">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Début
                              </label>
                              <input
                                type="time"
                                value={dayData.slots[0].start}
                                onChange={(e) =>
                                  handleSlotChange(day.key, 0, 'start', e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Fin
                              </label>
                              <input
                                type="time"
                                value={dayData.slots[0].end}
                                onChange={(e) =>
                                  handleSlotChange(day.key, 0, 'end', e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {/* Mode: Pause */}
                        {dayData.mode === 'pause' && dayData.slots.length === 2 && (
                          <div className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-[32px]">
                              <label className="block text-xs font-semibold text-gray-700 mb-2">
                                Matin
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Début
                                  </label>
                                  <input
                                    type="time"
                                    value={dayData.slots[0].start}
                                    onChange={(e) =>
                                      handleSlotChange(day.key, 0, 'start', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Fin
                                  </label>
                                  <input
                                    type="time"
                                    value={dayData.slots[0].end}
                                    onChange={(e) =>
                                      handleSlotChange(day.key, 0, 'end', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-[32px]">
                              <label className="block text-xs font-semibold text-gray-700 mb-2">
                                Après-midi
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Début
                                  </label>
                                  <input
                                    type="time"
                                    value={dayData.slots[1].start}
                                    onChange={(e) =>
                                      handleSlotChange(day.key, 1, 'start', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Fin
                                  </label>
                                  <input
                                    type="time"
                                    value={dayData.slots[1].end}
                                    onChange={(e) =>
                                      handleSlotChange(day.key, 1, 'end', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Mode: Custom */}
                        {dayData.mode === 'custom' && (
                          <div className="space-y-3">
                            {dayData.slots.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-2">
                                Aucune plage horaire définie. Ajoutez-en une pour
                                activer ce jour.
                              </p>
                            ) : (
                              <AnimatePresence>
                                {dayData.slots.map((slot, slotIndex) => (
                                  <motion.div
                                    key={slotIndex}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-[32px]"
                                  >
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">
                                          Début
                                        </label>
                                        <input
                                          type="time"
                                          value={slot.start}
                                          onChange={(e) =>
                                            handleSlotChange(
                                              day.key,
                                              slotIndex,
                                              'start',
                                              e.target.value
                                            )
                                          }
                                          className="w-full px-3 py-2 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">
                                          Fin
                                        </label>
                                        <input
                                          type="time"
                                          value={slot.end}
                                          onChange={(e) =>
                                            handleSlotChange(
                                              day.key,
                                              slotIndex,
                                              'end',
                                              e.target.value
                                            )
                                          }
                                          className="w-full px-3 py-2 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        />
                                      </div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleRemoveSlot(day.key, slotIndex)
                                      }
                                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                                      type="button"
                                    >
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            )}

                            <Button
                              onClick={() => handleAddSlot(day.key)}
                              variant="outline"
                              size="sm"
                              className="w-full rounded-[32px] text-sm"
                            >
                              + Ajouter une plage
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3">
                      <Button
                        onClick={() => handleSaveDay(day.key)}
                        disabled={
                          saving[dayKey] ||
                          (dayData.isEnabled && dayData.slots.length === 0)
                        }
                        size="sm"
                        variant="outline"
                        className="rounded-[32px] text-sm"
                      >
                        {saving[dayKey] ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </motion.div>

        {/* Exceptions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="rounded-[32px] bg-white shadow-[0_15px_50px_rgba(20,0,50,0.06)] p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Fermetures exceptionnelles
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Jours de fermeture (congés, fériés, etc.)
            </p>

            {/* Add Exception Form */}
            <form onSubmit={handleAddException} className="space-y-3 mb-6">
              <Input
                type="date"
                label="Date"
                value={exceptionDate}
                onChange={(e) => setExceptionDate(e.target.value)}
                required
                disabled={addingException}
              />
              <Input
                type="text"
                label="Raison (optionnel)"
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                disabled={addingException}
                placeholder="Ex: Jour férié, congés..."
              />
              <Button
                type="submit"
                disabled={addingException || !exceptionDate}
                className="w-full rounded-[32px]"
              >
                {addingException ? 'Ajout...' : 'Ajouter une fermeture'}
              </Button>
            </form>

            {/* Exceptions List */}
            <div className="space-y-2">
              {exceptions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune fermeture exceptionnelle enregistrée.
                </p>
              ) : (
                <AnimatePresence>
                  {exceptions.map((exception, index) => (
                    <motion.div
                      key={exception.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-[32px]"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(exception.date)}
                        </p>
                        {exception.reason && (
                          <p className="text-xs text-gray-600 mt-1">
                            {exception.reason}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteException(exception.id)}
                        variant="outline"
                        size="sm"
                        className="rounded-[32px] text-sm text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        Supprimer
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
