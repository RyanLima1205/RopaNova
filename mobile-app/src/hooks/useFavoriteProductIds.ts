import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import { app, auth } from '../firebaseConfig'

/** IDs produits mis en favoris par l’utilisateur connecté (rechargé au focus d’écran). */
export function useFavoriteProductIds() {
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([])

  const refreshFavoriteProductIds = useCallback(async () => {
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

  useFocusEffect(
    useCallback(() => {
      refreshFavoriteProductIds()
    }, [refreshFavoriteProductIds])
  )

  return { favoriteProductIds, refreshFavoriteProductIds }
}
