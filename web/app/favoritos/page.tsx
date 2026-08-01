"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebaseConfig"
import { formatPrice } from "@/lib/formatters"
import { cleanProductImages } from "@/lib/imageUtils"
import { collection, getDocs, query, where } from "firebase/firestore"

interface FavoriteProduct {
  id: string
  title: string
  price: string
  condition: string
  images: string[]
  brand: string
}

export default function FavoritosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)

  const loadFavorites = useCallback(async () => {
    const userId = user?.id
    if (!userId) {
      setFavorites([])
      setLoading(false)
      return
    }
    try {
      const favoritesQuery = query(collection(db, "favorites"), where("userId", "==", userId))
      const favoritesSnapshot = await getDocs(favoritesQuery)
      const favoriteProductIds = favoritesSnapshot.docs.map((d) => d.data().productId as string)

      if (favoriteProductIds.length === 0) {
        setFavorites([])
        setLoading(false)
        return
      }

      const chunks: string[][] = []
      for (let i = 0; i < favoriteProductIds.length; i += 10) {
        chunks.push(favoriteProductIds.slice(i, i + 10))
      }
      const snapshots = await Promise.all(chunks.map((chunk) => getDocs(query(collection(db, "products"), where("__name__", "in", chunk)))))
      const products = snapshots.flatMap((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any))

      setFavorites(
        products.map((item) => ({
          id: item.id,
          title: item.titulo || item.title || "",
          price: item.precio || item.price || "0",
          condition: item.condicion || item.condition || "Usado",
          images: cleanProductImages(item),
          brand: item.marca || item.brand || "",
        })),
      )
    } catch {
      setFavorites([])
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    setLoading(true)
    loadFavorites()
  }, [loadFavorites])

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-gray-900">Mis Favoritos</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-2">
          <Heart className="h-16 w-16 text-gray-300" />
          <p className="text-xl font-semibold text-gray-900 mt-2">No tienes favoritos</p>
          <p className="text-sm text-gray-500">Los productos que marques como favoritos aparecerán aquí</p>
          <Link href="/">
            <Button className="mt-4 bg-brand-ui hover:bg-brand-dark">Explorar Productos</Button>
          </Link>
        </div>
      ) : (
        <div className="p-3 grid grid-cols-2 gap-3">
          {favorites.map((item) => (
            <Link key={item.id} href={`/producto/${item.id}`}>
              <Card className="overflow-hidden">
                <div className="relative">
                  <img src={item.images[0] || "/placeholder.svg"} alt={item.title} className="w-full h-36 object-cover" />
                  <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs bg-white/90">
                    ♥ favorito
                  </Badge>
                </div>
                <CardContent className="p-2.5">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.title}</p>
                  <p className="text-sm font-bold text-brand-ui mb-1">{formatPrice(Number(item.price) || 0)}</p>
                  <div className="flex items-center gap-1 flex-wrap text-xs">
                    <Badge variant="outline" className="text-xs">
                      {item.condition}
                    </Badge>
                    {item.brand && (
                      <Badge variant="outline" className="text-xs">
                        {item.brand}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
