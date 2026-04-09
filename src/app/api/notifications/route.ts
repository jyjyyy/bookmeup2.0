import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

/**
 * GET /api/notifications?proId=xxx
 * Fetch the 20 most recent notifications for a pro (server-side, no client rules needed).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const proId = searchParams.get('proId')

    if (!proId) {
      return NextResponse.json({ error: 'proId requis' }, { status: 400 })
    }

    const snap = await adminDb
      .collection('notifications')
      .where('proId', '==', proId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    const notifications = snap.docs.map((doc) => {
      const data = doc.data()
      let createdAt: string
      if (data.createdAt?.toDate) {
        createdAt = data.createdAt.toDate().toISOString()
      } else if (typeof data.createdAt === 'string') {
        createdAt = data.createdAt
      } else {
        createdAt = new Date().toISOString()
      }

      return {
        id: doc.id,
        type: data.type || 'system',
        title: data.title || 'Notification',
        message: data.message || '',
        createdAt,
        read: data.read === true,
        bookingId: data.bookingId || null,
      }
    })

    return NextResponse.json({ notifications })
  } catch (error: any) {
    console.error('[Notifications API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
