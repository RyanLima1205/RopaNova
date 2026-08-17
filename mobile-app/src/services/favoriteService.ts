import {
  getFirestore,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  increment,
  runTransaction,
} from 'firebase/firestore'
import { app } from '../firebaseConfig'
import { logger } from '../utils/logger'

export interface FavoritableProduct {
  title: string
  price: number
  images?: string[]
  image?: string
  brand?: string
}

export const checkIfFavorited = async (productId: string, userId: string): Promise<boolean> => {
  if (!userId || userId === 'guest') return false
  try {
    const db = getFirestore(app)
    const favoriteDoc = await getDoc(doc(db, 'favorites', `${userId}_${productId}`))
    return favoriteDoc.exists()
  } catch (error) {
    return false
  }
}

export const addToFavorites = async (productId: string, userId: string, product: FavoritableProduct) => {
  try {
    const db = getFirestore(app)
    const favoriteData = {
      userId,
      productId,
      productTitle: product.title,
      productPrice: product.price,
      productImage: product.images?.[0] || product.image,
      productBrand: product.brand,
      /** Obligatoire pour firestore.rules (hasAll userId, productId, createdAt) */
      createdAt: serverTimestamp(),
      addedAt: serverTimestamp(),
    }

    const batch = writeBatch(db)
    batch.set(doc(db, 'favorites', `${userId}_${productId}`), favoriteData)
    batch.update(doc(db, 'products', productId), { favoriteCount: increment(1) })
    await batch.commit()
    logger.log('Producto agregado a favoritos')
  } catch (error) {
    logger.error('Error al agregar a favoritos:', error)
    throw error
  }
}

export const removeFromFavorites = async (productId: string, userId: string) => {
  try {
    const db = getFirestore(app)
    const favRef = doc(db, 'favorites', `${userId}_${productId}`)
    const productRef = doc(db, 'products', productId)

    /**
     * Si favoriteCount est déjà 0 (données désync.), increment(-1) vise -1 et
     * firestore.rules (favoriteCount >= 0) refuse → tout le batch échoue.
     * On ne décrémente que lorsque prev > 0 ; on supprime toujours le doc favori s'il existe.
     */
    await runTransaction(db, async (transaction) => {
      const favSnap = await transaction.get(favRef)
      const productSnap = await transaction.get(productRef)
      if (!favSnap.exists()) return

      transaction.delete(favRef)
      if (!productSnap.exists()) return

      const prev = productSnap.data()?.favoriteCount
      const prevNum = typeof prev === 'number' ? prev : 0
      if (prevNum > 0) {
        transaction.update(productRef, { favoriteCount: increment(-1) })
      }
    })
    logger.log('Producto eliminado de favoritos')
  } catch (error) {
    logger.error('Error al eliminar de favoritos:', error)
    throw error
  }
}
