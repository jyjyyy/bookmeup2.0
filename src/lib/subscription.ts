import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebaseClient'

export interface SubscriptionStatus {
  hasActiveSubscription: boolean
  status?: string
  plan?: string
}

/**
 * Check if a professional user has an active subscription
 * Returns true if subscription status is 'active' or 'trialing'
 */
export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    // Check pros document for subscription status
    const proDoc = await getDoc(doc(db, 'pros', userId))
    
    if (!proDoc.exists()) {
      // No pros document means no subscription
      return { hasActiveSubscription: false }
    }

    const proData = proDoc.data()
    const subscriptionStatus = proData?.stripe_subscription_status || proData?.subscription_status || null
    
    // Consider subscription active if status is 'active' or 'trialing'
    const hasActiveSubscription = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'
    
    return {
      hasActiveSubscription,
      status: subscriptionStatus || undefined,
      plan: proData?.plan || undefined,
    }
  } catch (error) {
    console.error('[checkSubscriptionStatus] Error:', error)
    // On error, assume no subscription to be safe
    return { hasActiveSubscription: false }
  }
}

