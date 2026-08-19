import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore'
import { app } from '../firebaseConfig'
import { StoreDetail } from '../types/store'
import { mapToStoreDetail } from './mappers/storeMapper'
import { logger } from '../utils/logger'

/**
 * Une seule contrainte serveur (userId == storeId) — ce projet n'a pas d'index composite
 * Firestore déployé, donc le statut vendu/inactif est filtré en mémoire (même principe que
 * useRelatedProducts.ts côté fiche produit).
 */
const countActiveProducts = async (storeId: string): Promise<number> => {
  try {
    const db = getFirestore(app)
    const q = query(collection(db, 'products'), where('userId', '==', storeId))
    const snapshot = await getDocs(q)
    return snapshot.docs.filter((productDoc) => {
      const status = (productDoc.data().status as string) || 'active'
      return status !== 'sold' && status !== 'inactive'
    }).length
  } catch (error) {
    logger.error('❌ getStoreDetail - erreur lors du comptage des produits:', error)
    return 0
  }
}

/**
 * Fiche boutique V1 (REFONTE_STOREFRONT.md, Phase 2). Lit users/{storeId}, compte les
 * produits actifs du vendeur, applique le mapper. N'affecte aucun service existant.
 *
 * `followerCount` est toujours 0 : aucune collection de followers n'existe encore côté
 * Firestore (voir REFONTE_STOREFRONT.md, section 1.4 et phase 5 — à construire plus tard).
 */
export async function getStoreDetail(storeId: string, viewerId: string): Promise<StoreDetail | null> {
  try {
    if (!storeId || typeof storeId !== 'string' || storeId.trim() === '') {
      logger.error('❌ getStoreDetail - storeId invalide:', storeId)
      return null
    }

    const db = getFirestore(app)
    const userDoc = await getDoc(doc(db, 'users', storeId))

    if (!userDoc.exists()) {
      logger.log('❌ getStoreDetail - boutique non trouvée:', storeId)
      return null
    }

    const productCount = await countActiveProducts(storeId)

    return mapToStoreDetail(userDoc.data(), storeId, viewerId, {
      productCount,
      followerCount: 0,
    })
  } catch (error) {
    logger.error('❌ getStoreDetail - erreur lors de la récupération de la boutique:', error)
    return null
  }
}
