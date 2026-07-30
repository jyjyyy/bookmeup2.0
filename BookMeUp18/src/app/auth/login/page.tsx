"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FadeIn } from "@/components/shared/motion"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      router.push("/dashboard")
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      switch (code) {
        case "auth/invalid-email":
          setError("Adresse email invalide.")
          break
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Email ou mot de passe incorrect.")
          break
        case "auth/too-many-requests":
          setError("Trop de tentatives. Réessayez dans quelques minutes.")
          break
        default:
          setError("Une erreur est survenue. Veuillez réessayer.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <FadeIn>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
          Bon retour parmi nous
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Connectez-vous pour accéder à votre espace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <div>
          <Input
            label="Mot de passe"
            type="password"
            placeholder="Votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <div className="mt-1.5 text-right">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-[var(--text-accent)] hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        {error && (
          <div
            className="p-3 rounded-[var(--radius-sm)] bg-error/10 text-error text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
        Pas encore de compte ?{" "}
        <Link
          href="/auth/signup"
          className="text-[var(--text-accent)] font-medium hover:underline"
        >
          Créer un compte gratuitement
        </Link>
      </p>
    </FadeIn>
  )
}
