'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage, auth } from '@/lib/firebaseClient'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { AccountSettingsSkeleton } from '@/components/ui/skeleton'
import { generateSlugFromNameAndCity } from '@/lib/slug'
import { PHOTOS_ENABLED } from '@/lib/features'

export default function AccountPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
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
  
  // Socials
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  
  // Gallery
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadState, setUploadState] = useState<"idle"|"uploading"|"success"|"error">("idle")
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [pendingPreviews, setPendingPreviews] = useState<Array<{ tempId: string; url: string }>>([])

  const [uid, setUid] = useState<string | null>(null)
  
  // Debug state
  const [debug, setDebug] = useState<{ step: string; info?: any; error?: any } | null>(null)

  // Debug: mounted
  useEffect(() => {
    console.log("[PHOTO] mounted")
    setDebug({ step: "mounted" })
  }, [])

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
          
          // Load socials
          if (prosData.socials) {
            setInstagram(prosData.socials.instagram || '')
            setTiktok(prosData.socials.tiktok || '')
          }
          
          // Load gallery
          if (prosData.gallery?.images) {
            setGalleryImages(prosData.gallery.images || [])
          }
        } else {
          // Create minimal pros document (no plan assigned — user must choose)
          const defaultBusinessName = name || currentUser.profile.name || 'Mon salon'
          await setDoc(doc(db, 'pros', userId), {
            profile_id: userId,
            business_name: defaultBusinessName,
            city: null,
            phone: null,
            address: null,
            description: null,
            slug: null,
            plan: null,
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

  const handleSaveSocials = async () => {
    if (!uid) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Validation URLs si renseignées
      if (instagram.trim() && !isValidUrl(instagram.trim())) {
        throw new Error('URL Instagram invalide')
      }
      if (tiktok.trim() && !isValidUrl(tiktok.trim())) {
        throw new Error('URL TikTok invalide')
      }

      const socialsData: any = {}
      if (instagram.trim()) socialsData.instagram = instagram.trim()
      if (tiktok.trim()) socialsData.tiktok = tiktok.trim()

      await updateDoc(doc(db, 'pros', uid), {
        socials: Object.keys(socialsData).length > 0 ? socialsData : null,
        updated_at: serverTimestamp(),
      })

      setSuccess('Réseaux sociaux enregistrés ✓')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error saving socials:', err)
      setError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleFileUpload = async (files: FileList | File[] | null) => {
    if (!files) return
    if (!PHOTOS_ENABLED) return
    const fileArray = Array.isArray(files) ? files : Array.from(files)
    if (fileArray.length === 0) return
    if (uploadState === "uploading") return
    const currentUser = auth.currentUser
    if (!currentUser) {
      setError("Veuillez vous reconnecter puis réessayer.")
      setUploadState("error")
      return
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    const MAX_BYTES = 2 * 1024 * 1024
    const ALLOWED_SET = new Set(['image/jpeg', 'image/png'])
    try {
      setUploading(true)
      setError(null)
      setUploadProgress(0)
      setUploadState("uploading")
      setUploadStatus(null)
      const uploadItems = fileArray.map((file) => {
        const tempId = Date.now() + "-" + Math.random().toString(36).slice(2)
        const previewUrl = URL.createObjectURL(file)
        return { tempId, file, previewUrl }
      })
      setPendingPreviews((prev) => [
        ...prev,
        ...uploadItems.map(({ tempId, previewUrl }) => ({ tempId, url: previewUrl })),
      ])
      const newImageUrls = []
      const failed = []
      for (let i = 0; i < uploadItems.length; i++) {
        const item = uploadItems[i]
        const file = item.file
        try {
          if (!ALLOWED_SET.has(file.type)) throw new Error('Formats acceptés : JPG, PNG')
          if (file.size > MAX_BYTES) throw new Error("L'image " + file.name + " est trop volumineuse (max 2MB)")
          console.log("[PHOTO] uploading via API", file.name, file.size)
          const idToken = await currentUser.getIdToken()
          const formData = new FormData()
          formData.append("file", file)
          const controller = new AbortController()
          abortControllerRef.current = controller
          const res = await fetch("/api/photos/upload", {
            method: "POST",
            headers: { Authorization: "Bearer " + idToken },
            body: formData,
            signal: controller.signal,
          })
          if (!res.ok) {
            const data = await res.json().catch(() => ({ error: "Erreur serveur" }))
            throw new Error(data.error || "Erreur " + res.status)
          }
          const data = await res.json()
          console.log("[PHOTO] success via API", data.url)
          newImageUrls.push(data.url)
          setUploadProgress(Math.round(((i + 1) / uploadItems.length) * 100))
          setPendingPreviews((prev) => prev.filter((p) => p.tempId !== item.tempId))
          try { URL.revokeObjectURL(item.previewUrl) } catch {}
          setGalleryImages(data.images)
        } catch (err) {
          console.log("[PHOTO] error", err?.message || "Unknown error")
          failed.push({ name: file.name, message: err?.message || "Erreur lors de l'upload", tempId: item.tempId })
        }
      }
      if (newImageUrls.length > 0) {
        setUploadState("success")
        setSuccess(newImageUrls.length + " photo" + (newImageUrls.length > 1 ? "s" : "") + " ajoutée" + (newImageUrls.length > 1 ? "s" : "") + " ✓")
        setTimeout(() => setSuccess(null), 3000)
      }
      if (failed.length > 0) {
        setError(failed[0].message + (failed.length > 1 ? " (+" + (failed.length - 1) + " autre" + (failed.length - 1 > 1 ? "s" : "") + ")" : ""))
        setUploadState("error")
        setTimeout(() => {
          setPendingPreviews((prev) => prev.filter((p) => !failed.some((f) => f.tempId === p.tempId)))
        }, 5000)
      }
    } catch (err) {
      console.log("[PHOTO] error", err?.message || "Unknown error")
      setError(err?.message || "Erreur lors de l'upload")
      setUploadState("error")
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setUploadStatus(null)
    }
  }

  const handleCancelUpload = () => {
    if (abortControllerRef.current && uploadState === "uploading") {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      console.log("[PHOTO] user canceled")
      setUploadState("idle")
      setUploadProgress(0)
      setUploading(false)
      setUploadStatus("Upload annulé")
      setTimeout(() => setUploadStatus(null), 3000)
    }
  }

  const handleDeleteImage = async (imageUrl: string) => {
    if (!uid) return
    if (!PHOTOS_ENABLED) return

    try {
      setUploading(true)
      setError(null)

      // Supprimer de Storage (extraire le path depuis l'URL Firebase Storage)
      try {
        // Les URLs Firebase Storage ont le format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token=...
        // On extrait le path encodé et on le décode
        const urlObj = new URL(imageUrl)
        const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/)
        if (pathMatch) {
          const encodedPath = pathMatch[1]
          const decodedPath = decodeURIComponent(encodedPath)
          const imageRef = ref(storage, decodedPath)
          await deleteObject(imageRef)
        }
      } catch (storageErr) {
        console.warn('Could not delete from storage:', storageErr)
        // Continue même si la suppression Storage échoue (l'image peut avoir été supprimée manuellement)
      }

      // Mettre à jour Firestore
      const updatedImages = galleryImages.filter(url => url !== imageUrl)
      await updateDoc(doc(db, 'pros', uid), {
        'gallery.images': updatedImages,
        updated_at: serverTimestamp(),
      })

      setGalleryImages(updatedImages)
      setSuccess('Photo supprimée ✓')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error deleting image:', err)
      setError(err.message || 'Erreur lors de la suppression')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <AccountSettingsSkeleton />
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Mon compte
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Paramètres du compte</h1>
        <p className="text-[#8a7a92] text-sm">
          Ces informations sont visibles sur votre fiche publique BookMeUp.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[20px] text-sm flex items-center gap-3"
        >
          <span>⚠️</span> {error}
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-[20px] text-sm flex items-center gap-3"
        >
          <span>✅</span> {success}
        </motion.div>
      )}

      {/* Card 1: Informations personnelles */}
      <Card className="rounded-[24px] shadow-[0_4px_20px_rgba(20,0,50,0.04)] border border-primary/8 p-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F0F7] flex items-center justify-center text-sm">👤</div>
            <div>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Vos informations de connexion et votre nom d&apos;affichage
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-[#2A1F2D] mb-2.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 rounded-[14px] border border-[#EDE8F0] bg-[#F5F0F7] text-[#8a7a92] cursor-not-allowed text-sm"
            />
            <p className="text-xs text-[#b5a8bc] mt-1.5">
              L&apos;email ne peut pas être modifié
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
            className="btn-gradient rounded-full px-6 text-sm font-bold shadow-[0_4px_16px_rgba(200,109,215,0.3)]"
          >
            {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </Card>

      {/* Card 2: Fiche professionnelle */}
      <Card className="rounded-[24px] shadow-[0_4px_20px_rgba(20,0,50,0.04)] border border-primary/8 p-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F0F7] flex items-center justify-center text-sm">💼</div>
            <div>
              <CardTitle>Fiche professionnelle</CardTitle>
              <CardDescription>
                Informations visibles sur votre profil public
              </CardDescription>
            </div>
          </div>
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
            <label className="block text-sm font-medium text-[#2A1F2D] mb-2.5">
              Description courte
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre salon en quelques mots..."
              className="w-full px-4 py-3 rounded-[16px] border border-[#EDE8F0] bg-white text-[#2A1F2D] placeholder:text-[#b5a8bc] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 min-h-[120px] resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2A1F2D] mb-2.5">
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
            <p className="text-xs text-[#7A6B80] mt-1">
              Votre fiche sera accessible sur : /pro/{slug || 'votre-slug'}
            </p>
          </div>

          <div className="pt-4 border-t border-[#EDE8F0]">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-[#2A1F2D] mb-1">
                  Afficher dans la recherche
                </label>
                <p className="text-xs text-[#7A6B80]">
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
            className="btn-gradient rounded-full px-6 text-sm font-bold shadow-[0_4px_16px_rgba(200,109,215,0.3)]"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer ma fiche'}
          </Button>
        </div>
      </Card>

      {/* Card 3: Réseaux sociaux */}
      <Card className="rounded-[24px] shadow-[0_4px_20px_rgba(20,0,50,0.04)] border border-primary/8 p-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F0F7] flex items-center justify-center text-sm">🔗</div>
            <div>
              <CardTitle>Réseaux sociaux</CardTitle>
              <CardDescription>
                Ajoutez vos liens pour renforcer votre visibilité
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-4 mt-6">
          {/* Bloc informatif Portfolio */}
          <div className="bg-primary/5 border border-primary/10 rounded-[16px] p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center text-sm flex-shrink-0">📸</div>
            <div>
              <h3 className="text-sm font-bold text-[#2A1F2D] mb-0.5">Portfolio</h3>
              <p className="text-xs text-[#8a7a92] leading-relaxed">
                Les photos sont temporairement disponibles via vos réseaux.
                Ajoutez votre lien Instagram pour que vos clientes puissent voir vos réalisations.
              </p>
            </div>
          </div>

          <div>
            <Input
              label="Instagram"
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
            />
            <p className="text-xs text-[#7A6B80] mt-1.5 ml-1">
              Ex: https://instagram.com/moncompte
            </p>
          </div>

          <Input
            label="TikTok"
            type="url"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="https://tiktok.com/@..."
          />
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSaveSocials}
            disabled={saving}
            className="btn-gradient rounded-full px-6 text-sm font-bold shadow-[0_4px_16px_rgba(200,109,215,0.3)]"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </Card>

      {/* Card 4: Galerie photos */}
      <Card className="rounded-[24px] shadow-[0_4px_20px_rgba(20,0,50,0.04)] border border-primary/8 p-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F0F7] flex items-center justify-center text-sm">📸</div>
            <div>
              <CardTitle>Galerie photos</CardTitle>
              <CardDescription>
                Les photos améliorent votre visibilité et vos réservations
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="mt-6">
          {PHOTOS_ENABLED ? (
            <>
              {/* Upload zone */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={uploadState === "uploading"}
                  className="sr-only"
                  id="gallery-upload"
                />
                <label
                  htmlFor="gallery-upload"
                  className="block"
                  onDragOver={(e) => {
                    e.preventDefault()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFileUpload(e.dataTransfer.files)
                  }}
                >
                  <div className="border-2 border-dashed border-primary/15 rounded-[20px] p-8 text-center cursor-pointer hover:border-primary/30 hover:bg-primary/3 transition-all">
                    <div className="w-12 h-12 rounded-[14px] bg-[#F5F0F7] flex items-center justify-center text-2xl mx-auto mb-3">📸</div>
                    <p className="text-sm text-[#2A1F2D] font-medium mb-1">
                      Cliquez ou glissez-déposez vos photos ici
                    </p>
                    <p className="text-xs text-[#b5a8bc]">
                      Formats acceptés : JPG, PNG (max 2MB par image)
                    </p>
                  </div>
                </label>
                <div className="mt-4 flex gap-2">
                  <label htmlFor="gallery-upload" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadState === "uploading"}
                      className="rounded-[32px] w-full"
                    >
                      {uploadState === "uploading" ? 'Upload en cours...' : 'Choisir des photos'}
                    </Button>
                  </label>
                  {uploadState === "uploading" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelUpload}
                      className="btn-gradient rounded-full px-6 text-sm font-bold shadow-[0_4px_16px_rgba(200,109,215,0.3)]"
                    >
                      Annuler upload
                    </Button>
                  )}
                </div>
                {/* Barre de progression */}
                {uploadState === "uploading" && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#7A6B80]">Progression</span>
                      <span className="text-sm font-medium text-[#2A1F2D]">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-[#EDE8F0] rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {uploadStatus && (
                  <div className="mt-2 text-sm text-[#7A6B80]">
                    {uploadStatus}
                  </div>
                )}
                {/* Debug panel */}
                {debug && (
                  <div className="mt-4 p-4 bg-background border border-[#EDE8F0] rounded-lg text-xs font-mono">
                    <div className="font-semibold mb-2 text-[#7A6B80]">🔍 Debug Upload</div>
                    <div className="space-y-1 text-[#7A6B80]">
                      <div><strong>Step:</strong> {debug.step}</div>
                      {debug.info && (
                        <>
                          {debug.info.uid && <div><strong>UID:</strong> {debug.info.uid}</div>}
                          {debug.info.bucket && <div><strong>Bucket:</strong> {debug.info.bucket}</div>}
                          {debug.info.path && <div><strong>Path:</strong> {debug.info.path}</div>}
                          {debug.info.progress !== undefined && <div><strong>Progress:</strong> {debug.info.progress}%</div>}
                        </>
                      )}
                      {debug.error && (
                        <div className="text-red-600">
                          <div><strong>Error Code:</strong> {debug.error.code || "N/A"}</div>
                          <div><strong>Error Message:</strong> {debug.error.message || "N/A"}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mb-6">
              <div className="border-2 border-dashed border-primary/10 rounded-[20px] p-8 text-center bg-[#FDFBFE]">
                <div className="w-14 h-14 rounded-[16px] bg-[#F5F0F7] flex items-center justify-center text-2xl mx-auto mb-3">📸</div>
                <p className="text-sm font-bold text-[#2A1F2D] mb-1">
                  Photos bientôt disponibles
                </p>
                <p className="text-xs text-[#8a7a92]">
                  Nous finalisons cette fonctionnalité. Vous pourrez bientôt ajouter vos photos ici.
                </p>
              </div>
            </div>
          )}

          {/* Gallery grid */}
          {PHOTOS_ENABLED && (galleryImages.length > 0 || pendingPreviews.length > 0) ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pendingPreviews.map((p) => (
                <div key={p.tempId} className="relative overflow-hidden rounded-[24px]">
                  <img
                    src={p.url}
                    alt="Aperçu"
                    className="w-full h-48 object-cover rounded-[24px] opacity-80"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="text-white text-sm">Upload…</div>
                  </div>
                </div>
              ))}
              {galleryImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-[24px]"
                  />
                  <button
                    onClick={() => handleDeleteImage(imageUrl)}
                    disabled={uploadState === "uploading"}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : PHOTOS_ENABLED ? (
            <p className="text-sm text-[#7A6B80] text-center py-8">
              Aucune photo pour le moment
            </p>
          ) : null}
        </div>
      </Card>
    </motion.div>
  )
}
