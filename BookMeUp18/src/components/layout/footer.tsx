import Link from "next/link"
import { Sparkles } from "lucide-react"

const FOOTER_LINKS = {
  Produit: [
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "Témoignages", href: "#temoignages" },
    { label: "FAQ", href: "#faq" },
  ],
  "Par métier": [
    { label: "Coiffeuse", href: "/pour/coiffeuse" },
    { label: "Esthéticienne", href: "/pour/estheticienne" },
    { label: "Prothésiste ongulaire", href: "/pour/prothesiste-ongulaire" },
    { label: "Masseuse", href: "/pour/masseuse" },
  ],
  Légal: [
    { label: "Mentions légales", href: "/legal/mentions" },
    { label: "CGU", href: "/legal/cgu" },
    { label: "Politique de confidentialité", href: "/legal/confidentialite" },
    { label: "RGPD", href: "/legal/rgpd" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-[var(--text-primary)]">
              <Sparkles className="h-5 w-5 text-terracotta" />
              <span className="font-heading text-lg font-bold">BookMeUp</span>
            </Link>
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              La plateforme de réservation pensée pour les professionnelles de la beauté.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} BookMeUp. Tous droits réservés.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Fait avec soin pour les pros de la beauté
          </p>
        </div>
      </div>
    </footer>
  )
}
