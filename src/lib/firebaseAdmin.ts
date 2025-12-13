// src/lib/firebaseAdmin.ts

import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
  throw new Error("Missing FIREBASE_ADMIN_PROJECT_ID")
}
if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
  throw new Error("Missing FIREBASE_ADMIN_CLIENT_EMAIL")
}
if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  throw new Error("Missing FIREBASE_ADMIN_PRIVATE_KEY")
}

export const adminApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process
            .env
            .FIREBASE_ADMIN_PRIVATE_KEY
            .replace(/\\n/g, "\n"),
        }),
      })
    : getApps()[0]

export const adminDb = getFirestore(adminApp)
