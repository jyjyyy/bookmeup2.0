'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { BookingPro, BookingService } from '../types'

interface SummaryProps {
  pro: BookingPro
  services: BookingService[]
  selectedServiceId: string | null
  selectedDate: string | null
  selectedTime: string | null
}

export function Summary({
  pro,
  services,
  selectedServiceId,
  selectedDate,
  selectedTime,
}: SummaryProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isComplete) {
      setError('Veuillez compléter toutes les étapes ci-dessus')
      return
    }

    // Validation
    if (!name.trim()) {
      setError('Le nom est requis')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Un email valide est requis')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pro_id: pro.id,
          service_id: selectedService.id,
          date: selectedDate,
          start_time: selectedTime,
          duration: selectedService.duration,
          client_name: name.trim(),
          client_email: email.trim(),
          client_phone: phone.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la réservation')
      }

      const data = await response.json()
      
      // Construire les paramètres de requête pour la page de confirmation
      const params = new URLSearchParams({
        serviceName: selectedService.name,
        proName: pro.name,
        date: selectedDate!,
        time: selectedTime!,
      })

      router.push(`/confirm?${params.toString()}`)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réservation')
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-[32px] p-6">
      <h2 className="text-xl font-bold text-[#2A1F2D] mb-6">
        Récapitulatif
      </h2>

      {!isComplete ? (
        <div className="bg-secondary/30 border border-primary/20 rounded-[32px] p-6 text-center">
          <p className="text-slate-600">
            Complète d'abord les étapes ci-dessus pour réserver.
          </p>
        </div>
      ) : (
        <>
          {/* Récapitulatif */}
          <div className="bg-secondary/30 rounded-[32px] p-6 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Service</span>
              <span className="font-semibold text-[#2A1F2D]">{selectedService.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Date</span>
              <span className="font-semibold text-[#2A1F2D]">
                {formatDate(selectedDate!)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Heure</span>
              <span className="font-semibold text-[#2A1F2D]">{selectedTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Durée</span>
              <span className="font-semibold text-[#2A1F2D]">
                {selectedService.duration} min
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-primary/20">
              <span className="text-sm text-slate-500">Prix</span>
              <span className="text-2xl font-bold text-primary">
                {selectedService.price} €
              </span>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[32px] text-sm">
                {error}
              </div>
            )}

            <Input
              type="text"
              label="Nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Jean Dupont"
            />

            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="jean.dupont@example.com"
            />

            <Input
              type="tel"
              label="Téléphone (optionnel)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              placeholder="06 12 34 56 78"
            />

            <Button
              type="submit"
              disabled={loading || !isComplete}
              className="w-full"
              size="lg"
            >
              {loading ? 'Réservation en cours...' : 'Confirmer la réservation'}
            </Button>
          </form>
        </>
      )}
    </Card>
  )
}

