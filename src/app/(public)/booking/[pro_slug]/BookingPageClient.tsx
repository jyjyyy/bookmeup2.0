'use client'

import { useState, useEffect } from 'react'
import { BookingHeader } from './components/BookingHeader'
import { ServiceSelector } from './components/ServiceSelector'
import { DatePicker } from './components/DatePicker'
import { TimeSlots } from './components/TimeSlots'
import { Summary } from './components/Summary'
import type { BookingPro, BookingService } from './types'

interface BookingPageClientProps {
  pro: BookingPro
  services: BookingService[]
  initialServiceId?: string | null
}

export function BookingPageClient({
  pro,
  services,
  initialServiceId,
}: BookingPageClientProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    initialServiceId ?? null
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Pré-sélectionner le service si initialServiceId est fourni
  useEffect(() => {
    if (initialServiceId && services.some((s) => s.id === initialServiceId)) {
      setSelectedServiceId(initialServiceId)
    }
  }, [initialServiceId, services])

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id)
    // Reset date et time quand on change de service
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    // Reset time quand on change de date
    setSelectedTime(null)
  }

  return (
    <div className="space-y-8">
      <BookingHeader pro={pro} servicesCount={services.length} />

      <ServiceSelector
        services={services}
        selectedServiceId={selectedServiceId}
        onSelectService={handleSelectService}
      />

      {selectedServiceId && (
        <DatePicker
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      )}

      {selectedServiceId && selectedDate && (
        <TimeSlots
          proId={pro.id}
          serviceId={selectedServiceId}
          date={selectedDate}
          selectedTime={selectedTime}
          onSelectTime={setSelectedTime}
        />
      )}

      <Summary
        pro={pro}
        services={services}
        selectedServiceId={selectedServiceId}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
      />
    </div>
  )
}
