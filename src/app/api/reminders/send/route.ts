import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import { sendEmail } from '@/lib/emails/sendEmail'
import { bookingReminderEmail } from '@/lib/emails/templates/bookingReminder'

/**
 * Helper function to get booking start date/time as Date object
 */
function getBookingStartDateTime(date: string, startTime: string): Date | null {
  try {
    const [hours, minutes] = startTime.split(':').map(Number)
    const [year, month, day] = date.split('-').map(Number)
    const bookingDateTime = new Date(year, month - 1, day, hours, minutes)
    
    if (isNaN(bookingDateTime.getTime())) {
      return null
    }
    
    return bookingDateTime
  } catch {
    return null
  }
}

/**
 * Check if booking is within time window for reminder
 * @param bookingDateTime - Booking start date/time
 * @param reminderHours - Hours before booking (24 or 2)
 * @param windowMinutes - Time window in minutes (default: 10 minutes)
 */
function isWithinReminderWindow(
  bookingDateTime: Date,
  reminderHours: number,
  windowMinutes: number = 10
): boolean {
  const now = new Date()
  const reminderTime = new Date(bookingDateTime)
  reminderTime.setHours(reminderTime.getHours() - reminderHours)
  
  const windowStart = new Date(reminderTime)
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes / 2)
  
  const windowEnd = new Date(reminderTime)
  windowEnd.setMinutes(windowEnd.getMinutes() + windowMinutes / 2)
  
  return now >= windowStart && now <= windowEnd
}

/**
 * Format date for email display
 */
