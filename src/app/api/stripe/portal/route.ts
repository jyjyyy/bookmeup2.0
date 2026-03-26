import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(stripeSecretKey, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2024-11-20.acacia' as any,
})

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) return null
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decodedClaims
  } catch {
    return null
  }
}

/**
 * GET /api/stripe/portal
 * Creates a Stripe Customer Portal session for managing an active subscription
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      )
    }

    // Get Stripe customer ID from Firestore
    const proDoc = await adminDb.collection('pros').doc(user.uid).get()
    if (!proDoc.exists) {
      return NextResponse.json(
        { error: 'Profil professionnel introuvable.' },
        { status: 404 }
      )
    }

    const proData = proDoc.data()
    const customerId = proData?.stripe_customer_id

    if (!customerId) {
      return NextResponse.json(
        { error: 'Aucun abonnement Stripe trouvé. Veuillez souscrire à un plan.' },
        { status: 400 }
      )
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const returnUrl = `${origin}/dashboard/settings/subscription`

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    console.log(`[Stripe Portal] Session created for user ${user.uid}`)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('[Stripe Portal] Error:', error)

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Erreur Stripe: ' + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'accès au portail de gestion.' },
      { status: 500 }
    )
  }
}
