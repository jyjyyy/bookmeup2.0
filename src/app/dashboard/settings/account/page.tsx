'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Loader } from '@/components/ui/loader'
import { generateSlugFromNameAndCity } from '@/lib/slug'

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Profile data
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  // Pro data
  const [businessName, setBusinessName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [showInSearch, setShowInSearch] = useState(false)

  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const currentUser = await getCurrentUser()

        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }

        if (currentUser.profile.role !== 'pro') {
          router.push('/')
          return
        }

        const userId = currentUser.user.uid
        setUid(userId)

        // Load profile
        const profileDoc = await getDoc(doc(db, 'profiles', userId))
        if (profileDoc.exists()) {
          const profileData = profileDoc.data()
          setEmail(profileData.email || currentUser.user.email || '')
          setName(profileData.name || '')
        } else {
          setEmail(currentUser.user.email || '')
        }

        // Load or create pros document
        const prosDoc = await getDoc(doc(db, 'pros', userId))
        if (prosDoc.exists()) {
          const prosData = prosDoc.data()
          setBusinessName(prosData.business_name || '')
          setCity(prosData.city || '')
          setPhone(prosData.phone || '')
          setAddress(prosData.address || '')
          setDescription(prosData.description || '')
          setSlug(prosData.slug || '')
          setShowInSearch(prosData.show_in_search || false)
        } else {
          // Create minimal pros document
          const defaultBusinessName = name || currentUser.profile.name || 'Mon salon'
          await setDoc(doc(db, 'pros', userId), {
            profile_id: userId,
            business_name: defaultBusinessName,
            city: null,
            phone: null,
            address: null,
            description: null,
            slug: null,
            plan: 'starter',
            show_in_search: false,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          })
          setBusinessName(defaultBusinessName)
        }
      } catch (err: any) {
        console.error('Error loading account data:', err)
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleGenerateSlug = () => {
    const generatedSlug = generateSlugFromNameAndCity(
      businessName || name,
      city
    )
    setSlug(generatedSlug)
  }

  const handleSaveProfile = async () => {
    if (!uid) return

    try {
      setSavingProfile(true)
      setError(null)
      setSuccess(null)

      await updateDoc(doc(db, 'profiles', uid), {
        name: name.trim(),
        updated_at: serverTimestamp(),
      })

      setSuccess('Informations personnelles enregistrées ✓')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePro = async () => {
    if (!uid) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Validation
      if (!businessName.trim()) {
        throw new Error('Le nom du salon est obligatoire')
      }

      if (showInSearch && !slug.trim()) {
        throw new Error('Vous devez définir un slug pour apparaître dans la recherche')
      }

      // Check if slug is already used by another pro
      if (slug.trim()) {
        const slugQuery = query(
          collection(db, 'pros'),
          where('slug', '==', slug.trim())
        )
        const slugSnapshot = await getDocs(slugQuery)

        if (!slugSnapshot.empty) {
          const existingDoc = slugSnapshot.docs[0]
          if (existingDoc.id !== uid) {
            throw new Error('Ce lien est déjà utilisé par un autre professionnel')
          }
        }
      }

      await updateDoc(doc(db, 'pros', uid), {
        business_name: businessName.trim(),
        city: city.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        description: description.trim() || null,
        slug: slug.trim() || null,
        show_in_search: showInSearch,
        updated_at: serverTimestamp(),
      })

      setSuccess('Fiche professionnelle enregistrée ✓')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error saving pro:', err)
      setError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Compte</h1>
        <p className="text-gray-600 text-sm">
          Ces informations sont visibles sur votre fiche publique BookMeUp.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[32px] text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-[32px] text-sm"
        >
          {success}
        </motion.div>
      )}

      {/* Card 1: Informations personnelles */}
      <Card className="rounded-[32px] shadow-bookmeup p-8">
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Vos informations de connexion et votre nom d'affichage
          </CardDescription>
        </CardHeader>

        <div className="space-y-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-5 py-3.5 rounded-[32px] border border-gray-200 bg-gray-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              L'email ne peut pas être modifié
            </p>
          </div>

          <Input
            label="Nom affiché"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
          />
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="rounded-[32px]"
          >
            {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </Card>

      {/* Card 2: Fiche professionnelle */}
      <Card className="rounded-[32px] shadow-bookmeup p-8">
        <CardHeader>
          <CardTitle>Fiche professionnelle (publique)</CardTitle>
          <CardDescription>
            Informations visibles sur votre profil public BookMeUp
          </CardDescription>
        </CardHeader>

        <div className="space-y-4 mt-6">
          <Input
            label="Nom du salon / Business *"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Ex: Mila Beauty"
            required
          />

          <Input
            label="Ville"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: Paris"
          />

          <Input
            label="Téléphone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ex: 06 12 34 56 78"
          />

          <Input
            label="Adresse"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: 123 Rue de la Paix, 75001 Paris"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2.5">
              Description courte
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre salon en quelques mots..."
              className="w-full px-5 py-3.5 rounded-[32px] border border-gray-200 bg-white text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 min-h-[120px] resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2.5">
              Lien public (slug)
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Ex: mila-beauty-paris"
                className="flex-1"
              />
              <Button
                onClick={handleGenerateSlug}
                variant="outline"
                className="rounded-[32px] whitespace-nowrap"
              >
                Générer automatiquement
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Votre fiche sera accessible sur : /pro/{slug || 'votre-slug'}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Afficher dans la recherche
                </label>
                <p className="text-xs text-gray-500">
                  Permet aux clients de vous trouver via la recherche BookMeUp
                </p>
                {showInSearch && !slug.trim() && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Vous devez d'abord définir un slug
                  </p>
                )}
              </div>
              <Switch
                checked={showInSearch}
                onChange={(e) => {
                  if (e.target.checked && !slug.trim()) {
                    setError('Vous devez d\'abord définir un slug')
                    return
                  }
                  setShowInSearch(e.target.checked)
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSavePro}
            disabled={saving || (showInSearch && !slug.trim())}
            className="rounded-[32px]"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer ma fiche'}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
