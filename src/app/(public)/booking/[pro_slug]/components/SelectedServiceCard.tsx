'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { BookingService } from '../types'

interface SelectedServiceCardProps {
  service: BookingService | null
  onChange: () => void
}

export function SelectedServiceCard({ service, onChange }: SelectedServiceCardProps) {
  if (!service) {
    return null
  }

  return (
    <div className="sticky top-4 z-10 mb-6">
      <Card className="rounded-[32px] p-5 bg-white border-2 border-primary/20 shadow-bookmeup">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#2A1F2D] mb-1 truncate">
              {service.name}
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-primary font-bold text-xl">
                {service.price} €
              </span>
              <span className="text-slate-500">
                {service.duration} min
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onChange}
            className="rounded-[24px] px-4 py-2 text-sm whitespace-nowrap"
          >
            Changer
          </Button>
        </div>
      </Card>
    </div>
  )
}

