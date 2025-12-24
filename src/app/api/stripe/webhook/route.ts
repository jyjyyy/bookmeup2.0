import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
})

// Get webhook secret from environment
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

/**
 * Verify Stripe webhook signature
 */
async function verifyWebhookSignature(
  request: NextRequest,
  body: string
): Promise<Stripe.Event | null> {
  if (!webhookSecret) {
    console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET')
    return null
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    console.error('[Stripe Webhook] Missing stripe-signature header')
    return null
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    return event
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message)
    return null
  }
}

/**
 * Handle checkout.session.completed event
 * Updates Firestore with subscription information
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    // Extract metadata
    const userId = session.metadata?.userId
    const plan = session.metadata?.plan

    if (!userId) {
      console.error('[Stripe Webhook] Missing userId in session metadata:', session.id)
      throw new Error('Missing userId in session metadata')
    }

    if (!plan || !['starter', 'pro', 'premium'].includes(plan)) {
      console.error('[Stripe Webhook] Missing or invalid plan in session metadata:', session.id)
      throw new Error('Missing or invalid plan in session metadata')
    }

    // Get subscription ID from session
    if (session.subscription && typeof session.subscription !== 'string') {
      console.error('[Stripe Webhook] Subscription is not a string:', session.id)
      throw new Error('Invalid subscription type')
    }

    const subscriptionId = session.subscription as string | null
    const customerId = session.customer as string | null

    if (!subscriptionId) {
      console.error('[Stripe Webhook] Missing subscription ID in session:', session.id)
      throw new Error('Missing subscription ID')
    }

    if (!customerId) {
      console.error('[Stripe Webhook] Missing customer ID in session:', session.id)
      throw new Error('Missing customer ID')
    }

    console.log('[Stripe Webhook] Processing checkout.session.completed:', {
      sessionId: session.id,
      userId,
      plan,
      subscriptionId,
      customerId,
    })

    // Get the pro document
    const proRef = adminDb.collection('pros').doc(userId)
    const proDoc = await proRef.get()

    if (!proDoc.exists) {
      console.error('[Stripe Webhook] Pro document not found:', userId)
      throw new Error(`Pro document not found for userId: ${userId}`)
    }

    const proData = proDoc.data()
    const currentStatus = proData?.subscription?.status || proData?.stripe_subscription_status

    // Idempotency check: Don't overwrite active subscriptions
    // Only update if the subscription is not already active or if it's a different subscription
    if (currentStatus === 'active') {
      const currentSubscriptionId = 
        proData?.subscription?.stripeSubscriptionId || 
        proData?.stripe_subscription_id

      // If this is the same subscription, skip update (already processed)
      if (currentSubscriptionId === subscriptionId) {
        console.log('[Stripe Webhook] Subscription already active, skipping update:', {
          userId,
          subscriptionId,
        })
        return { skipped: true, reason: 'Subscription already active' }
      }

      // If different subscription, log warning but continue (upgrade/downgrade scenario)
      console.warn('[Stripe Webhook] Updating active subscription with new one:', {
        userId,
        oldSubscriptionId: currentSubscriptionId,
        newSubscriptionId: subscriptionId,
      })
    }

    // Prepare update data
    // Use flat structure to match existing codebase pattern (checkSubscriptionStatus reads from these fields)
    const updateData: any = {
      plan: plan,
      stripe_subscription_status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_started_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    }

    // Update Firestore document
    await proRef.update(updateData)

    console.log('[Stripe Webhook] Successfully updated pro document:', {
      userId,
      plan,
      subscriptionId,
      customerId,
    })

    return { success: true, userId, plan, subscriptionId }
  } catch (error: any) {
    console.error('[Stripe Webhook] Error handling checkout.session.completed:', error)
    throw error
  }
}

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body as text for signature verification
    const body = await request.text()

    // Verify webhook signature
    const event = await verifyWebhookSignature(request, body)
    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('[Stripe Webhook] Received event:', event.type, event.id)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only process subscription checkouts
        if (session.mode === 'subscription') {
          await handleCheckoutSessionCompleted(session)
        } else {
          console.log('[Stripe Webhook] Ignoring non-subscription checkout session:', session.id)
        }

        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription updates/deletions if needed in the future
        console.log(`[Stripe Webhook] Event ${event.type} received but not handled yet`)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing webhook:', error)

    // Return 200 to Stripe to prevent retries for non-recoverable errors
    // But log the error for investigation
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 200 } // Stripe expects 200, even on error
    )
  }
}

// Disable body parsing for webhook to access raw body
export const runtime = 'nodejs'
