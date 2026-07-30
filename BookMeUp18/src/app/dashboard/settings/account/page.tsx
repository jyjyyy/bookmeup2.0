"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FadeIn } from "@/components/shared/motion"
import {
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Save,
  Loader2,
  Check,
  Link2,
  Copy,
} from "lucide-react"
import type { ProProfile } from "@/lib/types"

export default function AccountSettingsPage() {
  const { user, profile } = useAuth()
  const [proProfile, setProProfile] = useState<ProProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  // Form state
  const [businessName, setBusinessName] = useState("")
  const [description, setDescription] = useState("")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [instagram, setInstagram] = useState("")
  const [facebook, setFacebook] = useState("")
  const [website, setWebsite] = useState("")

  useEffect(() => {
    if (!user) return
    async function fetchPro() {
      try {
        const ref = doc(db, "pros", user!.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data() as ProProfile
          setProProfile(data)
          setBusinessName(data.business_name || "")
          setDescription(data.description || "")
          setCity(data.city || "")
          setAddress(data.address || "")
          setPhone(data.phone || "")
          setInstagram(data.socials?.instagram || "")
          setFacebook(data.socials?.facebook || "")
          setWebsite(data.socials?.website || "")
        }
      } catch (err) {
        console.error("Fetch pro profile error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPro()
  }, [user])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, "pros", user.uid), {
        business_name: businessName.trim(),
        description: description.trim(),
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        socials: {
          instagram: instagram.trim(),
          facebook: facebook.trim(),
          website: website.trim(),
        },
        updated_at: new Date().toISOString(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Save profile error:", err)
    } finally {
      setSaving(false)
    }
  }

  function copyBookingLink() {
    if (!proProfile?.slug) return
    const link = `${window.location.origin}/book/${proProfile.slug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Mon profil
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Gérez les informations de votre page publique.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving || saved}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Sauvegarde..." : saved ? "Enregistré !" : "Enregistrer"}
          </Button>
        </div>
      </FadeIn>

      {/* Booking link */}
      {proProfile?.slug && (
        <FadeIn delay={0.05}>
          <Card className="border-terracotta/20 bg-terracotta/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[var(--radius-md)] bg-terracotta/15 flex items-center justify-center shrink-0">
                  <Link2 className="h-4 w-4 text-terracotta" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Votre lien de réservation
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {typeof window !== "undefined" ? window.location.origin : ""}/book/{proProfile.slug}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={copyBookingLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copié !" : "Copier"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Business info */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-terracotta" />
              Informations professionnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nom de l'établissement"
              placeholder="Ex : Mila Beauty Lyon"
              value={businessName}
              onChange={(e) => { setBusinessName(e.target.value); setSaved(false) }}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Description
              </label>
              <textarea
                className="w-full rounded-[var(--radius-md)] px-4 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-2 border-[var(--border-default)] placeholder:text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--border-subtle)] focus:border-[var(--border-accent)] focus:outline-none resize-none"
                rows={4}
                placeholder="Présentez votre salon / activité..."
                value={description}
                onChange={(e) => { setDescription(e.target.value); setSaved(false) }}
              />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Contact & address */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-terracotta" />
              Coordonnées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ville"
                placeholder="Lyon"
                value={city}
                onChange={(e) => { setCity(e.target.value); setSaved(false) }}
              />
              <Input
                label="Téléphone"
                placeholder="06 12 34 56 78"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setSaved(false) }}
              />
            </div>
            <Input
              label="Adresse complète"
              placeholder="12 rue de la Paix, 69001 Lyon"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setSaved(false) }}
            />
          </CardContent>
        </Card>
      </FadeIn>

      {/* Socials */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-terracotta" />
              Réseaux sociaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Instagram"
              placeholder="@votre_compte"
              value={instagram}
              onChange={(e) => { setInstagram(e.target.value); setSaved(false) }}
            />
            <Input
              label="Facebook"
              placeholder="URL de votre page"
              value={facebook}
              onChange={(e) => { setFacebook(e.target.value); setSaved(false) }}
            />
            <Input
              label="Site web"
              placeholder="https://..."
              value={website}
              onChange={(e) => { setWebsite(e.target.value); setSaved(false) }}
            />
          </CardContent>
        </Card>
      </FadeIn>

      {/* Email (read-only) */}
      <FadeIn delay={0.25}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-terracotta" />
              Compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Email"
              value={profile?.email || ""}
              disabled
              hint="L'email ne peut pas être modifié ici."
            />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
