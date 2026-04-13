import { NextRequest, NextResponse } from 'next/server'
import { sendConfirmationEmail } from '@/lib/email'

/**
 * POST /api/email/send-confirmation
 * Envoie un email de confirmation de réservation via Resend (ou mock si pas de clé API).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, proName, serviceName, date, time, duration, price, clientName } = body

    // Validation des champs requis
    if (!email || !proName || !serviceName || !date || !time) {
      return NextResponse.json(
        { error: 'Champs requis manquants : email, proName, serviceName, date, time' },
        { status: 400 }
      )
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    const sent = await sendConfirmationEmail({
      email,
      proName,
      serviceName,
      date,
      time,
      duration,
      price,
      clientName,
    })

    return NextResponse.json({
      ok: sent,
      message: sent ? 'Email envoyé avec succès' : 'Échec de l\'envoi',
    })
  } catch (error: any) {
    console.error('[Email Send Confirmation] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
