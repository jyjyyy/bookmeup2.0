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
    <Card className="rounded-[32px] p-6">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
          {avatarLetter}
        </div>

        {/* Infos */}
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[#2A1F2D] mb-1">
            Réserver avec {pro.name}
          </h1>
          {pro.city && (
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <span>📍</span>
              <span>{pro.city}</span>
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            {servicesCount} service{servicesCount > 1 ? 's' : ''} disponible{servicesCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </Card>
  )
}

