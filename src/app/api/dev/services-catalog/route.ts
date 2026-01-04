import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

const DEV_SEED_TOKEN = process.env.DEV_SEED_TOKEN || 'DEV_SEED_TOKEN'

/**
 * Generate slug from service name
 * Converts to lowercase, removes accents, replaces spaces with underscores
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
}

/**
 * Generate intelligent aliases and keywords for a service
 */
function generateAliasesAndKeywords(name: string, category: string): { aliases: string[]; keywords: string[] } {
  const aliases: string[] = []
  const keywords: string[] = []

  // Common French variations
  const nameLower = name.toLowerCase()
  
  // Add variations based on common patterns
  if (nameLower.includes('manucure')) {
    aliases.push('manucure', 'nail care', 'nail treatment')
    keywords.push('ongles', 'nails', 'main', 'hand')
  }
  if (nameLower.includes('pédicure')) {
    aliases.push('pédicure', 'pedicure', 'soin des pieds')
    keywords.push('pieds', 'feet', 'pied', 'foot')
  }
  if (nameLower.includes('pose gel')) {
    aliases.push('gel nails', 'gel manicure', 'ongles gel')
    keywords.push('gel', 'nail extension', 'extension ongles')
  }
  if (nameLower.includes('coupe')) {
    aliases.push('haircut', 'coupe de cheveux')
    keywords.push('cheveux', 'hair', 'coiffure', 'hairstyle')
  }
  if (nameLower.includes('coloration')) {
    aliases.push('hair color', 'hair coloring', 'teinture')
    keywords.push('color', 'couleur', 'dye', 'teinture')
  }
  if (nameLower.includes('massage')) {
    aliases.push('massage therapy', 'massage treatment')
    keywords.push('relaxation', 'wellness', 'bien-être')
  }
  if (nameLower.includes('épilation')) {
    aliases.push('hair removal', 'waxing', 'depilation')
    keywords.push('wax', 'cire', 'hair removal')
  }
  if (nameLower.includes('maquillage')) {
    aliases.push('makeup', 'make-up', 'maquillage professionnel')
    keywords.push('makeup', 'beauty', 'cosmetic', 'cosmétique')
  }
  if (nameLower.includes('soin')) {
    aliases.push('treatment', 'care', 'therapy')
    keywords.push('treatment', 'care', 'soin')
  }
  if (nameLower.includes('extension cils')) {
    aliases.push('eyelash extensions', 'lash extensions', 'extensions cils')
    keywords.push('eyelashes', 'cils', 'lashes', 'mascara')
  }
  if (nameLower.includes('microblading')) {
    aliases.push('eyebrow microblading', 'microblading sourcils')
    keywords.push('eyebrows', 'sourcils', 'brows', 'permanent makeup')
  }

  // Add category-based keywords
  const categoryKeywords: Record<string, string[]> = {
    'ongles': ['nail', 'ongle', 'manicure', 'pedicure'],
    'coiffure_femme': ['women hair', 'cheveux femme', 'hairstyle women'],
    'coiffure_homme': ['men hair', 'cheveux homme', 'hairstyle men', 'barber'],
    'coiffure_enfant': ['kids hair', 'cheveux enfant', 'children hair'],
    'regard': ['eyes', 'yeux', 'eyelashes', 'eyebrows', 'cils', 'sourcils'],
    'soins_visage': ['facial', 'visage', 'face', 'skin care', 'soin peau'],
    'soins_corps': ['body', 'corps', 'body treatment', 'soin corps'],
    'massages': ['massage', 'massage therapy', 'relaxation'],
    'épilation': ['hair removal', 'waxing', 'depilation', 'laser'],
    'maquillage': ['makeup', 'make-up', 'cosmetic'],
    'services_spécifiques': ['consultation', 'conseil', 'diagnostic', 'forfait']
  }

  if (categoryKeywords[category]) {
    keywords.push(...categoryKeywords[category])
  }

  // Remove duplicates
  const uniqueAliases = Array.from(new Set(aliases))
  const uniqueKeywords = Array.from(new Set(keywords))

  return {
    aliases: uniqueAliases,
    keywords: uniqueKeywords
  }
}

/**
 * Service catalog data - EXACT list from requirements
 */
