'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'

type PlanType = 'starter' | 'pro' | 'premium'

interface Plan {
  id: PlanType
  name: string
  price: string
  priceMonthly?: string
  features: string[]
  popular?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '9,99',
    priceMonthly: ' €/mois',
    features: [
      'Jusqu\'à 15 services',
      'Gestion des réservations',
      'Planning hebdomadaire',
      'Support email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '24,99',
    priceMonthly: ' €/mois',
    features: [
      'Services illimités',
      'Gestion des réservations',
      'Planning avancé',
      'Synchronisation Google Calendar',
      'Support prioritaire',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '49,99',
    priceMonthly: ' €/mois',
    features: [
      'Tout Pro inclus',
      'Statistiques avancées',
      'Marketing automatisé',
      'API personnalisée',
      'Support dédié 24/7',
    ],
  },
]

export default function SubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlan = async () => {
      try {
        setLoading(true)
        setError(null)

        const currentUser = await getCurrentUser()

        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }

        if (currentUser.profile.role !== 'pro') {
          router.push('/')
          return
        }

        const uid = currentUser.user.uid

        // Load current plan from Firestore
        const proDoc = await getDoc(doc(db, 'pros', uid))
        if (proDoc.exists()) {
          const proData = proDoc.data()
          const plan = (proData?.plan as PlanType) || 'starter'
          setCurrentPlan(plan)
        } else {
          setCurrentPlan('starter')
        }
      } catch (err: any) {
        console.error('Error loading plan:', err)
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [router])

  const handleUpgrade = async (planType: 'pro' | 'premium') => {
    try {
      console.log('[Subscription] handleUpgrade called with plan:', planType)
      setProcessing(planType)
      setError(null)

      console.log('[Subscription] Calling /api/stripe/create-checkout with:', { type: planType })
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: planType }),
      })

      console.log('[Subscription] API response status:', response.status)
      
      if (!response.ok) {
        // Handle 404 specifically (route doesn't exist)
        if (response.status === 404) {
          console.error('[Subscription] Route not found: /api/stripe/create-checkout')
          throw new Error('Route API introuvable. La route /api/stripe/create-checkout doit être implémentée.')
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        console.error('[Subscription] API error:', errorData)
        throw new Error(errorData.error || 'Erreur lors de la création de la session')
      }

      const data = await response.json()
      console.log('[Subscription] API response data:', data)
      
      if (data.url) {
        console.log(data) // Debug: verify response structure before redirect
        console.log('[Subscription] Redirecting to Stripe:', data.url)
        window.open(data.url, '_self')
      } else {
        console.error('[Subscription] No URL in response:', data)
        throw new Error('URL de checkout non disponible')
      }
    } catch (err: any) {
      console.error('[Subscription] Error upgrading plan:', err)
      setError(err.message || 'Erreur lors de la mise à niveau')
      setProcessing(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setProcessing('manage')
      setError(null)

      const response = await fetch('/api/stripe/portal', {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'accès au portail')
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL du portail non disponible')
      }
    } catch (err: any) {
      console.error('Error accessing portal:', err)
      setError(err.message || 'Erreur lors de l\'accès au portail')
      setProcessing(null)
    }
  }

  const getPlanBadgeColor = (plan: PlanType) => {
    switch (plan) {
      case 'premium':
        return 'bg-gradient-to-r from-yellow-100 to-pink-100 text-pink-700 border border-pink-200'
      case 'pro':
        return 'bg-primary/10 text-primary border border-primary/20'
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Abonnement</h1>
        <p className="text-gray-600 mb-3">
          Gérez votre abonnement et choisissez le plan qui vous convient
        </p>
        <div className="bg-primary/10 border border-primary/20 rounded-[24px] p-4">
          <p className="text-sm text-[#2A1F2D] font-medium">
            ⚠️ Un abonnement est obligatoire pour accéder à l'espace professionnel.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[32px] text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Current Plan Card */}
      {currentPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="rounded-[32px] shadow-bookmeup p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Abonnement actuel
                </h2>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getPlanBadgeColor(
                      currentPlan
                    )}`}
                  >
                    {PLANS.find((p) => p.id === currentPlan)?.name || currentPlan}
                  </span>
                  <span className="text-gray-600 text-sm">
                    {PLANS.find((p) => p.id === currentPlan)?.price}
                    {PLANS.find((p) => p.id === currentPlan)?.priceMonthly}
                  </span>
                </div>
              </div>
              {(currentPlan === 'pro' || currentPlan === 'premium') && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={processing === 'manage'}
                  variant="outline"
                  className="rounded-[32px]"
                >
                  {processing === 'manage' ? 'Chargement...' : 'Gérer mon abonnement'}
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan, index) => {
          const isCurrentPlan = currentPlan === plan.id
          const isUpgrade = currentPlan === 'starter' && (plan.id === 'pro' || plan.id === 'premium') ||
            currentPlan === 'pro' && plan.id === 'premium'

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                hover
                className={`rounded-[32px] shadow-bookmeup p-6 relative ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-xs font-semibold">
                      Populaire
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-primary">
                      {plan.price}
                    </span>
                    {plan.priceMonthly && (
                      <span className="text-gray-600 text-sm">
                        {plan.priceMonthly}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <svg
                        className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => {
                    console.log('[Subscription] Button clicked for plan:', plan.id)
                    
                    // Only handle pro and premium plans for Stripe checkout
                    if (plan.id === 'pro' || plan.id === 'premium') {
                      console.log('[Subscription] Calling handleUpgrade for:', plan.id)
                      handleUpgrade(plan.id)
                    } else if (plan.id === 'starter') {
                      console.log('[Subscription] Starter plan clicked, but not handled (should be disabled)')
                    }
                  }}
                  disabled={
                    isCurrentPlan ||
                    processing !== null ||
                    (plan.id === 'starter' && currentPlan !== 'starter')
                  }
                  variant={isCurrentPlan ? 'subtle' : plan.popular ? 'primary' : 'outline'}
                  className="w-full rounded-[32px]"
                  size="lg"
                >
                  {isCurrentPlan
                    ? 'Plan actuel'
                    : isUpgrade
                    ? processing === plan.id
                      ? 'Traitement...'
                      : `Passer au ${plan.name}`
                    : processing === plan.id
                    ? 'Traitement...'
                    : `Choisir ${plan.name}`}
                </Button>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
