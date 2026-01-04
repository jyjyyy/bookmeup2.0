import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { adminDb } from '@/lib/firebaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pro_id,
      service_id,
      date,
      start_time,
      duration,
      client_name,
      client_email,
      client_phone,
    } = body

    // Validation
    if (!pro_id || !service_id || !date || !start_time || !duration || !client_name || !client_email) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    // Vérifier si le client est bloqué
    const clientEmail = client_email.trim().toLowerCase()
    const profilesSnapshot = await adminDb
      .collection('profiles')
      .where('email', '==', clientEmail)
      .where('role', '==', 'client')
      .get()

    // Si un profil client existe avec cet email, vérifier isBlocked
    if (!profilesSnapshot.empty) {
      for (const profileDoc of profilesSnapshot.docs) {
        const profileData = profileDoc.data()
        // Traiter les utilisateurs existants sans isBlocked comme non bloqués (default false)
        const isBlocked = profileData.isBlocked === true
        
        if (isBlocked) {
          return NextResponse.json(
            { error: 'Votre compte est temporairement bloqué suite à plusieurs annulations ou absences.' },
            { status: 403 }
          )
        }
      }
    }

    // Charger le service pour vérifier qu'il existe
    const serviceDoc = await getDoc(doc(db, 'services', service_id))
    if (!serviceDoc.exists()) {
      return NextResponse.json(
        { error: 'Service non trouvé' },
        { status: 404 }
      )
    }

    // Calculer l'heure de fin
    const [startHour, startMin] = start_time.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = startMinutes + duration
    const endHour = Math.floor(endMinutes / 60)
    const endMin = endMinutes % 60
    const end_time = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`

    // Créer la réservation (automatiquement confirmée)
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      pro_id,
      service_id,
      date,
      start_time,
      end_time,
      duration,
      client_name: client_name.trim(),
      client_email: client_email.trim(),
      client_phone: client_phone?.trim() || null,
      status: 'confirmed',
      created_at: serverTimestamp(),
    })

    return NextResponse.json({
      bookingId: bookingRef.id,
      message: 'Réservation créée avec succès',
    })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la réservation' },
      { status: 500 }
    )
  }
}