const SERVICES_CATALOG = [
  // ONGLES
  { name: 'Manucure classique', category: 'ongles' },
  { name: 'Manucure russe', category: 'ongles' },
  { name: 'Manucure combinée', category: 'ongles' },
  { name: 'Manucure express', category: 'ongles' },
  { name: 'Soin des mains', category: 'ongles' },
  { name: 'Gommage des mains', category: 'ongles' },
  { name: 'Massage des mains', category: 'ongles' },
  { name: 'Bain de paraffine mains', category: 'ongles' },
  { name: 'Pose gel', category: 'ongles' },
  { name: 'Pose résine', category: 'ongles' },
  { name: 'Pose acrygel', category: 'ongles' },
  { name: 'Pose capsules', category: 'ongles' },
  { name: 'Pose chablon', category: 'ongles' },
  { name: 'Gainage', category: 'ongles' },
  { name: 'Remplissage gel', category: 'ongles' },
  { name: 'Remplissage résine', category: 'ongles' },
  { name: 'Renforcement ongles naturels', category: 'ongles' },
  { name: 'Dépose gel', category: 'ongles' },
  { name: 'Dépose résine', category: 'ongles' },
  { name: 'Dépose acrygel', category: 'ongles' },
  { name: 'Réparation ongle', category: 'ongles' },
  { name: 'Dépose + soin', category: 'ongles' },
  { name: 'Nail art simple', category: 'ongles' },
  { name: 'Nail art complexe', category: 'ongles' },
  { name: 'French manucure', category: 'ongles' },
  { name: 'Baby boomer', category: 'ongles' },
  { name: 'Baby color', category: 'ongles' },
  { name: 'Incrustations', category: 'ongles' },
  { name: 'Strass', category: 'ongles' },
  { name: 'Dessins personnalisés', category: 'ongles' },
  { name: 'Pédicure esthétique', category: 'ongles' },
  { name: 'Beauté des pieds', category: 'ongles' },
  { name: 'Pose gel pieds', category: 'ongles' },
  { name: 'Soin anti-callosités', category: 'ongles' },
  { name: 'Pédicure spa', category: 'ongles' },
  { name: 'Bain de paraffine pieds', category: 'ongles' },

  // COIFFURE FEMME
  { name: 'Coupe femme', category: 'coiffure_femme' },
  { name: 'Coupe transformation', category: 'coiffure_femme' },
  { name: 'Coupe frange', category: 'coiffure_femme' },
  { name: 'Coupe entretien', category: 'coiffure_femme' },
  { name: 'Brushing court', category: 'coiffure_femme' },
  { name: 'Brushing mi-long', category: 'coiffure_femme' },
  { name: 'Brushing long', category: 'coiffure_femme' },
  { name: 'Coiffage événementiel', category: 'coiffure_femme' },
  { name: 'Mise en plis', category: 'coiffure_femme' },
  { name: 'Lissage brushing', category: 'coiffure_femme' },
  { name: 'Coloration racines', category: 'coiffure_femme' },
  { name: 'Coloration complète', category: 'coiffure_femme' },
  { name: 'Patine', category: 'coiffure_femme' },
  { name: 'Gloss', category: 'coiffure_femme' },
  { name: 'Coloration végétale', category: 'coiffure_femme' },
  { name: 'Décoloration', category: 'coiffure_femme' },
  { name: 'Balayage', category: 'coiffure_femme' },
  { name: 'Ombré hair', category: 'coiffure_femme' },
  { name: 'Tie & dye', category: 'coiffure_femme' },
  { name: 'Mèches', category: 'coiffure_femme' },
  { name: 'Contouring capillaire', category: 'coiffure_femme' },
  { name: 'Air touch', category: 'coiffure_femme' },
  { name: 'Soin profond', category: 'coiffure_femme' },
  { name: 'Soin kératine', category: 'coiffure_femme' },
  { name: 'Soin botox capillaire', category: 'coiffure_femme' },
  { name: 'Soin réparateur', category: 'coiffure_femme' },
  { name: 'Soin hydratant', category: 'coiffure_femme' },
  { name: 'Lissage brésilien', category: 'coiffure_femme' },
  { name: 'Lissage japonais', category: 'coiffure_femme' },
  { name: 'Lissage coréen', category: 'coiffure_femme' },
  { name: 'Lissage tanin', category: 'coiffure_femme' },

  // COIFFURE HOMME
  { name: 'Coupe homme', category: 'coiffure_homme' },
  { name: 'Coupe dégradé', category: 'coiffure_homme' },
  { name: 'Coupe tondeuse', category: 'coiffure_homme' },
  { name: 'Taille de barbe', category: 'coiffure_homme' },
  { name: 'Rasage traditionnel', category: 'coiffure_homme' },
  { name: 'Traçage barbe', category: 'coiffure_homme' },
  { name: 'Soin barbe', category: 'coiffure_homme' },
  { name: 'Coloration barbe', category: 'coiffure_homme' },
  { name: 'Coupe + barbe', category: 'coiffure_homme' },

  // COIFFURE ENFANT
  { name: 'Coupe enfant', category: 'coiffure_enfant' },
  { name: 'Coupe bébé', category: 'coiffure_enfant' },
  { name: 'Coupe ado', category: 'coiffure_enfant' },
  { name: 'Coiffage enfant', category: 'coiffure_enfant' },

  // REGARD
  { name: 'Extension cils classique', category: 'regard' },
  { name: 'Extension cils volume russe', category: 'regard' },
  { name: 'Extension cils hybride', category: 'regard' },
  { name: 'Rehaussement de cils', category: 'regard' },
  { name: 'Teinture cils', category: 'regard' },
  { name: 'Dépose extensions cils', category: 'regard' },
  { name: 'Épilation sourcils', category: 'regard' },
  { name: 'Restructuration sourcils', category: 'regard' },
  { name: 'Brow lift', category: 'regard' },
  { name: 'Teinture sourcils', category: 'regard' },
  { name: 'Microblading', category: 'regard' },
  { name: 'Microshading', category: 'regard' },
  { name: 'Retouche microblading', category: 'regard' },

  // SOINS DU VISAGE
  { name: 'Nettoyage de peau', category: 'soins_visage' },
  { name: 'Soin visage classique', category: 'soins_visage' },
  { name: 'Soin visage hydratant', category: 'soins_visage' },
  { name: 'Soin anti-âge', category: 'soins_visage' },
  { name: 'Soin purifiant', category: 'soins_visage' },
  { name: 'Soin éclat', category: 'soins_visage' },
  { name: 'Peeling superficiel', category: 'soins_visage' },
  { name: 'Peeling aux acides', category: 'soins_visage' },
  { name: 'Microneedling', category: 'soins_visage' },
  { name: 'HydraFacial', category: 'soins_visage' },
  { name: 'Soin visage homme', category: 'soins_visage' },

  // SOINS DU CORPS
  { name: 'Gommage corps', category: 'soins_corps' },
  { name: 'Enveloppement corps', category: 'soins_corps' },
  { name: 'Soin minceur', category: 'soins_corps' },
  { name: 'Soin raffermissant', category: 'soins_corps' },
  { name: 'Drainage lymphatique', category: 'soins_corps' },
  { name: 'Pressothérapie', category: 'soins_corps' },
  { name: 'Cryolipolyse', category: 'soins_corps' },
  { name: 'Soin anti-cellulite', category: 'soins_corps' },

  // MASSAGES
  { name: 'Massage relaxant', category: 'massages' },
  { name: 'Massage californien', category: 'massages' },
  { name: 'Massage suédois', category: 'massages' },
  { name: 'Massage deep tissue', category: 'massages' },
  { name: 'Massage sportif', category: 'massages' },
  { name: 'Massage prénatal', category: 'massages' },
  { name: 'Massage aux pierres chaudes', category: 'massages' },
  { name: 'Massage ayurvédique', category: 'massages' },
  { name: 'Massage balinais', category: 'massages' },
  { name: 'Massage crânien', category: 'massages' },
  { name: 'Massage dos', category: 'massages' },
  { name: 'Massage corps complet', category: 'massages' },
  { name: 'Réflexologie plantaire', category: 'massages' },

  // ÉPILATION
  { name: 'Épilation sourcils', category: 'épilation' },
  { name: 'Épilation lèvre', category: 'épilation' },
  { name: 'Épilation visage', category: 'épilation' },
  { name: 'Épilation aisselles', category: 'épilation' },
  { name: 'Épilation bras', category: 'épilation' },
  { name: 'Épilation jambes', category: 'épilation' },
  { name: 'Épilation maillot simple', category: 'épilation' },
  { name: 'Épilation maillot échancré', category: 'épilation' },
  { name: 'Épilation maillot intégral', category: 'épilation' },
  { name: 'Épilation cire', category: 'épilation' },
  { name: 'Épilation orientale', category: 'épilation' },
  { name: 'Épilation fil', category: 'épilation' },
  { name: 'Épilation lumière pulsée', category: 'épilation' },
  { name: 'Épilation laser', category: 'épilation' },

  // MAQUILLAGE
  { name: 'Maquillage jour', category: 'maquillage' },
  { name: 'Maquillage soirée', category: 'maquillage' },
  { name: 'Maquillage mariage', category: 'maquillage' },
  { name: 'Maquillage événementiel', category: 'maquillage' },
  { name: 'Maquillage shooting', category: 'maquillage' },
  { name: 'Cours d\'auto-maquillage', category: 'maquillage' },

  // SERVICES SPÉCIFIQUES
  { name: 'Conseil en image', category: 'services_spécifiques' },
  { name: 'Relooking', category: 'services_spécifiques' },
  { name: 'Diagnostic capillaire', category: 'services_spécifiques' },
  { name: 'Diagnostic peau', category: 'services_spécifiques' },
  { name: 'Forfait mariage', category: 'services_spécifiques' },
  { name: 'Forfait événement', category: 'services_spécifiques' },
]

