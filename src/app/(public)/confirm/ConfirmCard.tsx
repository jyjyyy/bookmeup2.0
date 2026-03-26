'use client'

import { motion } from 'framer-motion'
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
          suppressHydrationWarning
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-bookmeup border border-[#EDE8F0]">
            {/* Header avec icône de succès */}
            <motion.div
              suppressHydrationWarning
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-center mb-8"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-[#9C44AF] rounded-full flex items-center justify-center mx-auto mb-5 shadow-bookmeup">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <motion.h1
                suppressHydrationWarning
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-extrabold text-[#2A1F2D] mb-2"
              >
                Réservation confirmée !
              </motion.h1>

              <motion.p
                suppressHydrationWarning
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[#7A6B80] text-base"
              >
                Un email de confirmation a été envoyé à votre adresse.
              </motion.p>
            </motion.div>

            {/* Récapitulatif */}
            <motion.div
              suppressHydrationWarning
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-5"
            >
              {/* Bloc principal */}
              <div className="bg-secondary rounded-[24px] p-6 border border-primary/10">
                <h2 className="text-base font-bold text-[#2A1F2D] mb-4 uppercase tracking-wide text-xs text-[#7A6B80]">
                  Détails de votre réservation
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-[#EDE8F0]">
                    <span className="text-[#7A6B80]">Service</span>
                    <span className="font-bold text-[#2A1F2D]">{serviceName}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#EDE8F0]">
                    <span className="text-[#7A6B80]">Professionnel</span>
                    <div className="text-right">
                      <span className="font-bold text-[#2A1F2D] block">{proName}</span>
                      {city && (
                        <span className="text-xs text-[#7A6B80] flex items-center justify-end gap-1 mt-0.5">
                          <span>📍</span><span>{city}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#EDE8F0]">
                    <span className="text-[#7A6B80]">Date</span>
                    <span className="font-bold text-[#2A1F2D]">{formattedDate}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#EDE8F0]">
                    <span className="text-[#7A6B80]">Heure</span>
                    <span className="font-bold text-[#2A1F2D]">{time}</span>
                  </div>

                  {duration && (
                    <div className="flex items-center justify-between py-2 border-b border-[#EDE8F0]">
                      <span className="text-[#7A6B80]">Durée</span>
                      <span className="font-bold text-[#2A1F2D]">{duration} min</span>
                    </div>
                  )}

                  {price && (
                    <div className="flex items-center justify-between pt-3 border-t-2 border-primary/20">
                      <span className="text-[#7A6B80] font-semibold">Total</span>
                      <span className="text-2xl font-extrabold text-primary">{price} €</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 bg-[#F0FDF4] rounded-[16px] p-4 border border-[#BBF7D0]">
                <span className="text-lg mt-0.5">✓</span>
                <div>
                  <p className="text-sm font-semibold text-[#166534] mb-0.5">Prochaines étapes</p>
                  <p className="text-sm text-[#166534]/80 leading-relaxed">
                    Vous recevrez un email avec tous les détails. N'hésitez pas à contacter le professionnel si vous avez des questions.
                  </p>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/search" className="flex-1">
                  <button className="w-full py-3 rounded-[16px] border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all">
                    Nouvelle réservation
                  </button>
                </Link>
                <Link href="/" className="flex-1">
                  <button className="w-full py-3 rounded-[16px] btn-gradient text-white font-bold text-sm">
                    Retour à l&apos;accueil
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
