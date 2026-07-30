"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/motion"
import {
  Clock,
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  CalendarOff,
} from "lucide-react"
import type { Availability, TimeSlot } from "@/lib/types"
import { DAYS_FR } from "@/lib/types"

const DEFAULT_SLOT: TimeSlot = { start: "09:00", end: "18:00" }

const DEFAULT_AVAILABILITY: Availability[] = [
  { day: 0, enabled: false, slots: [] },
  { day: 1, enabled: true, slots: [{ start: "09:00", end: "19:00" }] },
  { day: 2, enabled: true, slots: [{ start: "09:00", end: "19:00" }] },
  { day: 3, enabled: true, slots: [{ start: "09:00", end: "19:00" }] },
  { day: 4, enabled: true, slots: [{ start: "09:00", end: "19:00" }] },
  { day: 5, enabled: true, slots: [{ start: "09:00", end: "19:00" }] },
  { day: 6, enabled: true, slots: [{ start: "09:00", end: "13:00" }] },
]

const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
  }
}

export default function AvailabilityPage() {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState<Availability[]>(DEFAULT_AVAILABILITY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    async function fetchAvailability() {
      try {
        const ref = doc(db, "availability", user!.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data()
          if (data.schedule) {
            setSchedule(data.schedule)
          }
        }
      } catch (err) {
        console.error("Fetch availability error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAvailability()
  }, [user])

  function toggleDay(dayIndex: number) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === dayIndex
          ? {
              ...d,
              enabled: !d.enabled,
              slots: !d.enabled && d.slots.length === 0 ? [{ ...DEFAULT_SLOT }] : d.slots,
            }
          : d
      )
    )
    setSaved(false)
  }

  function updateSlot(dayIndex: number, slotIndex: number, field: "start" | "end", value: string) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === dayIndex
          ? {
              ...d,
              slots: d.slots.map((s, i) =>
                i === slotIndex ? { ...s, [field]: value } : s
              ),
            }
          : d
      )
    )
    setSaved(false)
  }

  function addSlot(dayIndex: number) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === dayIndex
          ? {
              ...d,
              slots: [...d.slots, { start: "14:00", end: "18:00" }],
            }
          : d
      )
    )
    setSaved(false)
  }

  function removeSlot(dayIndex: number, slotIndex: number) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === dayIndex
          ? {
              ...d,
              slots: d.slots.filter((_, i) => i !== slotIndex),
            }
          : d
      )
    )
    setSaved(false)
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await setDoc(doc(db, "availability", user.uid), {
        pro_id: user.uid,
        schedule,
        updated_at: new Date().toISOString(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Save availability error:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AvailabilitySkeleton />
  }

  // Reorder: Monday first (1,2,3,4,5,6,0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Disponibilités
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Configurez vos créneaux d&apos;ouverture hebdomadaires.
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

      {/* Schedule */}
      <StaggerContainer className="space-y-3" staggerDelay={0.04}>
        {orderedDays.map((dayNum) => {
          const day = schedule.find((d) => d.day === dayNum)!
          return (
            <StaggerItem key={dayNum}>
              <Card>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* Toggle + day name */}
                    <button
                      onClick={() => toggleDay(dayNum)}
                      className={`mt-0.5 w-10 h-6 rounded-full relative transition-colors duration-200 shrink-0 ${
                        day.enabled
                          ? "bg-terracotta"
                          : "bg-[var(--bg-muted)]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                          day.enabled ? "translate-x-4 left-0.5" : "left-0.5 translate-x-0"
                        }`}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${day.enabled ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                        {DAYS_FR[dayNum]}
                      </p>

                      {day.enabled ? (
                        <div className="mt-3 space-y-2">
                          {day.slots.map((slot, si) => (
                            <div key={si} className="flex items-center gap-2">
                              <select
                                className="h-9 rounded-[var(--radius-sm)] px-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
                                value={slot.start}
                                onChange={(e) => updateSlot(dayNum, si, "start", e.target.value)}
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <span className="text-xs text-[var(--text-muted)]">à</span>
                              <select
                                className="h-9 rounded-[var(--radius-sm)] px-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
                                value={slot.end}
                                onChange={(e) => updateSlot(dayNum, si, "end", e.target.value)}
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              {day.slots.length > 1 && (
                                <button
                                  onClick={() => removeSlot(dayNum, si)}
                                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-error hover:bg-error/5 transition-colors"
                                  title="Supprimer ce créneau"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addSlot(dayNum)}
                            className="flex items-center gap-1.5 text-xs text-terracotta hover:text-terracotta/80 transition-colors mt-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter un créneau
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                          <CalendarOff className="h-3.5 w-3.5" />
                          Fermé
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          )
        })}
      </StaggerContainer>

      {/* Info */}
      <FadeIn delay={0.3}>
        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] p-4">
          <p className="font-medium text-[var(--text-secondary)] mb-1">Bon à savoir</p>
          <p>
            Ces créneaux définissent vos heures d&apos;ouverture générales.
            Vous pouvez ajouter des exceptions (congés, fermetures exceptionnelles)
            depuis le calendrier.
          </p>
        </div>
      </FadeIn>
    </div>
  )
}

function AvailabilitySkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div>
          <div className="h-8 w-48 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
          <div className="h-4 w-64 bg-[var(--bg-muted)] rounded mt-2" />
        </div>
        <div className="h-11 w-36 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
      </div>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="h-20 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
      ))}
    </div>
  )
}
