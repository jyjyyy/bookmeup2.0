"use client"

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/db/firebase-client"
import type { UserProfile, UserRole } from "@/lib/types"

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, data: {
    name: string
    role: UserRole
    city?: string
    phone?: string
  }) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider")
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  })

  // Écouter les changements d'authentification
  useEffect(() => {
    const timeout = setTimeout(() => {
      setState((prev) => (prev.loading ? { ...prev, loading: false } : prev))
    }, 5000)

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeout)
      if (user) {
        try {
          const profileSnap = await getDoc(doc(db, "profiles", user.uid))
          const profile = profileSnap.exists()
            ? ({ uid: user.uid, ...profileSnap.data() } as UserProfile)
            : null
          setState({ user, profile, loading: false })
        } catch {
          setState({ user, profile: null, loading: false })
        }
      } else {
        setState({ user: null, profile: null, loading: false })
      }
    })

    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      data: { name: string; role: UserRole; city?: string; phone?: string }
    ) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const profileData: Omit<UserProfile, "uid"> = {
        email,
        name: data.name,
        role: data.role,
        city: data.city,
        phone: data.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await setDoc(doc(db, "profiles", cred.user.uid), {
        ...profileData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      // Si pro, créer le document pro
      if (data.role === "pro") {
        const slug = data.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")

        await setDoc(doc(db, "pros", cred.user.uid), {
          slug: `${slug}-${data.city?.toLowerCase() || "france"}`,
          business_name: data.name,
          description: "",
          city: data.city || "",
          plan: "starter",
          gallery: { images: [] },
          show_in_search: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        })
      }
    },
    []
  )

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }, [])

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}
