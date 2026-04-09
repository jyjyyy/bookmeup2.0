import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

/**
 * POST /api/notifications/read
 * Mark one or all notifications as read (server-side).
 * Body: { notificationId: string } or { proId: string, all: true }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { notificationId, proId, all } = body

    if (all && proId) {
      // Mark all unread notifications as read for this pro
      const snap = await adminDb
        .collection('notifications')
        .where('proId', '==', proId)
        .where('read', '==', false)
        .get()

      const batch = adminDb.batch()
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true })
      })
      await batch.commit()

      return NextResponse.json({ ok: true, updated: snap.docs.length })
    }

    if (notificationId) {
      await adminDb.collection('notifications').doc(notificationId).update({ read: true })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'notificationId ou proId+all requis' }, { status: 400 })
  } catch (error: any) {
    console.error('[Notifications Read API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
