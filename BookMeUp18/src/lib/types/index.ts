/* ─────────────────────────────────────────────
   BookMeUp18 — Types centraux
   ───────────────────────────────────────────── */

export type UserRole = "client" | "pro"

export type SubscriptionPlan = "starter" | "pro" | "premium"
export type SubscriptionStatus = "active" | "trialing" | "cancelled" | "past_due" | "none"

export interface UserProfile {
  uid: string
  email: string
  name: string
  role: UserRole
  city?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface ProProfile {
  uid: string
  slug: string
  business_name: string
  description: string
  city: string
  address?: string
  phone?: string
  plan: SubscriptionPlan
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_subscription_status?: SubscriptionStatus
  gallery: {
    images: string[]
  }
  socials?: {
    instagram?: string
    facebook?: string
    website?: string
  }
  rating?: number
  review_count?: number
  show_in_search: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  pro_id: string
  name: string
  description: string
  price: number
  duration: number // minutes
  category?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  pro_id: string
  client_id?: string
  service_id: string
  client_name: string
  client_email: string
  client_phone: string
  date: string // YYYY-MM-DD
  start_time: string // HH:mm
  end_time: string // HH:mm
  status: "pending" | "confirmed" | "cancelled" | "completed"
  pricing_snapshot: {
    label: string
    price: number
    duration: number
  }
  google_event_id?: string
  cancelled_at?: string
  cancelled_by?: "client" | "pro"
  created_at: string
}

export interface Availability {
  day: number // 0=dimanche, 1=lundi, ..., 6=samedi
  enabled: boolean
  slots: TimeSlot[]
}

export interface TimeSlot {
  start: string // HH:mm
  end: string // HH:mm
}

export interface AvailabilityException {
  id: string
  pro_id: string
  date: string // YYYY-MM-DD
  all_day: boolean
  start_time?: string
  end_time?: string
  reason?: string
}

export interface Notification {
  id: string
  pro_id: string
  type: "booking" | "cancellation" | "system"
  title: string
  message: string
  read: boolean
  booking_id?: string
  created_at: string
}

export interface ClientRecord {
  email: string
  name: string
  phone: string
  booking_count: number
  cancel_count: number
  no_show_count: number
  is_blocked: boolean
  last_booking_at?: string
  notes?: string
}

/* ── Plan limits ── */
export const PLAN_LIMITS: Record<SubscriptionPlan, {
  max_services: number
  max_bookings_per_month: number
  analytics: "basic" | "advanced" | "full"
  google_calendar: boolean
  sms: boolean
  exports: boolean
}> = {
  starter: {
    max_services: 5,
    max_bookings_per_month: 50,
    analytics: "basic",
    google_calendar: false,
    sms: false,
    exports: false,
  },
  pro: {
    max_services: 20,
    max_bookings_per_month: Infinity,
    analytics: "advanced",
    google_calendar: true,
    sms: false,
    exports: false,
  },
  premium: {
    max_services: Infinity,
    max_bookings_per_month: Infinity,
    analytics: "full",
    google_calendar: true,
    sms: true,
    exports: true,
  },
}

/* ── i18n-ready text keys ── */
export const DAYS_FR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  starter: "Starter",
  pro: "Pro",
  premium: "Premium",
}
