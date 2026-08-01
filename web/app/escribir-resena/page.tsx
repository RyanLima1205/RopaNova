"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Star, AlertCircle, CheckCircle2, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { fetchOrderForBuyer, type BuyerOrder } from "@/lib/services/orderService"
import { createReview, getReviewByOrderId } from "@/lib/services/reviewService"
import { sellerPublicProfileFromUserData, EMPTY_SELLER_PUBLIC_PROFILE, type SellerPublicProfile } from "@/lib/sellerDisplayName"

const MAX_COMMENT = 500
const RATING_LABELS: Record<number, string> = {
  1: "Muy mala",
  2: "Mala",
  3: "Regular",
  4: "Buena",
  5: "Excelente",
}

type ScreenPhase = "loading" | "error" | "form" | "success"

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex justify-center gap-2 py-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onChange(star)} aria-label={`${star} estrella${star > 1 ? "s" : ""}`}>
          <Star className={`h-11 w-11 ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  )
}

export default function EscribirResenaPageGate() {
  return (
    <RequireAuth>
      <EscribirResenaPage />
    </RequireAuth>
  )
}

function EscribirResenaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId") || ""
  const { user } = useAuth()

  const [phase, setPhase] = useState<ScreenPhase>("loading")
  const [order, setOrder] = useState<BuyerOrder | null>(null)
  const [sellerProfile, setSellerProfile] = useState<SellerPublicProfile>(EMPTY_SELLER_PUBLIC_PROFILE)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  const formValid = rating >= 1

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoadError("Inicia sesión para dejar una reseña.")
      setPhase("error")
      return
    }
    setPhase("loading")
    setLoadError(null)
    try {
      const [existing, fetched] = await Promise.all([getReviewByOrderId(orderId), fetchOrderForBuyer(orderId, user.id)])
      if (existing) {
        setLoadError("Ya dejaste una reseña para este pedido.")
        setPhase("error")
        return
      }
      if (!fetched) {
        setLoadError("No se encontró el pedido.")
        setPhase("error")
        return
      }
      if (fetched.status !== "delivered") {
        setLoadError("Solo puedes publicar la reseña cuando el pedido esté marcado como entregado.")
        setPhase("error")
        return
      }
      setOrder(fetched)
      if (fetched.sellerId) {
        try {
          const sellerSnap = await getDoc(doc(db, "users", fetched.sellerId))
          if (sellerSnap.exists()) {
            setSellerProfile(sellerPublicProfileFromUserData(sellerSnap.data() as Record<string, unknown>))
          } else {
            setSellerProfile({
              experienceLabel: fetched.sellerName || "este vendedor",
              chipName: fetched.sellerName || "Vendedor",
              handleLine: "",
              avatar: fetched.sellerAvatar || EMPTY_SELLER_PUBLIC_PROFILE.avatar,
            })
          }
        } catch {
          setSellerProfile({
            experienceLabel: fetched.sellerName || "este vendedor",
            chipName: fetched.sellerName || "Vendedor",
            handleLine: "",
            avatar: fetched.sellerAvatar || EMPTY_SELLER_PUBLIC_PROFILE.avatar,
          })
        }
      }
      setPhase("form")
    } catch {
      setLoadError("No se pudo cargar el pedido.")
      setPhase("error")
    }
  }, [orderId, user?.id])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async () => {
    if (!user?.id || !formValid) return
    const trimmed = comment.trim()
    if (trimmed.length > MAX_COMMENT) {
      setSubmitError(`El comentario no puede superar ${MAX_COMMENT} caracteres.`)
      return
    }
    setSubmitError(null)
    setSubmitting(true)
    try {
      await createReview(user.id, user.name, user.avatar ?? "", { orderId, rating, comment: trimmed })
      setPhase("success")
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : ""
      if (code === "REVIEW_ALREADY_EXISTS") {
        setLoadError("Ya dejaste una reseña para este pedido.")
        setPhase("error")
        return
      }
      if (code === "ORDER_NOT_DELIVERED") {
        setSubmitError("El pedido debe estar entregado para publicar la reseña.")
        return
      }
      setSubmitError("No se pudo publicar la reseña. Intenta de nuevo.")
    }
    setSubmitting(false)
  }

  const Header = ({ title }: { title: string }) => (
    <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h1 className="font-semibold text-gray-900">{title}</h1>
    </div>
  )

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header title="Dejar reseña" />
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
        </div>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header title="Dejar reseña" />
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-3">
          <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-amber-700" />
          </div>
          <p className="text-xl font-bold text-gray-900">No disponible</p>
          <p className="text-gray-500 leading-relaxed">{loadError}</p>
          <Link href="/mis-pedidos">
            <Button className="bg-brand-ui hover:bg-brand-dark mt-2">Volver a mis pedidos</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (phase === "success") {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header title="Reseña publicada" />
        <div className="flex flex-col items-center justify-center py-20 px-6 gap-3">
          <div className="h-24 w-24 rounded-full bg-brand-ui flex items-center justify-center mb-2">
            <CheckCircle2 className="h-14 w-14 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900">¡Gracias!</p>
          <p className="text-gray-500 text-center mb-4">Tu opinión ayuda a la comunidad</p>
          <div className="w-full max-w-sm space-y-3">
            <Link href="/mis-pedidos">
              <Button className="w-full bg-brand-ui hover:bg-brand-dark py-6">Volver a mis pedidos</Button>
            </Link>
            <Link href={order?.sellerId ? `/vendedor/${order.sellerId}/reseñas` : "/mis-pedidos"}>
              <Button variant="outline" className="w-full border-brand-ui text-brand-ui py-6 bg-transparent">
                Ver reseñas del vendedor
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Header title="Dejar reseña" />

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-lg font-bold text-gray-900 mb-4 leading-relaxed">¿Cómo fue tu experiencia con {sellerProfile.experienceLabel}?</p>
          <div className="flex gap-3.5 mb-3.5">
            {order?.productImage ? (
              <img src={order.productImage} alt="" className="w-24 rounded-xl object-cover shrink-0" style={{ height: 120 }} />
            ) : (
              <div className="w-24 rounded-xl bg-gray-200 flex items-center justify-center shrink-0" style={{ height: 120 }}>
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="font-semibold text-gray-900 line-clamp-2">{order?.productTitle}</p>
              <p className="text-sm text-gray-500 mt-0.5">Pedido {order?.orderCode}</p>
              {order?.lineSummary && order.lineSummary !== "—" && <p className="text-sm text-gray-400 truncate">{order.lineSummary}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2">
            <img src={sellerProfile.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
            <div className="min-w-0 max-w-[140px]">
              <p className="text-sm font-semibold text-gray-700 truncate">{sellerProfile.chipName}</p>
              {sellerProfile.handleLine && <p className="text-xs text-gray-500 truncate">{sellerProfile.handleLine}</p>}
            </div>
            {order?.shippingLabel && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-500 truncate flex-1">{order.shippingLabel}</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <p className="font-semibold text-gray-900 mb-1">Calificación general</p>
          <StarPicker value={rating} onChange={setRating} />
          <p className={`text-center font-semibold ${rating > 0 ? "text-brand-ui" : "text-gray-400"}`}>
            {rating > 0 ? RATING_LABELS[rating] : "Toca una estrella para calificar"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <p className="font-semibold text-gray-900">Tu comentario</p>
          <p className="text-sm text-gray-400 mb-3">Opcional</p>
          <Textarea
            placeholder="Escribe tu experiencia aquí…"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
            rows={5}
          />
          <p className="text-xs text-gray-400 text-right mt-2">
            {comment.length}/{MAX_COMMENT}
          </p>
        </div>

        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
            <AlertCircle className="h-4 w-4 text-red-700 shrink-0" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        <Button className="w-full bg-brand-ui hover:bg-brand-dark py-6" onClick={handleSubmit} disabled={submitting || !formValid}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar reseña"}
        </Button>
      </div>
    </div>
  )
}
