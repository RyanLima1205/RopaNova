"use client"

import { useState, useCallback, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "@/lib/firebaseConfig"

/** IDs de productos marcados como favoritos por el usuario conectado. */
export function useFavoriteProductIds() {
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([])

  const refreshFavoriteProductIds = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) {
      setFavoriteProductIds([])
      return
    }
    try {
      const q = query(collection(db, "favorites"), where("userId", "==", uid))
      const snap = await getDocs(q)
      const ids = snap.docs
        .map((d) => d.data().productId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
      setFavoriteProductIds(ids)
    } catch {
      setFavoriteProductIds([])
    }
  }, [])

  useEffect(() => {
    refreshFavoriteProductIds()
  }, [refreshFavoriteProductIds])

  return { favoriteProductIds, refreshFavoriteProductIds }
}
