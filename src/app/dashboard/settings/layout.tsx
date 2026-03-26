import { ReactNode } from 'react'
import { SettingsSidebar } from '@/components/settings/SettingsSidebar'

interface SettingsLayoutProps {
  children: ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Paramètres</h1>
        <p className="text-sm text-[#7A6B80]">
          Gérez votre compte, votre abonnement et vos préférences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
        {/* Sidebar */}
        <aside>
          <SettingsSidebar />
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}

