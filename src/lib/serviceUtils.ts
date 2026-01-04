/**
 * Service category labels in French
 */
export const CATEGORY_LABELS: Record<string, string> = {
  ongles: 'Ongles',
  coiffure_femme: 'Coiffure Femme',
  coiffure_homme: 'Coiffure Homme',
  coiffure_enfant: 'Coiffure Enfant',
  regard: 'Regard',
  soins_visage: 'Soins du Visage',
  soins_corps: 'Soins du Corps',
  massages: 'Massages',
  épilation: 'Épilation',
  maquillage: 'Maquillage',
  'services_spécifiques': 'Services Spécifiques',
}

/**
 * Get category label in French
 */
export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return 'Autres'
  return CATEGORY_LABELS[category] || category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * Group services by category
 */
export function groupServicesByCategory<T extends { category?: string | null }>(
  services: T[]
): Array<{ category: string; label: string; services: T[] }> {
  const grouped = new Map<string, T[]>()

  // Group services by category
  services.forEach((service) => {
    const category = service.category || 'autres'
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(service)
  })

  // Convert to array and sort
  const categoryOrder = [
    'ongles',
    'coiffure_femme',
    'coiffure_homme',
    'coiffure_enfant',
    'regard',
    'soins_visage',
    'soins_corps',
    'massages',
    'épilation',
    'maquillage',
    'services_spécifiques',
    'autres',
  ]

  return Array.from(grouped.entries())
    .map(([category, categoryServices]) => ({
      category,
      label: getCategoryLabel(category),
      services: categoryServices,
    }))
    .sort((a, b) => {
      const orderA = categoryOrder.indexOf(a.category)
      const orderB = categoryOrder.indexOf(b.category)
      // If category not in order list, put it at the end
      const finalOrderA = orderA === -1 ? 999 : orderA
      const finalOrderB = orderB === -1 ? 999 : orderB
      if (finalOrderA !== finalOrderB) {
        return finalOrderA - finalOrderB
      }
      // If same order, sort by label
      return a.label.localeCompare(b.label)
    })
}