function formatDateForEmail(date: string): string {
  try {
    const dateObj = new Date(date + 'T00:00:00')
    return dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

/**
 * API Route for sending booking reminders
 * This should be called by a cron job every 5-10 minutes
 * 
 * Security: Should be protected by a secret token or Vercel Cron
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const results = {
      reminders24hSent: 0,
      reminders2hSent: 0,
      reminders24hSmsSkipped: 0, // Track SMS reminders that were skipped (not implemented yet)
      reminders2hSmsSkipped: 0,
      errors: [] as string[],
    }

    // Query all confirmed bookings
    // Note: Firestore 'in' queries are limited to 10 values, so we use 'confirmed' only
    // 'pending' bookings are also included by checking status !== 'cancelled'
    const bookingsSnapshot = await adminDb
      .collection('bookings')
      .where('status', '==', 'confirmed')
      .get()
    
    // Also get pending bookings (if any)
    const pendingBookingsSnapshot = await adminDb
      .collection('bookings')
      .where('status', '==', 'pending')
      .get()
    
    // Combine both snapshots
    const allBookings = [...bookingsSnapshot.docs, ...pendingBookingsSnapshot.docs]

    console.log(`[Reminders] Found ${allBookings.length} confirmed/pending bookings`)

    // Process each booking
    for (const bookingDoc of allBookings) {
      try {
        const bookingData = bookingDoc.data()
        const bookingId = bookingDoc.id

        // Skip if booking is cancelled
        if (bookingData.status === 'cancelled' || bookingData.status === 'cancelled_by_client') {
          continue
        }

        // Get booking date/time
        const bookingDateTime = getBookingStartDateTime(bookingData.date, bookingData.start_time)
        if (!bookingDateTime) {
          console.warn(`[Reminders] Invalid date/time for booking ${bookingId}`)
          continue
        }

        // Skip if booking is in the past
        if (bookingDateTime <= now) {
          continue
        }

        // Get professional settings
        const proId = bookingData.pro_id
        if (!proId) {
          continue
        }

        const proDoc = await adminDb.collection('pros').doc(proId).get()
        if (!proDoc.exists()) {
          continue
        }

        const proData = proDoc.data()
        const notificationSettings = proData?.notificationSettings || {}
        const reminderChannel = notificationSettings?.reminderChannel || 'email'

        // Skip if reminderChannel is neither 'email' nor 'sms'
        if (reminderChannel !== 'email' && reminderChannel !== 'sms') {
          console.log(`[Reminders] Skipping booking ${bookingId} - invalid reminderChannel: ${reminderChannel}`)
          continue
        }

        // Get professional name
        let proName = 'Votre professionnel'
        try {
          const proProfileDoc = await adminDb.collection('profiles').doc(proId).get()
          if (proProfileDoc.exists()) {
            const proProfileData = proProfileDoc.data()
            proName = proProfileData?.name || proProfileData?.business_name || proName
          }
          if (!proName || proName === 'Votre professionnel') {
            const prosData = proDoc.data()
            proName = prosData?.business_name || proName
          }
        } catch (error) {
          console.error(`[Reminders] Error fetching pro name for ${proId}:`, error)
        }

        // Get service name
        const serviceId = bookingData.service_id
        let serviceName = 'Service'
        if (serviceId) {
          try {
            const serviceDoc = await adminDb.collection('services').doc(serviceId).get()
            if (serviceDoc.exists()) {
              serviceName = serviceDoc.data()?.name || serviceName
            }
          } catch (error) {
            console.error(`[Reminders] Error fetching service name for ${serviceId}:`, error)
          }
        }

        // Check and send 24h reminder
        if (!bookingData.reminder24hSent && isWithinReminderWindow(bookingDateTime, 24, 10)) {
          try {
            if (reminderChannel === 'email') {
              // Send email reminder
              const formattedDate = formatDateForEmail(bookingData.date)
              const emailData = bookingReminderEmail({
                clientName: bookingData.client_name || 'Client',
                proName,
                serviceName,
                date: formattedDate,
                time: bookingData.start_time,
                duration: bookingData.duration,
                hoursUntil: 24,
              })

              const emailSent = await sendEmail(
                bookingData.client_email,
                emailData.subject,
                emailData.html
              )

              if (emailSent) {
                // Mark 24h reminder as sent
                await adminDb.collection('bookings').doc(bookingId).update({
                  reminder24hSent: true,
                  reminder24hSentAt: FieldValue.serverTimestamp(),
                })
                results.reminders24hSent++
                console.log(`[Reminders] 24h email reminder sent for booking ${bookingId}`)
              } else {
                results.errors.push(`Failed to send 24h email reminder for booking ${bookingId}`)
              }
            } else if (reminderChannel === 'sms') {
              // TODO: Implement SMS reminder sending
              // - Use Twilio or another SMS provider
              // - Format SMS message with booking details
              // - Send to bookingData.client_phone
              // - Handle errors and retries
              // - Mark reminder as sent only after successful delivery
              
              // Placeholder: Skip SMS sending for now
              console.log(`[Reminders] 24h SMS reminder skipped (not implemented yet) for booking ${bookingId}`)
              results.reminders24hSmsSkipped++
              
              // TODO: Uncomment when SMS sending is implemented:
              // const smsSent = await sendSMSReminder({
              //   phoneNumber: bookingData.client_phone,
              //   clientName: bookingData.client_name || 'Client',
              //   proName,
              //   serviceName,
              //   date: bookingData.date,
              //   time: bookingData.start_time,
              //   hoursUntil: 24,
              // })
              // 
              // if (smsSent) {
              //   await adminDb.collection('bookings').doc(bookingId).update({
              //     reminder24hSent: true,
              //     reminder24hSentAt: FieldValue.serverTimestamp(),
              //   })
              //   results.reminders24hSent++
              //   console.log(`[Reminders] 24h SMS reminder sent for booking ${bookingId}`)
              // } else {
              //   results.errors.push(`Failed to send 24h SMS reminder for booking ${bookingId}`)
              // }
            }
          } catch (error: any) {
            console.error(`[Reminders] Error sending 24h reminder for booking ${bookingId}:`, error)
            results.errors.push(`Error sending 24h reminder for booking ${bookingId}: ${error.message}`)
          }
        }

        // Check and send 2h reminder
        if (!bookingData.reminder2hSent && isWithinReminderWindow(bookingDateTime, 2, 10)) {
          try {
            if (reminderChannel === 'email') {
              // Send email reminder
              const formattedDate = formatDateForEmail(bookingData.date)
              const emailData = bookingReminderEmail({
                clientName: bookingData.client_name || 'Client',
                proName,
                serviceName,
                date: formattedDate,
                time: bookingData.start_time,
                duration: bookingData.duration,
                hoursUntil: 2,
              })

              const emailSent = await sendEmail(
                bookingData.client_email,
                emailData.subject,
                emailData.html
              )

              if (emailSent) {
                // Mark 2h reminder as sent
                await adminDb.collection('bookings').doc(bookingId).update({
                  reminder2hSent: true,
                  reminder2hSentAt: FieldValue.serverTimestamp(),
                })
                results.reminders2hSent++
                console.log(`[Reminders] 2h email reminder sent for booking ${bookingId}`)
              } else {
                results.errors.push(`Failed to send 2h email reminder for booking ${bookingId}`)
              }
            } else if (reminderChannel === 'sms') {
              // TODO: Implement SMS reminder sending
              // - Use Twilio or another SMS provider
              // - Format SMS message with booking details
              // - Send to bookingData.client_phone
              // - Handle errors and retries
              // - Mark reminder as sent only after successful delivery
              
              // Placeholder: Skip SMS sending for now
              console.log(`[Reminders] 2h SMS reminder skipped (not implemented yet) for booking ${bookingId}`)
              results.reminders2hSmsSkipped++
              
              // TODO: Uncomment when SMS sending is implemented:
              // const smsSent = await sendSMSReminder({
              //   phoneNumber: bookingData.client_phone,
              //   clientName: bookingData.client_name || 'Client',
              //   proName,
              //   serviceName,
              //   date: bookingData.date,
              //   time: bookingData.start_time,
              //   hoursUntil: 2,
              // })
              // 
              // if (smsSent) {
              //   await adminDb.collection('bookings').doc(bookingId).update({
              //     reminder2hSent: true,
              //     reminder2hSentAt: FieldValue.serverTimestamp(),
              //   })
              //   results.reminders2hSent++
              //   console.log(`[Reminders] 2h SMS reminder sent for booking ${bookingId}`)
              // } else {
              //   results.errors.push(`Failed to send 2h SMS reminder for booking ${bookingId}`)
              // }
            }
          } catch (error: any) {
            console.error(`[Reminders] Error sending 2h reminder for booking ${bookingId}:`, error)
            results.errors.push(`Error sending 2h reminder for booking ${bookingId}: ${error.message}`)
          }
        }
      } catch (error: any) {
        console.error(`[Reminders] Error processing booking ${bookingDoc.id}:`, error)
        results.errors.push(`Error processing booking ${bookingDoc.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Reminders processed',
      results,
    })
  } catch (error: any) {
    console.error('[Reminders] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error processing reminders' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for manual testing (optional)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Reminder service is running',
    endpoint: 'POST /api/reminders/send',
    note: 'This endpoint should be called by a cron job every 5-10 minutes',
  })
}

