'use client'

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
      <div className="bg-secondary rounded-[20px] p-4 border-2 border-primary/30 shadow-bookmeup-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-0.5">Prestation sélectionnée</p>
            <h3 className="text-sm font-bold text-[#2A1F2D] truncate">
              {service.name}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-primary font-extrabold">
                {service.price} €
              </span>
              <span className="text-xs text-[#7A6B80]">
                ⏱ {service.duration} min
              </span>
            </div>
          </div>
          <button
            onClick={onChange}
            className="text-xs font-semibold text-[#7A6B80] hover:text-primary transition-colors px-3 py-2 rounded-[12px] hover:bg-white whitespace-nowrap"
          >
            Changer
          </button>
        </div>
      </div>
    </div>
  )
}

