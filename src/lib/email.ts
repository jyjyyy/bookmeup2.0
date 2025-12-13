/**
 * Email utilities for BookMeUp
 * 
 * Currently mocked - no actual emails are sent.
 * To activate real email sending, replace the mock implementation
 * with your email service provider (Resend, Mailgun, SendGrid, etc.)
 */

export interface ConfirmationEmailData {
  email: string
  proName: string
  serviceName: string
  date: string
  time: string
  duration?: number
  price?: number
  clientName?: string
}

/**
 * Send a booking confirmation email
 * 
 * @param data - Email data including recipient, booking details, etc.
 * @returns Promise<boolean> - true if email would be sent successfully (mocked)
 * 
 * @example
 * ```ts
 * await sendConfirmationEmail({
 *   email: 'client@example.com',
 *   proName: 'Marie Dubois',
 *   serviceName: 'Coupe et coloration',
 *   date: '2025-03-15',
 *   time: '14:00',
 *   duration: 90,
 *   price: 65,
 *   clientName: 'Jean Dupont',
 * })
 * ```
 */
export async function sendConfirmationEmail(
  data: ConfirmationEmailData
): Promise<boolean> {
  try {
    // MOCK: Logger au lieu d'envoyer un vrai email
    console.log('[EMAIL MOCK] sendConfirmationEmail called:', {
      ...data,
      timestamp: new Date().toISOString(),
    })

    // TODO: Replace with actual email service when ready
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'BookMeUp <noreply@bookmeup.com>',
    //   to: data.email,
    //   subject: `Confirmation de réservation - ${data.serviceName}`,
    //   html: generateConfirmationEmailHTML(data),
    // })

    // MOCK: Simuler un délai d'envoi
    await new Promise((resolve) => setTimeout(resolve, 100))

    return true
  } catch (error) {
    console.error('[EMAIL MOCK] Error in sendConfirmationEmail:', error)
    return false
  }
}

/**
 * Generate HTML content for confirmation email
 * (Ready for future use when email service is activated)
 */
export function generateConfirmationEmailHTML(data: ConfirmationEmailData): string {
  const formattedDate = new Date(data.date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de réservation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #C86DD7 0%, #9C44AF 100%); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Réservation confirmée !</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 25px; border-radius: 16px; margin-bottom: 20px;">
          <h2 style="color: #2A1F2D; margin-top: 0;">Bonjour ${data.clientName || 'Cher client'},</h2>
          <p>Votre réservation a été confirmée avec succès !</p>
        </div>
        
        <div style="background: white; border: 2px solid #F5E9F8; padding: 25px; border-radius: 16px; margin-bottom: 20px;">
          <h3 style="color: #2A1F2D; margin-top: 0;">Détails de votre réservation</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #666;">Service</td>
              <td style="padding: 10px 0; font-weight: bold; text-align: right;">${data.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">Professionnel</td>
              <td style="padding: 10px 0; font-weight: bold; text-align: right;">${data.proName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">Date</td>
              <td style="padding: 10px 0; font-weight: bold; text-align: right;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">Heure</td>
              <td style="padding: 10px 0; font-weight: bold; text-align: right;">${data.time}</td>
            </tr>
            ${data.duration ? `
            <tr>
              <td style="padding: 10px 0; color: #666;">Durée</td>
              <td style="padding: 10px 0; font-weight: bold; text-align: right;">${data.duration} minutes</td>
            </tr>
            ` : ''}
            ${data.price ? `
            <tr>
              <td style="padding: 10px 0; color: #666; border-top: 2px solid #F5E9F8;">Prix</td>
              <td style="padding: 10px 0; font-weight: bold; text-align: right; border-top: 2px solid #F5E9F8; font-size: 20px; color: #C86DD7;">${data.price} €</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="background: #F5E9F8; padding: 20px; border-radius: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>ℹ️ Important :</strong> Si vous avez des questions ou souhaitez modifier votre réservation, 
            n'hésitez pas à contacter le professionnel directement.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            BookMeUp - Votre plateforme de réservation beauté
          </p>
        </div>
      </body>
    </html>
  `
}

