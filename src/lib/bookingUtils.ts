/**
 * Booking time utilities
 * 
 * Provides reusable functions for booking time calculations and comparisons.
 */

/**
 * Determines whether a booking occurs in less than 24 hours from now.
 * 
 * A booking is considered "less than 1 day before" if:
 * now >= bookingStartDate - 24 hours
 * 
 * @param bookingStartDate - The start date/time of the booking
 * @returns true if the booking is less than 24 hours away, false otherwise
 * 
 * @example
 * // Now: Dec 25 at 10:00
 * // Booking: Dec 26 at 10:00
 * // Result: true (exactly 24 hours, so it counts as "less than 24 hours")
 * 
 * @example
 * // Now: Dec 25 at 10:00
 * // Booking: Dec 26 at 09:59
 * // Result: true (23h59m, less than 24 hours)
 * 
 * @example
 * // Now: Dec 25 at 10:00
 * // Booking: Dec 26 at 10:01
 * // Result: false (24h01m, more than 24 hours)
 */
export function isLessThan24Hours(bookingStartDate: Date): boolean {
  // Get current time in milliseconds since epoch
  const now = Date.now()
  
  // Get booking start time in milliseconds since epoch
  const bookingStart = bookingStartDate.getTime()
  
  // Calculate 24 hours in milliseconds
  // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000
  
  // Calculate the threshold: booking start time minus 24 hours
  // This represents the earliest time at which the booking is considered "less than 24 hours away"
  const threshold = bookingStart - twentyFourHoursInMs
  
  // Return true if current time is at or past the threshold
  // This means: now >= (bookingStartDate - 24 hours)
  return now >= threshold
}

