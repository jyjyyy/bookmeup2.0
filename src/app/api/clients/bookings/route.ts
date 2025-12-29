import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification client
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')?.value || null
    
    let clientEmail: string | null = null

    // Si session cookie existe, vérifier l'authentification
    if (sessionCookie) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie)
        const userDoc = await adminDb.collection('profiles').doc(decoded.uid).get()
        
        if (userDoc.exists) {
          const userData = userDoc.data()
          // Vérifier que c'est un client
          if (userData?.role === 'client') {
            clientEmail = userData.email || decoded.email || null
          }
        }
      } catch (e) {
        console.error('[Client Bookings] Session error:', e)
        // Continue sans authentification, on utilisera l'email du paramètre
      }
    }

    // Si pas d'email depuis la session, essayer depuis les query params
    if (!clientEmail) {
      const { searchParams } = new URL(request.url)
      clientEmail = searchParams.get('email')
    }

    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Email client requis. Veuillez vous connecter.' },
        { status: 401 }
      )
    }

    // Normaliser l'email
    const normalizedEmail = clientEmail.trim().toLowerCase()

    // Récupérer TOUS les bookings du client (no date or status filtering)
    // Note: On trie par date seulement pour éviter les problèmes d'index composite
    const bookingsSnapshot = await adminDb
      .collection('bookings')
      .where('client_email', '==', normalizedEmail)
      .orderBy('date', 'desc')
      .get()

    const bookings = []

    for (const bookingDoc of bookingsSnapshot.docs) {
      const bookingData = bookingDoc.data()
      
      // Récupérer les informations du service
      let serviceName = 'Service'
      let servicePrice: number | undefined = undefined
      
      try {
        const serviceDoc = await adminDb.collection('services').doc(bookingData.service_id).get()
        if (serviceDoc.exists) {
          const serviceData = serviceDoc.data()
          serviceName = serviceData?.name || 'Service'
          servicePrice = serviceData?.price || undefined
        }
      } catch (error) {
        console.error('[Client Bookings] Error fetching service:', error)
      }

      // Récupérer les informations du professionnel
      let proName = 'Professionnel'
      
      try {
        // Essayer de récupérer depuis profiles
        const proProfileDoc = await adminDb.collection('profiles').doc(bookingData.pro_id).get()
        if (proProfileDoc.exists) {
          const proProfileData = proProfileDoc.data()
          proName = proProfileData?.name || proName
        }

        // Essayer de récupérer depuis pros pour business_name
        const prosDoc = await adminDb.collection('pros').doc(bookingData.pro_id).get()
        if (prosDoc.exists) {
          const prosData = prosDoc.data()
          if (prosData?.business_name) {
            proName = prosData.business_name
          }
        }
      } catch (error) {
        console.error('[Client Bookings] Error fetching pro:', error)
      }

      // Return ALL bookings without date or status filtering
      // isPast will be calculated on frontend
      bookings.push({
        id: bookingDoc.id,
        date: bookingData.date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        serviceName,
        servicePrice,
        proName,
        status: bookingData.status || 'confirmed',
        isPast: false, // Will be recalculated on frontend
        duration: bookingData.duration || null,
      })
    }

    // Trier par date puis par heure (tri côté client pour éviter les problèmes d'index)
    bookings.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.start_time)
      const dateB = new Date(b.date + 'T' + b.start_time)
      return dateB.getTime() - dateA.getTime() // Plus récent en premier
    })

    return NextResponse.json({
      bookings,
    })
  } catch (error: any) {
    console.error('[Client Bookings] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des rendez-vous' },
      { status: 500 }
    )
  }
}

