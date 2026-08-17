import { useEffect, useState } from 'react'
import { collection, getDocs, getFirestore, limit, query, where } from 'firebase/firestore'
import { app } from '../../../firebaseConfig'
import { ProductDetail } from '../../../types/product'
import { ProductCardData } from '../components/RelatedProducts'
import { logger } from '../../../utils/logger'

// Marge avant filtrage/tri côté client (même vendeur exclu, produits vendus/inactifs exclus).
const FETCH_LIMIT = 30
const RESULT_LIMIT = 10

interface UseRelatedProductsResult {
  products: ProductCardData[]
  loading: boolean
}

const toMillis = (value: unknown): number => {
  if (!value) return 0
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().getTime()
  }
  const date = new Date(value as string | number)
  return isNaN(date.getTime()) ? 0 : date.getTime()
}

const mapToProductCardData = (id: string, data: Record<string, unknown>): ProductCardData => {
  const stock = Array.isArray(data.stock) ? data.stock : []
  const talla = stock
    .map((item) => (item && typeof item === 'object' ? (item as { talla?: unknown }).talla : undefined))
    .filter((size): size is string => typeof size === 'string' && size.trim() !== '')
  const images = Array.isArray(data.images)
    ? data.images.filter((img): img is string => typeof img === 'string' && img.trim() !== '')
    : []

  return {
    id,
    title: (data.titulo as string) || (data.title as string) || '',
    price: String(data.precio ?? data.price ?? ''),
    condition: (data.condicionGeneral as string) || (data.condition as string) || '',
    images,
    createdAt: data.createdAt,
    category: (data.categoria as string) || (data.category as string) || '',
    subcategory: (data.subcategoria as string) || (data.subcategory as string) || '',
    brand: (data.marca as string) || (data.brand as string) || '',
    color: Array.isArray(data.color) ? data.color : [],
    talla,
  }
}

/**
 * "También podría gustarte" : même catégorie, autre vendeur, produits actifs, plus récents
 * d'abord, 10 max. Le filtrage combiné (vendeur, statut) et le tri se font côté client — ce
 * projet n'a pas d'index composite Firestore déployé (voir aussi HomeScreen.loadProducts, qui
 * suit le même principe : une seule contrainte serveur, le reste en mémoire).
 */
export function useRelatedProducts(product: ProductDetail | null): UseRelatedProductsResult {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!product) {
      setProducts([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        const db = getFirestore(app)
        const q = query(collection(db, 'products'), where('categoria', '==', product.info.category), limit(FETCH_LIMIT))
        const snapshot = await getDocs(q)

        const related = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }))
          .filter(({ id, data }) => {
            if (id === product.info.id) return false
            if (((data.userId as string) || '') === product.seller.id) return false
            const status = (data.status as string) || 'active'
            return status !== 'sold' && status !== 'inactive'
          })
          .sort((a, b) => toMillis(b.data.createdAt) - toMillis(a.data.createdAt))
          .slice(0, RESULT_LIMIT)
          .map(({ id, data }) => mapToProductCardData(id, data))

        if (!cancelled) setProducts(related)
      } catch (err) {
        logger.error('❌ useRelatedProducts - error al cargar los productos relacionados:', err)
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [product])

  return { products, loading }
}
