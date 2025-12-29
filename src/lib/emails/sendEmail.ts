import { Resend } from 'resend'

/**
 * Send an email using Resend
 * 
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email HTML content
 * @returns Promise<boolean> - true if email was sent successfully
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    // Validate required environment variables
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM

    if (!apiKey) {
      console.error('[EMAIL] RESEND_API_KEY is not set in environment variables')
      return false
    }

    if (!from) {
      console.error('[EMAIL] EMAIL_FROM is not set in environment variables')
      return false
    }

    // Initialize Resend client
    const resend = new Resend(apiKey)

    // Send email via Resend
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    if (result.error) {
      console.error('[EMAIL] Resend API error:', result.error)
      return false
    }

    console.log('[EMAIL] Email sent successfully:', {
      to,
      subject,
      id: result.data?.id,
    })

    return true
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error)
    return false
  }
}

