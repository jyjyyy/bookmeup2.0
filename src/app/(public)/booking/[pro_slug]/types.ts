export interface BookingService {
  id: string
  name: string
  description?: string | null
  duration: number
  price: number
  isActive?: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface BookingPro {
  id: string
  name: string
  slug: string
  city?: string | null
  description?: string | null
}

