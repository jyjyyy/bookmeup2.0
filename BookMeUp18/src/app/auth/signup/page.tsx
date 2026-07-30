"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FadeIn } from "@/components/shared/motion"
import { cn } from "@/lib/utils/cn"
import { Loader2, Scissors, User } from "lucide-react"
import type { UserRole } from "@/lib/types"

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<UserRole>("pro")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (step === 1) {
      setStep(2)
      return
    }

    setError(null)
    setLoading(true)

    try {
      await signUp(email, password, { name, role, city, phone })
      router.push(role === "pro" ? "/dashboard" : "/")
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      switch (code) {
        case "auth/email-already-in-use":
          setError("Un compte existe déjà avec cet email.")
          break
        case "auth/weak-password":
          setError("Le mot de passe doit faire au moins 6 caractères.")
          break
        case "auth/invalid-email":
          setError("Adresse email invalide.")
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
          Créer votre compte
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {step === 1
            ? "Commençons par les bases"
            : "Plus que quelques infos et c'est prêt"}
        </p>
        {/* Progress bar */}
        <div className="mt-4 flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-terracotta" />
          <div
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              step === 2 ? "bg-terracotta" : "bg-[var(--border-default)]"
            )}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 ? (
          <>
            {/* Role selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Vous êtes
              </label>
              <div className="grid grid-cols-2 gap-3">
                <RoleCard
                  icon={<Scissors className="h-5 w-5" />}
                  label="Professionnelle"
                  description="Je propose mes services"
                  selected={role === "pro"}
                  onClick={() => setRole("pro")}
                />
                <RoleCard
                  icon={<User className="h-5 w-5" />}
                  label="Cliente"
                  description="Je réserve des RDV"
                  selected={role === "client"}
                  onClick={() => setRole("client")}
                />
              </div>
            </div>

            <Input
              label={role === "pro" ? "Nom de votre activité" : "Votre prénom"}
              placeholder={role === "pro" ? "Ex: Mila Beauty" : "Ex: Sophie"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <Button type="submit" className="w-full" size="lg">
              Continuer
            </Button>
          </>
        ) : (
          <>
            {role === "pro" && (
              <Input
                label="Ville"
                placeholder="Ex: Paris, Lyon, Marseille..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            )}

            <Input
              label="Téléphone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              hint="Optionnel — pour les rappels SMS"
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            {error && (
              <div
                className="p-3 rounded-[var(--radius-sm)] bg-error/10 text-error text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Retour
              </Button>
              <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </div>
          </>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
        Déjà un compte ?{" "}
        <Link
          href="/auth/login"
          className="text-[var(--text-accent)] font-medium hover:underline"
        >
          Se connecter
        </Link>
      </p>

      {step === 2 && (
        <p className="mt-4 text-center text-xs text-[var(--text-muted)] leading-relaxed">
          En créant un compte, vous acceptez nos{" "}
          <Link href="/legal/cgu" className="underline">
            conditions d&apos;utilisation
          </Link>{" "}
          et notre{" "}
          <Link href="/legal/confidentialite" className="underline">
            politique de confidentialité
          </Link>
          .
        </p>
      )}
    </FadeIn>
  )
}

function RoleCard({
  icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)] border-2 transition-all duration-200",
        selected
          ? "border-terracotta bg-terracotta/5 text-[var(--text-primary)]"
          : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-subtle)]"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          selected ? "bg-terracotta/15 text-terracotta" : "bg-[var(--bg-muted)]"
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-[var(--text-muted)]">{description}</span>
    </button>
  )
}
