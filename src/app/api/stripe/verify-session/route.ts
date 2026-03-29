import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(stripeSecretKey, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2024-11-20.acacia' as any,
})

/**
 * POST /api/stripe/verify-session
 *
 * Called when the user returns from Stripe checkout with a session_id.
 * Verifies the session is paid, then updates Firestore with the plan.
 * This is a fallback in case the webhook hasn't fired yet.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    let decodedClaims
    try {
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    } catch {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const userId = decodedClaims.uid

    // Parse body
    const body = await request.json()
    const checkoutSessionId = body.session_id

    if (!checkoutSessionId || typeof checkoutSessionId !== 'string') {
      return NextResponse.json({ error: 'session_id manquant' }, { status: 400 })
    }

    // Retrieve the Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
      expand: ['subscription'],
    })

    // Verify the session belongs to this user
    if (checkoutSession.metadata?.userId !== userId && checkoutSession.client_reference_id !== userId) {
      console.error('[verify-session] User mismatch:', {
        sessionUserId: checkoutSession.metadata?.userId,
        clientRefId: checkoutSession.client_reference_id,
        requestUserId: userId,
      })
      return NextResponse.json({ error: 'Session non autorisée' }, { status: 403 })
    }

    // Check payment status
    if (checkoutSession.payment_status !== 'paid') {
      console.log('[verify-session] Payment not completed:', checkoutSession.payment_status)
      return NextResponse.json({
        verified: false,
        reason: 'Paiement non complété',
        payment_status: checkoutSession.payment_status,
      })
    }

    // Extract plan and subscription info
    const plan = checkoutSession.metadata?.plan
    if (!plan || !['starter', 'pro', 'premium'].includes(plan)) {
      return NextResponse.json({ error: 'Plan invalide dans la session' }, { status: 400 })
    }

    const subscriptionId = typeof checkoutSession.subscription === 'string'
      ? checkoutSession.subscription
      : (checkoutSession.subscription as Stripe.Subscription)?.id || null

    const customerId = typeof checkoutSession.customer === 'string'
      ? checkoutSession.customer
      : null

    // Check if already updated (idempotency)
    const proRef = adminDb.collection('pros').doc(userId)
    const proDoc = await proRef.get()

    if (!proDoc.exists) {
      return NextResponse.json({ error: 'Profil pro introuvable' }, { status: 404 })
    }

    const proData = proDoc.data()
    const currentStatus = proData?.stripe_subscription_status
    const currentSubId = proData?.stripe_subscription_id

    // If already active with same subscription, no need to update
    if (currentStatus === 'active' && currentSubId === subscriptionId) {
      console.log('[verify-session] Already up to date:', { userId, plan })
      return NextResponse.json({
        verified: true,
        plan,
        alreadyActive: true,
      })
    }

    // Update Firestore with subscription info
    await proRef.update({
      plan: plan,
      stripe_subscription_status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_started_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    })

    console.log('[verify-session] Plan updated successfully:', {
      userId,
      plan,
      subscriptionId,
    })

    return NextResponse.json({
      verified: true,
      plan,
      alreadyActive: false,
    })
  } catch (error: any) {
    console.error('[verify-session] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur de vérification' },
      { status: 500 }
    )
  }
}
