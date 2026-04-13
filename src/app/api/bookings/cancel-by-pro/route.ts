import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { sendCancellationEmail } from '@/lib/email'
import { deleteCalendarEvent } from '@/lib/googleCalendar'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, proId } = body

    // Validation
    if (!bookingId || !proId) {
      return NextResponse.json(
        { error: 'bookingId et proId sont requis' },
        { status: 400 }
      )
    }

    // Charger la réservation
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      )
    }

    const bookingData = bookingDoc.data()

    // Vérifier que le booking appartient bien à ce pro
    const bookingProId = bookingData?.proId ?? bookingData?.pro_id
    if (bookingProId !== proId) {
      return NextResponse.json(
        { error: 'Non autorisé — ce rendez-vous ne vous appartient pas' },
        { status: 403 }
      )
    }

    // Vérifier que la réservation n'est pas déjà annulée
    if (
      bookingData?.status === 'cancelled' ||
      bookingData?.status === 'cancelled_by_client' ||
      bookingData?.status === 'cancelled_by_pro'
    ) {
      return NextResponse.json(
        { error: 'Cette réservation est déjà annulée' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut
    await adminDb.collection('bookings').doc(bookingId).update({
      status: 'cancelled_by_pro',
      cancelled_at: FieldValue.serverTimestamp(),
      cancelled_by: proId,
    })

    // Créer une notification pour le pro (confirmation)
    try {
      await adminDb.collection('notifications').add({
        proId: proId,
        userId: proId,
        type: 'booking_cancelled',
        title: 'Rendez-vous annulé',
        message: `Le rendez-vous de ${bookingData?.client_name || 'un client'} (${bookingData?.serviceName || 'service'}) a été annulé.`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      })
    } catch (notifError) {
      console.error('[Cancel by Pro] Notification error (non-blocking):', notifError)
    }

    // Supprimer l'événement Google Calendar si existant
    if (bookingData?.googleEventId) {
      try {
        await deleteCalendarEvent(proId, bookingData.googleEventId)
        console.log(`[Cancel by Pro] Google Calendar event deleted: ${bookingData.googleEventId}`)
      } catch (gcalError) {
        console.error('[Cancel by Pro] Google Calendar delete error (non-blocking):', gcalError)
      }
    }

    // Envoyer un email d'annulation au client
    try {
      const proProfile = await adminDb.collection('profiles').doc(proId).get()
      const proName = proProfile.exists ? (proProfile.data()?.displayName || proProfile.data()?.name || 'Votre professionnel') : 'Votre professionnel'

      await sendCancellationEmail({
        email: bookingData?.client_email || '',
        proName,
        serviceName: bookingData?.serviceName || 'Service',
        date: bookingData?.date || '',
        time: bookingData?.start_time || '',
        clientName: bookingData?.client_name,
        cancelledBy: 'pro',
      })
    } catch (emailError) {
      console.error('[Cancel by Pro] Email error (non-blocking):', emailError)
    }

    return NextResponse.json({
      ok: true,
      message: 'Rendez-vous annulé avec succès',
    })
  } catch (error: any) {
    console.error('[Cancel by Pro] Error:', error)
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'annulation" },
      { status: 500 }
    )
  }
}
