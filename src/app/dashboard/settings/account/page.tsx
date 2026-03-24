'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from 'firebase/storage'
import { db, storage, auth } from '@/lib/firebaseClient'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Loader } from '@/components/ui/loader'
import { generateSlugFromNameAndCity } from '@/lib/slug'
import { PHOTOS_ENABLED } from '@/lib/features'

export default function AccountPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const uploadTaskRef = useRef<UploadTask | null>(null)
  const stuckTimerRef = useRef<NodeJS.Timeout | null>(null)
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

    // Empêcher la sélection d'un nouveau fichier pendant l'upload
    if (uploadState === "uploading") {
      const confirmCancel = window.confirm("Un upload est en cours. Voulez-vous vraiment annuler ?")
      if (!confirmCancel) {
        return
      }
      // Annuler l'upload en cours si l'utilisateur confirme
      if (uploadTaskRef.current) {
        uploadTaskRef.current.cancel()
        uploadTaskRef.current = null
        console.log("[PHOTO] user canceled")
      }
      setUploading(false)
      setUploadProgress(0)
      setUploadState("idle")
      setUploadStatus(null)
      setPendingPreviews([])
      return
    }

    // Logs systématiques - fichier sélectionné
    fileArray.forEach((file) => {
      console.log("[PHOTO] file selected", { name: file.name, size: file.size, type: file.type })
    })
    setDebug({ step: "file_selected", info: { files: fileArray.map(f => ({ name: f.name, size: f.size, type: f.type })) } })

    // Logs systématiques - avant upload
    const currentUid = auth.currentUser?.uid ?? null
    const bucket = storage.app.options.storageBucket
    console.log("[PHOTO] uid", currentUid)
    console.log("[PHOTO] bucket", bucket)
    setDebug({ step: "uid_check", info: { uid: currentUid, bucket } })

    if (!currentUid) {
      setError("Veuillez vous reconnecter puis réessayer.")
      setUploadState("error")
      setDebug({ step: "error", error: { code: "NO_UID", message: "Veuillez vous reconnecter puis réessayer." } })
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    try {
      setUploading(true)
      setError(null)
      setUploadProgress(0)
      setUploadState("idle")
      setUploadStatus(null)

      const uploadItems = fileArray.map((file) => {
        const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const previewUrl = URL.createObjectURL(file)
        return { tempId, file, previewUrl }
      })
      setPendingPreviews((prev) => [
        ...prev,
        ...uploadItems.map(({ tempId, previewUrl }) => ({ tempId, url: previewUrl })),
      ])

      const baseImages = galleryImages
      const newImageUrls: string[] = []
      const failed: Array<{ name: string; message: string; code?: string; tempId: string }> = []
      const MAX_BYTES = 2 * 1024 * 1024
      const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png'])

      for (const item of uploadItems) {
        const file = item.file

        try {
          if (!ALLOWED_TYPES.has(file.type)) {
            throw new Error('Formats acceptés : JPG, PNG')
          }
          if (file.size > MAX_BYTES) {
            throw new Error(`L'image ${file.name} est trop volumineuse (max 2MB)`)
          }

          // Path stable avec sanitizer simple
          const filenameSafe = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          const path = `pros/${currentUid}/photos/${filenameSafe}`
          console.log("[PHOTO] path", path)
          setDebug({ step: "upload_clicked", info: { uid: currentUid, bucket, path, filename: file.name } })

          const storageRef = ref(storage, path)

          // uploadBytesResumable + state_changed obligatoire
          const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type })
          
          // Stocker le task dans la ref au démarrage
          uploadTaskRef.current = uploadTask
          console.log("[PHOTO] upload start")
          setDebug({ step: "task_created", info: { uid: currentUid, bucket, path } })
          
          // Timer pour détecter si progress reste à 0 après 15s
          // Clear any existing timer
          if (stuckTimerRef.current) {
            clearTimeout(stuckTimerRef.current)
          }
          stuckTimerRef.current = setTimeout(() => {
            // Vérifier si le progress est toujours à 0
            setUploadProgress((currentProgress) => {
              if (currentProgress === 0) {
                console.log("[PHOTO] stuck_0_percent - No progress events received")
                setDebug({ step: "stuck_0_percent", error: { code: "STUCK_0_PERCENT", message: "No progress events received after 15s" } })
              }
              return currentProgress
            })
          }, 15000)

          const uploadPromise = new Promise<string>((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
                const bytesTransferred = snap.bytesTransferred
                const totalBytes = snap.totalBytes
                console.log("[PHOTO] progress", pct, bytesTransferred, totalBytes)
                setUploadProgress(pct)
                setUploadState("uploading")
                setDebug({ 
                  step: "state_changed", 
                  info: { 
                    uid: currentUid, 
                    bucket, 
                    path, 
                    progress: pct, 
                    bytesTransferred, 
                    totalBytes 
                  } 
                })
                // Clear stuck timer if progress > 0
                if (pct > 0 && stuckTimerRef.current) {
                  clearTimeout(stuckTimerRef.current)
                  stuckTimerRef.current = null
                }
              },
              (error) => {
                // Log obligatoire dans la callback error
                console.log("[PHOTO] error", error.code, error.message)
                setError(`${error.code}: ${error.message}`)
                setUploading(false)
                setUploadState("error")
                uploadTaskRef.current = null
                if (stuckTimerRef.current) {
                  clearTimeout(stuckTimerRef.current)
                  stuckTimerRef.current = null
                }
                setDebug({ 
                  step: "error", 
                  error: { 
                    code: error.code, 
                    message: error.message 
                  },
                  info: { 
                    uid: currentUid, 
                    bucket, 
                    path, 
                    progress: uploadProgress 
                  } 
                })
                // NE PAS effacer la preview ici
                reject(error)
              },
              async () => {
                try {
                  if (stuckTimerRef.current) {
                    clearTimeout(stuckTimerRef.current)
                    stuckTimerRef.current = null
                  }
                  const url = await getDownloadURL(uploadTask.snapshot.ref)
                  console.log("[PHOTO] success", url)
                  uploadTaskRef.current = null
                  setUploadState("success")
                  setDebug({ 
                    step: "success", 
                    info: { 
                      uid: currentUid, 
                      bucket, 
                      path, 
                      progress: 100, 
                      url 
                    } 
                  })
                  resolve(url)
                } catch (e: any) {
                  if (stuckTimerRef.current) {
                    clearTimeout(stuckTimerRef.current)
                    stuckTimerRef.current = null
                  }
                  uploadTaskRef.current = null
                  setUploadState("error")
                  setDebug({ 
                    step: "error", 
                    error: { 
                      code: e?.code || "GET_URL_ERROR", 
                      message: e?.message || "Failed to get download URL" 
                    },
                    info: { 
                      uid: currentUid, 
                      bucket, 
                      path, 
                      progress: uploadProgress 
                    } 
                  })
                  reject(e)
                }
              }
            )
          })

          const downloadURL = await uploadPromise
          newImageUrls.push(downloadURL)
          
          // Retirer la preview uniquement après succès confirmé
          setPendingPreviews((prev) => prev.filter((p) => p.tempId !== item.tempId))
          try {
            URL.revokeObjectURL(item.previewUrl)
          } catch {
            // ignore
          }
          
          // Ajouter l'image à la galerie
          setGalleryImages((prev) => [...prev, downloadURL])
        } catch (err: any) {
          console.log("[PHOTO] error", err?.code || "unknown", err?.message || "Unknown error")
          failed.push({
            name: file.name,
            message: err?.message || "Erreur lors de l'upload",
            code: err?.code,
            tempId: item.tempId,
          })
          setUploadState("error")
          setDebug({ 
            step: "error", 
            error: { 
              code: err?.code || "unknown", 
              message: err?.message || "Unknown error" 
            },
            info: { 
              uid: currentUid, 
              bucket, 
              path, 
              progress: uploadProgress 
            } 
          })
          // En cas d'erreur, on garde la preview pour que l'utilisateur voie ce qui a échoué
        }
      }

      if (newImageUrls.length > 0) {
        const updatedImages = [...baseImages, ...newImageUrls]
        try {
          await updateDoc(doc(db, 'pros', currentUid), {
            'gallery.images': updatedImages,
            updated_at: serverTimestamp(),
          })
          setGalleryImages(updatedImages)
          setSuccess(`${newImageUrls.length} photo${newImageUrls.length > 1 ? 's' : ''} ajoutée${newImageUrls.length > 1 ? 's' : ''} ✓`)
          setTimeout(() => setSuccess(null), 3000)
        } catch (firestoreErr: any) {
          setGalleryImages(updatedImages)
          setError('Photos envoyées mais erreur d\'enregistrement. Réessayez plus tard.')
          console.error('[PHOTO] Firestore updateDoc failed', firestoreErr?.message)
        }
      }

      // Retirer les previews des fichiers qui ont échoué (après un délai)
      if (failed.length > 0) {
        const first = failed[0]
        const extra = failed.length > 1 ? ` (+${failed.length - 1} autre${failed.length - 1 > 1 ? 's' : ''})` : ''
        setError(`${first.message}${extra}`)
        
        setTimeout(() => {
          setPendingPreviews((prev) => prev.filter((p) => !failed.some((f) => f.tempId === p.tempId)))
          failed.forEach((f) => {
            const item = uploadItems.find((i) => i.tempId === f.tempId)
            if (item) {
              try {
                URL.revokeObjectURL(item.previewUrl)
              } catch {
                // ignore
              }
            }
          })
        }, 5000)
      }
    } catch (err: any) {
      console.log("[PHOTO] error", err?.code || "unknown", err?.message || "Unknown error")
      setError(err?.message || 'Erreur lors de l\'upload')
      setUploadState("error")
      // Ne pas reset le state (preview/file) tant que l'upload est en cours
      // On garde les previews pour que l'utilisateur voie ce qui a échoué
    } finally {
      // Ne reset que si l'upload est vraiment terminé (pas annulé par l'utilisateur)
      if (!uploadTaskRef.current && uploadState !== "uploading") {
        setUploading(false)
        if (uploadState !== "error") {
          setUploadProgress(0)
          setUploadState("idle")
        }
        setUploadStatus(null)
      }
    }
  }

  const handleCancelUpload = () => {
    if (uploadTaskRef.current && uploadState === "uploading") {
      uploadTaskRef.current.cancel()
      uploadTaskRef.current = null
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

      {/* Card 3: Réseaux sociaux */}
      <Card className="rounded-[32px] shadow-bookmeup p-8">
        <CardHeader>
          <CardTitle>Réseaux sociaux</CardTitle>
          <CardDescription>
            Ajoutez vos liens pour renforcer votre visibilité
          </CardDescription>
        </CardHeader>

        <div className="space-y-4 mt-6">
          {/* Bloc informatif Portfolio */}
          <div className="bg-pink-50 border border-pink-200 rounded-[24px] p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-1.5">
              📸 Portfolio
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Les photos sont temporairement disponibles via vos réseaux.
              Ajoutez votre lien Instagram ou Facebook pour que vos clientes puissent voir vos réalisations.
            </p>
          </div>

          <div>
            <Input
              label="Instagram"
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
            />
            <p className="text-xs text-gray-500 mt-1.5 ml-1">
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
            className="rounded-[32px]"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </Card>

      {/* Card 4: Galerie photos */}
      <Card className="rounded-[32px] shadow-bookmeup p-8">
        <CardHeader>
          <CardTitle>Galerie photos</CardTitle>
          <CardDescription>
            Les photos améliorent votre visibilité et vos réservations
          </CardDescription>
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
                  <div className="border-2 border-dashed border-gray-300 rounded-[32px] p-8 text-center cursor-pointer hover:border-primary transition-colors">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-sm text-gray-600 mb-1">
                      Cliquez ou glissez-déposez vos photos ici
                    </p>
                    <p className="text-xs text-gray-500">
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
                      className="rounded-[32px]"
                    >
                      Annuler upload
                    </Button>
                  )}
                </div>
                {/* Barre de progression */}
                {uploadState === "uploading" && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progression</span>
                      <span className="text-sm font-medium text-gray-900">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {uploadStatus && (
                  <div className="mt-2 text-sm text-gray-600">
                    {uploadStatus}
                  </div>
                )}
                {/* Debug panel */}
                {debug && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono">
                    <div className="font-semibold mb-2 text-gray-700">🔍 Debug Upload</div>
                    <div className="space-y-1 text-gray-600">
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
              <div className="border-2 border-dashed border-gray-200 rounded-[32px] p-8 text-center bg-gray-50">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-base font-medium text-gray-700 mb-2">
                  Photos bientôt disponibles
                </p>
                <p className="text-sm text-gray-600">
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
            <p className="text-sm text-gray-500 text-center py-8">
              Aucune photo pour le moment
            </p>
          ) : null}
        </div>
      </Card>
    </motion.div>
  )
}
