'use client'

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, db } from './firebaseClient'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

export type UserRole = 'client' | 'pro'

export interface Profile {
  id: string
  role: UserRole
  name?: string | null
  email?: string | null
  city?: string | null
}

export interface CurrentUser {
  user: User | null
  profile: Profile | null
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        unsubscribe()
        return resolve({ user: null, profile: null })
      }

      try {
        const profileRef = doc(db, 'profiles', user.uid)
        const snap = await getDoc(profileRef)

        if (!snap.exists()) {
          unsubscribe()
          return resolve({
            user,
            profile: null,
          })
        }

        const data = snap.data() as any

        const profile: Profile = {
          id: snap.id,
          role: (data.role as UserRole) ?? 'client',
          name: data.name ?? null,
          email: data.email ?? user.email ?? null,
          city: data.city ?? null,
        }

        unsubscribe()
        resolve({ user, profile })
      } catch (err) {
        console.error('[getCurrentUser] Error loading profile:', err)
        unsubscribe()
        resolve({ user, profile: null })
      }
    })
  })
}

export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole = 'client'
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )
  const user = userCredential.user

  // Create profile document in Firestore
  const profileData = {
    uid: user.uid,
    email: user.email,
    name: name.trim(),
    role,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }
  
  await setDoc(doc(db, 'profiles', user.uid), profileData)
  
  console.log('[DEBUG signup] Created profile document:', {
    collection: 'profiles',
    documentId: user.uid,
    data: {
      ...profileData,
      created_at: '[serverTimestamp]',
      updated_at: '[serverTimestamp]',
    },
  })

  // If role is "pro", create pros document
  if (role === 'pro') {
    const prosData = {
      profile_id: user.uid,
      business_name: name.trim(),
      city: null,
      slug: null,
      plan: 'starter',
      show_in_search: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    }
    
    await setDoc(doc(db, 'pros', user.uid), prosData)
    
    console.log('[DEBUG signup] Created pros document:', {
      collection: 'pros',
      documentId: user.uid,
      data: {
        ...prosData,
        created_at: '[serverTimestamp]',
        updated_at: '[serverTimestamp]',
      },
    })
  }

  return user
}

export async function signOut(): Promise<void> {
  // Clear session cookie first
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    console.error('[signOut] Error clearing session cookie:', error)
    // Continue with Firebase signOut even if API call fails
  }
  
  // Then sign out from Firebase
  await firebaseSignOut(auth)
}

export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

