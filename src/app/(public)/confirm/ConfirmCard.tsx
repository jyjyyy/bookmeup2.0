'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ConfirmCardProps {
  serviceName: string
  proName: string
  date: string
  time: string
  city?: string
  duration?: number
  price?: number
}

export function ConfirmCard({
  serviceName,
  proName,
  date,
  time,
  city,
  duration,
  price,
}: ConfirmCardProps) {
  // Formater la date en français
  const formatDate = (dateString: string) => {
    try {
      const dateParts = dateString.split('-')
      if (dateParts.length !== 3) {
        return dateString // Retourner tel quel si format invalide
      }
      
      const date = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2])
      )

      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  const formattedDate = formatDate(date)

  return (
    <div className="min-h-screen bg-background py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="rounded-[32px] p-8 md:p-12">
            {/* Header avec icône de succès */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-center mb-8"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-[#9C44AF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-bookmeup-lg">
                <motion.svg
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold text-[#2A1F2D] mb-3"
              >
                Réservation confirmée !
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-600 text-lg"
              >
                Un email de confirmation a été envoyé à votre adresse.
              </motion.p>
            </motion.div>

            {/* Récapitulatif */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              {/* Bloc principal */}
              <div className="bg-secondary/30 rounded-[32px] p-6 md:p-8 border border-primary/10">
                <h2 className="text-xl md:text-2xl font-bold text-[#2A1F2D] mb-6">
                  Détails de votre réservation
                </h2>

                <div className="space-y-4">
                  {/* Service */}
                  <div className="flex items-center justify-between py-3 border-b border-primary/10">
                    <span className="text-slate-600 font-medium">Service</span>
                    <span className="font-bold text-[#2A1F2D] text-lg">
                      {serviceName}
                    </span>
                  </div>

                  {/* Professionnel */}
                  <div className="flex items-center justify-between py-3 border-b border-primary/10">
                    <span className="text-slate-600 font-medium">Professionnel</span>
                    <div className="text-right">
                      <span className="font-bold text-[#2A1F2D] text-lg block">
                        {proName}
                      </span>
                      {city && (
                        <span className="text-sm text-slate-500 flex items-center justify-end gap-1 mt-1">
                          <span>📍</span>
                          <span>{city}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center justify-between py-3 border-b border-primary/10">
                    <span className="text-slate-600 font-medium">Date</span>
                    <span className="font-bold text-[#2A1F2D] text-lg">
                      {formattedDate}
                    </span>
                  </div>

                  {/* Heure */}
                  <div className="flex items-center justify-between py-3 border-b border-primary/10">
                    <span className="text-slate-600 font-medium">Heure</span>
                    <span className="font-bold text-[#2A1F2D] text-lg">
                      {time}
                    </span>
                  </div>

                  {/* Durée (si fournie) */}
                  {duration && (
                    <div className="flex items-center justify-between py-3 border-b border-primary/10">
                      <span className="text-slate-600 font-medium">Durée</span>
                      <span className="font-bold text-[#2A1F2D]">
                        {duration} minutes
                      </span>
                    </div>
                  )}

                  {/* Prix (si fourni) */}
                  {price && (
                    <div className="flex items-center justify-between pt-4 border-t-2 border-primary/20">
                      <span className="text-slate-600 font-semibold text-lg">Prix</span>
                      <span className="text-3xl font-bold text-primary">
                        {price} €
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="bg-secondary/20 rounded-[32px] p-6 border border-primary/5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-lg">ℹ️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2A1F2D] mb-1">
                      Prochaines étapes
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Vous recevrez un email de confirmation avec tous les détails de votre réservation. 
                      N'hésitez pas à contacter le professionnel si vous avez des questions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/search" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full rounded-[32px] border-2 border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    Nouvelle réservation
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button className="w-full rounded-[32px]">
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
