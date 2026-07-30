"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/motion"
import Link from "next/link"
import {
  Sparkles,
  MapPin,
  Phone,
  Star,
  Clock,
  Euro,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  User,
  Mail,
  Loader2,
  ArrowLeft,
  Instagram,
  Globe,
  Facebook,
  CheckCircle2,
  Copy,
} from "lucide-react"
import type { ProProfile, Service, Availability, Booking } from "@/lib/types"
import { DAYS_FR } from "@/lib/types"

/* ── Types internes ── */
type BookingStep = "services" | "date" | "time" | "info" | "confirm" | "success"

interface BookingForm {
  client_name: string
  client_email: string
  client_phone: string
}

/* ── Constantes ── */
const EMPTY_FORM: BookingForm = {
  client_name: "",
  client_email: "",
  client_phone: "",
}

export default function PublicBookingPage() {
  const params = useParams()
  const slug = params.slug as string

  // Data
  const [pro, setPro] = useState<(ProProfile & { uid: string }) | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [existingBookings, setExistingBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Booking flow
  const [step, setStep] = useState<BookingStep>("services")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date())

  /* ── Fetch pro data ── */
  useEffect(() => {
    async function fetchPro() {
      try {
        // Find pro by slug
        const q = query(collection(db, "pros"), where("slug", "==", slug))
        const snap = await getDocs(q)
        if (snap.empty) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const proDoc = snap.docs[0]
        const proData = { uid: proDoc.id, ...proDoc.data() } as ProProfile & { uid: string }
        setPro(proData)

        // Fetch services
        const servicesQ = query(
          collection(db, "services"),
          where("pro_id", "==", proDoc.id),
          where("is_active", "==", true)
        )
        const servicesSnap = await getDocs(servicesQ)
        setServices(
          servicesSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Service))
            .sort((a, b) => a.price - b.price)
        )

        // Fetch availability
        const availRef = doc(db, "availability", proDoc.id)
        const availSnap = await getDoc(availRef)
        if (availSnap.exists()) {
          setAvailability(availSnap.data().schedule || [])
        }
      } catch (err) {
        console.error("Fetch pro error:", err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchPro()
  }, [slug])

  /* ── Fetch bookings for selected month ── */
  useEffect(() => {
    if (!pro) return
    async function fetchBookings() {
      const y = calendarDate.getFullYear()
      const m = calendarDate.getMonth()
      const start = `${y}-${String(m + 1).padStart(2, "0")}-01`
      const end = `${y}-${String(m + 1).padStart(2, "0")}-31`
      try {
        const q = query(
          collection(db, "bookings"),
          where("pro_id", "==", pro!.uid),
          where("date", ">=", start),
          where("date", "<=", end),
          where("status", "in", ["confirmed", "pending"])
        )
        const snap = await getDocs(q)
        setExistingBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)))
      } catch (err) {
        console.error("Fetch bookings error:", err)
      }
    }
    fetchBookings()
  }, [pro, calendarDate])

  /* ── Available time slots for selected date ── */
  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return []

    const dateObj = new Date(selectedDate + "T00:00:00")
    const dayOfWeek = dateObj.getDay() // 0=dim
    const dayAvail = availability.find((a) => a.day === dayOfWeek)

    if (!dayAvail || !dayAvail.enabled || dayAvail.slots.length === 0) return []

    const duration = selectedService.duration
    const dayBookings = existingBookings.filter((b) => b.date === selectedDate)

    const slots: string[] = []

    for (const slot of dayAvail.slots) {
      const [startH, startM] = slot.start.split(":").map(Number)
      const [endH, endM] = slot.end.split(":").map(Number)
      const slotStartMin = startH * 60 + startM
      const slotEndMin = endH * 60 + endM

      // Generate slots every 15 min
      for (let t = slotStartMin; t + duration <= slotEndMin; t += 15) {
        const h = Math.floor(t / 60)
        const m = t % 60
        const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
        const endT = t + duration
        const endTimeStr = `${Math.floor(endT / 60).toString().padStart(2, "0")}:${(endT % 60).toString().padStart(2, "0")}`

        // Check conflicts
        const conflict = dayBookings.some((b) => {
          const [bh, bm] = b.start_time.split(":").map(Number)
          const [beh, bem] = b.end_time.split(":").map(Number)
          const bStart = bh * 60 + bm
          const bEnd = beh * 60 + bem
          return t < bEnd && endT > bStart
        })

        if (!conflict) {
          slots.push(timeStr)
        }
      }
    }

    // Filter past slots for today
    const today = new Date().toISOString().split("T")[0]
    if (selectedDate === today) {
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes() + 30 // 30 min buffer
      return slots.filter((s) => {
        const [h, m] = s.split(":").map(Number)
        return h * 60 + m >= nowMin
      })
    }

    return slots
  }, [selectedDate, selectedService, availability, existingBookings])

  /* ── Submit booking ── */
  async function handleSubmit() {
    if (!pro || !selectedService || !selectedDate || !selectedTime) return
    if (!form.client_name.trim()) { setError("Votre nom est requis"); return }
    if (!form.client_email.trim() || !form.client_email.includes("@")) {
      setError("Un email valide est requis")
      return
    }
    if (!form.client_phone.trim()) { setError("Votre téléphone est requis"); return }

    setSubmitting(true)
    setError("")

    try {
      const endMin =
        selectedTime.split(":").map(Number).reduce((h, m) => h * 60 + m, 0) +
        selectedService.duration
      const endTime = `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`

      const bookingData = {
        pro_id: pro.uid,
        service_id: selectedService.id,
        client_name: form.client_name.trim(),
        client_email: form.client_email.trim().toLowerCase(),
        client_phone: form.client_phone.trim(),
        date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        status: "pending",
        pricing_snapshot: {
          label: selectedService.name,
          price: selectedService.price,
          duration: selectedService.duration,
        },
        created_at: new Date().toISOString(),
      }

      const ref = await addDoc(collection(db, "bookings"), bookingData)
      setBookingId(ref.id)
      setStep("success")
    } catch (err) {
      console.error("Submit booking error:", err)
      setError("Erreur lors de la réservation. Réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Render ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Chargement...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-terracotta mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">
            Page introuvable
          </h1>
          <p className="text-[var(--text-muted)] mb-6">
            Ce professionnel n&apos;existe pas ou a désactivé sa page.
          </p>
          <Button variant="secondary" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!pro) return null

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <Sparkles className="h-5 w-5 text-terracotta" />
            <span className="font-heading text-lg font-bold text-[var(--text-primary)]">BookMeUp</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Pro profile header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar placeholder */}
            <div className="w-24 h-24 rounded-[var(--radius-lg)] bg-terracotta/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-10 w-10 text-terracotta" />
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                {pro.business_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--text-secondary)]">
                {pro.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {pro.city}
                  </span>
                )}
                {pro.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    {pro.rating} ({pro.review_count} avis)
                  </span>
                )}
              </div>
              {pro.description && (
                <p className="text-sm text-[var(--text-muted)] mt-3 max-w-lg">
                  {pro.description}
                </p>
              )}
              {/* Socials */}
              <div className="flex items-center gap-3 mt-3">
                {pro.socials?.instagram && (
                  <a
                    href={`https://instagram.com/${pro.socials.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {pro.socials?.facebook && (
                  <a
                    href={pro.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {pro.socials?.website && (
                  <a
                    href={pro.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Step indicator */}
        {step !== "success" && (
          <FadeIn delay={0.05}>
            <div className="flex items-center gap-2">
              {(["services", "date", "time", "info", "confirm"] as BookingStep[]).map((s, idx) => {
                const steps: BookingStep[] = ["services", "date", "time", "info", "confirm"]
                const currentIdx = steps.indexOf(step)
                const thisIdx = idx
                const labels = ["Service", "Date", "Heure", "Infos", "Confirmer"]
                return (
                  <div key={s} className="flex items-center gap-2">
                    {idx > 0 && (
                      <div className={`w-6 h-0.5 ${thisIdx <= currentIdx ? "bg-terracotta" : "bg-[var(--border-default)]"}`} />
                    )}
                    <div
                      className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                        thisIdx < currentIdx
                          ? "bg-terracotta/10 text-terracotta"
                          : thisIdx === currentIdx
                          ? "bg-terracotta text-white"
                          : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                      }`}
                    >
                      {thisIdx < currentIdx ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                      <span className="hidden sm:inline">{labels[idx]}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </FadeIn>
        )}

        {/* ────────── STEP 1 : Services ────────── */}
        {step === "services" && (
          <FadeIn>
            <div>
              <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-4">
                Choisissez une prestation
              </h2>
              {services.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-[var(--text-muted)]">
                      Aucun service disponible pour le moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <StaggerContainer className="space-y-3" staggerDelay={0.04}>
                  {services.map((service) => (
                    <StaggerItem key={service.id}>
                      <button
                        onClick={() => {
                          setSelectedService(service)
                          setStep("date")
                        }}
                        className={`w-full text-left p-4 rounded-[var(--radius-md)] border-2 transition-all hover:shadow-[var(--shadow-soft)] ${
                          selectedService?.id === service.id
                            ? "border-terracotta bg-terracotta/5"
                            : "border-[var(--border-default)] bg-[var(--bg-secondary)] hover:border-[var(--border-subtle)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {service.duration >= 60
                                  ? `${Math.floor(service.duration / 60)}h${service.duration % 60 || ""}`
                                  : `${service.duration} min`}
                              </span>
                              {service.category && (
                                <Badge variant="outline">{service.category}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-lg font-bold text-terracotta">{service.price} €</p>
                          </div>
                        </div>
                      </button>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>
          </FadeIn>
        )}

        {/* ────────── STEP 2 : Date ────────── */}
        {step === "date" && (
          <FadeIn>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setStep("services")}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                  Choisissez une date
                </h2>
              </div>

              {/* Selected service recap */}
              {selectedService && (
                <div className="mb-4 p-3 bg-terracotta/5 rounded-[var(--radius-md)] border border-terracotta/20 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">{selectedService.name}</span>
                  <span className="text-[var(--text-muted)]">
                    {" "}· {selectedService.duration} min · {selectedService.price} €
                  </span>
                </div>
              )}

              <MiniCalendar
                calendarDate={calendarDate}
                onMonthChange={setCalendarDate}
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d)
                  setSelectedTime(null)
                  setStep("time")
                }}
                availability={availability}
              />
            </div>
          </FadeIn>
        )}

        {/* ────────── STEP 3 : Time ────────── */}
        {step === "time" && (
          <FadeIn>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => { setStep("date"); setSelectedTime(null) }}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                  Choisissez un créneau
                </h2>
              </div>

              {/* Date recap */}
              <div className="mb-4 p-3 bg-terracotta/5 rounded-[var(--radius-md)] border border-terracotta/20 text-sm">
                <span className="font-medium text-[var(--text-primary)]">{selectedService?.name}</span>
                <span className="text-[var(--text-muted)]">
                  {" "}· {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>

              {availableSlots.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--text-muted)]">
                      Aucun créneau disponible ce jour.
                    </p>
                    <Button variant="secondary" size="sm" className="mt-4" onClick={() => setStep("date")}>
                      Choisir une autre date
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        setSelectedTime(time)
                        setStep("info")
                      }}
                      className={`py-3 px-2 rounded-[var(--radius-md)] text-sm font-medium transition-all border-2 ${
                        selectedTime === time
                          ? "border-terracotta bg-terracotta text-white"
                          : "border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-terracotta/50"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* ────────── STEP 4 : Client info ────────── */}
        {step === "info" && (
          <FadeIn>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setStep("time")}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                  Vos coordonnées
                </h2>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <Input
                    label="Nom complet *"
                    placeholder="Marie Dupont"
                    value={form.client_name}
                    onChange={(e) => { setForm({ ...form, client_name: e.target.value }); setError("") }}
                  />
                  <Input
                    label="Email *"
                    type="email"
                    placeholder="marie@exemple.com"
                    value={form.client_email}
                    onChange={(e) => { setForm({ ...form, client_email: e.target.value }); setError("") }}
                  />
                  <Input
                    label="Téléphone *"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={form.client_phone}
                    onChange={(e) => { setForm({ ...form, client_phone: e.target.value }); setError("") }}
                  />

                  {error && (
                    <p className="text-sm text-error">{error}</p>
                  )}

                  <Button onClick={() => {
                    if (!form.client_name.trim()) { setError("Votre nom est requis"); return }
                    if (!form.client_email.trim() || !form.client_email.includes("@")) { setError("Un email valide est requis"); return }
                    if (!form.client_phone.trim()) { setError("Votre téléphone est requis"); return }
                    setError("")
                    setStep("confirm")
                  }} className="w-full">
                    Continuer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        )}

        {/* ────────── STEP 5 : Confirm ────────── */}
        {step === "confirm" && selectedService && selectedDate && selectedTime && (
          <FadeIn>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setStep("info")}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                  Confirmez votre réservation
                </h2>
              </div>

              <Card>
                <CardContent className="p-6 space-y-5">
                  {/* Recap */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-terracotta mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Professionnel</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{pro.business_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-terracotta mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Prestation</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {selectedService.name}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {selectedService.duration} min · {selectedService.price} €
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-terracotta mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Date & heure</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                          {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {selectedTime} —{" "}
                          {(() => {
                            const [h, m] = selectedTime.split(":").map(Number)
                            const endMin = h * 60 + m + selectedService.duration
                            return `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-terracotta mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Vos coordonnées</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{form.client_name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{form.client_email} · {form.client_phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border-default)] pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-[var(--text-secondary)]">Total</span>
                      <span className="text-xl font-bold text-[var(--text-primary)]">{selectedService.price} €</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-4">
                      Le paiement se fera sur place. Votre réservation sera confirmée par le professionnel.
                    </p>

                    {error && <p className="text-sm text-error mb-3">{error}</p>}

                    <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                      {submitting ? "Réservation en cours..." : "Confirmer la réservation"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        )}

        {/* ────────── SUCCESS ────────── */}
        {step === "success" && selectedService && selectedDate && selectedTime && (
          <FadeIn>
            <Card className="border-sage/30 bg-sage/5">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-sage-dark" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Réservation envoyée !
                </h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
                  Votre demande de rendez-vous a été envoyée à <strong>{pro.business_name}</strong>.
                  Vous recevrez une confirmation par email à <strong>{form.client_email}</strong>.
                </p>

                <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-4 text-left max-w-sm mx-auto mb-6 space-y-2">
                  <p className="text-sm">
                    <span className="text-[var(--text-muted)]">Prestation :</span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">{selectedService.name}</span>
                  </p>
                  <p className="text-sm capitalize">
                    <span className="text-[var(--text-muted)]">Date :</span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-[var(--text-muted)]">Heure :</span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">{selectedTime}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-[var(--text-muted)]">Prix :</span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">{selectedService.price} €</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStep("services")
                      setSelectedService(null)
                      setSelectedDate(null)
                      setSelectedTime(null)
                      setForm(EMPTY_FORM)
                      setBookingId(null)
                    }}
                  >
                    Réserver un autre créneau
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/">Retour à l&apos;accueil</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-default)] bg-[var(--bg-secondary)] mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-primary)]">
            <Sparkles className="h-4 w-4 text-terracotta" />
            BookMeUp
          </Link>
          <p>Propulsé par BookMeUp</p>
        </div>
      </footer>
    </div>
  )
}

/* ── Mini Calendar Component ── */

function MiniCalendar({
  calendarDate,
  onMonthChange,
  selectedDate,
  onSelectDate,
  availability,
}: {
  calendarDate: Date
  onMonthChange: (d: Date) => void
  selectedDate: string | null
  onSelectDate: (d: string) => void
  availability: Availability[]
}) {
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days: (number | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [year, month])

  const todayStr = new Date().toISOString().split("T")[0]
  const monthLabel = calendarDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  function isDayAvailable(day: number): boolean {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    // Past dates
    if (dateStr < todayStr) return false
    const dateObj = new Date(dateStr + "T00:00:00")
    const dow = dateObj.getDay()
    const dayAvail = availability.find((a) => a.day === dow)
    return !!dayAvail?.enabled && dayAvail.slots.length > 0
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => onMonthChange(new Date(year, month - 1, 1))}
            className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
            {monthLabel}
          </span>
          <button
            onClick={() => onMonthChange(new Date(year, month + 1, 1))}
            className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-[var(--text-muted)] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={idx} className="aspect-square" />

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const available = isDayAvailable(day)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate

            return (
              <button
                key={idx}
                disabled={!available}
                onClick={() => onSelectDate(dateStr)}
                className={`aspect-square rounded-[var(--radius-sm)] flex items-center justify-center text-sm transition-colors ${
                  isSelected
                    ? "bg-terracotta text-white font-semibold"
                    : available
                    ? isToday
                      ? "bg-terracotta/10 text-terracotta font-semibold hover:bg-terracotta/20"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                    : "text-[var(--text-muted)]/40 cursor-not-allowed"
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-3 text-center">
          Les jours disponibles sont cliquables
        </p>
      </CardContent>
    </Card>
  )
}
