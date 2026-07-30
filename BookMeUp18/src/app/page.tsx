"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/motion"
import Link from "next/link"
import {
  Calendar,
  Clock,
  CreditCard,
  BarChart3,
  Bell,
  Shield,
  Star,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Users,
  Zap,
  Heart,
  Camera,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils/cn"

/* ─────────────────────────────────────────────
   Landing Page — BookMeUp18
   ───────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <SocialProofBar />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}

/* ── Hero ── */
function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-tertiary)]/40 via-[var(--bg-primary)] to-[var(--bg-primary)]" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-terracotta/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose/30 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center max-w-3xl mx-auto">
          <Badge className="mb-6">Essai gratuit 14 jours</Badge>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.1]">
            Votre agenda beauté,{" "}
            <span className="text-terracotta">en 5 minutes</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
            Fini les appels manqués et les SMS de rappel. Vos clientes réservent en ligne,
            vous gérez tout depuis un seul dashboard.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" asChild>
              <Link href="/auth/signup">
                Créer mon agenda gratuitement
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#fonctionnalites">Découvrir</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Pas de carte bancaire requise &middot; Configuration en 5 min
          </p>
        </FadeIn>

        {/* Dashboard preview placeholder */}
        <FadeIn delay={0.3} className="mt-16 max-w-4xl mx-auto">
          <div className="relative rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-elevated)] border border-[var(--border-default)]">
            <div className="aspect-[16/9] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] flex items-center justify-center">
              <div className="text-center px-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-terracotta/10 mb-4">
                  <Sparkles className="h-8 w-8 text-terracotta" />
                </div>
                <p className="text-lg font-heading font-semibold text-[var(--text-primary)]">
                  Aperçu du dashboard
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Gérez vos rendez-vous, services et clientes en un coup d&apos;œil
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ── Social proof bar ── */
function SocialProofBar() {
  return (
    <section className="py-8 border-y border-[var(--border-default)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-center">
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">500+</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Professionnelles inscrites</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">12 000+</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">RDV réservés ce mois</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-warning text-warning" />
              ))}
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] ml-1">4.9/5</p>
            <p className="text-xs text-[var(--text-muted)]">(340 avis)</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Features ── */
const FEATURES = [
  {
    icon: Calendar,
    title: "Agenda intelligent",
    description:
      "Vue jour, semaine, mois. Vos clientes ne voient que les créneaux disponibles. Fini les doubles réservations.",
  },
  {
    icon: Clock,
    title: "Réservation en 60 secondes",
    description:
      "Votre page de réservation est prête en 5 minutes. Partagez un lien, vos clientes réservent en 3 clics.",
  },
  {
    icon: Bell,
    title: "Rappels automatiques",
    description:
      "Vos clientes reçoivent un email de confirmation et un rappel la veille. Moins de no-shows, plus de revenus.",
  },
  {
    icon: CreditCard,
    title: "Paiements intégrés",
    description:
      "Acceptez les paiements en ligne ou gardez votre fonctionnement actuel. C'est vous qui choisissez.",
  },
  {
    icon: BarChart3,
    title: "Statistiques claires",
    description:
      "Votre CA, vos services les plus populaires, vos créneaux les plus demandés. En un coup d'œil.",
  },
  {
    icon: Camera,
    title: "Galerie photos",
    description:
      "Mettez en valeur votre travail. Votre page est votre vitrine : soignée, professionnelle, à votre image.",
  },
  {
    icon: Users,
    title: "Gestion clientèle",
    description:
      "Fiches clientes, historique des RDV, notes privées. Fidélisez et connaissez mieux vos clientes.",
  },
  {
    icon: Shield,
    title: "Anti no-show",
    description:
      "Blocage automatique des clientes qui annulent trop souvent. Protégez votre temps et votre CA.",
  },
]

function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <Badge className="mb-4">Fonctionnalités</Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Un outil complet, pensé par et pour les professionnelles de la beauté.
            Simple à prendre en main, puissant au quotidien.
          </p>
        </FadeIn>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" staggerDelay={0.06}>
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title}>
              <Card className="h-full group">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-terracotta/10 flex items-center justify-center mb-4 group-hover:bg-terracotta/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-terracotta" />
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

/* ── How it works ── */
const STEPS = [
  {
    step: "01",
    title: "Créez votre compte",
    description: "Inscription en 2 minutes. Choisissez votre métier, ajoutez vos services et vos tarifs.",
  },
  {
    step: "02",
    title: "Configurez vos horaires",
    description: "Définissez vos jours et créneaux de travail. Ajoutez vos vacances et jours de fermeture.",
  },
  {
    step: "03",
    title: "Partagez votre lien",
    description: "Un lien unique, à mettre sur Instagram, Google, ou à envoyer par SMS. Vos clientes réservent en 3 clics.",
  },
]

