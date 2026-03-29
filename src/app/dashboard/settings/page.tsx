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
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Configuration
        </div>
        <h2 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">
          Paramètres
        </h2>
        <p className="text-sm text-[#8a7a92]">
          Gérez votre compte, votre abonnement et vos préférences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {settingsCards.map((card, index) => (
          <motion.div
            key={card.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link href={card.href}>
              <div className="bg-white rounded-[24px] border border-primary/8 shadow-[0_4px_20px_rgba(20,0,50,0.04)] hover:shadow-[0_8px_32px_rgba(20,0,50,0.08)] hover:border-primary/15 transition-all cursor-pointer h-full flex flex-col p-6">
                <div className="w-12 h-12 rounded-[14px] bg-[#F5F0F7] flex items-center justify-center text-2xl mb-4">{card.icon}</div>
                <h3 className="text-base font-bold text-[#2A1F2D] mb-1">{card.title}</h3>
                <p className="text-sm text-[#8a7a92] mb-5 flex-1">
                  {card.description}
                </p>
                <span className="text-xs font-bold text-primary">
                  {card.cta} →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
