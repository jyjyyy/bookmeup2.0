'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SettingsCard {
  title: string
  description: string
  href: string
  icon: string
  cta: string
}

const settingsCards: SettingsCard[] = [
  {
    title: 'Compte',
    description: 'Informations personnelles et profil professionnel.',
    href: '/dashboard/settings/account',
    icon: '👤',
    cta: 'Gérer mon compte',
  },
  {
    title: 'Abonnement',
    description: 'Voir et gérer votre plan BookMeUp.',
    href: '/dashboard/settings/subscription',
    icon: '💳',
    cta: 'Voir les abonnements',
  },
  {
    title: 'Sécurité',
    description: 'Mot de passe, sécurité et accès.',
    href: '/dashboard/settings/security',
    icon: '🔒',
    cta: 'Configurer la sécurité',
  },
  {
    title: 'Préférences',
    description: 'Langue, notifications et expérience.',
    href: '/dashboard/settings/preferences',
    icon: '🎨',
    cta: 'Ajuster mes préférences',
  },
  {
    title: 'Communication',
    description: 'Messages clients, SMS, e-mails.',
    href: '/dashboard/settings/communication',
    icon: '💬',
    cta: 'Configurer la communication',
  },
  {
    title: 'Intégrations',
    description: 'Connecter Google Calendar et autres outils.',
    href: '/dashboard/integrations/google-calendar',
    icon: '📅',
    cta: 'Gérer les intégrations',
  },
]

export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Paramètres du compte
        </h2>
        <p className="text-gray-600 mb-6">
          Gérez votre compte, votre abonnement et vos préférences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {settingsCards.map((card, index) => (
          <motion.div
            key={card.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link href={card.href}>
              <Card
                hover
                className="rounded-[32px] shadow-bookmeup hover:shadow-bookmeup-lg transition cursor-pointer h-full flex flex-col"
              >
                <CardHeader>
                  <div className="text-5xl mb-4">{card.icon}</div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  <CardDescription className="text-sm mt-2">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <div className="mt-auto pt-4">
                  <Button
                    variant="outline"
                    className="w-full rounded-[32px] text-sm"
                  >
                    {card.cta} →
                  </Button>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
