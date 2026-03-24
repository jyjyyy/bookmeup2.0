'use client'

import { useId, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'

type FaqItem = {
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Comment réserver un rendez-vous ?',
    answer:
      'Choisis un professionnel, sélectionne un service, puis choisis ton créneau. La réservation se fait en quelques secondes.',
  },
  {
    question: 'Dois-je créer un compte pour réserver ?',
    answer:
      'Oui, un compte est nécessaire pour confirmer la réservation et retrouver tes rendez-vous.',
  },
  {
    question: 'Puis-je modifier ou annuler un rendez-vous ?',
    answer:
      'Oui. Selon les règles du professionnel, la modification/annulation peut être limitée à plus de 24h avant le rendez-vous.',
  },
  {
    question: 'Comment les professionnels ajoutent leurs services ?',
    answer:
      'Chaque professionnel configure ses services, prix et durées depuis son tableau de bord.',
  },
  {
    question: 'Le paiement se fait-il en ligne ?',
    answer: 'Non, le paiement se fait généralement sur place (sauf évolution future).',
  },
]

export function FaqSection() {
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-20 bg-white/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Questions fréquentes</h2>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            const buttonId = `${baseId}-faq-button-${index}`
            const panelId = `${baseId}-faq-panel-${index}`

            return (
              <Card key={item.question} className="p-0">
                <button
                  type="button"
                  className="w-full text-left px-8 py-6 flex items-center justify-between gap-6"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  id={buttonId}
                  onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
                >
                  <span className="text-lg font-bold text-slate-900">{item.question}</span>
                  <span
                    className="shrink-0 text-slate-600"
                    aria-hidden="true"
                    title={isOpen ? 'Réduire' : 'Développer'}
                  >
                    {isOpen ? '–' : '+'}
                  </span>
                </button>

                {isOpen ? (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-8 pb-7 -mt-2 text-slate-600 leading-relaxed"
                  >
                    {item.answer}
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

