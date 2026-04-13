/**
 * Email utilities for BookMeUp
 *
 * Uses Resend for real email delivery.
 * Set RESEND_API_KEY in .env.local to activate.
 * Set EMAIL_FROM in .env.local for the sender address (default: noreply@bookmeup.com).
 */

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.EMAIL_FROM || 'BookMeUp <noreply@bookmeup.com>'

// ─── Types ───────────────────────────────────────────────────────────

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

export interface CancellationEmailData {
  email: string
  proName: string
  serviceName: string
  date: string
  time: string
  clientName?: string
  cancelledBy: 'pro' | 'client'
}

// ─── Send helpers ────────────────────────────────────────────────────

/**
 * Send a booking confirmation email to the client.
 */
export async function sendConfirmationEmail(data: ConfirmationEmailData): Promise<boolean> {
  const html = generateConfirmationEmailHTML(data)
  return sendEmail(data.email, `Confirmation de réservation — ${data.serviceName}`, html)
}

/**
 * Send a cancellation email to the client.
 */
export async function sendCancellationEmail(data: CancellationEmailData): Promise<boolean> {
  const html = generateCancellationEmailHTML(data)
  return sendEmail(data.email, `Rendez-vous annulé — ${data.serviceName}`, html)
}

// ─── Core send function ──────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`)
    return true
  }

  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) {
      console.error('[EMAIL] Resend error:', error)
      return false
    }
    console.log(`[EMAIL] Sent to ${to}: ${subject}`)
    return true
  } catch (err) {
    console.error('[EMAIL] Send error:', err)
    return false
  }
}

// ─── HTML Templates ──────────────────────────────────────────────────

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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#FAF7FB;">
  <div style="background:linear-gradient(135deg,#C86DD7 0%,#9C44AF 100%);padding:30px;border-radius:16px;text-align:center;margin-bottom:30px;">
    <h1 style="color:white;margin:0;font-size:24px;">Réservation confirmée !</h1>
  </div>

  <div style="background:#fff;padding:25px;border-radius:16px;margin-bottom:20px;border:1px solid #EDE8F0;">
    <h2 style="color:#2A1F2D;margin-top:0;font-size:18px;">Bonjour ${data.clientName || 'Cher client'},</h2>
    <p style="color:#64576b;">Votre réservation a été confirmée avec succès !</p>
  </div>

  <div style="background:#fff;border:2px solid #F5E9F8;padding:25px;border-radius:16px;margin-bottom:20px;">
    <h3 style="color:#2A1F2D;margin-top:0;font-size:16px;">Détails de votre rendez-vous</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:10px 0;color:#8a7a92;">Service</td><td style="padding:10px 0;font-weight:bold;text-align:right;color:#2A1F2D;">${data.serviceName}</td></tr>
      <tr><td style="padding:10px 0;color:#8a7a92;">Professionnel</td><td style="padding:10px 0;font-weight:bold;text-align:right;color:#2A1F2D;">${data.proName}</td></tr>
      <tr><td style="padding:10px 0;color:#8a7a92;">Date</td><td style="padding:10px 0;font-weight:bold;text-align:right;color:#2A1F2D;">${formattedDate}</td></tr>
      <tr><td style="padding:10px 0;color:#8a7a92;">Heure</td><td style="padding:10px 0;font-weight:bold;text-align:right;color:#2A1F2D;">${data.time}</td></tr>
      ${data.duration ? `<tr><td style="padding:10px 0;color:#8a7a92;">Durée</td><td style="padding:10px 0;font-weight:bold;text-align:right;color:#2A1F2D;">${data.duration} min</td></tr>` : ''}
      ${data.price ? `<tr><td style="padding:10px 0;color:#8a7a92;border-top:2px solid #F5E9F8;">Prix</td><td style="padding:10px 0;font-weight:bold;text-align:right;border-top:2px solid #F5E9F8;font-size:20px;color:#C86DD7;">${data.price} €</td></tr>` : ''}
    </table>
  </div>

  <div style="background:#F5E9F8;padding:16px 20px;border-radius:16px;margin-bottom:20px;">
    <p style="margin:0;color:#64576b;font-size:13px;">
      <strong>Important :</strong> Si vous avez des questions ou souhaitez modifier votre réservation, contactez le professionnel directement.
    </p>
  </div>

  <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #EDE8F0;">
    <p style="color:#B5A8BE;font-size:11px;margin:0;">BookMeUp — Votre plateforme de réservation beauté</p>
  </div>
</body>
</html>`
}

function generateCancellationEmailHTML(data: CancellationEmailData): string {
  const formattedDate = new Date(data.date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const reason = data.cancelledBy === 'pro'
    ? `Votre professionnel <strong>${data.proName}</strong> a dû annuler ce rendez-vous.`
    : 'Votre rendez-vous a bien été annulé.'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#FAF7FB;">
  <div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:30px;border-radius:16px;text-align:center;margin-bottom:30px;">
    <h1 style="color:white;margin:0;font-size:24px;">Rendez-vous annulé</h1>
  </div>

  <div style="background:#fff;padding:25px;border-radius:16px;margin-bottom:20px;border:1px solid #EDE8F0;">
    <h2 style="color:#2A1F2D;margin-top:0;font-size:18px;">Bonjour ${data.clientName || 'Cher client'},</h2>
    <p style="color:#64576b;">${reason}</p>
  </div>

  <div style="background:#fff;border:2px solid #fecaca;padding:25px;border-radius:16px;margin-bottom:20px;">
    <h3 style="color:#2A1F2D;margin-top:0;font-size:16px;">Rendez-vous concerné</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:10px 0;color:#8a7a92;">Service</td><td style="padding:10px 0;font-weight:bold;text-align:right;color:#2A1F2D;">${data.serviceName}</td></tr>
      <tr><td style="padding:10px 0;color:#8a7a92;">Date</td><td style="padding:10px 0;font-weight:bold;text-align:right;color:#2A1F2D;">${formattedDate}</td></tr>
      <tr><td style="padding:10px 0;color:#8a7a92;">Heure</td><td style="padding:10px 0;font-weight:bold;text-align:right;color:#2A1F2D;">${data.time}</td></tr>
    </table>
  </div>

  <div style="background:#fef2f2;padding:16px 20px;border-radius:16px;margin-bottom:20px;">
    <p style="margin:0;color:#991b1b;font-size:13px;">
      N'hésitez pas à reprendre rendez-vous si vous le souhaitez.
    </p>
  </div>

  <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #EDE8F0;">
    <p style="color:#B5A8BE;font-size:11px;margin:0;">BookMeUp — Votre plateforme de réservation beauté</p>
  </div>
</body>
</html>`
}
