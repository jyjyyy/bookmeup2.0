// Type definitions

export type SubscriptionPlan = 'starter' | 'pro' | 'premium'

export interface User {
  id: string
  email: string
  subscriptionPlan?: SubscriptionPlan
  stripeCustomerId?: string
  createdAt: Date
}

export interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  proId: string
  created_at?: any
  updated_at?: any
}

export interface Pro {
  id: string
  uid?: string
  name: string
  slug: string
  email?: string
  city?: string
  role?: string
}

export interface Availability {
  dayOfWeek: number
  startTime: string
  endTime: string
  isEnabled: boolean
}

export interface Booking {
  id: string
  proId: string
  clientId?: string
  serviceId: string
  client_name: string
  client_email: string
  client_phone?: string
  date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at?: any
}

export interface TimeSlot {
  time: string
  available: boolean
}

