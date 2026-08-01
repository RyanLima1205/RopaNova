"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Star, ShieldCheck, Filter, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ReviewCard } from "@/components/review-card"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import {
  computeSellerReviewStats,
  getReviewsBySellerId,
  sellerReviewToCardReview,
  type SellerReviewStats,
} from "@/lib/services/reviewService"

const AVATAR_PLACEHOLDER = "https://via.placeholder.com/80x80/4ade80/ffffff?text=V"

const handleWithoutAt = (username?: string) => (username || "").trim().replace(/^@+/, "")
const atHandle = (username?: string) => {
  const h = handleWithoutAt(username)
  return h ? `@${h}` : ""
}

function buildSellerHeaderFromUserDoc(data: Record<string, unknown>) {
  const accountType = String(data.accountType || "")
  const username = String(data.username || "")
  const storeName = String(data.storeName || "").trim()
  const fullName = `${String(data.name || "")} ${String(data.lastname || "")}`.trim()
  const uh = atHandle(username)

  let displayName = "Vendedor"
  let handleLine = ""

  if (accountType === "privado") {
    displayName = uh || fullName || "Vendedor"
  } else if (accountType === "virtual" || accountType === "fisica") {
    if (storeName) {
      displayName = storeName
      handleLine = uh
    } else {
      displayName = fullName || uh || "Vendedor"
      handleLine = fullName && uh ? uh : ""
    }
  } else {
    displayName = storeName || fullName || uh || "Vendedor"
    handleLine = storeName ? uh : fullName && uh ? uh : ""
  }

  const avatarRaw = data.avatar != null ? String(data.avatar).trim() : ""
  const avatar = avatarRaw || AVATAR_PLACEHOLDER
  const verified = Boolean(data.verified)

  return { displayName, handleLine, avatar, verified }
}

async function fetchSellerHeaderById(sellerId: string | undefined): Promise<ReturnType<typeof buildSellerHeaderFromUserDoc>> {
  if (!sellerId) return { displayName: "Vendedor", handleLine: "", avatar: AVATAR_PLACEHOLDER, verified: false }
  try {
    const snap = await getDoc(doc(db, "users", sellerId))
    if (!snap.exists()) return { displayName: "Vendedor", handleLine: "", avatar: AVATAR_PLACEHOLDER, verified: false }
    return buildSellerHeaderFromUserDoc(snap.data() as Record<string, unknown>)
  } catch {
    return { displayName: "Vendedor", handleLine: "", avatar: AVATAR_PLACEHOLDER, verified: false }
  }
}

const EMPTY_STATS: SellerReviewStats = {
  averageRating: 0,
  reviewCount: 0,
  ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  categoryAverages: {},
  categoryCounts: {},
}

const FILTER_OPTIONS = [
  { value: "todos", label: "Todas" },
  { value: "5", label: "5 estrellas" },
  { value: "4", label: "4 estrellas" },
  { value: "3", label: "3 estrellas" },
  { value: "2", label: "2 estrellas" },
  { value: "1", label: "1 estrella" },
  { value: "fotos", label: "Con fotos" },
]

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" }
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${sizeMap[size]} ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  )
}

export default function SellerReviewsPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const sellerId = params.id

  const [reviewFilter, setReviewFilter] = useState("todos")
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState<SellerReviewStats>(EMPTY_STATS)
  const [sellerHeader, setSellerHeader] = useState<ReturnType<typeof buildSellerHeaderFromUserDoc> | null>(null)
  const [loadingReviews, setLoadingReviews] = useState(true)

  const loadHeader = useCallback(async () => {
    const header = await fetchSellerHeaderById(sellerId)
    setSellerHeader(header)
  }, [sellerId])

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true)
    try {
      const rows = await getReviewsBySellerId(sellerId)
      setStats(computeSellerReviewStats(rows))
      setReviews(rows.map((r) => sellerReviewToCardReview(r)))
    } catch {
      setStats(EMPTY_STATS)
      setReviews([])
    }
    setLoadingReviews(false)
  }, [sellerId])

  useEffect(() => {
    loadHeader()
    loadReviews()
  }, [loadHeader, loadReviews])

  const headerDisplayName = sellerHeader?.displayName ?? "Vendedor"
  const headerHandleLine = sellerHeader?.handleLine ?? ""
  const headerAvatar = sellerHeader?.avatar ?? AVATAR_PLACEHOLDER
  const headerVerified = sellerHeader?.verified ?? false

  const filteredReviews = reviews.filter((review) => {
    if (reviewFilter === "todos") return true
    if (reviewFilter === "fotos") return review.photos && review.photos.length > 0
    return String(review.rating) === reviewFilter
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-gray-900">Reseñas del Vendedor</h1>
      </div>

      <div className="bg-white p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative shrink-0">
            <img src={headerAvatar} alt={headerDisplayName} className="h-16 w-16 rounded-full object-cover" />
            {headerVerified && (
              <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-brand-ui flex items-center justify-center border-2 border-white">
                <ShieldCheck className="h-3 w-3 text-white" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-gray-900 truncate">{headerDisplayName}</p>
              {headerVerified && <ShieldCheck className="h-4 w-4 text-brand-ui shrink-0" />}
            </div>
            {headerHandleLine && <p className="text-sm text-gray-500">{headerHandleLine}</p>}
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(stats.averageRating)} size="md" />
              <span className="font-semibold text-gray-900">{stats.reviewCount > 0 ? `${stats.averageRating.toFixed(1)}/5` : "—"}</span>
              <span className="text-sm text-gray-500">({stats.reviewCount} reseñas)</span>
            </div>
          </div>
        </div>

        {/* Rating breakdown */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">Distribución de Calificaciones</p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingBreakdown[rating] ?? 0
              const percentage = stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 w-3">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-6 text-right">{count}</span>
                  <span className="text-sm text-gray-500 w-9 text-right">{percentage.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white mt-2 p-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
          <p className="font-semibold text-gray-900">Todas las Reseñas ({reviews.length})</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Filter className="h-5 w-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {FILTER_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt.value} onClick={() => setReviewFilter(opt.value)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {loadingReviews ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} showProduct />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center gap-2">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">
              {reviews.length === 0 ? "Este vendedor aún no tiene reseñas." : "No hay reseñas que coincidan con los filtros seleccionados."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
