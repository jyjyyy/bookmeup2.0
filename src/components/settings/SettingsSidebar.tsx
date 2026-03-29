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
    <div className="bg-white rounded-[24px] border border-primary/8 shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-4 h-fit">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#b5a8bc] mb-3 px-3">
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
                'flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-r from-primary/10 to-secondary text-[#2A1F2D] font-bold shadow-[0_2px_8px_rgba(200,109,215,0.08)]'
                  : 'text-[#7A6B80] hover:bg-[#F5F0F7] hover:text-[#2A1F2D]'
              )}
            >
              <span className={cn(
                'w-8 h-8 rounded-[10px] flex items-center justify-center text-sm flex-shrink-0',
                isActive ? 'bg-white shadow-sm' : 'bg-[#F5F0F7]'
              )}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

