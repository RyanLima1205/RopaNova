"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Store, User, CheckCircle2, Star, Users, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFavoriteProductIds } from "@/hooks/useFavoriteProductIds"
import { db } from "@/lib/firebaseConfig"
import { formatPrice } from "@/lib/formatters"
import { getReviewsBySellerId, computeSellerReviewStats } from "@/lib/services/reviewService"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"

interface SellerBadge {
  name: string
  icon: string
  color: string
}

interface SellerProfileData {
  id: string
  username: string
  name: string
  lastname: string
  storeName: string
  accountType: string
  avatar: string
  coverImage: string
  bio: string
  location: string
  province: string
  city: string
  verified: boolean
  stats: { followers: number }
  badges: SellerBadge[]
  createdAt?: string
}

const defaultSellerData: SellerProfileData = {
  id: "",
  username: "",
  name: "",
  lastname: "",
  storeName: "",
  accountType: "",
  avatar: "",
  coverImage: "",
  bio: "",
  location: "",
  province: "",
  city: "",
  verified: false,
  stats: { followers: 0 },
  badges: [],
  createdAt: "",
}

interface SellerListing {
  id: string
  title: string
  price: string
  condition: string
  images: string[]
  createdAt: any
  category: string
  subcategory: string
  brand: string
  status?: "active" | "sold" | "inactive"
}

function formatCreatedAt(createdAt?: any) {
  if (!createdAt) return ""
  let date: Date
  if (typeof createdAt === "object" && createdAt.seconds) {
    date = new Date(createdAt.seconds * 1000)
  } else {
    date = new Date(createdAt)
  }
  if (isNaN(date.getTime())) return ""
  const monthsEs = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]
  return `${monthsEs[date.getMonth()]} ${date.getFullYear()}`
}

