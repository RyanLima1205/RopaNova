"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  RefreshCw,
  Rocket,
  ChevronRight,
  Barcode,
  Car,
  Store,
  CheckCircle2,
  Loader2,
  WifiOff,
  ShoppingBag,
  PlusCircle,
  MessageCircle,
  User,
  Settings,
  BarChart3,
  Users,
  TrendingUp,
  Star,
  Bell,
  Wallet,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/contexts/AuthContext"
import { fetchOrdersForSeller, updateOrderStatus, type BuyerOrder, type OrderStatus } from "@/lib/services/orderService"
import { getStatusInfo, formatOrderCurrency, formatOrderDate } from "@/lib/orderStatus"

type TabKey = "all" | OrderStatus

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmados" },
  { key: "shipped", label: "Enviados" },
  { key: "delivered", label: "Entregados" },
  { key: "cancelled", label: "Cancelados" },
]

const COMING_FEATURES = [
  { icon: BarChart3, color: "#1F7EF5", bg: "#EAF4FF", title: "Estadísticas de ventas e ingresos", desc: "Visualiza tus ingresos diarios, semanales y mensuales en tiempo real." },
  { icon: Users, color: "#2563eb", bg: "#eff6ff", title: "Seguimiento de compradores", desc: "Conoce cuántos compradores únicos tienes y su tasa de retorno." },
  { icon: TrendingUp, color: "#7c3aed", bg: "#f5f3ff", title: "Categorías más exitosas", desc: "Descubre qué prendas y tallas se venden más rápido en tu tienda." },
  { icon: Star, color: "#d97706", bg: "#fffbeb", title: "Valoración promedio", desc: "Tu puntuación como vendedor y el historial de reseñas de compradores." },
  { icon: Bell, color: "#dc2626", bg: "#fef2f2", title: "Alertas inteligentes", desc: "Recibe notificaciones cuando un producto esté próximo a agotarse o tenga alta demanda." },
  { icon: Wallet, color: "#1F7EF5", bg: "#EAF4FF", title: "Resumen financiero", desc: "Balance de ingresos netos, comisiones y fondos disponibles para retirar." },
] as const

export default function DashboardPageGate() {
  return (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  )
}

