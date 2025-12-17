'use client'

import { useState, useEffect } from 'react'
import { BookingHeader } from './components/BookingHeader'
import { ServiceSelector } from './components/ServiceSelector'
import { SelectedServiceCard } from './components/SelectedServiceCard'
import { DatePicker } from './components/DatePicker'
import { TimeSlots } from './components/TimeSlots'
import { Summary } from './components/Summary'
import { ConfirmButton } from './components/ConfirmButton'
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
  const [showServiceSelector, setShowServiceSelector] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Pré-sélectionner le service si initialServiceId est fourni
  useEffect(() => {
    if (initialServiceId && services.some((s) => s.id === initialServiceId)) {
      setSelectedServiceId(initialServiceId)
      setShowServiceSelector(false)
    } else if (services.length > 1) {
      setShowServiceSelector(true)
    }
  }, [initialServiceId, services])

  const selectedService = services.find((s) => s.id === selectedServiceId)

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id)
    setShowServiceSelector(false)
    // Reset date et time quand on change de service
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const handleChangeService = () => {
    setShowServiceSelector(true)
  }

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    // Reset time quand on change de date
    setSelectedTime(null)
  }

  return (
    <div className="space-y-6 pb-32">
      <BookingHeader pro={pro} servicesCount={services.length} />

      {/* Service sélectionné (sticky) ou sélecteur */}
      {showServiceSelector || !selectedServiceId ? (
        <ServiceSelector
          services={services}
          selectedServiceId={selectedServiceId}
          onSelectService={handleSelectService}
        />
      ) : (
        <SelectedServiceCard
          service={selectedService}
          onChange={handleChangeService}
        />
      )}

      {/* Date et heures côte à côte sur desktop */}
      {selectedServiceId && (
        <div className="grid md:grid-cols-2 gap-6">
          <DatePicker
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />

          {selectedDate && (
            <TimeSlots
              proId={pro.id}
              serviceId={selectedServiceId}
              date={selectedDate}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
            />
          )}
        </div>
      )}

      {/* Formulaire client */}
      {selectedServiceId && selectedDate && selectedTime && (
        <Summary
          pro={pro}
          services={services}
          selectedServiceId={selectedServiceId}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSubmit={() => {}}
          onFormChange={(data) => {
            setFirstName(data.firstName)
            setPhone(data.phone)
            setEmail(data.email)
          }}
        />
      )}

      {/* Bouton de confirmation sticky */}
      {selectedServiceId && selectedDate && selectedTime && (
        <ConfirmButton
          pro={pro}
          selectedService={selectedService}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          firstName={firstName}
          phone={phone}
          email={email}
        />
      )}
    </div>
  )
}
