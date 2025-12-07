'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center md:text-left"
              >
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                  Simplifiez vos{' '}
                  <span className="text-primary">rendez-vous beauté</span>{' '}
                  ✨
                </h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Réservez en quelques clics avec les meilleurs professionnels
                  de beauté. Une expérience simple, rapide et élégante.
                </p>
                <Link href="/search">
                  <Button size="lg" className="text-lg">
                    Rechercher un professionnel
                  </Button>
                </Link>
              </motion.div>

              {/* Illustration */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative w-full h-96 bg-gradient-to-br from-primary/10 to-pink-100/30 rounded-[32px] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80')] bg-cover bg-center opacity-20 rounded-[32px]"></div>
                  <div className="relative z-10 text-center p-8">
                    <div className="w-32 h-32 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-6xl">💅</span>
                    </div>
                    <p className="text-slate-600 font-medium">
                      Votre beauté, notre priorité
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages Section */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Pourquoi choisir BookMeUp ?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Une plateforme pensée pour vous simplifier la vie
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: '📅',
                title: 'Réservations simples',
                description:
                  'Réservez votre rendez-vous en quelques clics, sans complication.',
              },
              {
                icon: '✅',
                title: 'Professionnels vérifiés',
                description:
                  'Tous nos partenaires sont sélectionnés et vérifiés pour votre tranquillité.',
              },
              {
                icon: '💎',
                title: 'Zéro commission',
                description:
                  'Vous payez directement le professionnel, sans frais cachés.',
              },
            ].map((advantage, index) => (
              <motion.div
                key={advantage.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card hover className="text-center h-full">
                  <div className="text-5xl mb-4">{advantage.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {advantage.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {advantage.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-gradient-to-br from-primary/10 to-pink-100/30 border-2 border-primary/20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                Rejoignez des milliers de clients satisfaits et découvrez une
                nouvelle façon de réserver vos rendez-vous beauté.
              </p>
              <Link href="/search">
                <Button size="lg" className="text-lg">
                  Commencer maintenant
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

