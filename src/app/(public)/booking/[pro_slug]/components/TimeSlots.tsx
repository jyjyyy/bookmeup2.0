'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'

interface TimeSlotsProps {
  proId: string | null
  serviceId: string | null
  date: string | null
  selectedTime: string | null
  onSelectTime: (time: string) => void
}

interface TimeSlot {
  time: string
  available: boolean
}

export function TimeSlots({
  proId,
  serviceId,
  date,
  selectedTime,
  onSelectTime,
}: TimeSlotsProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSlots = async () => {
      // Ne pas appeler l'API si un paramètre manque
      if (!proId || !serviceId || !date) {
        setSlots([])
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Construire l'URL avec URLSearchParams pour éviter les problèmes d'encodage
        const params = new URLSearchParams({
          pro_id: proId,
          service_id: serviceId,
          date,
        })

        const response = await fetch(`/api/availability?${params.toString()}`)

        if (!response.ok) {
          let errorMessage = 'Erreur lors du chargement des créneaux'
          try {
            const errorData = await response.json()
            if (errorData?.error) errorMessage = errorData.error
            console.error('[TimeSlots] API error:', errorData)
          } catch (e) {
            console.error('[TimeSlots] Error parsing error response', e)
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        setSlots(data.slots || [])
      } catch (err: any) {
        console.error('[TimeSlots] Fetch error:', err)
        setError(err.message || 'Erreur lors du chargement des créneaux')
        setSlots([])
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [proId, serviceId, date])

  // Grouper les créneaux par moment de la journée
  const groupSlotsByTime = (slots: TimeSlot[]) => {
    const groups: {
      label: string
      slots: TimeSlot[]
    }[] = [
      { label: 'Matin', slots: [] },
      { label: 'Après-midi', slots: [] },
      { label: 'Soir', slots: [] },
    ]

    slots.forEach((slot) => {
      const [hour] = slot.time.split(':').map(Number)
      if (hour >= 6 && hour < 12) {
        groups[0].slots.push(slot)
      } else if (hour >= 12 && hour < 18) {
        groups[1].slots.push(slot)
      } else if (hour >= 18 && hour <= 23) {
        groups[2].slots.push(slot)
      }
    })

    return groups.filter((group) => group.slots.length > 0)
  }

  if (!proId || !serviceId || !date) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[24px] p-6 border border-[#EDE8F0] shadow-bookmeup-sm">
        <div className="flex items-center gap-3 py-8 justify-center text-[#7A6B80]">
          <Loader />
          <span className="text-sm">Chargement des créneaux…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-[24px] p-6 border border-[#EDE8F0] shadow-bookmeup-sm">
        <div className="rounded-[16px] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-[24px] p-6 border border-[#EDE8F0] shadow-bookmeup-sm">
        <div className="text-center py-8 text-[#7A6B80] text-sm">
          Aucun créneau disponible pour cette date.
        </div>
      </div>
    )
  }

  const groupedSlots = groupSlotsByTime(slots)

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#EDE8F0] shadow-bookmeup-sm">
      <h2 className="text-base font-bold text-[#2A1F2D] mb-5">
        Choisissez un créneau
      </h2>

      <div className="space-y-5">
        {groupedSlots.map((group) => (
          <div key={group.label}>
            <h3 className="text-xs font-bold text-[#7A6B80] mb-3 uppercase tracking-wider">
              {group.label}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {group.slots.map((slot) => {
                const isSelected = selectedTime === slot.time
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => slot.available && onSelectTime(slot.time)}
                    disabled={!slot.available}
                    className={`
                      flex items-center justify-center text-center
                      rounded-[12px] px-3 py-3 text-sm font-bold transition-all
                      ${
                        !slot.available
                          ? 'bg-background text-[#EDE8F0] cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-primary text-white shadow-bookmeup-sm'
                          : 'bg-secondary text-[#2A1F2D] hover:bg-primary hover:text-white hover:shadow-bookmeup-sm'
                      }
                    `}
                  >
                    {slot.time}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

