'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: string
}

const navItems: NavItem[] = [
  { label: 'Compte', href: '/dashboard/settings/account', icon: '👤' },
  { label: 'Abonnement', href: '/dashboard/settings/subscription', icon: '💳' },
  { label: 'Sécurité', href: '/dashboard/settings/security', icon: '🔒' },
  { label: 'Préférences', href: '/dashboard/settings/preferences', icon: '🎨' },
  { label: 'Communication', href: '/dashboard/settings/communication', icon: '💬' },
  { label: 'Intégrations', href: '/dashboard/integrations/google-calendar', icon: '📅' },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <div className="bg-white rounded-[32px] shadow-bookmeup p-6 h-fit">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Paramètres
      </h2>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-[999px] transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

