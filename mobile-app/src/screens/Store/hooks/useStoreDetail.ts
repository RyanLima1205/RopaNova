import { useCallback, useEffect, useState } from 'react'
import { auth } from '../../../firebaseConfig'
import { getStoreDetail } from '../../../services/storeService'
import { StoreDetail } from '../../../types/store'
import { logger } from '../../../utils/logger'

interface UseStoreDetailResult {
  store: StoreDetail | null
  loading: boolean
  error: boolean
  reload: () => void
}

/** Charge la fiche boutique V1 (REFONTE_STOREFRONT.md) pour un storeId donné. */
export function useStoreDetail(storeId: string): UseStoreDetailResult {
  const [store, setStore] = useState<StoreDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!storeId || typeof storeId !== 'string' || storeId.trim() === '') {
      logger.error('❌ useStoreDetail - storeId inválido:', storeId)
      setStore(null)
      setError(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)
    try {
      const viewerId = auth.currentUser?.uid || ''
      const data = await getStoreDetail(storeId, viewerId)
      if (!data) {
        setStore(null)
        setError(true)
        return
      }
      setStore(data)
    } catch (err) {
      logger.error('❌ useStoreDetail - error al cargar la tienda:', err)
      setStore(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    load()
  }, [load])

  return { store, loading, error, reload: load }
}
