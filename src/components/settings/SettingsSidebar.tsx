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
    <div className="bg-white rounded-[24px] border border-[#EDE8F0] shadow-bookmeup-sm p-5 h-fit">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A6B80] mb-3 px-2">
        Paramètres
      </p>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-[#7A6B80] hover:bg-secondary hover:text-[#2A1F2D]'
              )}
            >
              <span className={cn(
                'w-7 h-7 rounded-[8px] flex items-center justify-center text-sm flex-shrink-0',
                isActive ? 'bg-primary/20' : 'bg-secondary'
              )}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