function HowItWorksSection() {
  return (
    <section className="py-20 bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <Badge className="mb-4">Comment ça marche</Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Prête en 5 minutes
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <FadeIn key={step.step} delay={i * 0.15}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-terracotta/10 text-terracotta font-heading text-xl font-bold mb-4">
                  {step.step}
                </div>
                <h3 className="font-heading text-xl font-semibold text-[var(--text-primary)] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ── */
const PLANS = [
  {
    name: "Starter",
    price: "9,99",
    description: "Pour se lancer",
    features: [
      "5 services",
      "50 RDV / mois",
      "Page de réservation personnalisée",
      "Rappels email automatiques",
      "Statistiques basiques",
      "Support par email",
    ],
    cta: "Commencer l'essai",
    popular: false,
  },
  {
    name: "Pro",
    price: "24,99",
    description: "Le plus populaire",
    features: [
      "20 services",
      "RDV illimités",
      "Tout Starter +",
      "Google Calendar sync",
      "Statistiques avancées",
      "Galerie photos illimitée",
      "Fiches clientes détaillées",
      "Support prioritaire",
    ],
    cta: "Commencer l'essai",
    popular: true,
  },
  {
    name: "Premium",
    price: "49,99",
    description: "Pour les ambitieuses",
    features: [
      "Services illimités",
      "RDV illimités",
      "Tout Pro +",
      "Exports comptables CSV/PDF",
      "Rappels SMS (Twilio)",
      "Comparaison de périodes",
      "Taux d'occupation détaillé",
      "Support dédié",
    ],
    cta: "Commencer l'essai",
    popular: false,
  },
]

function PricingSection() {
  return (
    <section id="tarifs" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <Badge className="mb-4">Tarifs</Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Un prix juste, sans surprise
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            14 jours d&apos;essai gratuit sur tous les plans. Sans carte bancaire.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1}>
              <Card
                className={cn(
                  "relative h-full flex flex-col",
                  plan.popular &&
                    "border-terracotta shadow-[var(--shadow-card)] scale-[1.02]"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Le plus populaire</Badge>
                  </div>
                )}
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="mb-6">
                    <h3 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">
                      {plan.description}
                    </p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-bold text-[var(--text-primary)]">
                        {plan.price}
                      </span>
                      <span className="text-sm text-[var(--text-muted)]">&euro;/mois</span>
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-sage mt-0.5 shrink-0" />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? "primary" : "outline"}
                    className="w-full mt-6"
                    asChild
                  >
                    <Link href="/auth/signup">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Testimonials ── */
const TESTIMONIALS = [
  {
    name: "Camille B.",
    role: "Esthéticienne à Lyon",
    quote:
      "Depuis que j'utilise BookMeUp, je ne passe plus mes soirées à gérer mes RDV par SMS. Mes clientes adorent la simplicité de la réservation.",
    rating: 5,
  },
  {
    name: "Nadia K.",
    role: "Coiffeuse à Paris",
    quote:
      "Le dashboard est magnifique et ultra simple. J'ai configuré mon agenda en 10 minutes et j'ai reçu mon premier RDV dans l'heure.",
    rating: 5,
  },
  {
    name: "Sarah M.",
    role: "Prothésiste ongulaire à Marseille",
    quote:
      "Le système anti no-show a changé ma vie. Avant, j'avais 3-4 annulations par semaine. Maintenant c'est rare. Mon CA a augmenté de 20%.",
    rating: 5,
  },
]

function TestimonialsSection() {
  return (
    <section id="temoignages" className="py-20 bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <Badge className="mb-4">Témoignages</Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Elles en parlent mieux que nous
          </h2>
        </FadeIn>

        <StaggerContainer className="grid md:grid-cols-3 gap-6" staggerDelay={0.1}>
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <blockquote className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div>
                    <p className="font-medium text-sm text-[var(--text-primary)]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

/* ── FAQ ── */
const FAQ_ITEMS = [
  {
    question: "Est-ce que je suis engagée ?",
    answer:
      "Non, aucun engagement. Vous pouvez annuler à tout moment depuis votre espace, en un clic. Vos données restent accessibles 30 jours après l'annulation.",
  },
  {
    question: "Combien de temps pour configurer mon agenda ?",
    answer:
      "5 à 10 minutes. L'onboarding est guidé étape par étape : vous ajoutez vos services, vos horaires, et c'est prêt. Votre lien de réservation est actif immédiatement.",
  },
  {
    question: "Mes clientes ont besoin de créer un compte ?",
    answer:
      "Non. Elles entrent simplement leur prénom, email et téléphone au moment de réserver. Aucun compte à créer, aucun mot de passe à retenir.",
  },
  {
    question: "Qu'est-ce qui se passe avec mes données si j'arrête ?",
    answer:
      "Vos données vous appartiennent. Vous pouvez les exporter à tout moment (CSV). Conformément au RGPD, nous supprimons tout dans les 30 jours suivant votre demande.",
  },
  {
    question: "Comment ça se compare à Planity ou Treatwell ?",
    answer:
      "BookMeUp est fait pour les indépendantes. Pas de commission sur vos RDV, pas de marketplace où vous êtes noyée parmi des centaines de concurrentes. C'est votre outil, votre page, votre marque.",
  },
  {
    question: "Je peux synchroniser avec Google Calendar ?",
    answer:
      "Oui, à partir du plan Pro. La synchronisation est bidirectionnelle : vos RDV BookMeUp apparaissent dans Google Calendar et inversement.",
  },
]

function FaqSection() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-12">
          <Badge className="mb-4">FAQ</Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Questions fréquentes
          </h2>
        </FadeIn>

        <StaggerContainer className="space-y-3" staggerDelay={0.05}>
          {FAQ_ITEMS.map((item) => (
            <StaggerItem key={item.question}>
              <FaqItem question={item.question} answer={item.answer} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[var(--border-default)] rounded-[var(--radius-md)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--bg-tertiary)]/30 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-sm text-[var(--text-primary)] pr-4">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Final CTA ── */
function CtaSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-[var(--bg-tertiary)]/40 to-[var(--bg-primary)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-terracotta/10 mb-6">
            <Heart className="h-7 w-7 text-terracotta" />
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Prête à simplifier votre quotidien ?
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Rejoignez les 500+ professionnelles qui gagnent du temps chaque jour
            grâce à BookMeUp.
          </p>
          <Button size="xl" className="mt-8" asChild>
            <Link href="/auth/signup">
              Commencer gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            14 jours gratuits &middot; Sans carte bancaire &middot; Sans engagement
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
