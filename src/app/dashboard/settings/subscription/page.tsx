'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
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
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

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

        // Check if returning from Stripe checkout
        const isSuccess = searchParams.get('success') === 'true'
        const sessionId = searchParams.get('session_id')

        if (isSuccess && sessionId) {
          // Verify the Stripe session and activate the plan
          setVerifying(true)
          try {
            const verifyRes = await fetch('/api/stripe/verify-session', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sessionId }),
            })

            const verifyData = await verifyRes.json()

            if (verifyRes.ok && verifyData.verified) {
              setSuccessMessage('Abonnement activé avec succès !')
              setCurrentPlan(verifyData.plan as PlanType)
              // Clean up URL params
              router.replace('/dashboard/settings/subscription', { scroll: false })
              setVerifying(false)
              setLoading(false)
              return
            } else {
              console.error('[Subscription] Verification failed:', verifyData)
              // Fall through to load plan normally
            }
          } catch (verifyErr) {
            console.error('[Subscription] Verification error:', verifyErr)
            // Fall through to load plan normally
          }
          setVerifying(false)
        }

        // Load current plan from Firestore
        const proDoc = await getDoc(doc(db, 'pros', uid))
        if (proDoc.exists()) {
          const proData = proDoc.data()
          const plan = proData?.plan as PlanType | null
          setCurrentPlan(plan) // null if no plan chosen yet
        } else {
          setCurrentPlan(null) // no plan
        }
      } catch (err: any) {
        console.error('Error loading plan:', err)
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [router, searchParams])

  const handleSelectPlan = async (planType: PlanType) => {
    try {
      console.log('[Subscription] handleSelectPlan called with plan:', planType)
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
        console.log('[Subscription] Redirecting to Stripe:', data.url)
        window.open(data.url, '_self')
      } else {
        console.error('[Subscription] No URL in response:', data)
        throw new Error('URL de checkout non disponible')
      }
    } catch (err: any) {
      console.error('[Subscription] Error selecting plan:', err)
      setError(err.message || 'Erreur lors de la sélection du plan')
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

  const getPlanBadgeColor = (plan: PlanType | null) => {
    switch (plan) {
      case 'premium':
        return 'bg-gradient-to-r from-yellow-100 to-pink-100 text-pink-700 border border-pink-200'
      case 'pro':
        return 'bg-primary/10 text-primary border border-primary/20'
      case 'starter':
        return 'bg-gray-100 text-gray-600 border border-gray-200'
      default:
        return 'bg-orange-100 text-orange-700 border border-orange-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  const hasNoPlan = currentPlan === null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Abonnement
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Mon abonnement</h1>
        <p className="text-sm text-[#8a7a92] mb-3">
          {hasNoPlan
            ? 'Choisissez un abonnement pour accéder à toutes les fonctionnalités.'
            : 'Gérez votre abonnement et choisissez le plan qui vous convient.'
          }
        </p>
        {hasNoPlan && (
          <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-4 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-orange-800 font-medium">
              Vous n&apos;avez pas encore d&apos;abonnement. Choisissez un plan ci-dessous pour commencer.
            </p>
          </div>
        )}
      </div>

      {verifying && (
        <div className="p-4 bg-purple-50 border border-purple-200 text-purple-700 rounded-[16px] text-sm flex items-center gap-2">
          <Loader />
          <span>Vérification de votre paiement en cours…</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-[16px] text-sm font-medium">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[20px] text-sm flex items-center gap-3">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Current Plan Card — only show if user already has a plan */}
      {!hasNoPlan && (
        <div className="bg-white rounded-[24px] border border-primary/8 shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-primary to-[#9C44AF] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">💳</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#8a7a92] uppercase tracking-wide mb-1">Abonnement actuel</p>
                <div className="flex items-center gap-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getPlanBadgeColor(currentPlan)}`}>
                    {PLANS.find((p) => p.id === currentPlan)?.name || currentPlan}
                  </span>
                  <span className="text-[#8a7a92] text-sm">
                    {PLANS.find((p) => p.id === currentPlan)?.price}
                    {PLANS.find((p) => p.id === currentPlan)?.priceMonthly}
                  </span>
                </div>
              </div>
            </div>
            {(currentPlan === 'pro' || currentPlan === 'premium') && (
              <Button
                onClick={handleManageSubscription}
                disabled={processing === 'manage'}
                variant="outline"
                className="rounded-full text-sm font-bold border-primary/20 text-primary hover:bg-primary/5"
              >
                {processing === 'manage' ? 'Chargement…' : 'Gérer'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan, index) => {
          const isCurrentPlan = currentPlan === plan.id
          const isUpgrade =
            hasNoPlan ||
            (currentPlan === 'starter' && (plan.id === 'pro' || plan.id === 'premium')) ||
            (currentPlan === 'pro' && plan.id === 'premium')

          return (
            <motion.div
              key={plan.id}
              suppressHydrationWarning
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className={`rounded-[24px] p-6 relative border transition-all ${
                plan.popular
                  ? 'bg-[#2A1F2D] border-transparent shadow-[0_12px_40px_rgba(0,0,0,0.25)]'
                  : isCurrentPlan
                  ? 'bg-white border-primary/20 shadow-[0_4px_20px_rgba(200,109,215,0.1)]'
                  : 'bg-white border-primary/8 shadow-[0_4px_20px_rgba(20,0,50,0.04)] hover:shadow-[0_8px_32px_rgba(20,0,50,0.08)] hover:border-primary/15'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="btn-gradient text-white px-4 py-1 rounded-full text-xs font-bold shadow-[0_4px_12px_rgba(200,109,215,0.4)]">
                      Populaire ✨
                    </span>
                  </div>
                )}

                <div className="mb-5 pt-1">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${plan.popular ? 'text-primary' : 'text-[#8a7a92]'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-extrabold ${plan.popular ? 'text-white' : 'text-[#2A1F2D]'}`}>
                      {plan.price} €
                    </span>
                    {plan.priceMonthly && (
                      <span className={`text-xs ${plan.popular ? 'text-white/40' : 'text-[#b5a8bc]'}`}>
                        {plan.priceMonthly}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={`flex items-start gap-2.5 text-xs ${plan.popular ? 'text-white/80' : 'text-[#64576b]'}`}>
                      <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-[6px] flex items-center justify-center text-[10px] font-bold ${plan.popular ? 'bg-primary/25 text-white' : 'bg-primary/10 text-primary'}`}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan || processing !== null}
                  className={`w-full py-3 rounded-full text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-default ${
                    isCurrentPlan
                      ? plan.popular ? 'bg-white/10 text-white/60' : 'bg-[#F5F0F7] text-[#8a7a92]'
                      : plan.popular
                      ? 'btn-gradient text-white shadow-[0_4px_16px_rgba(200,109,215,0.4)]'
                      : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  {isCurrentPlan
                    ? 'Plan actuel'
                    : processing === plan.id
                    ? 'Traitement…'
                    : hasNoPlan
                    ? `Choisir ${plan.name}`
                    : isUpgrade
                    ? `Passer au ${plan.name}`
                    : `Choisir ${plan.name}`}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
