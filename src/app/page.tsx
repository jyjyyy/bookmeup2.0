'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FaqSection } from '@/components/home/FaqSection'
import { motion } from 'framer-motion'

const FEATURES = [
  { icon: '⚡', title: 'Réservation instantanée', desc: 'Disponibilités en temps réel, confirmation immédiate. Fini les SMS et les appels sans réponse.' },
  { icon: '🔔', title: 'Rappels automatiques', desc: 'Email et SMS de rappel 24h avant. Zéro oubli, zéro no-show.' },
  { icon: '⭐', title: 'Pros vérifiées', desc: 'Chaque professionnelle est vérifiée et notée par notre communauté de clientes.' },
  { icon: '🔒', title: 'Paiement sécurisé', desc: 'Vos informations sont protégées par un chiffrement SSL de niveau bancaire.' },
  { icon: '📱', title: '100% mobile', desc: 'Réservez depuis votre téléphone où que vous soyez, en quelques secondes.' },
  { icon: '🗓️', title: 'Historique complet', desc: 'Retrouvez tous vos rendez-vous, re-réservez en un clic vos prestataires préférées.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO LIGHT ─────────────────────────────────────────────────── */}
      <section className="hero-light pt-20 pb-28 md:pb-36">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-sm font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                La réservation beauté nouvelle génération
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-[#2A1F2D] mb-6 leading-[1.1] tracking-tight">
                Réservez votre{' '}
                <span className="gradient-text">esthéticienne</span>
                <br />en 30 secondes
              </h1>
              <p className="text-lg text-[#64576b] mb-10 leading-relaxed max-w-lg">
                Trouvez les meilleures esthéticiennes près de chez vous.
                Disponibilités en temps réel, confirmation instantanée.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/search">
                  <Button size="lg" className="btn-gradient text-lg w-full sm:w-auto">
                    Trouver une esthéticienne →
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Vous êtes pro ?
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
                <div className="bg-white rounded-[32px] p-7 shadow-[0_20px_60px_rgba(20,0,50,0.1)] border border-primary/10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-13 h-13 rounded-full bg-gradient-to-br from-primary to-[#9C44AF] flex items-center justify-center text-xl font-bold text-white w-[52px] h-[52px]">S</div>
                    <div>
                      <div className="font-bold text-[#2A1F2D]">Sophie Martin</div>
                      <div className="text-sm text-[#8a7a92]">Esthéticienne · Paris 11e</div>
                      <div className="text-sm text-amber-500">⭐⭐⭐⭐⭐ <span className="text-[#8a7a92] text-xs">48 avis</span></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="chip">💆 Soins visage</span>
                    <span className="chip">💅 Manucure</span>
                    <span className="chip">✨ Épilation</span>
                  </div>
                  <p className="text-xs text-[#8a7a92] font-medium mb-3">Prochaines disponibilités · Vendredi 28 mars</p>
                  <div className="flex gap-2 flex-wrap">
                    {['09:00', '10:30', '14:00', '15:30', '17:00'].map((t, i) => (
                      <span key={t} className={`slot-btn ${i === 2 ? 'active' : ''}`}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Floating badge: confirmed */}
                <div className="absolute -top-5 -right-5 bg-white rounded-[20px] px-4 py-3 shadow-[0_12px_40px_rgba(20,0,50,0.12)] border border-primary/10 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-[10px] bg-[#f0fdf4] flex items-center justify-center text-base">✅</span>
                  <div>
                    <div className="text-xs text-[#8a7a92]">Rendez-vous</div>
                    <div className="text-sm font-bold text-[#2A1F2D]">Confirmé</div>
                  </div>
                </div>

                {/* Floating badge: next slot */}
                <div className="absolute -bottom-5 -left-5 bg-white rounded-[20px] px-4 py-3 shadow-[0_12px_40px_rgba(20,0,50,0.12)] border border-primary/10 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-[10px] bg-[#fdf4ff] flex items-center justify-center text-base">📅</span>
                  <div>
                    <div className="text-xs text-[#8a7a92]">Prochaine dispo</div>
                    <div className="text-sm font-bold text-[#2A1F2D]">Auj. 14h00 <span className="text-emerald-500 text-xs font-semibold">● libre</span></div>
                  </div>
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
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            suppressHydrationWarning
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="section-label">Pourquoi BookMeUp ?</p>
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-12">
              <h2 className="text-4xl font-extrabold text-[#2A1F2D] leading-tight">
                La beauté,<br />sans la complication
              </h2>
              <p className="text-base text-[#8a7a92] max-w-md leading-relaxed">
                Planifiez, confirmez et gérez vos rendez-vous beauté en quelques clics.
              </p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                suppressHydrationWarning
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="card-hover bg-white rounded-[32px] p-7 border border-primary/8 shadow-[0_6px_24px_rgba(20,0,50,0.05)]"
              >
                <div className="w-[52px] h-[52px] rounded-[16px] bg-secondary flex items-center justify-center text-2xl mb-5">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-[#2A1F2D] mb-2">{f.title}</h3>
                <p className="text-sm text-[#8a7a92] leading-relaxed">{f.desc}</p>
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
            className="max-w-5xl mx-auto"
          >
            <div className="hero-dark rounded-[32px] p-10 md:p-14 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_24px_80px_rgba(20,0,50,0.2)]">
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight">
                  Prête à rejoindre<br />BookMeUp ?
                </h2>
                <p className="text-base text-white/60">
                  Créez votre compte gratuitement en 2 minutes.
                </p>
              </div>
              <Link href="/auth/signup" className="relative z-10">
                <Button size="lg" className="btn-gradient text-lg whitespace-nowrap">
                  Commencer maintenant →
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
