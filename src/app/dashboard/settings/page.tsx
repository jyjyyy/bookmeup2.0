'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface SettingsCard {
  title: string
  description: string
  href: string
  icon: string
  cta: string
  color: string
}

const settingsCards: SettingsCard[] = [
  {
    title: 'Compte',
    description: 'Informations personnelles et profil professionnel.',
    href: '/dashboard/settings/account',
    icon: '👤',
    cta: 'Gérer mon compte',
    color: 'from-primary/10 to-secondary',
  },
  {
    title: 'Abonnement',
    description: 'Voir et gérer votre plan BookMeUp.',
    href: '/dashboard/settings/subscription',
    icon: '💳',
    cta: 'Voir les abonnements',
    color: 'from-amber-100/60 to-amber-50',
  },
  {
    title: 'Sécurité',
    description: 'Mot de passe, sécurité et accès.',
    href: '/dashboard/settings/security',
    icon: '🔒',
    cta: 'Configurer la sécurité',
    color: 'from-blue-100/60 to-blue-50',
  },
  {
    title: 'Préférences',
    description: 'Langue, notifications et expérience.',
    href: '/dashboard/settings/preferences',
    icon: '🎨',
    cta: 'Ajuster mes préférences',
    color: 'from-pink-100/60 to-pink-50',
  },
  {
    title: 'Communication',
    description: 'Messages clients, SMS, e-mails.',
    href: '/dashboard/settings/communication',
    icon: '💬',
    cta: 'Configurer la communication',
    color: 'from-emerald-100/60 to-emerald-50',
  },
  {
    title: 'Intégrations',
    description: 'Connecter Google Calendar et autres outils.',
    href: '/dashboard/integrations/google-calendar',
    icon: '📅',
    cta: 'Gérer les intégrations',
    color: 'from-sky-100/60 to-sky-50',
  },
]

export default function SettingsPage() {
  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Configuration
        </div>
        <h2 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">
          Paramètres
        </h2>
        <p className="text-sm text-[#8a7a92]">
          Gérez votre compte, votre abonnement et vos préférences.
        </p>
      </motion.div>

      {/* Settings cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {settingsCards.map((card, index) => (
          <motion.div
            key={card.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
          >
            <Link href={card.href}>
              <div className="group bg-white rounded-[22px] border border-[#EDE8F0] shadow-[0_4px_20px_rgba(20,0,50,0.04)] hover:shadow-[0_8px_32px_rgba(20,0,50,0.08)] hover:border-primary/15 transition-all duration-300 cursor-pointer h-full flex flex-col p-6 relative overflow-hidden">
                {/* Subtle gradient corner */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${card.color} rounded-bl-[40px] opacity-50 group-hover:opacity-80 transition-opacity`} />

                <div className="relative">
                  <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl mb-4 shadow-[0_2px_8px_rgba(20,0,50,0.04)]`}>
                    {card.icon}
                  </div>
                  <h3 className="text-[15px] font-bold text-[#2A1F2D] mb-1">{card.title}</h3>
                  <p className="text-xs text-[#8a7a92] mb-5 flex-1 leading-relaxed">
                    {card.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:gap-2.5 transition-all">
                    {card.cta}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
