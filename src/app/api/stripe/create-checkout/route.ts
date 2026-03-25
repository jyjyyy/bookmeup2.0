import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(stripeSecretKey, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2024-11-20.acacia' as any,
})

// Map plans to Stripe Price IDs
// These should be set as environment variables or configured in Stripe
const PLAN_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER || '',
  pro: process.env.STRIPE_PRICE_ID_PRO || '',
  premium: process.env.STRIPE_PRICE_ID_PREMIUM || '',
}

type PlanType = 'starter' | 'pro' | 'premium'

/**
 * Get authenticated user from session cookie
 */
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value

    if (!sessionCookie) {
      return null
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decodedClaims
  } catch (error) {
    console.error('[Stripe Checkout] Error verifying session:', error)
    return null
  }
}

/**
 * POST /api/stripe/create-checkout
 * Creates a Stripe Checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      )
    }

    // Get user profile to verify role
    const profileDoc = await adminDb.collection('profiles').doc(user.uid).get()
    if (!profileDoc.exists) {
      return NextResponse.json(
        { error: 'Profil utilisateur introuvable.' },
        { status: 404 }
      )
    }

    const profileData = profileDoc.data()
    if (profileData?.role !== 'pro') {
      return NextResponse.json(
        { error: 'Accès réservé aux professionnels.' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const planType = (body.type || body.plan) as PlanType // Support both "type" and "plan" for compatibility

    // Validate plan type
    if (!planType || !['starter', 'pro', 'premium'].includes(planType)) {
      return NextResponse.json(
        { error: 'Plan invalide. Les plans valides sont: starter, pro, premium' },
        { status: 400 }
      )
    }

    // Debug (safe): confirm env vars presence + received plan (do NOT log secrets)
    const envPresent = {
      hasStarter: Boolean(process.env.STRIPE_PRICE_ID_STARTER),
      hasPro: Boolean(process.env.STRIPE_PRICE_ID_PRO),
      hasPremium: Boolean(process.env.STRIPE_PRICE_ID_PREMIUM),
    }
    console.log('[create-checkout] env present:', envPresent)
    console.log('[create-checkout] received plan:', planType)

    // Get Stripe Price ID for the plan
    const priceId = PLAN_PRICE_IDS[planType]
    if (!priceId) {
      console.error(`[Stripe Checkout] Missing price ID for plan: ${planType}`)
      return NextResponse.json(
        {
          error: `Configuration manquante pour le plan ${planType}. Contactez le support.`,
          plan: planType,
          ...envPresent,
        },
        { status: 500 }
      )
    }

    // Build success and cancel URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const successUrl = `${origin}/dashboard/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/dashboard/settings/subscription?canceled=true`

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.uid, // Store user ID for webhook
      metadata: {
        userId: user.uid,
        plan: planType,
      },
    })

    console.log(`[Stripe Checkout] Session created for user ${user.uid}, plan: ${planType}, session: ${session.id}`)

    // Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error('[Stripe Checkout] Error creating checkout session:', error)

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Erreur Stripe: ' + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}

