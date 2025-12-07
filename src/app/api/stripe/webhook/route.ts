import { NextRequest, NextResponse } from 'next/server'

// TODO: implement Stripe webhook handler
export async function POST(request: NextRequest) {
  // TODO: handle Stripe webhook events
  return NextResponse.json({ received: true })
}

