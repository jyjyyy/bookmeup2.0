/**
 * Helper function to serialize Firestore Timestamp fields to ISO strings
 * This is necessary when passing Firestore documents from Server Components to Client Components
 * 
 * @param data - Firestore document data (object or array)
 * @returns Serialized data with timestamps converted to ISO strings
 */
export function serializeTimestamps<T extends Record<string, any>>(
  data: T
): T {
  if (!data || typeof data !== 'object') {
    return data
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeTimestamps(item)) as T
  }

  // Handle objects
  const serialized = { ...data }

  for (const key in serialized) {
    const value = serialized[key]

    // Check if it's a Firestore Timestamp
    if (
      value &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof value.toDate === 'function'
    ) {
      try {
        serialized[key] = value.toDate().toISOString()
      } catch (error) {
        console.warn(`Error serializing timestamp for key ${key}:`, error)
        serialized[key] = null
      }
    }
    // Recursively handle nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      serialized[key] = serializeTimestamps(value)
    }
    // Recursively handle arrays
    else if (Array.isArray(value)) {
      serialized[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? serializeTimestamps(item)
          : item
      )
    }
  }

  return serialized
}

/**
 * Serialize a single Firestore document
 */
export function serializeDocument<T extends Record<string, any>>(
  doc: T
): T {
  return serializeTimestamps(doc)
}

/**
 * Serialize multiple Firestore documents
 */
export function serializeDocuments<T extends Record<string, any>>(
  docs: T[]
): T[] {
  return docs.map((doc) => serializeTimestamps(doc))
}

