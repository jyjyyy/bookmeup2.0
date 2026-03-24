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
      pricing, // Optional: { label, price, duration }
    } = body

    // Validation
    if (!pro_id || !service_id || !date || !start_time || !duration || !client_name || !client_email) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    // Validate pricing object if provided
    if (pricing !== undefined && pricing !== null) {
      if (
        typeof pricing !== 'object' ||
        typeof pricing.label !== 'string' ||
        typeof pricing.price !== 'number' ||
        typeof pricing.duration !== 'number'
      ) {
        return NextResponse.json(
          { error: 'pricing object must have: { label: string, price: number, duration: number }' },
          { status: 400 }
        )
      }
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

    // Charger le service pour vérifier qu'il existe et obtenir les données à snapshot
    const serviceDoc = await getDoc(doc(db, 'services', service_id))
    if (!serviceDoc.exists()) {
      return NextResponse.json(
        { error: 'Service non trouvé' },
        { status: 404 }
      )
    }

    const serviceData = serviceDoc.data()
    
    // Extraire les informations du service
    const serviceName = serviceData?.name || 'Service'
    
    // Determine pricing snapshot: use provided pricing object, or create from service data
    let pricingSnapshot: { label: string; price: number; duration: number }
    
    if (pricing && typeof pricing === 'object') {
      // Use provided pricing object (for services with multiple pricing options)
      pricingSnapshot = {
        label: pricing.label,
        price: pricing.price,
        duration: pricing.duration,
      }
    } else {
      // Fallback: create pricing snapshot from service data (backward compatibility)
      const servicePrice = typeof serviceData?.price === 'number' ? serviceData.price : 0
      const serviceDuration = typeof serviceData?.duration === 'number' ? serviceData.duration : duration
      pricingSnapshot = {
        label: serviceName,
        price: servicePrice,
        duration: serviceDuration,
      }
    }

    // Use pricing duration for end time calculation
    const bookingDuration = pricingSnapshot.duration

    // Calculer l'heure de fin
    const [startHour, startMin] = start_time.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = startMinutes + bookingDuration
    const endHour = Math.floor(endMinutes / 60)
    const endMin = endMinutes % 60
    const end_time = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`

    // Créer la réservation (automatiquement confirmée)
    // IMPORTANT: pricing, serviceId, serviceName sont des snapshots immuables
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      pro_id,
      service_id, // Store as serviceId (keeping pro_id for backward compatibility)
      serviceId: service_id, // Also store as serviceId for clarity
      serviceName: serviceName,
      date,
      start_time,
      end_time,
      duration: bookingDuration,
      // Snapshot du pricing au moment de la création (immutable)
      pricing: {
        label: pricingSnapshot.label,
        price: pricingSnapshot.price,
        duration: pricingSnapshot.duration,
      },
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
