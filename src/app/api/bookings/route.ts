import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { adminDb } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emails/sendEmail'
import { bookingConfirmedEmail } from '@/lib/emails/templates/bookingConfirmed'
import { bookingNotificationProEmail } from '@/lib/emails/templates/bookingNotificationPro'

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

    // Charger le service pour vérifier qu'il existe et récupérer ses données
    const serviceDoc = await getDoc(doc(db, 'services', service_id))
    if (!serviceDoc.exists()) {
      return NextResponse.json(
        { error: 'Service non trouvé' },
        { status: 404 }
      )
    }
    const serviceData = serviceDoc.data()

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

    // Envoyer les emails après création réussie (ne bloque pas en cas d'erreur)
    // Les emails sont envoyés uniquement pour les bookings confirmés
    const bookingStatus = 'confirmed'
    if (bookingStatus === 'confirmed') {
      // Récupérer les données du pro pour les emails
      let proEmail: string | null = null
      let proName: string = 'Professionnel'
      
      try {
        // Essayer de récupérer depuis profiles
        const proProfileDoc = await adminDb.collection('profiles').doc(pro_id).get()
        if (proProfileDoc.exists()) {
          const proProfileData = proProfileDoc.data()
          proEmail = proProfileData?.email || null
          proName = proProfileData?.name || proProfileData?.business_name || proName
        }

        // Essayer de récupérer depuis pros pour business_name
        const prosDoc = await adminDb.collection('pros').doc(pro_id).get()
        if (prosDoc.exists()) {
          const prosData = prosDoc.data()
          if (prosData?.business_name) {
            proName = prosData.business_name
          }
          // Si pas d'email dans profile, essayer pros (peu probable mais possible)
          if (!proEmail && prosData?.email) {
            proEmail = prosData.email
          }
        }
      } catch (error) {
        console.error('[BOOKING] Error fetching pro data for emails:', error)
      }

      // Formater la date pour l'email client
      let formattedDate = date
      try {
        const dateObj = new Date(date + 'T00:00:00')
        formattedDate = dateObj.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      } catch (error) {
        console.error('[BOOKING] Error formatting date:', error)
        // Garder la date originale si le formatage échoue
      }

      // Construire l'URL de booking (approximative, à ajuster selon votre structure)
      const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://bookmeup.com'}/confirm?bookingId=${bookingRef.id}`

      // Envoyer email de confirmation au client
      try {
        const clientEmailData = bookingConfirmedEmail({
          clientName: client_name.trim(),
          proName,
          serviceName: serviceData.name || 'Service',
          date: formattedDate,
          time: start_time,
          duration: duration,
          price: serviceData.price || undefined,
          location: undefined, // À ajouter si disponible
          bookingUrl,
        })

        await sendEmail(
          client_email.trim(),
          clientEmailData.subject,
          clientEmailData.html
        )
      } catch (error) {
        console.error('[BOOKING] Error sending confirmation email to client:', error)
        // Ne pas bloquer la création de booking
      }

      // Envoyer email de notification au pro (si email disponible)
      if (proEmail) {
        try {
          const proEmailData = bookingNotificationProEmail({
            clientName: client_name.trim(),
            clientEmail: client_email.trim(),
            serviceName: serviceData.name || 'Service',
            date: formattedDate,
            time: start_time,
          })

          await sendEmail(
            proEmail,
            proEmailData.subject,
            proEmailData.html
          )
        } catch (error) {
          console.error('[BOOKING] Error sending notification email to pro:', error)
          // Ne pas bloquer la création de booking
        }
      } else {
        console.warn('[BOOKING] Pro email not found, skipping pro notification email')
      }
    }

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
