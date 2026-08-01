"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  Settings,
  Camera,
  Pencil,
  Store,
  User,
  Star,
  Users,
  CheckCircle2,
  MoreVertical,
  Share2,
  Trash2,
  Home,
  Search,
  Plus,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/contexts/AuthContext"
import { useFavoriteProductIds } from "@/hooks/useFavoriteProductIds"
import { db, storage } from "@/lib/firebaseConfig"
import { formatPrice } from "@/lib/formatters"
import { getReviewsBySellerId, computeSellerReviewStats } from "@/lib/services/reviewService"
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

interface ProfileBadge {
  name: string
  icon: string
  color: string
}

interface UserProfileData {
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
  badges: ProfileBadge[]
  createdAt?: string
}

const defaultUserData: UserProfileData = {
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

interface UserListing {
  id: string
  title: string
  price: string
  condition: string
  images: string[]
  createdAt: any
  category: string
  subcategory: string
  brand: string
  color: string[]
  talla: string[]
  status?: "active" | "sold" | "inactive"
}

/** Misma lógica que mobile-app ProfileScreen.tsx (soporta string o Firestore Timestamp). */
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

export default function PerfilPageGate() {
  return (
    <RequireAuth>
      <PerfilPage />
    </RequireAuth>
  )
}

function PerfilPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { favoriteProductIds } = useFavoriteProductIds()
  const profileUserId = user?.id || ""

  const [userData, setUserData] = useState<UserProfileData>(defaultUserData)
  const [loading, setLoading] = useState(true)
  const [myListings, setMyListings] = useState<UserListing[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [sellerReviewStats, setSellerReviewStats] = useState({ averageRating: 0, reviewCount: 0 })
  const [productToDelete, setProductToDelete] = useState<UserListing | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!profileUserId) {
      setUserData(defaultUserData)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", profileUserId))
        if (cancelled) return
        if (docSnap.exists()) {
          setUserData({ ...defaultUserData, ...(docSnap.data() as Partial<UserProfileData>), id: profileUserId })
        } else {
          setUserData(defaultUserData)
        }
      } catch {
        if (!cancelled) setUserData(defaultUserData)
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [profileUserId])

  const fetchSellerReviewStats = useCallback(async () => {
    if (!profileUserId) {
      setSellerReviewStats({ averageRating: 0, reviewCount: 0 })
      return
    }
    try {
      const rows = await getReviewsBySellerId(profileUserId)
      const stats = computeSellerReviewStats(rows)
      setSellerReviewStats({ averageRating: stats.averageRating, reviewCount: stats.reviewCount })
    } catch {
      setSellerReviewStats({ averageRating: 0, reviewCount: 0 })
    }
  }, [profileUserId])

  const fetchUserListings = useCallback(async () => {
    if (!profileUserId) return
    setListingsLoading(true)
    try {
      const q = query(collection(db, "products"), where("userId", "==", profileUserId))
      const snap = await getDocs(q)
      const listings: UserListing[] = []
      snap.forEach((d) => {
        const data = d.data()
        let tallas: string[] = []
        if (data.stock && Array.isArray(data.stock)) {
          tallas = data.stock.map((item: any) => item.talla).filter(Boolean)
        }
        listings.push({
          id: d.id,
          title: data.titulo || data.title || "",
          price: data.precio || data.price || "",
          condition: data.condicionGeneral || data.condition || "",
          images: data.images || [],
          createdAt: data.createdAt,
          category: data.categoria || data.category || "",
          subcategory: data.subcategoria || data.subcategory || "",
          brand: data.marca || data.brand || "",
          color: data.color || [],
          talla: tallas,
          status: data.status || "active",
        })
      })
      listings.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)
        return dateB.getTime() - dateA.getTime()
      })
      setMyListings(listings)
    } catch {
      // deja la lista tal cual estaba
    } finally {
      setListingsLoading(false)
    }
  }, [profileUserId])

  useEffect(() => {
    fetchUserListings()
    fetchSellerReviewStats()
  }, [fetchUserListings, fetchSellerReviewStats])

  const isStore = userData.accountType === "fisica" || userData.accountType === "virtual"

  const handleUploadImage = async (file: File, type: "avatar" | "cover") => {
    if (!user?.id) return
    type === "avatar" ? setUploadingAvatar(true) : setUploadingCover(true)
    try {
      const fileName = type === "avatar" ? `avatars/${user.id}/${Date.now()}.jpg` : `covers/${user.id}/${Date.now()}.jpg`
      const imageRef = ref(storage, fileName)
      await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(imageRef)

      const updateData = type === "avatar" ? { avatar: downloadURL } : { coverImage: downloadURL }
      await updateDoc(doc(db, "users", user.id), updateData)
      setUserData((prev) => ({ ...prev, ...updateData }))

      const imageType = type === "avatar" ? "perfil" : "portada"
      toast({ title: `Foto de ${imageType} actualizada` })
    } catch {
      const imageType = type === "avatar" ? "perfil" : "portada"
      toast({ title: `Error al actualizar la foto de ${imageType}`, variant: "destructive" })
    } finally {
      type === "avatar" ? setUploadingAvatar(false) : setUploadingCover(false)
    }
  }

  const handleShareProduct = (item: UserListing) => {
    const shareUrl = `${window.location.origin}/producto/${item.id}`
    const shareMessage = `¡Mira este producto en RopaNova!\n\n${item.title}\nPrecio: RD$${(Number(item.price) || 0).toLocaleString()}\n\n${shareUrl}`
    if (navigator.share) {
      navigator.share({ title: item.title, text: shareMessage, url: shareUrl })
    } else {
      navigator.clipboard.writeText(shareUrl)
      toast({ title: "Enlace copiado" })
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "products", productToDelete.id))
      setMyListings((prev) => prev.filter((item) => item.id !== productToDelete.id))
      toast({ title: `"${productToDelete.title}" eliminado` })
    } catch {
      toast({ title: "Error al eliminar la publicación", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setProductToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-brand-ui text-sm">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-gray-900">Mi Perfil</h1>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <BarChart3 className="h-5 w-5 text-brand-ui" />
              </Button>
            </Link>
            <Link href="/configuracion">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-5 w-5 text-gray-700" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Cover image */}
      <div className="relative h-60 bg-brand-light overflow-hidden">
        {userData.coverImage ? (
          <img src={userData.coverImage} alt="Portada" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="h-10 w-10 text-brand-ui" />
          </div>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUploadImage(file, "cover")
            e.target.value = ""
          }}
        />
        <button
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="absolute bottom-2 right-3 bg-white rounded-full p-2 shadow disabled:opacity-60"
        >
          <Camera className={`h-4 w-4 text-brand-ui ${uploadingCover ? "animate-pulse" : ""}`} />
        </button>
      </div>

      {/* Avatar + info */}
      <div className="bg-white px-4 pb-4 border-b border-gray-200">
        <div className="flex items-end -mt-14">
          <div className="relative">
            {userData.avatar ? (
              <img
                src={userData.avatar}
                alt={userData.name}
                className={`border-4 border-white object-cover ${isStore ? "w-40 h-40 rounded-xl" : "w-20 h-20 rounded-full"}`}
              />
            ) : (
              <div
                className={`border-4 border-white bg-brand-light flex items-center justify-center ${isStore ? "w-40 h-40 rounded-xl" : "w-20 h-20 rounded-full"}`}
              >
                {isStore ? <Store className="h-12 w-12 text-brand-ui" /> : <User className="h-8 w-8 text-brand-ui" />}
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUploadImage(file, "avatar")
                e.target.value = ""
              }}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-1 right-1 bg-white border border-gray-200 rounded-md p-1.5 disabled:opacity-60"
            >
              <Pencil className={`h-3.5 w-3.5 text-brand-ui ${uploadingAvatar ? "animate-pulse" : ""}`} />
            </button>
          </div>
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
        {userData.createdAt && (
          <p className="text-xs text-gray-500 mt-1">Miembro desde {formatCreatedAt(userData.createdAt)}</p>
        )}

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
        <Link href={profileUserId ? `/vendedor/${profileUserId}/reseñas` : "#"}>
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
          <span className="text-sm text-gray-500">{myListings.length} productos</span>
        </div>

        {listingsLoading ? (
          <p className="text-sm text-gray-500 text-center py-8">Cargando productos...</p>
        ) : myListings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="font-medium mb-1">No hay productos disponibles</p>
            <p className="text-sm">Aún no has publicado productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {myListings.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative">
                  <Link href={`/producto/${item.id}`}>
                    <img
                      src={item.images[0] || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-36 object-cover"
                    />
                  </Link>
                  {item.status === "sold" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge className="bg-red-500 text-white">VENDIDO</Badge>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 bg-white/90 hover:bg-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/vender?edit=${item.id}`)}>
                        <Pencil className="h-4 w-4 mr-2" /> Modificar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareProduct(item)}>
                        <Share2 className="h-4 w-4 mr-2" /> Compartir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setProductToDelete(item)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar publicación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar &quot;{productToDelete?.title}&quot;? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2">
            <Home className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Inicio</span>
          </Link>
          <Link href="/buscar" className="flex flex-col items-center p-2">
            <Search className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Buscar</span>
          </Link>
          <Link href="/vender" className="flex flex-col items-center p-2">
            <Plus className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Vender</span>
          </Link>
          <Link href="/mensajes" className="flex flex-col items-center p-2">
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Mensajes</span>
          </Link>
          <Link href="/perfil" className="flex flex-col items-center p-2">
            <User className="h-5 w-5 text-brand-ui" />
            <span className="text-xs text-brand-ui mt-1">Perfil</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
