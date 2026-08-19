import { useEffect, useState } from 'react'
import { collection, getDocs, getFirestore, limit, query, where } from 'firebase/firestore'
import { app } from '../../../firebaseConfig'
import { ProductCardData } from '../../ProductDetail/components/RelatedProducts'
import { logger } from '../../../utils/logger'

// Une seule contrainte serveur (userId == storeId) — ce projet n'a pas d'index composite
// Firestore déployé ; le statut vendu/inactif et le tri sont faits en mémoire (même
// principe que useRelatedProducts.ts côté fiche produit).
const FETCH_LIMIT = 60

interface UseStoreCatalogResult {
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

/** Catalogue d'une boutique (produits actifs, plus récents d'abord). */
export function useStoreCatalog(storeId: string | null): UseStoreCatalogResult {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!storeId) {
      setProducts([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        const db = getFirestore(app)
        const q = query(collection(db, 'products'), where('userId', '==', storeId), limit(FETCH_LIMIT))
        const snapshot = await getDocs(q)

        const items = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }))
          .filter(({ data }) => {
            const status = (data.status as string) || 'active'
            return status !== 'sold' && status !== 'inactive'
          })
          .sort((a, b) => toMillis(b.data.createdAt) - toMillis(a.data.createdAt))
          .map(({ id, data }) => mapToProductCardData(id, data))

        if (!cancelled) setProducts(items)
      } catch (err) {
        logger.error('❌ useStoreCatalog - error al cargar el catálogo:', err)
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [storeId])

  return { products, loading }
}
