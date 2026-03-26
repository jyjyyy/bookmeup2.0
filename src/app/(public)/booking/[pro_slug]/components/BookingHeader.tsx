'use client'

import { Card } from '@/components/ui/card'
import type { BookingPro } from '../types'

interface BookingHeaderProps {
  pro: BookingPro
  servicesCount: number
}

export function BookingHeader({ pro, servicesCount }: BookingHeaderProps) {
  const avatarLetter = pro.name?.[0]?.toUpperCase() || 'P'

  return (
    <div className="hero-dark rounded-[28px] p-6 md:p-8">
      <div className="flex items-center gap-4 relative z-10">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-[#9C44AF] flex items-center justify-center text-2xl font-extrabold text-white flex-shrink-0 shadow-md border-2 border-white/20">
          {avatarLetter}
        </div>

        {/* Infos */}
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-extrabold text-white mb-1">
            Réserver avec {pro.name}
          </h1>
          {pro.city && (
            <p className="text-sm text-white/65 flex items-center gap-1.5">
              <span>📍</span><span>{pro.city}</span>
            </p>
          )}
          <p className="text-xs text-white/45 mt-1">
            {servicesCount} prestation{servicesCount > 1 ? 's' : ''} disponible{servicesCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

