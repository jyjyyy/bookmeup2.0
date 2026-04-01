'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
})

/**
 * Dark mode CSS injected at runtime to avoid PostCSS escaping issues.
 * These override Tailwind's hardcoded color classes.
 */
const DARK_STYLES = `
[data-theme="dark"] .bg-white,
[data-theme="dark"] .bg-white\\/80,
[data-theme="dark"] .bg-white\\/70 {
  background-color: var(--card-bg) !important;
}

[data-theme="dark"] .bg-\\[\\#FDFBFE\\],
[data-theme="dark"] .bg-\\[\\#FAF7FB\\] {
  background-color: var(--card-bg) !important;
}

[data-theme="dark"] .bg-\\[\\#F5F0F7\\],
[data-theme="dark"] .bg-\\[\\#F5E9F8\\] {
  background-color: var(--subtle-bg) !important;
}

[data-theme="dark"] .text-\\[\\#2A1F2D\\] {
  color: var(--text-dark) !important;
}

[data-theme="dark"] .text-\\[\\#8a7a92\\],
[data-theme="dark"] .text-\\[\\#64576b\\],
[data-theme="dark"] .text-\\[\\#7A6B80\\] {
  color: var(--text-muted) !important;
}

[data-theme="dark"] .text-\\[\\#b5a8bc\\],
[data-theme="dark"] .text-\\[\\#B5A8BE\\] {
  color: #7A6B80 !important;
}

[data-theme="dark"] .text-\\[\\#9C44AF\\] {
  color: var(--primary) !important;
}

[data-theme="dark"] .border-\\[\\#EDE8F0\\] {
  border-color: var(--border) !important;
}

[data-theme="dark"] .border-primary\\/8,
[data-theme="dark"] .border-primary\\/10,
[data-theme="dark"] .border-primary\\/15,
[data-theme="dark"] .border-primary\\/20 {
  border-color: var(--border) !important;
}

[data-theme="dark"] .from-white {
  --tw-gradient-from: var(--card-bg) !important;
}

[data-theme="dark"] .bg-orange-50,
[data-theme="dark"] .bg-emerald-50,
[data-theme="dark"] .bg-red-50,
[data-theme="dark"] .bg-amber-50,
[data-theme="dark"] .bg-purple-50,
[data-theme="dark"] .bg-sky-50,
[data-theme="dark"] .bg-green-50,
[data-theme="dark"] .bg-blue-50,
[data-theme="dark"] .bg-gray-100 {
  background-color: var(--subtle-bg) !important;
}

[data-theme="dark"] .bg-orange-100,
[data-theme="dark"] .bg-emerald-100,
[data-theme="dark"] .bg-red-100,
[data-theme="dark"] .bg-amber-100,
[data-theme="dark"] .bg-sky-100 {
  background-color: #2D2538 !important;
}

[data-theme="dark"] .text-orange-800,
[data-theme="dark"] .text-orange-700\\/80,
[data-theme="dark"] .text-emerald-700,
[data-theme="dark"] .text-red-700,
[data-theme="dark"] .text-purple-700 {
  opacity: 0.9;
}

[data-theme="dark"] input,
[data-theme="dark"] select,
[data-theme="dark"] textarea {
  background-color: var(--input-bg) !important;
  color: var(--text-dark) !important;
  border-color: var(--border) !important;
}

[data-theme="dark"] .glass {
  background: rgba(26, 21, 32, 0.85) !important;
}

[data-theme="dark"] .slot-btn {
  background: var(--card-bg) !important;
  color: var(--text-muted) !important;
  border-color: var(--border) !important;
}

[data-theme="dark"] .bg-\\[\\#2A1F2D\\] {
  background-color: #1A1520 !important;
}

[data-theme="dark"] .text-white {
  color: white !important;
}

[data-theme="dark"] .hero-light {
  background: linear-gradient(160deg, var(--background) 0%, var(--secondary) 45%, var(--background) 100%) !important;
}
`

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Inject dark mode styles once (bypasses PostCSS processing)
    if (!document.getElementById('bookmeup-dark-styles')) {
      const style = document.createElement('style')
      style.id = 'bookmeup-dark-styles'
      style.textContent = DARK_STYLES
      document.head.appendChild(style)
    }

    const stored = typeof window !== 'undefined' ? window.localStorage?.getItem('bookmeup-theme') : null
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', next)
      try {
        window.localStorage?.setItem('bookmeup-theme', next)
      } catch {}
      return next
    })
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
