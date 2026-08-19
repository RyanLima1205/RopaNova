import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore'
import { app } from '../../../firebaseConfig'

/** Suivi d'une boutique. Écriture optimiste sur `follows/{viewerId}_{storeId}`, comme FavoritesContext. */
export function useFollowStore(storeId: string, viewerId: string) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!viewerId || !storeId) {
      setIsFollowing(false)
      return
    }
    let cancelled = false
    const db = getFirestore(app)
    getDoc(doc(db, 'follows', `${viewerId}_${storeId}`))
      .then((snap) => {
        if (!cancelled) setIsFollowing(snap.exists())
      })
      .catch(() => {
        if (!cancelled) setIsFollowing(false)
      })
    return () => {
      cancelled = true
    }
  }, [storeId, viewerId])

  const toggleFollow = useCallback(async () => {
    if (!viewerId) {
      Alert.alert('Inicia sesión para seguir esta tienda')
      return
    }

    const wasFollowing = isFollowing
    setIsFollowing(!wasFollowing)
    setLoading(true)

    const db = getFirestore(app)
    const followRef = doc(db, 'follows', `${viewerId}_${storeId}`)
    const storeRef = doc(db, 'users', storeId)

    try {
      if (wasFollowing) {
        await deleteDoc(followRef)
      } else {
        await setDoc(followRef, { followerId: viewerId, storeId, createdAt: serverTimestamp() })
      }
    } catch (error) {
      setIsFollowing(wasFollowing)
      setLoading(false)
      throw error
    }

    // Compteur best-effort : pas de rollback si ça échoue, il se resynchronisera
    // au prochain chargement de getStoreDetail.
    updateDoc(storeRef, { followerCount: increment(wasFollowing ? -1 : 1) }).catch(() => {})

    setLoading(false)
  }, [storeId, viewerId, isFollowing])

  return { isFollowing, loading, toggleFollow }
}
