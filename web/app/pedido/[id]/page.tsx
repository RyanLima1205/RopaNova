"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  AlertCircle,
  XCircle,
  ImageIcon,
  ChevronRight,
  User,
  Check,
  CheckCircle2,
  X,
  Star,
  MessageCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { RequireAuth } from "@/components/require-auth"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { fetchOrderForBuyer, cancelOrderAsBuyer, type BuyerOrder, type OrderStatus } from "@/lib/services/orderService"
import { createConversationIfNeeded } from "@/lib/services/chatService"
import { getStatusInfo, ORDER_TIMELINE_STEPS, getTimelineStepStates, formatOrderCurrency, formatOrderDate, type TimelineStepState } from "@/lib/orderStatus"

const canCancelPending = (s: OrderStatus) => s === "pending"

function TimelineDot({ state }: { state: TimelineStepState }) {
  if (state === "done") {
    return (
      <div className="h-[22px] w-[22px] rounded-full bg-green-500 flex items-center justify-center">
        <Check className="h-3.5 w-3.5 text-white" />
      </div>
    )
  }
  if (state === "current") {
    return (
      <div className="h-[22px] w-[22px] rounded-full bg-brand-ui border-2 border-brand-light flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-white" />
      </div>
    )
  }
  if (state === "cancelled") {
    return (
      <div className="h-[22px] w-[22px] rounded-full bg-red-500 flex items-center justify-center">
        <X className="h-3.5 w-3.5 text-white" />
      </div>
    )
  }
  return <div className="h-[22px] w-[22px] rounded-full bg-gray-200 border-2 border-gray-300" />
}

export default function PedidoDetailPageGate() {
  return (
    <RequireAuth>
      <PedidoDetailPage />
    </RequireAuth>
  )
}

function PedidoDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const orderId = params.id
  const { user } = useAuth()

  const [order, setOrder] = useState<BuyerOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) {
      setError("Inicia sesión para ver este pedido.")
      setOrder(null)
      setLoading(false)
      return
    }
    setError(null)
    try {
      const row = await fetchOrderForBuyer(orderId, user.id)
      if (!row) {
        setError("Pedido no encontrado.")
        setOrder(null)
      } else {
        setOrder(row)
      }
    } catch {
      setError("No se pudo cargar el pedido.")
      setOrder(null)
    }
    setLoading(false)
  }, [orderId, user?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const handleCancel = async () => {
    if (!order || !user?.id) return
    try {
      await cancelOrderAsBuyer(order.id, user.id)
      await load()
    } catch {
      toast({ title: "No se pudo cancelar el pedido.", variant: "destructive" })
    }
    setCancelOpen(false)
  }

  const handleContactSeller = async () => {
    if (!order || !user?.id) return
    setContactLoading(true)
    try {
      const conversationId = await createConversationIfNeeded(user.id, order.sellerId, { id: order.productId, title: order.productTitle })
      const qs = new URLSearchParams({
        productId: order.productId,
        productTitle: order.productTitle,
        productPrice: String(order.amount),
        productImage: order.productImage || "",
        sellerId: order.sellerId,
        sellerName: order.sellerName,
      })
      router.push(`/mensajes/${conversationId}?${qs.toString()}`)
    } catch {
      toast({ title: "No se pudo abrir el chat con el vendedor.", variant: "destructive" })
    }
    setContactLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
        <p className="text-sm text-gray-500">Cargando pedido...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Detalle del pedido</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400" />
          <p className="text-gray-500">{error ?? "Pedido no disponible"}</p>
          <button onClick={load} className="text-brand-ui font-medium">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const stepStates = getTimelineStepStates(order.status)
  const detailLine =
    order.unitCount > 1 || (order.lineSummary && order.lineSummary !== "—")
      ? `${order.lineSummary}${order.unitCount > 0 ? ` · ${order.unitCount} ${order.unitCount === 1 ? "artículo" : "artículos"}` : ""}`
      : null

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">Pedido {order.orderCode}</h1>
          <p className="text-xs text-gray-400">{formatOrderDate(order.createdAt)}</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: `${statusInfo.color}22`, color: statusInfo.color }}>
          {statusInfo.label}
        </span>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {order.status === "cancelled" ? (
          <div className="flex items-center gap-2 bg-red-50 rounded-lg p-3">
            <XCircle className="h-5 w-5 text-red-700" />
            <p className="text-sm font-semibold text-red-700">Este pedido fue cancelado.</p>
          </div>
        ) : (
          <div className="flex items-start gap-2 bg-brand-extraLight rounded-lg p-3">
            <AlertCircle className="h-5 w-5 text-brand-ui shrink-0 mt-0.5" />
            <p className="text-sm text-brand-dark">Consulta aquí el estado de tu pedido. El vendedor actualizará cada etapa cuando corresponda.</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-3">Estado del pedido</p>
          {ORDER_TIMELINE_STEPS.map((step, index) => {
            const state = stepStates[index]
            const isLast = index === ORDER_TIMELINE_STEPS.length - 1
            const description = state === "current" || state === "done" ? step.descriptionActive : step.descriptionPending
            return (
              <div key={step.status} className="flex">
                <div className="w-7 flex flex-col items-center">
                  <TimelineDot state={state} />
                  {!isLast && (
                    <div className={`flex-1 w-0.5 my-1 min-h-[24px] ${state === "done" ? "bg-green-500" : state === "current" ? "bg-brand-light" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className={`flex-1 pl-2 ${!isLast ? "pb-5" : ""}`}>
                  <p className={`text-sm font-semibold ${state === "current" ? "text-brand-ui" : state === "upcoming" ? "text-gray-400" : "text-gray-700"}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs mt-1 leading-relaxed ${state === "current" ? "text-brand-dark font-medium" : "text-gray-400"}`}>{description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Producto */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-3">Producto</p>
          <Link href={`/producto/${order.productId}`} className="flex items-center gap-3">
            {order.productImage ? (
              <img src={order.productImage} alt="" className="h-[72px] w-[72px] rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-[72px] w-[72px] rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <ImageIcon className="h-8 w-8 text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{order.productTitle}</p>
              {detailLine && <p className="text-xs text-gray-500 mt-1">{detailLine}</p>}
              <p className="text-brand-ui font-bold mt-1.5">{formatOrderCurrency(order.amount)}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
          </Link>
        </div>

        {/* Vendedor */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-3">Vendedor</p>
          <Link href={`/vendedor/${order.sellerId}`} className="flex items-center gap-3">
            {order.sellerAvatar ? (
              <img src={order.sellerAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-400" />
              </div>
            )}
            <p className="flex-1 font-semibold text-gray-900">{order.sellerName}</p>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>

        {/* Envío */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-2">Envío</p>
          <p className="text-sm text-gray-700">{order.shippingLabel}</p>
          {order.deliveryAddressSummary && <p className="text-sm text-gray-500 mt-1.5">Dirección: {order.deliveryAddressSummary}</p>}
          {order.deliveryCity && <p className="text-sm text-gray-500 mt-1.5">Ciudad: {order.deliveryCity}</p>}
          {order.includeInsurance && <p className="text-sm text-gray-500 mt-1.5">Seguro de envío incluido</p>}
          {order.trackingNumber ? (
            <div className="bg-gray-100 rounded-lg p-2.5 mt-2.5">
              <p className="text-xs text-gray-500">N° de seguimiento</p>
              <p className="font-bold text-gray-900">{order.trackingNumber}</p>
              {order.estimatedDelivery && <p className="text-xs text-brand-ui mt-1">Entrega estimada: {formatOrderDate(new Date(order.estimatedDelivery))}</p>}
            </div>
          ) : order.status === "shipped" ? (
            <p className="text-sm text-gray-500 mt-1.5">El vendedor aún no ha añadido un número de seguimiento.</p>
          ) : null}
        </div>

        {/* Acciones */}
        <div className="space-y-2.5">
          {canCancelPending(order.status) && (
            <Button variant="outline" className="w-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100" onClick={() => setCancelOpen(true)}>
              <XCircle className="h-4 w-4 mr-2" /> Cancelar pedido
            </Button>
          )}
          {order.status === "delivered" &&
            (order.hasReview || order.reviewId ? (
              <div className="w-full flex items-center justify-center gap-2 bg-green-50 rounded-lg py-3.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-semibold">Reseña enviada</span>
              </div>
            ) : (
              <Link href={`/escribir-resena?orderId=${order.id}`}>
                <Button className="w-full bg-brand-ui hover:bg-brand-dark py-6">
                  <Star className="h-4 w-4 mr-2" /> Dejar reseña
                </Button>
              </Link>
            ))}
          <Button variant="outline" className="w-full border-brand-ui text-brand-ui py-6 bg-transparent" onClick={handleContactSeller} disabled={contactLoading}>
            {contactLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
            Contactar vendedor
          </Button>
        </div>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Anular el pedido {order.orderCode}? Solo es posible mientras está pendiente (antes de que el vendedor lo confirme).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleCancel}>
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
