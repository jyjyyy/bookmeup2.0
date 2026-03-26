'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FaqSection } from '@/components/home/FaqSection'
import { motion } from 'framer-motion'

const FEATURES = [
  { icon: '📅', title: 'Réservation instantanée', desc: 'Réservez votre rendez-vous en quelques secondes, 24h/24.' },
  { icon: '✅', title: 'Professionnels vérifiés', desc: 'Chaque pro est sélectionné et certifié pour votre tranquillité.' },
  { icon: '💎', title: 'Zéro commission', desc: 'Vous payez directement le pro, sans frais cachés ni surprises.' },
  { icon: '🔔', title: 'Rappels automatiques', desc: 'Recevez un rappel la veille de chaque rendez-vous par email.' },
  { icon: '⭐', title: 'Avis certifiés', desc: 'Des milliers d\'avis authentiques pour choisir en confiance.' },
  { icon: '🔒', title: 'Paiement sécurisé', desc: 'Vos données sont protégées avec les derniers standards de sécurité.' },
]

const PRICING = [
  {
    name: 'Starter',
    price: '0',
    period: 'pour toujours',
    description: 'Pour démarrer votre activité en ligne.',
    features: ['1 profil professionnel', 'Réservations illimitées', 'Page de profil publique', 'Support email'],
    cta: 'Commencer gratuitement',
    href: '/auth/signup',
    popular: false,
  },
  {
    name: 'Pro',
    price: '29',
    period: 'par mois',
    description: 'Pour les pros qui veulent développer leur clientèle.',
    features: ['Tout Starter inclus', 'Statistiques avancées', 'Rappels SMS clients', 'Galerie photos', 'Priorité dans la recherche'],
    cta: 'Essayer 14 jours gratuit',
    href: '/auth/signup',
    popular: true,
  },
  {
    name: 'Premium',
    price: '59',
    period: 'par mois',
    description: 'Pour les salons et les équipes ambitieuses.',
    features: ['Tout Pro inclus', 'Export comptabilité CSV/PDF', 'KPIs avancés', 'Intégration Google Calendar', 'Support prioritaire'],
    cta: 'Contacter les ventes',
    href: '/auth/signup',
    popular: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO DARK ──────────────────────────────────────────────────── */}
      <section className="hero-dark pt-20 pb-32 md:pb-40">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <motion.div
              suppressHydrationWarning
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-6 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Réservation en ligne instantanée
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
                Votre beauté,{' '}
                <span className="gradient-text">réservée en 30s</span>
              </h1>
              <p className="text-lg text-white/65 mb-10 leading-relaxed max-w-lg">
                Trouvez les meilleurs coiffeurs, esthéticiennes et spas près de chez vous.
                Réservez instantanément, annulez gratuitement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/search">
                  <Button size="lg" className="btn-gradient text-lg w-full sm:w-auto">
                    Trouver un professionnel →
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 w-full sm:w-auto">
                    Je suis un pro
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: floating cards widget */}
            <motion.div
              suppressHydrationWarning
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden md:flex items-center justify-center"
            >
              {/* Main card */}
              <div className="relative w-full max-w-sm">
                <div className="bg-white rounded-[28px] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-[#9C44AF] flex items-center justify-center text-xl font-bold text-white">S</div>
                    <div>
                      <div className="font-bold text-[#2A1F2D]">Salon Élégance</div>
                      <div className="text-sm text-[#7A6B80]">Coiffure · Paris 3e</div>
                    </div>
                    <div className="ml-auto text-sm font-semibold text-amber-500">⭐ 4.9</div>
                  </div>
                  <div className="text-xs font-semibold text-[#7A6B80] uppercase tracking-wide mb-3">Créneaux disponibles aujourd&apos;hui</div>
                  <div className="flex gap-2 flex-wrap">
                    {['10:00', '11:30', '14:00', '16:30'].map((t, i) => (
                      <span key={t} className={`slot-btn ${i === 1 ? 'active' : ''}`}>{t}</span>
                    ))}
                  </div>
                  <button className="w-full mt-5 py-3 rounded-[14px] font-bold text-white btn-gradient">
                    Réserver maintenant →
                  </button>
                </div>

                {/* Floating badge: confirmed */}
                <div className="absolute -top-4 -right-4 bg-white rounded-[14px] px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.15)] flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
                  <span className="w-6 h-6 rounded-full bg-[#DCFCE7] flex items-center justify-center text-xs">✓</span>
                  Réservation confirmée
                </div>

                {/* Floating badge: next slot */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-[14px] px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.15)] flex items-center gap-2 text-sm font-semibold text-[#2A1F2D]">
                  <span className="text-base">⚡</span>
                  Prochaine dispo dans 2h
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-b border-[#EDE8F0]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 max-w-3xl mx-auto">
            {[
              { step: '1', label: 'Choisissez un pro' },
              { step: '2', label: 'Sélectionnez un créneau' },
              { step: '3', label: 'Réservez en 30 secondes' },
            ].map((item, i) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col sm:flex-row items-center gap-3 px-6 py-4 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#9C44AF] flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
                    {item.step}
                  </div>
                  <span className="text-sm font-semibold text-[#2A1F2D]">{item.label}</span>
                </div>
                {i < 2 && <div className="hidden sm:block w-8 h-px bg-[#EDE8F0]" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            suppressHydrationWarning
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-extrabold text-[#2A1F2D] mb-4">
              Pourquoi choisir <span className="gradient-text">BookMeUp</span> ?
            </h2>
            <p className="text-lg text-[#7A6B80] max-w-2xl mx-auto">
              Une plateforme pensée pour vous simplifier la vie et sublimer votre routine beauté.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <motion.div
                suppressHydrationWarning
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="card-hover bg-background rounded-[24px] p-6 border border-[#EDE8F0]"
              >
                <div className="w-12 h-12 rounded-[14px] bg-secondary flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-[#2A1F2D] mb-2">{f.title}</h3>
                <p className="text-sm text-[#7A6B80] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <motion.div
            suppressHydrationWarning
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-extrabold text-[#2A1F2D] mb-4">
              Des tarifs <span className="gradient-text">transparents</span>
            </h2>
            <p className="text-lg text-[#7A6B80] max-w-xl mx-auto">
              Commencez gratuitement. Évoluez à votre rythme.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {PRICING.map((plan, i) => (
              <motion.div
                suppressHydrationWarning
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className={`rounded-[28px] p-7 border relative ${
                  plan.popular
                    ? 'bg-[#2A1F2D] border-transparent shadow-[0_20px_60px_rgba(0,0,0,0.25)]'
                    : 'bg-white border-[#EDE8F0] shadow-bookmeup'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-[#9C44AF] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                    Le plus populaire ✨
                  </div>
                )}
                <div className={`text-sm font-bold uppercase tracking-wide mb-2 ${plan.popular ? 'text-primary' : 'text-[#7A6B80]'}`}>
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-[#2A1F2D]'}`}>
                    {plan.price === '0' ? 'Gratuit' : `${plan.price} €`}
                  </span>
                  {plan.price !== '0' && (
                    <span className={`text-sm mb-1.5 ${plan.popular ? 'text-white/60' : 'text-[#7A6B80]'}`}>/ mois</span>
                  )}
                </div>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/65' : 'text-[#7A6B80]'}`}>{plan.description}</p>
                <ul className="space-y-3 mb-7">
                  {plan.features.map((feat) => (
                    <li key={feat} className={`flex items-center gap-2.5 text-sm ${plan.popular ? 'text-white/85' : 'text-[#2A1F2D]'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${plan.popular ? 'bg-primary/30 text-primary' : 'bg-secondary text-primary'}`}>✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="md"
                    className={`w-full ${plan.popular ? 'btn-gradient' : ''}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <FaqSection />

      {/* ── CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <motion.div
            suppressHydrationWarning
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="hero-dark rounded-[32px] p-10 md:p-14 text-center relative overflow-hidden">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 relative z-10">
                Prêt à trouver votre prochain soin ?
              </h2>
              <p className="text-lg text-white/65 mb-8 max-w-xl mx-auto relative z-10">
                Trouvez les meilleurs professionnels près de chez vous et prenez soin de vous en toute simplicité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Link href="/search">
                  <Button size="lg" className="btn-gradient text-lg w-full sm:w-auto">
                    Rechercher maintenant →
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                    Créer un compte gratuit
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
