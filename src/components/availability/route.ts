// src/app/api/availability/route.ts

import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const proId = url.searchParams.get("pro_id") ?? url.searchParams.get("proId")
    const serviceId = url.searchParams.get("service_id")
    const date = url.searchParams.get("date")

    if (!proId || !serviceId || !date) {
      return NextResponse.json(
        { error: "Missing pro_id, service_id or date" },
        { status: 400 }
      )
    }

    // Load service info (duration)
    const serviceDoc = await adminDb.collection("services").doc(serviceId).get()

    if (!serviceDoc.exists) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const service = serviceDoc.data()
    const duration = service.duration ?? 30

    // Determine dayOfWeek
    const dayOfWeek = new Date(date + "T00:00:00").getDay()

    const availabilityDoc = await adminDb
      .collection("pros")
      .doc(proId)
      .collection("availability")
      .doc(dayOfWeek.toString())
      .get()

    if (!availabilityDoc.exists) {
      return NextResponse.json({ slots: [] }, { status: 200 })
    }

    const availability = availabilityDoc.data()
    const slots = availability.slots ?? []
    const step = availability.step ?? 30

    let generatedSlots: { time: string; available: boolean }[] = []

    for (const slot of slots) {
      const start = timeToMinutes(slot.start)
      const end = timeToMinutes(slot.end)

      for (let t = start; t + duration <= end; t += step) {
        const finalTime = minutesToTime(t)
        generatedSlots.push({ time: finalTime, available: true })
      }
    }

    // Load bookings for the date
    const bookingsSnap = await adminDb
      .collection("bookings")
      .where("proId", "==", proId)
      .where("date", "==", date)
      .get()

    const bookings = bookingsSnap.docs.map((d) => d.data())

    // Check conflicts
    generatedSlots = generatedSlots.map((slot) => {
      const slotStart = timeToMinutes(slot.time)
      const slotEnd = slotStart + duration

      const conflict = bookings.some((b) => {
        const bStart = timeToMinutes(b.time)
        const bEnd = bStart + (b.duration ?? duration)
        return !(slotEnd <= bStart || slotStart >= bEnd)
      })

      return { ...slot, available: !conflict }
    })

    return NextResponse.json({ slots: generatedSlots })

  } catch (error) {
    console.error("[Availability] ERROR", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}