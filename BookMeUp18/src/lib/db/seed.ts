/**
 * BookMeUp18 — Seed Script
 *
 * Crée des données de test pour pouvoir utiliser l'app immédiatement.
 * Usage : npx tsx src/lib/db/seed.ts
 *
 * Pré-requis : .env.local avec les variables Firebase Admin
 */

import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore, Timestamp } from "firebase-admin/firestore"
import * as dotenv from "dotenv"
import { resolve } from "path"

dotenv.config({ path: resolve(process.cwd(), ".env.local") })

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  }),
})

const db = getFirestore(app)

async function seed() {
  console.log("🌱 Seeding BookMeUp18...")

  const now = Timestamp.now()

  // ── Pro de démo ──
  const demoProId = "demo-pro-001"
  const demoProProfile = {
    email: "mila@bookmeup.fr",
    name: "Mila Beauty",
    role: "pro",
    city: "Lyon",
    phone: "06 12 34 56 78",
    created_at: now,
    updated_at: now,
  }

  await db.doc(`profiles/${demoProId}`).set(demoProProfile)
  console.log("  ✓ Profil pro créé")

  await db.doc(`pros/${demoProId}`).set({
    slug: "mila-beauty-lyon",
    business_name: "Mila Beauty",
    description:
      "Institut de beauté au cœur de Lyon. Soins du visage, manucure, massage. Un moment de douceur rien que pour vous.",
    city: "Lyon",
    address: "12 Rue de la République, 69002 Lyon",
    phone: "06 12 34 56 78",
    plan: "pro",
    gallery: { images: [] },
    socials: {
      instagram: "https://instagram.com/milabeauty",
    },
    rating: 4.8,
    review_count: 42,
    show_in_search: true,
    created_at: now,
    updated_at: now,
  })
  console.log("  ✓ Profil pro détaillé créé")

  // ── Services ──
  const services = [
    {
      name: "Soin du visage Éclat",
      description: "Nettoyage en profondeur, gommage, masque et hydratation. Votre peau retrouve sa luminosité.",
      price: 65,
      duration: 60,
      category: "Soins visage",
    },
    {
      name: "Manucure semi-permanent",
      description: "Pose de vernis semi-permanent avec soin des cuticules et limage.",
      price: 35,
      duration: 45,
      category: "Ongles",
    },
    {
      name: "Massage relaxant corps entier",
      description: "Massage aux huiles essentielles pour une détente absolue.",
      price: 80,
      duration: 75,
      category: "Massages",
    },
    {
      name: "Épilation sourcils",
      description: "Restructuration et épilation des sourcils au fil ou à la cire.",
      price: 12,
      duration: 15,
      category: "Épilation",
    },
    {
      name: "Beauté des pieds",
      description: "Soin complet des pieds : bain, gommage, soin des ongles, hydratation.",
      price: 40,
      duration: 50,
      category: "Soins corps",
    },
  ]

  for (const svc of services) {
    const ref = db.collection("services").doc()
    await ref.set({
      ...svc,
      pro_id: demoProId,
      is_active: true,
      created_at: now,
      updated_at: now,
    })
  }
  console.log(`  ✓ ${services.length} services créés`)

  // ── Disponibilités ──
  const defaultSlots = [{ start: "09:00", end: "12:30" }, { start: "14:00", end: "19:00" }]
  for (let day = 1; day <= 5; day++) {
    await db.doc(`pros/${demoProId}/availability/${day}`).set({
      enabled: true,
      slots: defaultSlots,
    })
  }
  // Samedi matin uniquement
  await db.doc(`pros/${demoProId}/availability/6`).set({
    enabled: true,
    slots: [{ start: "09:00", end: "13:00" }],
  })
  // Dimanche fermé
  await db.doc(`pros/${demoProId}/availability/0`).set({
    enabled: false,
    slots: [],
  })
  console.log("  ✓ Disponibilités configurées (lun-ven 9h-19h, sam 9h-13h)")

  // ── Bookings de démo ──
  const today = new Date()
  const bookings = [
    {
      client_name: "Sophie Martin",
      client_email: "sophie.martin@email.com",
      client_phone: "06 98 76 54 32",
      date: formatDate(today),
      start_time: "10:00",
      end_time: "11:00",
      status: "confirmed",
      pricing_snapshot: { label: "Soin du visage Éclat", price: 65, duration: 60 },
    },
    {
      client_name: "Léa Dupont",
      client_email: "lea.dupont@email.com",
      client_phone: "06 11 22 33 44",
      date: formatDate(today),
      start_time: "14:30",
      end_time: "15:15",
      status: "confirmed",
      pricing_snapshot: { label: "Manucure semi-permanent", price: 35, duration: 45 },
    },
    {
      client_name: "Emma Bernard",
      client_email: "emma.b@email.com",
      client_phone: "06 55 44 33 22",
      date: formatDate(addDays(today, 1)),
      start_time: "11:00",
      end_time: "12:15",
      status: "confirmed",
      pricing_snapshot: { label: "Massage relaxant corps entier", price: 80, duration: 75 },
    },
  ]

  for (const booking of bookings) {
    const ref = db.collection("bookings").doc()
    await ref.set({
      ...booking,
      pro_id: demoProId,
      service_id: "demo",
      created_at: now,
    })
  }
  console.log(`  ✓ ${bookings.length} réservations de démo créées`)

  // ── Notifications ──
  const notifications = [
    {
      type: "booking",
      title: "Nouveau RDV",
      message: "Sophie Martin a réservé un Soin du visage Éclat pour aujourd'hui à 10h.",
      read: false,
    },
    {
      type: "booking",
      title: "Nouveau RDV",
      message: "Léa Dupont a réservé une Manucure semi-permanent pour aujourd'hui à 14h30.",
      read: true,
    },
  ]

  for (const notif of notifications) {
    await db.collection("notifications").add({
      ...notif,
      pro_id: demoProId,
      created_at: now,
    })
  }
  console.log(`  ✓ ${notifications.length} notifications créées`)

  console.log("\n✅ Seed terminé avec succès !")
  console.log(`   Pro de démo : Mila Beauty (${demoProId})`)
  console.log("   Page publique : /pro/mila-beauty-lyon")
  process.exit(0)
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0]
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

seed().catch((err) => {
  console.error("❌ Erreur seed:", err)
  process.exit(1)
})
