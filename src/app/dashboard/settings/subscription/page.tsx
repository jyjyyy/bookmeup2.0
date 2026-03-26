'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Abonnement</h1>
        <p className="text-sm text-[#7A6B80] mb-3">
          Gérez votre abonnement et choisissez le plan qui vous convient
        </p>
        <div className="bg-secondary border border-primary/20 rounded-[16px] p-4">
          <p className="text-sm text-[#2A1F2D] font-medium">
            ⚠️ Un abonnement est obligatoire pour accéder à l'espace professionnel.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[16px] text-sm">
          {error}
        </div>
      )}

      {/* Current Plan Card */}
      {currentPlan && (
        <div className="bg-white rounded-[20px] border border-[#EDE8F0] shadow-bookmeup-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#7A6B80] uppercase tracking-wide mb-2">Abonnement actuel</p>
              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getPlanBadgeColor(currentPlan)}`}>
                  {PLANS.find((p) => p.id === currentPlan)?.name || currentPlan}
                </span>
                <span className="text-[#7A6B80] text-sm">
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
                className="rounded-[12px] text-sm font-semibold border-[#EDE8F0] hover:border-primary hover:text-primary"
              >
                {processing === 'manage' ? 'Chargement…' : 'Gérer mon abonnement'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan, index) => {
          const isCurrentPlan = currentPlan === plan.id
          const isUpgrade = (currentPlan === 'starter' && (plan.id === 'pro' || plan.id === 'premium')) ||
            (currentPlan === 'pro' && plan.id === 'premium')

          return (
            <motion.div
              key={plan.id}
              suppressHydrationWarning
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className={`rounded-[20px] p-5 relative border ${
                plan.popular
                  ? 'bg-[#2A1F2D] border-transparent shadow-[0_8px_30px_rgba(0,0,0,0.2)]'
                  : 'bg-white border-[#EDE8F0] shadow-bookmeup-sm'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="btn-gradient text-white px-3 py-1 rounded-full text-xs font-bold shadow-bookmeup-sm">
                      Populaire ✨
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${plan.popular ? 'text-primary' : 'text-[#7A6B80]'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-extrabold ${plan.popular ? 'text-white' : 'text-[#2A1F2D]'}`}>
                      {plan.price} €
                    </span>
                    {plan.priceMonthly && (
                      <span className={`text-xs ${plan.popular ? 'text-white/50' : 'text-[#7A6B80]'}`}>
                        {plan.priceMonthly}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={`flex items-start gap-2 text-xs ${plan.popular ? 'text-white/80' : 'text-[#7A6B80]'}`}>
                      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${plan.popular ? 'bg-primary/30 text-white' : 'bg-secondary text-primary'}`}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (plan.id === 'pro' || plan.id === 'premium') handleUpgrade(plan.id)
                  }}
                  disabled={
                    isCurrentPlan ||
                    processing !== null ||
                    (plan.id === 'starter' && currentPlan !== 'starter')
                  }
                  className={`w-full py-2.5 rounded-[12px] text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-default ${
                    isCurrentPlan
                      ? plan.popular ? 'bg-white/10 text-white/60' : 'bg-secondary text-[#7A6B80]'
                      : plan.popular
                      ? 'btn-gradient text-white'
                      : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  {isCurrentPlan
                    ? 'Plan actuel'
                    : processing === plan.id
                    ? 'Traitement…'
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