function DashboardPage() {
  const { user } = useAuth()

  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [showStatsSheet, setShowStatsSheet] = useState(false)
  const [trackingModal, setTrackingModal] = useState<{ orderId: string; title: string } | null>(null)
  const [trackingInput, setTrackingInput] = useState("")
  const [confirmAction, setConfirmAction] = useState<{ type: "confirm" | "deliver" | "cancel"; order: BuyerOrder } | null>(null)

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const data = await fetchOrdersForSeller(user.id)
        setOrders(data)
      } catch {
        setError("No se pudieron cargar tus ventas.")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [user?.id],
  )

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () => (activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab)),
    [orders, activeTab],
  )

  const doUpdate = async (order: BuyerOrder, newStatus: OrderStatus, extras?: { trackingNumber?: string }) => {
    if (!user?.id) return
    setUpdatingId(order.id)
    try {
      await updateOrderStatus(order.id, user.id, newStatus, extras)
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus, ...(extras?.trackingNumber ? { trackingNumber: extras.trackingNumber } : {}) } : o)),
      )
    } catch (e: any) {
      toast({
        title: e.message === "FORBIDDEN" ? "No tienes permiso para actualizar este pedido." : "No se pudo actualizar el estado. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleConfirmShip = async () => {
    if (!trackingModal) return
    const order = orders.find((o) => o.id === trackingModal.orderId)
    setTrackingModal(null)
    if (!order) return
    await doUpdate(order, "shipped", trackingInput.trim() ? { trackingNumber: trackingInput.trim() } : undefined)
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    const { type, order } = confirmAction
    setConfirmAction(null)
    if (type === "confirm") await doUpdate(order, "confirmed")
    else if (type === "deliver") await doUpdate(order, "delivered")
    else if (type === "cancel") await doUpdate(order, "cancelled")
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/perfil">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-gray-900">Mis Ventas</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => load(true)}>
          <RefreshCw className={`h-5 w-5 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-3 py-2.5">
        <div className="flex overflow-x-auto gap-1.5 scrollbar-hide">
          {TABS.map((tab) => {
            const count = tab.key === "all" ? orders.length : orders.filter((o) => o.status === tab.key).length
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm shrink-0 ${
                  active ? "bg-brand-ui text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 ${
                      active ? "bg-white/30 text-white" : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-3">
        {/* Stats teaser */}
        <button
          onClick={() => setShowStatsSheet(true)}
          className="w-full flex items-center gap-2 bg-brand-extraLight border border-brand-light rounded-lg px-3.5 py-2.5"
        >
          <Rocket className="h-4 w-4 text-brand-ui shrink-0" />
          <span className="text-sm text-gray-700 flex-1 text-left">
            Estadísticas detalladas — <span className="font-semibold text-brand-ui">próximamente</span>
          </span>
          <ChevronRight className="h-4 w-4 text-brand-ui" />
        </button>

        {/* Body */}
        {loading && !refreshing ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-brand-ui" />
            <p className="text-sm text-gray-500">Cargando ventas...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <WifiOff className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-600 text-center">{error}</p>
            <Button onClick={() => load()} className="bg-brand-ui hover:bg-brand-dark">
              Reintentar
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-6">
            <ShoppingBag className="h-12 w-12 text-gray-200" />
            <p className="font-semibold text-gray-700">
              {activeTab === "all" ? "Aún no tienes ventas" : `Sin pedidos ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}`}
            </p>
            <p className="text-sm text-gray-400">
              {activeTab === "all" ? "Cuando recibas tu primera venta aparecerá aquí." : "Cambia de pestaña para ver otros pedidos."}
            </p>
          </div>
        ) : (
          filtered.map((order) => {
            const { label: statusLabel, color: statusColor } = getStatusInfo(order.status)
            const isUpdating = updatingId === order.id
            const initials = order.buyerName
              ? order.buyerName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
              : "C"

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* TODO: enlazar a la página de detalle del pedido para el vendedor
                      (mobile: SellerOrderDetailScreen.tsx) — aún no construida. */}
                  <div className="block">
                    <div className="flex gap-3 mb-2.5">
                      {order.productImage ? (
                        <img src={order.productImage} alt="" className="h-[72px] w-[72px] rounded-lg object-cover bg-gray-100" />
                      ) : (
                        <div className="h-[72px] w-[72px] rounded-lg bg-gray-100 flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{order.productTitle}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{order.lineSummary}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-sm font-bold text-brand-ui">{formatOrderCurrency(order.amount)}</span>
                          <span className="text-[11px] text-gray-400">{formatOrderDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 font-mono mb-2.5">Pedido #{order.orderCode}</p>

                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="h-[34px] w-[34px] rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {order.buyerAvatar ? (
                          <img src={order.buyerAvatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-brand-ui">{initials}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">Comprador</p>
                        <p className="text-sm font-medium text-gray-900">{order.buyerName || "Cliente"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="h-[34px] w-[34px] rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        {order.shippingMethodId === "pickup" ? (
                          <Store className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Car className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">{order.shippingLabel}</p>
                        {order.deliveryCity && <p className="text-sm font-medium text-gray-900">{order.deliveryCity}</p>}
                        {order.deliveryAddressSummary && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{order.deliveryAddressSummary}</p>
                        )}
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <div className="flex items-center gap-1.5 bg-gray-50 rounded px-2.5 py-1.5 mb-2">
                        <Barcode className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-xs text-gray-500 font-mono">{order.trackingNumber}</span>
                      </div>
                    )}

                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border"
                      style={{ backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40`, color: statusColor }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                      {statusLabel}
                    </span>
                  </div>

                  {isUpdating ? (
                    <div className="flex justify-center mt-3">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-ui" />
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      {order.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-brand-ui hover:bg-brand-dark"
                            onClick={() => setConfirmAction({ type: "confirm", order })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => setConfirmAction({ type: "cancel", order })}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setTrackingInput("")
                            setTrackingModal({ orderId: order.id, title: order.productTitle })
                          }}
                        >
                          <Car className="h-3.5 w-3.5 mr-1" /> Marcar como enviado
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <Button
                          size="sm"
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          onClick={() => setConfirmAction({ type: "deliver", order })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marcar como entregado
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}

        {/* Quick actions */}
        <Card>
          <CardContent className="p-3.5">
            <p className="text-xs font-bold text-gray-900 mb-3">Acciones Rápidas</p>
            <div className="flex justify-between">
              <Link href="/vender" className="flex-1 flex flex-col items-center gap-1 py-1.5">
                <PlusCircle className="h-5 w-5 text-brand-ui" />
                <span className="text-[11px] text-gray-700">Publicar</span>
              </Link>
              <Link href="/mensajes" className="flex-1 flex flex-col items-center gap-1 py-1.5">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <span className="text-[11px] text-gray-700">Mensajes</span>
              </Link>
              <Link href="/perfil" className="flex-1 flex flex-col items-center gap-1 py-1.5">
                <User className="h-5 w-5 text-purple-600" />
                <span className="text-[11px] text-gray-700">Perfil</span>
              </Link>
              <Link href="/configuracion" className="flex-1 flex flex-col items-center gap-1 py-1.5">
                <Settings className="h-5 w-5 text-amber-600" />
                <span className="text-[11px] text-gray-700">Config</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking dialog */}
      <Dialog open={!!trackingModal} onOpenChange={(open) => !open && setTrackingModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como enviado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 line-clamp-2 -mt-2">{trackingModal?.title}</p>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">
              Número de tracking <span className="text-gray-400 font-normal">(opcional)</span>
            </p>
            <Input
              placeholder="Ej: CAEX12345678DO"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmShip()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmShip} className="bg-blue-600 hover:bg-blue-700">
              <Car className="h-4 w-4 mr-1.5" /> Confirmar envío
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm/cancel/deliver dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "confirm" && "Confirmar pedido"}
              {confirmAction?.type === "deliver" && "Marcar como entregado"}
              {confirmAction?.type === "cancel" && "Cancelar pedido"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "confirm" && `¿Aceptas el pedido #${confirmAction.order.orderCode}?`}
              {confirmAction?.type === "deliver" && "¿Confirmas que el comprador recibió el pedido?"}
              {confirmAction?.type === "cancel" && "¿Seguro que deseas cancelar este pedido? El comprador será notificado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{confirmAction?.type === "confirm" ? "No" : "Cancelar"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction?.type === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-brand-ui hover:bg-brand-dark"}
            >
              {confirmAction?.type === "confirm" && "Confirmar"}
              {confirmAction?.type === "deliver" && "Sí, entregado"}
              {confirmAction?.type === "cancel" && "Cancelar pedido"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SellerStatsScreen.tsx content, ported as a sheet (coming-soon placeholder, no own route) */}
      <Sheet open={showStatsSheet} onOpenChange={setShowStatsSheet}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Estadísticas</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="bg-white border border-brand-light rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="h-[88px] w-[88px] rounded-full bg-brand-extraLight flex items-center justify-center mb-4">
                <Rocket className="h-10 w-10 text-brand-ui" />
              </div>
              <p className="text-xl font-extrabold text-gray-900 mb-3">¡Tu centro de mando está en camino! 🚀</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Estamos construyendo algo increíble para ti. Muy pronto podrás ver en tiempo real tus ventas,
                ingresos, compradores recurrentes y mucho más — todo desde aquí.
              </p>
              <span className="inline-flex items-center gap-1.5 bg-brand-extraLight border border-brand-light rounded-full px-3.5 py-1.5 text-sm font-semibold text-brand-ui">
                <Info className="h-3.5 w-3.5" /> Próximamente disponible
              </span>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1 pt-2">Lo que viene para ti</p>

            {COMING_FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="flex items-start gap-3.5 bg-white rounded-xl p-3.5 shadow-sm">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: f.bg }}>
                    <Icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">{f.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              )
            })}

            <div className="flex items-start gap-2 px-1 pt-2 pb-4">
              <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Las estadísticas estarán disponibles en una próxima actualización de RopaNova.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
