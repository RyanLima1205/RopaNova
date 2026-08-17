import { useCallback, useEffect, useState } from 'react'
import { getProductDetail } from '../../../services/productService'
import { ProductDetail } from '../../../types/product'
import { logger } from '../../../utils/logger'

interface UseProductDetailResult {
  product: ProductDetail | null
  loading: boolean
  error: boolean
  reload: () => void
}

export function useProductDetail(productId: string): UseProductDetailResult {
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      logger.error('❌ useProductDetail - productId inválido:', productId)
      setProduct(null)
      setError(true)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      const data = await getProductDetail(productId)
      if (!data) { setProduct(null); setError(true); return }
      setProduct(data)
    } catch (err) {
      logger.error('❌ useProductDetail - error al cargar el producto:', err)
      setProduct(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => { load() }, [load])

  return { product, loading, error, reload: load }
}
