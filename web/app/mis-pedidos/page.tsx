"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, ImageIcon, User, XCircle, CheckCircle2, Star, Car, MessageCircle, FileText, Package, Loader2 } from "lucide-react"
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
import { fetchOrdersForBuyer, cancelOrderAsBuyer, type BuyerOrder, type OrderStatus } from "@/lib/services/orderService"
import { getStatusInfo, formatOrderCurrency, formatOrderDate } from "@/lib/orderStatus"
import { createConversationIfNeeded } from "@/lib/services/chatService"

type Tab = "all" | "active" | "delivered" | "cancelled"

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "delivered", label: "Entregados" },
  { id: "cancelled", label: "Cancelados" },
]

const canCancelPending = (s: OrderStatus) => s === "pending"

export default function MisPedidosPageGate() {
  return (
    <RequireAuth>
      <MisPedidosPage />
    </RequireAuth>
  )
}

function MisPedidosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("all")
  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<BuyerOrder | null>(null)
  const [contactLoading, setContactLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) {
      setOrders([])
      setLoading(false)
      return
    }
    setError(null)
    try {
      const list = await fetchOrdersForBuyer(user.id)
      setOrders(list)
    } catch {
      setError("No se pudieron cargar los pedidos.")
      setOrders([])
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const filterList = (list: BuyerOrder[]): BuyerOrder[] => {
    switch (activeTab) {
      case "active":
        return list.filter((o) => ["pending", "confirmed", "shipped"].includes(o.status))
      case "delivered":
        return list.filter((o) => o.status === "delivered")
      case "cancelled":
        return list.filter((o) => o.status === "cancelled")
      default:
        return list
    }
  }
  const filteredOrders = filterList(orders)

  const handleCancel = async () => {
    if (!cancelTarget || !user?.id) return
    try {
      await cancelOrderAsBuyer(cancelTarget.id, user.id)
      await load()
    } catch {
      toast({ title: "No se pudo cancelar. Solo puedes cancelar mientras el pedido está pendiente.", variant: "destructive" })
    }
    setCancelTarget(null)
  }

  const handleContact = async (order: BuyerOrder) => {
    if (!user?.id) return
    setContactLoading(order.id)
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
      toast({ title: "No se pudo abrir el chat.", variant: "destructive" })
    }
    setContactLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-gray-900">Mis Pedidos</h1>
      </div>

      <div className="bg-white border-b border-gray-100 flex sticky top-[57px] z-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${
              activeTab === tab.id ? "border-brand-ui text-brand-ui" : "border-transparent text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={load} className="text-brand-ui text-sm font-medium mt-2">
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
        </div>
      ) : (
        <div className="p-4 max-w-2xl mx-auto space-y-4">
          {filteredOrders.length === 0 && !error ? (
            <div className="flex flex-col items-center py-16 text-center gap-2">
              <Package className="h-12 w-12 text-gray-300" />
              <p className="font-semibold text-gray-900">No hay pedidos</p>
              <p className="text-sm text-gray-500">
                {activeTab === "all"
                  ? "Aún no has realizado ningún pedido"
                  : `No tienes pedidos ${activeTab === "active" ? "activos" : activeTab === "delivered" ? "entregados" : "cancelados"}`}
              </p>
              <Link href="/">
                <Button className="mt-3 bg-brand-ui hover:bg-brand-dark">Explorar Productos</Button>
              </Link>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const detailLine =
                order.unitCount > 1 || (order.lineSummary && order.lineSummary !== "—")
                  ? `${order.lineSummary}${order.unitCount > 0 ? ` · ${order.unitCount} ${order.unitCount === 1 ? "artículo" : "artículos"}` : ""}`
                  : null

              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <Link href={`/pedido/${order.id}`} className="block">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pedido {order.orderCode}</p>
                        <p className="text-xs text-gray-400">{formatOrderDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ backgroundColor: `${statusInfo.color}22`, color: statusInfo.color }}
                        >
                          {statusInfo.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {order.productImage ? (
                        <img src={order.productImage} alt="" className="h-[60px] w-[60px] rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-[60px] w-[60px] rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{order.productTitle}</p>
                        {detailLine && <p className="text-xs text-gray-500">{detailLine}</p>}
                        <div className="flex items-center gap-1.5 mt-1">
                          {order.sellerAvatar ? (
                            <img src={order.sellerAvatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-2.5 w-2.5 text-gray-400" />
                            </div>
                          )}
                          <span className="text-xs text-gray-500">{order.sellerName}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{order.shippingLabel}</p>
                        <p className="text-brand-ui font-bold mt-1">{formatOrderCurrency(order.amount)}</p>
                      </div>
                    </div>
                  </Link>

                  {order.trackingNumber && (
                    <div className="bg-gray-50 rounded-lg p-2.5 mt-3">
                      <p className="text-xs text-gray-500">N° seguimiento:</p>
                      <p className="text-sm font-medium text-gray-900">{order.trackingNumber}</p>
                      {order.estimatedDelivery && (
                        <p className="text-xs text-brand-ui mt-0.5">Entrega estimada: {formatOrderDate(new Date(order.estimatedDelivery))}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {canCancelPending(order.status) && user?.id && (
                      <button
                        onClick={() => setCancelTarget(order)}
                        className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-1.5"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancelar
                      </button>
                    )}
                    {order.status === "delivered" &&
                      (order.hasReview || order.reviewId ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-brand-ui bg-brand-extraLight rounded-md px-3 py-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Reseña enviada
                        </span>
                      ) : (
                        <Link
                          href={`/escribir-resena?orderId=${order.id}`}
                          className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-brand-extraLight rounded-md px-3 py-1.5"
                        >
                          <Star className="h-3.5 w-3.5 text-yellow-500" /> Reseña
                        </Link>
                      ))}
                    {order.status === "shipped" && (
                      <Link href={`/pedido/${order.id}`} className="flex items-center gap-1 text-xs font-medium text-brand-ui bg-brand-extraLight rounded-md px-3 py-1.5">
                        <Car className="h-3.5 w-3.5" /> Rastrear
                      </Link>
                    )}
                    <button
                      onClick={() => handleContact(order)}
                      disabled={contactLoading === order.id}
                      className="flex items-center gap-1 text-xs font-medium text-brand-ui bg-brand-extraLight rounded-md px-3 py-1.5 disabled:opacity-60"
                    >
                      {contactLoading === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
                      Contactar
                    </button>
                    <Link href={`/pedido/${order.id}`} className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md px-3 py-1.5">
                      <FileText className="h-3.5 w-3.5" /> Detalle
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Anular el pedido {cancelTarget?.orderCode}? Solo es posible mientras el pedido está pendiente (antes de que el vendedor lo confirme). Para
              cambiar tallas o envío, cancela y vuelve a realizar el pedido.
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
