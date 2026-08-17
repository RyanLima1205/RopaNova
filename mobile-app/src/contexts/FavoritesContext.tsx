import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { app, auth } from '../firebaseConfig'
import { addToFavorites, removeFromFavorites, FavoritableProduct } from '../services/favoriteService'

interface FavoritesContextValue {
  favoriteProductIds: string[]
  isFavorited: (productId: string) => boolean
  /** Écrit dans Firestore et met à jour l'état local immédiatement (source unique pour tout l'app). */
  toggleFavorite: (productId: string, product: FavoritableProduct) => Promise<void>
  refresh: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([])

  const refresh = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid || uid === 'guest') {
      setFavoriteProductIds([])
      return
    }
    try {
      const db = getFirestore(app)
      const q = query(collection(db, 'favorites'), where('userId', '==', uid))
      const snap = await getDocs(q)
      const ids = snap.docs
        .map((d) => d.data().productId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
      setFavoriteProductIds(ids)
    } catch {
      setFavoriteProductIds([])
    }
  }, [])

  useEffect(() => {
    refresh()
    const unsubscribe = onAuthStateChanged(auth, () => {
      refresh()
    })
    return unsubscribe
  }, [refresh])

  const isFavorited = useCallback(
    (productId: string) => favoriteProductIds.includes(productId),
    [favoriteProductIds]
  )

  const toggleFavorite = useCallback(
    async (productId: string, product: FavoritableProduct) => {
      const uid = auth.currentUser?.uid
      if (!uid || uid === 'guest') return

      const wasFavorited = favoriteProductIds.includes(productId)
      setFavoriteProductIds((prev) =>
        wasFavorited ? prev.filter((id) => id !== productId) : [...prev, productId]
      )
      try {
        if (wasFavorited) {
          await removeFromFavorites(productId, uid)
        } else {
          await addToFavorites(productId, uid, product)
        }
      } catch (error) {
        // Rollback si l'écriture Firestore échoue
        setFavoriteProductIds((prev) =>
          wasFavorited ? [...prev, productId] : prev.filter((id) => id !== productId)
        )
        throw error
      }
    },
    [favoriteProductIds]
  )

  return (
    <FavoritesContext.Provider value={{ favoriteProductIds, isFavorited, toggleFavorite, refresh }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider')
  return ctx
}
