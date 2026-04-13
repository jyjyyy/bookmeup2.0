/**
 * Google Calendar integration helpers for BookMeUp.
 *
 * Uses raw fetch() calls to Google APIs — no googleapis package needed.
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   NEXT_PUBLIC_BASE_URL   (e.g. https://bookmeup.com or http://localhost:3000)
 */

import { adminDb } from '@/lib/firebaseAdmin'

// ─── Constants ──────────────────────────────────────────────────────

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${base}/api/google-calendar/callback`
}

// ─── OAuth helpers ──────────────────────────────────────────────────

/**
 * Generate the Google OAuth consent URL.
 * `state` should contain the proId so we know who to link after callback.
 */
export function generateAuthUrl(proId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: proId,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token exchange failed: ${JSON.stringify(err)}`)
  }

  return res.json() as Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
    token_type: string
  }>
}

/**
 * Refresh an access token using a refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to refresh access token')
  }

  const data = await res.json()
  return data.access_token as string
}

/**
 * Get the Google email address associated with an access token.
 */
export async function getGoogleEmail(accessToken: string): Promise<string> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to get user info')
  const data = await res.json()
  return data.email as string
}

// ─── Token storage (Firestore) ─────────────────────────────────────

const tokensCollection = (proId: string) =>
  adminDb.collection('pros').doc(proId).collection('integrations')

export async function saveTokens(
  proId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in: number },
  googleEmail: string,
) {
  const expiresAt = Date.now() + tokens.expires_in * 1000

  await tokensCollection(proId).doc('google-calendar').set(
    {
      accessToken: tokens.access_token,
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      expiresAt,
      googleEmail,
      connected: true,
      autoSync: true,
      updatedAt: Date.now(),
    },
    { merge: true },
  )
}

export async function getStoredTokens(proId: string) {
  const doc = await tokensCollection(proId).doc('google-calendar').get()
  if (!doc.exists) return null
  return doc.data() as {
    accessToken: string
    refreshToken?: string
    expiresAt: number
    googleEmail: string
    connected: boolean
    autoSync: boolean
  }
}

/**
 * Get a valid access token, refreshing if expired.
 */
export async function getValidAccessToken(proId: string): Promise<string | null> {
  const stored = await getStoredTokens(proId)
  if (!stored || !stored.connected) return null

  // If token still valid (with 60s buffer)
  if (stored.expiresAt > Date.now() + 60_000) {
    return stored.accessToken
  }

  // Refresh
  if (!stored.refreshToken) return null
  const newToken = await refreshAccessToken(stored.refreshToken)

  // Save new token (expires_in default 3600s)
  await tokensCollection(proId).doc('google-calendar').update({
    accessToken: newToken,
    expiresAt: Date.now() + 3600 * 1000,
    updatedAt: Date.now(),
  })

  return newToken
}

export async function removeTokens(proId: string) {
  await tokensCollection(proId).doc('google-calendar').delete()
}

export async function setAutoSync(proId: string, enabled: boolean) {
  await tokensCollection(proId).doc('google-calendar').update({
    autoSync: enabled,
    updatedAt: Date.now(),
  })
}

// ─── Calendar event helpers ─────────────────────────────────────────

export interface BookingEvent {
  summary: string
  description?: string
  date: string       // YYYY-MM-DD
  startTime: string  // HH:MM
  endTime: string    // HH:MM
  clientName?: string
  clientEmail?: string
}

/**
 * Create a Google Calendar event for a booking.
 * Returns the created event ID, or null on failure.
 */
export async function createCalendarEvent(
  proId: string,
  booking: BookingEvent,
): Promise<string | null> {
  const accessToken = await getValidAccessToken(proId)
  if (!accessToken) return null

  const startDateTime = `${booking.date}T${booking.startTime}:00`
  const endDateTime = `${booking.date}T${booking.endTime}:00`

  const event: Record<string, any> = {
    summary: booking.summary,
    description: booking.description || '',
    start: {
      dateTime: startDateTime,
      timeZone: 'Europe/Paris',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Europe/Paris',
    },
  }

  // Optionally add attendee
  if (booking.clientEmail) {
    event.attendees = [
      {
        email: booking.clientEmail,
        displayName: booking.clientName || undefined,
        responseStatus: 'accepted',
      },
    ]
  }

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?sendUpdates=none`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  )

  if (!res.ok) {
    console.error('[Google Calendar] Create event error:', await res.text())
    return null
  }

  const created = await res.json()
  return created.id as string
}

/**
 * Delete a Google Calendar event by its event ID.
 */
export async function deleteCalendarEvent(
  proId: string,
  googleEventId: string,
): Promise<boolean> {
  const accessToken = await getValidAccessToken(proId)
  if (!accessToken) return false

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${googleEventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  return res.ok || res.status === 404 // 404 = already deleted
}
