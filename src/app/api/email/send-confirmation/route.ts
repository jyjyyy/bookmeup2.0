import { NextRequest, NextResponse } from 'next/server'

interface SendConfirmationEmailBody {
  email: string
  proName: string
  serviceName: string
  date: string
  time: string
}

export async function POST(req: NextRequest) {
  try {
    const body: SendConfirmationEmailBody = await req.json()

    // Validation des champs requis
    if (!body.email || !body.proName || !body.serviceName || !body.date || !body.time) {
      console.error('[EMAIL MOCK] Missing required fields:', body)
      return NextResponse.json(
        { error: 'Missing required fields: email, proName, serviceName, date, time' },
        { status: 400 }
      )
    }

    // Validation basique de l'email
    if (!body.email.includes('@')) {
      console.error('[EMAIL MOCK] Invalid email format:', body.email)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // MOCK: Logger au lieu d'envoyer un vrai email
    console.log('[EMAIL MOCK] Confirmation email would be sent:', {
      to: body.email,
      proName: body.proName,
      serviceName: body.serviceName,
      date: body.date,
      time: body.time,
      timestamp: new Date().toISOString(),
    })

    // Retourner une réponse de succès mockée
    return NextResponse.json({
      ok: true,
      mocked: true,
      message: 'Email mock sent successfully (no actual email was sent)',
    })
  } catch (error: any) {
    console.error('[EMAIL MOCK] Error processing email request:', error)
    return NextResponse.json(
      { error: 'Internal server error', mocked: true },
      { status: 500 }
    )
  }
}

