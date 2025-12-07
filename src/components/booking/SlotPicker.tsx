'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader } from '@/components/ui/loader'

interface SlotPickerProps {
  proId: string
  serviceId: string
  date: string
  duration: number
  onSelect: (time: string) => void
}

interface TimeSlot {
  time: string
  available: boolean
}

export function SlotPicker({
  proId,
  serviceId,
  date,
  duration,
  onSelect,
}: SlotPickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/availability?pro_id=${proId}&service_id=${serviceId}&date=${date}`
        )

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des créneaux')
        }

        const data = await response.json()
        setSlots(data.slots || [])
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des créneaux')
      } finally {
        setLoading(false)
      }
    }

    if (proId && serviceId && date) {
      fetchSlots()
    }
  }, [proId, serviceId, date])

  const handleTimeClick = (time: string, available: boolean) => {
    if (!available) return
    setSelectedTime(time)
    onSelect(time)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[32px] text-sm">
        {error}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        Aucun créneau disponible pour cette date.
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {slots.map((slot, index) => (
          <motion.button
            key={slot.time}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => handleTimeClick(slot.time, slot.available)}
            disabled={!slot.available}
            className={`
              px-4 py-3 rounded-[32px] font-medium transition-all
              ${
                !slot.available
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : selectedTime === slot.time
                  ? 'bg-primary text-white scale-105'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary hover:bg-pink-50'
              }
            `}
          >
            {slot.time}
          </motion.button>
        ))}
      </div>
      {selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-sm text-gray-600"
        >
          Créneau sélectionné : <span className="font-semibold text-primary">{selectedTime}</span>
        </motion.div>
      )}
    </div>
  )
}
