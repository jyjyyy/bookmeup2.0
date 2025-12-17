'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { BookingPro, BookingService } from '../types'

interface SummaryProps {
  pro: BookingPro
  services: BookingService[]
  selectedServiceId: string | null
  selectedDate: string | null
  selectedTime: string | null
  onSubmit: () => void
  onFormChange: (data: { firstName: string; phone: string; email: string }) => void
}

export function Summary({
  pro,
  services,
  selectedServiceId,
  selectedDate,
  selectedTime,
  onSubmit,
  onFormChange,
}: SummaryProps) {
  const [firstName, setFirstName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Notifier les changements du formulaire
  useEffect(() => {
    onFormChange({ firstName, phone, email })
  }, [firstName, phone, email, onFormChange])

  const selectedService = services.find((s) => s.id === selectedServiceId)

  // Vérifier si toutes les étapes sont complètes
  const isComplete = selectedService && selectedDate && selectedTime

  // Formater la date en français
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }


  if (!isComplete) {
    return null
  }

  return (
    <Card className="rounded-[32px] p-6">
      <h2 className="text-xl font-bold text-[#2A1F2D] mb-6">
        Tes informations
      </h2>

      {/* Récapitulatif compact */}
      <div className="bg-secondary/30 rounded-[24px] p-4 mb-6 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Service</span>
          <span className="font-semibold text-[#2A1F2D]">{selectedService.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Date & Heure</span>
          <span className="font-semibold text-[#2A1F2D]">
            {formatDate(selectedDate!)} à {selectedTime}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-primary/20">
          <span className="text-slate-500">Total</span>
          <span className="text-xl font-bold text-primary">
            {selectedService.price} €
          </span>
        </div>
      </div>

      {/* Formulaire minimal */}
      <div className="space-y-4">
        <Input
          type="text"
          label="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          placeholder="Marie"
        />

        <Input
          type="tel"
          label="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="06 12 34 56 78"
        />

        <Input
          type="email"
          label="Email (optionnel)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="marie@example.com"
        />
      </div>
    </Card>
  )
}

