"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/shared/motion"
import {
  CreditCard,
  Check,
  Star,
  Zap,
  Crown,
  ArrowRight,
} from "lucide-react"
import type { ProProfile, SubscriptionPlan } from "@/lib/types"
import { PLAN_LIMITS, PLAN_LABELS } from "@/lib/types"

const PLANS: {
  id: SubscriptionPlan
  name: string
  price: number
  icon: React.ElementType
  features: string[]
  highlight?: boolean
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    icon: Star,
    features: [
      "5 services maximum",
      "50 réservations / mois",
      "Statistiques de base",
      "Page de réservation",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    icon: Zap,
    highlight: true,
    features: [
      "20 services",
      "Réservations illimitées",
      "Statistiques avancées",
      "Sync Google Calendar",
      "Support prioritaire",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 39,
    icon: Crown,
    features: [
      "Services illimités",
      "Réservations illimitées",
      "Analytics complets",
      "Google Calendar + SMS",
      "Export données",
      "Support VIP",
    ],
  },
]

export default function SubscriptionPage() {
  const { user } = useAuth()
  const [proProfile, setProProfile] = useState<ProProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchPro() {
      try {
        const ref = doc(db, "pros", user!.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setProProfile(snap.data() as ProProfile)
        }
      } catch (err) {
        console.error("Fetch pro error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPro()
  }, [user])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    )
  }

  const currentPlan = proProfile?.plan || "starter"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Abonnement
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Vous êtes actuellement sur le plan{" "}
            <span className="font-semibold text-terracotta">
              {PLAN_LABELS[currentPlan]}
            </span>
          </p>
        </div>
      </FadeIn>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan, idx) => {
          const isCurrent = plan.id === currentPlan
          return (
            <FadeIn key={plan.id} delay={0.05 * (idx + 1)}>
              <Card
                className={`relative ${
                  plan.highlight && !isCurrent
                    ? "border-2 border-terracotta"
                    : isCurrent
                    ? "border-2 border-sage"
                    : ""
                }`}
              >
                {plan.highlight && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="bg-terracotta text-white border-0">
                      Populaire
                    </Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="success">Plan actuel</Badge>
                  </div>
                )}

                <CardContent className="p-6 pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-terracotta/10 flex items-center justify-center">
                      <plan.icon className="h-5 w-5 text-terracotta" />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-[var(--text-primary)]">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      {plan.price}€
                    </span>
                    <span className="text-sm text-[var(--text-muted)]"> / mois</span>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <Check className="h-4 w-4 text-sage shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlight ? "primary" : "outline"}
                      className="w-full"
                      onClick={() => {
                        // TODO: Stripe checkout
                        alert("L'intégration Stripe sera disponible prochainement !")
                      }}
                    >
                      {plan.price > (PLANS.find((p) => p.id === currentPlan)?.price || 0)
                        ? "Passer à ce plan"
                        : "Changer de plan"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          )
        })}
      </div>

      {/* Info */}
      <FadeIn delay={0.25}>
        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] p-4">
          <p className="font-medium text-[var(--text-secondary)] mb-1">Informations</p>
          <p>
            Tous les plans incluent votre page de réservation publique et les rappels automatiques par email.
            Vous pouvez changer de plan ou annuler à tout moment. Le paiement est géré via Stripe de manière sécurisée.
          </p>
        </div>
      </FadeIn>
    </div>
  )
}
