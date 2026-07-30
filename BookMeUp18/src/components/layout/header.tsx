"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "@/components/shared/theme-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"
import { Menu, X, Sun, Moon, Sparkles } from "lucide-react"

const NAV_LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#temoignages", label: "Témoignages" },
  { href: "#faq", label: "FAQ" },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[var(--bg-secondary)]/90 backdrop-blur-lg border-b border-[var(--border-default)] shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" aria-label="Navigation principale">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--text-primary)] hover:opacity-80 transition-opacity"
          >
            <Sparkles className="h-6 w-6 text-terracotta" />
            <span className="font-heading text-xl font-bold tracking-tight">
              BookMeUp
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label={resolvedTheme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Connexion</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">Essai gratuit</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-[var(--border-default)]">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border-default)]">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href="/auth/login">Connexion</Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href="/auth/signup">Essai gratuit</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
