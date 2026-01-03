'use client'

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser as firebaseDeleteUser,
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
  const profileData: any = {
    uid: user.uid,
    email: user.email,
    name: name.trim(),
    role,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }
  
  // Add abuse prevention fields for client users
  if (role === 'client') {
    profileData.cancelCount = 0
    profileData.noShowCount = 0
    profileData.isBlocked = false
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

/**
 * Error types for account management operations
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Change user password with re-authentication
 * @param user - Firebase Auth user
 * @param currentPassword - Current password for re-authentication
 * @param newPassword - New password to set
 * @throws {AuthError} If authentication or password update fails
 */
export async function changePassword(
  user: User,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (!user.email) {
    throw new AuthError(
      'User email not available',
      'auth/no-email',
      'Email non disponible'
    )
  }

  // Validate new password
  if (newPassword.length < 6) {
    throw new AuthError(
      'Password too short',
      'auth/weak-password',
      'Le nouveau mot de passe doit contenir au moins 6 caractères'
    )
  }

  try {
    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)

    // Update password
    await updatePassword(user, newPassword)
  } catch (error: any) {
    console.error('[changePassword] Error:', error)

    // Map Firebase errors to user-friendly messages
    if (error.code === 'auth/wrong-password') {
      throw new AuthError(
        'Wrong password',
        error.code,
        'Mot de passe actuel incorrect'
      )
    } else if (error.code === 'auth/weak-password') {
      throw new AuthError(
        'Weak password',
        error.code,
        'Le nouveau mot de passe est trop faible'
      )
    } else if (error.code === 'auth/requires-recent-login') {
      throw new AuthError(
        'Recent login required',
        error.code,
        'Veuillez vous reconnecter avant de changer votre mot de passe'
      )
    } else if (error.code === 'auth/invalid-credential') {
      throw new AuthError(
        'Invalid credential',
        error.code,
        'Mot de passe actuel incorrect'
      )
    } else {
      throw new AuthError(
        error.message || 'Password change failed',
        error.code || 'auth/unknown-error',
        error.message || 'Erreur lors du changement de mot de passe'
      )
    }
  }
}

/**
 * Delete Firebase Auth user account
 * @param user - Firebase Auth user to delete
 * @throws {AuthError} If account deletion fails
 */
export async function deleteAccount(user: User): Promise<void> {
  try {
    await firebaseDeleteUser(user)
  } catch (error: any) {
    console.error('[deleteAccount] Error:', error)

    // Map Firebase errors to user-friendly messages
    if (error.code === 'auth/requires-recent-login') {
      throw new AuthError(
        'Recent login required',
        error.code,
        'Veuillez vous reconnecter avant de supprimer votre compte'
      )
    } else {
      throw new AuthError(
        error.message || 'Account deletion failed',
        error.code || 'auth/unknown-error',
        error.message || 'Erreur lors de la suppression du compte'
      )
    }
  }
}

