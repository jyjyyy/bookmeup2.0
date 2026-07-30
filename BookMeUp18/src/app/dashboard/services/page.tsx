"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/motion"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  Euro,
  Scissors,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import type { Service } from "@/lib/types"

type ServiceFormData = {
  name: string
  description: string
  price: string
  duration: string
  category: string
}

const EMPTY_FORM: ServiceFormData = {
  name: "",
  description: "",
  price: "",
  duration: "30",
  category: "",
}

const CATEGORIES = [
  "Coiffure",
  "Coloration",
  "Soins capillaires",
  "Esthétique",
  "Manucure",
  "Maquillage",
  "Massage",
  "Épilation",
  "Autre",
]

const DURATIONS = [15, 30, 45, 60, 75, 90, 120]

export default function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const fetchServices = useCallback(async () => {
    if (!user) return
    try {
      const q = query(
        collection(db, "services"),
        where("pro_id", "==", user.uid)
      )
      const snap = await getDocs(q)
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Service))
        .sort((a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1))
      setServices(data)
    } catch (err) {
      console.error("Fetch services error:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError("")
    setShowForm(true)
  }

  function openEdit(service: Service) {
    setForm({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category || "",
    })
    setEditingId(service.id)
    setError("")
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError("")
  }

  async function handleSave() {
    if (!user) return
    if (!form.name.trim()) { setError("Le nom est requis"); return }
    if (!form.price || parseFloat(form.price) < 0) { setError("Le prix doit être un nombre positif"); return }

    setSaving(true)
    setError("")

    try {
      const data = {
        pro_id: user.uid,
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        duration: parseInt(form.duration),
        category: form.category || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }

      if (editingId) {
        await updateDoc(doc(db, "services", editingId), data)
      } else {
        await addDoc(collection(db, "services"), {
          ...data,
          created_at: new Date().toISOString(),
        })
      }

      closeForm()
      await fetchServices()
    } catch (err) {
      console.error("Save service error:", err)
      setError("Erreur lors de la sauvegarde. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(service: Service) {
    try {
      await updateDoc(doc(db, "services", service.id), {
        is_active: !service.is_active,
        updated_at: new Date().toISOString(),
      })
      await fetchServices()
    } catch (err) {
      console.error("Toggle service error:", err)
    }
  }

  async function handleDelete(serviceId: string) {
    setDeletingId(serviceId)
    try {
      await deleteDoc(doc(db, "services", serviceId))
      await fetchServices()
    } catch (err) {
      console.error("Delete service error:", err)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <ServicesSkeleton />
  }

  const activeCount = services.filter((s) => s.is_active).length
  const inactiveCount = services.filter((s) => !s.is_active).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Mes services
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              {activeCount} actif{activeCount > 1 ? "s" : ""}
              {inactiveCount > 0 && ` · ${inactiveCount} inactif${inactiveCount > 1 ? "s" : ""}`}
            </p>
          </div>
          <Button onClick={openCreate} size="md">
            <Plus className="h-4 w-4" />
            Ajouter un service
          </Button>
        </div>
      </FadeIn>

      {/* Form modal/overlay */}
      {showForm && (
        <FadeIn>
          <Card className="border-2 border-[var(--border-accent)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editingId ? "Modifier le service" : "Nouveau service"}
              </CardTitle>
              <button
                onClick={closeForm}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nom du service *"
                placeholder="Ex : Coupe femme, Balayage, Soin visage..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Description
                </label>
                <textarea
                  className="w-full rounded-[var(--radius-md)] px-4 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-2 border-[var(--border-default)] placeholder:text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--border-subtle)] focus:border-[var(--border-accent)] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Décrivez votre prestation..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prix (€) *"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="35"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    Durée
                  </label>
                  <select
                    className="h-11 w-full rounded-[var(--radius-md)] px-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-2 border-[var(--border-default)] transition-colors duration-200 hover:border-[var(--border-subtle)] focus:border-[var(--border-accent)] focus:outline-none"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  >
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? d % 60 : ""}` : `${d} min`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Catégorie
                </label>
                <select
                  className="h-11 w-full rounded-[var(--radius-md)] px-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-2 border-[var(--border-default)] transition-colors duration-200 hover:border-[var(--border-subtle)] focus:border-[var(--border-accent)] focus:outline-none"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Sans catégorie</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-error bg-error/5 rounded-[var(--radius-md)] p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Enregistrer" : "Créer le service"}
                </Button>
                <Button variant="ghost" onClick={closeForm}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Services list */}
      {services.length === 0 && !showForm ? (
        <FadeIn>
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
                  <Scissors className="h-7 w-7 text-[var(--text-muted)]" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-1">
                  Aucun service
                </h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mb-6">
                  Commencez par ajouter vos prestations. Vos clientes pourront ensuite les réserver en ligne.
                </p>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Ajouter mon premier service
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerContainer className="space-y-3" staggerDelay={0.04}>
          {services.map((service) => (
            <StaggerItem key={service.id}>
              <ServiceCard
                service={service}
                onEdit={() => openEdit(service)}
                onToggle={() => handleToggleActive(service)}
                onDelete={() => handleDelete(service.id)}
                deleting={deletingId === service.id}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}

/* ── Sub-components ── */

function ServiceCard({
  service,
  onEdit,
  onToggle,
  onDelete,
  deleting,
}: {
  service: Service
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  return (
    <Card className={!service.is_active ? "opacity-60" : ""}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-terracotta/10 flex items-center justify-center shrink-0">
            <Scissors className="h-5 w-5 text-terracotta" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {service.name}
              </h3>
              {service.category && (
                <Badge variant="outline">{service.category}</Badge>
              )}
              {!service.is_active && (
                <Badge variant="warning">Inactif</Badge>
              )}
            </div>
            {service.description && (
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">
                {service.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <Euro className="h-3.5 w-3.5" />
                {service.price} €
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {service.duration >= 60
                  ? `${Math.floor(service.duration / 60)}h${service.duration % 60 ? service.duration % 60 : ""}`
                  : `${service.duration} min`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggle}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              title={service.is_active ? "Désactiver" : "Activer"}
            >
              {service.is_active ? (
                <ToggleRight className="h-5 w-5 text-sage" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={onEdit}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              title="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </button>

            {showConfirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onDelete(); setShowConfirmDelete(false) }}
                  disabled={deleting}
                  className="p-2 rounded-[var(--radius-md)] text-error hover:bg-error/10 transition-colors"
                  title="Confirmer la suppression"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  title="Annuler"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-error/10 hover:text-error transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ServicesSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div>
          <div className="h-8 w-40 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
          <div className="h-4 w-24 bg-[var(--bg-muted)] rounded mt-2" />
        </div>
        <div className="h-11 w-44 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
      ))}
    </div>
  )
}