export default function VendedorPerfilPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const sellerId = params.id
  const { favoriteProductIds } = useFavoriteProductIds()

  const [userData, setUserData] = useState<SellerProfileData>(defaultSellerData)
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<SellerListing[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [sellerReviewStats, setSellerReviewStats] = useState({ averageRating: 0, reviewCount: 0 })

  useEffect(() => {
    if (!sellerId) {
      setUserData(defaultSellerData)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", sellerId))
        if (cancelled) return
        if (docSnap.exists()) {
          setUserData({ ...defaultSellerData, ...(docSnap.data() as Partial<SellerProfileData>), id: sellerId })
        } else {
          setUserData(defaultSellerData)
        }
      } catch {
        if (!cancelled) setUserData(defaultSellerData)
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [sellerId])

  const fetchSellerReviewStats = useCallback(async () => {
    if (!sellerId) {
      setSellerReviewStats({ averageRating: 0, reviewCount: 0 })
      return
    }
    try {
      const rows = await getReviewsBySellerId(sellerId)
      const stats = computeSellerReviewStats(rows)
      setSellerReviewStats({ averageRating: stats.averageRating, reviewCount: stats.reviewCount })
    } catch {
      setSellerReviewStats({ averageRating: 0, reviewCount: 0 })
    }
  }, [sellerId])

  const fetchListings = useCallback(async () => {
    if (!sellerId) return
    setListingsLoading(true)
    try {
      const q = query(collection(db, "products"), where("userId", "==", sellerId))
      const snap = await getDocs(q)
      const rows: SellerListing[] = []
      snap.forEach((d) => {
        const data = d.data()
        rows.push({
          id: d.id,
          title: data.titulo || data.title || "",
          price: data.precio || data.price || "",
          condition: data.condicionGeneral || data.condition || "",
          images: data.images || [],
          createdAt: data.createdAt,
          category: data.categoria || data.category || "",
          subcategory: data.subcategoria || data.subcategory || "",
          brand: data.marca || data.brand || "",
          status: data.status || "active",
        })
      })
      rows.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)
        return dateB.getTime() - dateA.getTime()
      })
      setListings(rows)
    } catch {
      // deja la lista tal cual estaba
    } finally {
      setListingsLoading(false)
    }
  }, [sellerId])

  useEffect(() => {
    fetchListings()
    fetchSellerReviewStats()
  }, [fetchListings, fetchSellerReviewStats])

  const isStore = userData.accountType === "fisica" || userData.accountType === "virtual"

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Perfil</h1>
        </div>
      </header>

      {/* Cover image */}
      <div className="relative h-60 bg-brand-light overflow-hidden">
        {userData.coverImage ? (
          <img src={userData.coverImage} alt="Portada" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="h-10 w-10 text-brand-ui" />
          </div>
        )}
      </div>

      {/* Avatar + info */}
      <div className="bg-white px-4 pb-4 border-b border-gray-200">
        <div className="flex items-end -mt-14">
          {userData.avatar ? (
            <img
              src={userData.avatar}
              alt={userData.name}
              className={`border-4 border-white object-cover ${isStore ? "w-40 h-40 rounded-xl" : "w-20 h-20 rounded-full"}`}
            />
          ) : (
            <div className={`border-4 border-white bg-brand-light flex items-center justify-center ${isStore ? "w-40 h-40 rounded-xl" : "w-20 h-20 rounded-full"}`}>
              {isStore ? <Store className="h-12 w-12 text-brand-ui" /> : <User className="h-8 w-8 text-brand-ui" />}
            </div>
          )}
          <div className="flex-1 ml-4 mt-16">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {isStore ? userData.storeName || `${userData.name} ${userData.lastname}` : `${userData.name} ${userData.lastname}`}
              </h2>
              {userData.verified && (
                <span className="bg-brand-ui rounded-full p-0.5 shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">@{userData.username.replace(/^@/, "")}</p>
          </div>
        </div>

        {userData.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {userData.badges.slice(0, 3).map((badge, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5"
                style={{ backgroundColor: badge.color + "22", color: badge.color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.color }} />
                {badge.name}
              </span>
            ))}
            {userData.badges.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{userData.badges.length - 3} más
              </Badge>
            )}
          </div>
        )}

        {userData.bio && <p className="text-sm text-gray-700 mt-3">{userData.bio}</p>}

        <p className="text-xs text-gray-500 mt-2">
          {userData.province && userData.city ? `${userData.province}, ${userData.city}` : userData.location}
        </p>
        {userData.createdAt && <p className="text-xs text-gray-500 mt-1">Miembro desde {formatCreatedAt(userData.createdAt)}</p>}

        <div className="flex flex-wrap gap-1.5 mt-2">
          {userData.accountType === "fisica" && (
            <Badge variant="outline" className="text-xs text-brand-ui border-brand-ui">
              Tienda Física
            </Badge>
          )}
          {userData.accountType === "virtual" && (
            <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
              Tienda Virtual
            </Badge>
          )}
          {userData.verified && (
            <Badge variant="outline" className="text-xs text-brand-ui border-brand-ui">
              Verificado
            </Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 bg-white px-4 py-3 border-b border-gray-200">
        <Link href={`/vendedor/${sellerId}/reseñas`}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 flex flex-col items-center text-center">
              <Star className="h-5 w-5 text-yellow-500 mb-1" />
              <p className="font-semibold text-gray-900">
                {sellerReviewStats.reviewCount > 0 ? `${sellerReviewStats.averageRating.toFixed(1)}/5` : "—"}
              </p>
              <p className="text-xs text-gray-500">
                {sellerReviewStats.reviewCount} {sellerReviewStats.reviewCount === 1 ? "reseña" : "reseñas"}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-3 flex flex-col items-center text-center">
            <Users className="h-5 w-5 text-brand-ui mb-1" />
            <p className="font-semibold text-gray-900">{userData.stats.followers.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Seguidores</p>
          </CardContent>
        </Card>
      </div>

      {/* Listings */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Anuncios del Vendedor</h3>
          <span className="text-sm text-gray-500">{listings.length} productos</span>
        </div>

        {listingsLoading ? (
          <p className="text-sm text-gray-500 text-center py-8">Cargando productos...</p>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="font-medium mb-1">No hay productos disponibles</p>
            <p className="text-sm">Este vendedor aún no ha publicado productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((item) => (
              <Link key={item.id} href={`/producto/${item.id}`}>
                <Card className="overflow-hidden">
                  <div className="relative">
                    <img src={item.images[0] || "/placeholder.svg"} alt={item.title} className="w-full h-36 object-cover" />
                    {item.status === "sold" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge className="bg-red-500 text-white">VENDIDO</Badge>
                      </div>
                    )}
                    {favoriteProductIds.includes(item.id) && (
                      <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs bg-white/90">
                        ♥ favorito
                      </Badge>
                    )}
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
    </div>
  )
}
