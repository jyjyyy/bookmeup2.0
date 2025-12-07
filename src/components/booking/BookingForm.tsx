'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface BookingFormProps {
  proId: string
  serviceId: string
  date: string
  startTime: string
  duration: number
}

export function BookingForm({
  proId,
  serviceId,
  date,
  startTime,
  duration,
}: BookingFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation basique
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
          pro_id: proId,
          service_id: serviceId,
          date,
          start_time: startTime,
          duration,
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
      router.push(`/confirm?bookingId=${data.bookingId}`)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réservation')
      setLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
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

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? 'Réservation en cours...' : 'Confirmer la réservation'}
      </Button>
    </motion.form>
  )
}
