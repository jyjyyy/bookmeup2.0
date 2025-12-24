'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface LockedPremiumBlockProps {
  message?: string
}

export function LockedPremiumBlock({
  message = "Disponible avec l’abonnement Premium",
}: LockedPremiumBlockProps) {
  return (
    <Card className="rounded-[32px] border border-primary/15 bg-secondary/40 p-6 shadow-bookmeup">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Premium
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#2A1F2D]">🔒 {message}</h3>
          <p className="mt-1 text-sm text-slate-600">
            Débloquez les analyses avancées (comparaison de période, taux d’occupation, clients
            uniques…).
          </p>
        </div>

        <Link href="/dashboard/settings/subscription">
          <Button variant="primary" className="w-full sm:w-auto">
            Passer à Premium
          </Button>
        </Link>
      </div>
    </Card>
  )
}


