'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ConfirmCardProps {
  booking: {
    id: string
    client_name: string
    date: string
    start_time: string
    end_time: string
  }
  service: {
    name: string
    duration: number
    price: number
  }
  pro: {
    name: string
    city?: string
  }
}

export function ConfirmCard({ booking, service, pro }: ConfirmCardProps) {
  // Parse date string (YYYY-MM-DD) correctly
  const dateParts = booking.date.split('-')
  const date = new Date(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2])
  )
  
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Merci, votre réservation est confirmée !
          </h1>
          <p className="text-gray-600">
            Un email de confirmation a été envoyé à votre adresse.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-gray-50 rounded-[32px] p-6">
            <h2 className="text-xl font-bold text-primary mb-4">
              Détails de la réservation
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Service</span>
                <span className="font-semibold">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-semibold">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Heure</span>
                <span className="font-semibold">
                  {booking.start_time} - {booking.end_time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Durée</span>
                <span className="font-semibold">{service.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Professionnel</span>
                <span className="font-semibold">{pro.name}</span>
              </div>
              {pro.city && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ville</span>
                  <span className="font-semibold">{pro.city}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-gray-600">Prix</span>
                <span className="font-bold text-primary text-lg">
                  {service.price} €
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/search" className="flex-1">
              <Button variant="outline" className="w-full">
                Retour à la recherche
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </motion.div>
      </Card>
    </motion.div>
  )
}