/**
 * POST /api/dev/services-catalog
 * Populates the services_catalog collection in Firestore
 * Idempotent: safe to re-run, won't create duplicates
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    if (token !== DEV_SEED_TOKEN) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log('[Services Catalog Seed] Starting seed process...')
    console.log(`[Services Catalog Seed] Total services to process: ${SERVICES_CATALOG.length}`)

    const catalogRef = adminDb.collection('services_catalog')
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Process each service
    for (let i = 0; i < SERVICES_CATALOG.length; i++) {
      const service = SERVICES_CATALOG[i]
      try {
        const slug = generateSlug(service.name)
        const { aliases, keywords } = generateAliasesAndKeywords(service.name, service.category)

        const serviceData = {
          name: service.name,
          category: service.category,
          aliases,
          keywords,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        }

        // Use setDoc with slug as document ID for idempotency
        // This will create or update the document
        const docRef = catalogRef.doc(slug)
        const docSnapshot = await docRef.get()

        if (docSnapshot.exists) {
          // Update existing document (preserve created_at)
          const existingData = docSnapshot.data()
          await docRef.update({
            ...serviceData,
            created_at: existingData?.created_at || FieldValue.serverTimestamp(),
          })
          results.updated++
          if ((i + 1) % 20 === 0) {
            console.log(`[Services Catalog Seed] Progress: ${i + 1}/${SERVICES_CATALOG.length} (${results.created} created, ${results.updated} updated)`)
          }
        } else {
          // Create new document
          await docRef.set(serviceData)
          results.created++
          if ((i + 1) % 20 === 0) {
            console.log(`[Services Catalog Seed] Progress: ${i + 1}/${SERVICES_CATALOG.length} (${results.created} created, ${results.updated} updated)`)
          }
        }
      } catch (error: any) {
        const errorMsg = `Error processing "${service.name}": ${error.message}`
        console.error(`[Services Catalog Seed] ${errorMsg}`)
        results.errors.push(errorMsg)
      }
    }

    console.log('[Services Catalog Seed] Seed process completed!')
    console.log(`[Services Catalog Seed] Results: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`)

    return NextResponse.json({
      ok: true,
      message: 'Services catalog populated successfully',
      results: {
        total: SERVICES_CATALOG.length,
        created: results.created,
        updated: results.updated,
        errors: results.errors.length,
        errorDetails: results.errors,
      },
    })
  } catch (error: any) {
    console.error('Error populating services catalog:', error)
    return NextResponse.json(
      { error: error.message || 'Error populating services catalog' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dev/services-catalog
 * Returns the current state of the services catalog
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    if (token !== DEV_SEED_TOKEN) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const catalogRef = adminDb.collection('services_catalog')
    const snapshot = await catalogRef.get()

    const services = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({
      ok: true,
      count: services.length,
      services,
    })
  } catch (error: any) {
    console.error('Error fetching services catalog:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching services catalog' },
      { status: 500 }
    )
  }
}

