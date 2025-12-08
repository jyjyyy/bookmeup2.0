/**
 * Génère un slug à partir d'un nom et optionnellement d'une ville
 * @param name - Le nom du business
 * @param city - La ville (optionnelle)
 * @returns Un slug propre (ex: "mila-beauty-paris")
 */
export function generateSlugFromNameAndCity(
  name: string,
  city?: string
): string {
  // Fonction pour normaliser une chaîne en slug
  const normalize = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplace tout ce qui n'est pas alphanumérique par -
      .replace(/^-+|-+$/g, '') // Supprime les - en début et fin
      .replace(/-+/g, '-') // Remplace les - multiples par un seul
  }

  const slugName = normalize(name.trim())

  if (city && city.trim()) {
    const slugCity = normalize(city.trim())
    return slugCity ? `${slugName}-${slugCity}` : slugName
  }

  return slugName
}

