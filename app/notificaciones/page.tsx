"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Bell,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Settings,
  MoreVertical,
  Home,
  Search,
  Camera,
  MessageCircle,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

// Mock notifications data
const notificationsData = [
  {
    id: 1,
    type: "new_order",
    title: "Nueva orden recibida",
    message: "Ana Rodríguez compró tu Vestido Elegante de Noche Zara por RD$2,500",
    timestamp: "Hace 5 minutos",
    read: false,
    priority: "high",
    actionUrl: "/ordenes/123",
    metadata: {
      buyerName: "Ana Rodríguez",
      productTitle: "Vestido Elegante de Noche Zara",
      amount: 2500,
      orderId: "ORD-123",
    },
  },
  {
    id: 2,
    type: "low_stock",
    title: "Stock bajo",
    message: "Solo te queda 1 artículo de la categoría Vestidos",
    timestamp: "Hace 1 hora",
    read: false,
    priority: "medium",
    actionUrl: "/dashboard?tab=inventory",
    metadata: {
      category: "Vestidos",
      remainingStock: 1,
      threshold: 2,
    },
  },
  {
    id: 3,
    type: "performance_alert",
    title: "¡Producto destacado!",
    message: "Tu Bolso Coach ha recibido 50+ vistas en las últimas 24 horas",
    timestamp: "Hace 2 horas",
    read: true,
    priority: "low",
    actionUrl: "/producto/456",
    metadata: {
      productTitle: "Bolso de Cuero Genuino Coach",
      views: 52,
      timeframe: "24 horas",
    },
  },
  {
    id: 4,
    type: "price_suggestion",
    title: "Sugerencia de precio",
    message: "Considera reducir el precio de tus Zapatos Steve Madden para aumentar las ventas",
    timestamp: "Hace 3 horas",
    read: true,
    priority: "medium",
    actionUrl: "/dashboard?tab=inventory&product=789",
    metadata: {
      productTitle: "Zapatos de Tacón Steve Madden",
      currentPrice: 2200,
      suggestedPrice: 1900,
      reason: "Productos similares se venden a menor precio",
    },
  },
  {
    id: 5,
    type: "review_received",
    title: "Nueva reseña recibida",
    message: "Carmen López te dejó una reseña de 5 estrellas",
    timestamp: "Hace 4 horas",
    read: true,
    priority: "low",
    actionUrl: "/vendedor/user1/reseñas",
    metadata: {
      reviewerName: "Carmen López",
      rating: 5,
      productTitle: "Jeans Skinny Levi's",
    },
  },
  {
    id: 6,
    type: "message_received",
    title: "Nuevo mensaje",
    message: "Isabella Martínez te envió un mensaje sobre el Vestido Floral",
    timestamp: "Hace 6 horas",
    read: true,
    priority: "medium",
    actionUrl: "/mensajes?conversation=567",
    metadata: {
      senderName: "Isabella Martínez",
      productTitle: "Vestido Floral Verano",
    },
  },
  {
    id: 7,
    type: "weekly_summary",
    title: "Resumen semanal",
    message: "Esta semana vendiste 3 artículos por un total de RD$6,200",
    timestamp: "Hace 1 día",
    read: true,
    priority: "low",
    actionUrl: "/dashboard",
    metadata: {
      salesCount: 3,
      totalRevenue: 6200,
      period: "Esta semana",
    },
  },
  {
    id: 8,
    type: "promotion_suggestion",
    title: "Oportunidad de promoción",
    message: "Tus productos de la categoría Bolsos están teniendo buena demanda",
    timestamp: "Hace 2 días",
    read: true,
    priority: "low",
    actionUrl: "/dashboard?tab=analytics",
    metadata: {
      category: "Bolsos",
      trend: "increasing",
      suggestion: "Considera agregar más productos de esta categoría",
    },
  },
]

// Notification settings
const notificationSettings = {
  newOrders: {
    enabled: true,
    push: true,
    email: true,
    whatsapp: false,
  },
  lowStock: {
    enabled: true,
    push: true,
    email: false,
    whatsapp: false,
    threshold: 2,
  },
  performanceAlerts: {
    enabled: true,
    push: true,
    email: true,
    whatsapp: false,
  },
  priceAlerts: {
    enabled: true,
    push: false,
    email: true,
    whatsapp: false,
  },
  reviews: {
    enabled: true,
    push: true,
    email: false,
    whatsapp: false,
  },
  messages: {
    enabled: true,
    push: true,
    email: false,
    whatsapp: true,
  },
  weeklySummary: {
    enabled: true,
    push: false,
    email: true,
    whatsapp: false,
  },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(notificationsData)
  const [filter, setFilter] = useState("all")
  const [settings, setSettings] = useState(notificationSettings)
  const [showSettings, setShowSettings] = useState(false)

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true
    if (filter === "unread") return !notification.read
    if (filter === "orders") return notification.type === "new_order"
    if (filter === "alerts") return ["low_stock", "performance_alert", "price_suggestion"].includes(notification.type)
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_order":
        return <Package className="h-5 w-5 text-green-500" />
      case "low_stock":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "performance_alert":
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case "price_suggestion":
        return <DollarSign className="h-5 w-5 text-purple-500" />
      case "review_received":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "message_received":
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case "weekly_summary":
        return <TrendingUp className="h-5 w-5 text-indigo-500" />
      case "promotion_suggestion":
        return <Eye className="h-5 w-5 text-pink-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-orange-500"
      case "low":
        return "border-l-blue-500"
      default:
        return "border-l-gray-300"
    }
  }

  const updateSetting = (category: string, setting: string, value: boolean | number) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }))
  }

  const NotificationCard = ({ notification }: { notification: any }) => (
    <Card
      className={`cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
        !notification.read ? "bg-blue-50/30" : ""
      }`}
      onClick={() => {
        markAsRead(notification.id)
        // In a real app, navigate to the action URL
        console.log("Navigate to:", notification.actionUrl)
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-medium text-sm ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                  {notification.title}
                </h3>
                <p className={`text-sm mt-1 ${!notification.read ? "text-gray-700" : "text-gray-600"}`}>
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{notification.timestamp}</span>
                  {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </div>

            {/* Additional metadata for specific notification types */}
            {notification.type === "new_order" && notification.metadata && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-700">Orden #{notification.metadata.orderId}</span>
                  <span className="font-medium text-green-800">RD${notification.metadata.amount.toLocaleString()}</span>
                </div>
              </div>
            )}

            {notification.type === "low_stock" && notification.metadata && (
              <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-xs text-orange-700">
                  Solo {notification.metadata.remainingStock} artículo(s) restante(s) en{" "}
                  {notification.metadata.category}
                </div>
              </div>
            )}

            {notification.type === "price_suggestion" && notification.metadata && (
              <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-700">
                  Precio actual: RD${notification.metadata.currentPrice.toLocaleString()} → Sugerido: RD$
                  {notification.metadata.suggestedPrice.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-700" />
              <h1 className="font-semibold text-gray-900">Notificaciones</h1>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configuración de Notificaciones</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* New Orders */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-500" />
                      Nuevas Órdenes
                    </h3>
                    <div className="space-y-3 pl-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Activar notificaciones</span>
                        <Switch
                          checked={settings.newOrders.enabled}
                          onCheckedChange={(checked) => updateSetting("newOrders", "enabled", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Push notifications</span>
                        <Switch
                          checked={settings.newOrders.push}
                          onCheckedChange={(checked) => updateSetting("newOrders", "push", checked)}
                          disabled={!settings.newOrders.enabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email</span>
                        <Switch
                          checked={settings.newOrders.email}
                          onCheckedChange={(checked) => updateSetting("newOrders", "email", checked)}
                          disabled={!settings.newOrders.enabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">WhatsApp</span>
                        <Switch
                          checked={settings.newOrders.whatsapp}
                          onCheckedChange={(checked) => updateSetting("newOrders", "whatsapp", checked)}
                          disabled={!settings.newOrders.enabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Low Stock */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Stock Bajo
                    </h3>
                    <div className="space-y-3 pl-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Activar alertas</span>
                        <Switch
                          checked={settings.lowStock.enabled}
                          onCheckedChange={(checked) => updateSetting("lowStock", "enabled", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Umbral de stock</span>
                        <Select
                          value={settings.lowStock.threshold.toString()}
                          onValueChange={(value) => updateSetting("lowStock", "threshold", Number.parseInt(value))}
                          disabled={!settings.lowStock.enabled}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Push notifications</span>
                        <Switch
                          checked={settings.lowStock.push}
                          onCheckedChange={(checked) => updateSetting("lowStock", "push", checked)}
                          disabled={!settings.lowStock.enabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Performance Alerts */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Alertas de Rendimiento
                    </h3>
                    <div className="space-y-3 pl-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Activar alertas</span>
                        <Switch
                          checked={settings.performanceAlerts.enabled}
                          onCheckedChange={(checked) => updateSetting("performanceAlerts", "enabled", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Push notifications</span>
                        <Switch
                          checked={settings.performanceAlerts.push}
                          onCheckedChange={(checked) => updateSetting("performanceAlerts", "push", checked)}
                          disabled={!settings.performanceAlerts.enabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email</span>
                        <Switch
                          checked={settings.performanceAlerts.email}
                          onCheckedChange={(checked) => updateSetting("performanceAlerts", "email", checked)}
                          disabled={!settings.performanceAlerts.enabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Messages */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      Mensajes
                    </h3>
                    <div className="space-y-3 pl-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Activar notificaciones</span>
                        <Switch
                          checked={settings.messages.enabled}
                          onCheckedChange={(checked) => updateSetting("messages", "enabled", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Push notifications</span>
                        <Switch
                          checked={settings.messages.push}
                          onCheckedChange={(checked) => updateSetting("messages", "push", checked)}
                          disabled={!settings.messages.enabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">WhatsApp</span>
                        <Switch
                          checked={settings.messages.whatsapp}
                          onCheckedChange={(checked) => updateSetting("messages", "whatsapp", checked)}
                          disabled={!settings.messages.enabled}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      className="w-full bg-emerald-500 hover:bg-emerald-600"
                      onClick={() => setShowSettings(false)}
                    >
                      Guardar Configuración
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="bg-transparent">
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 pb-20">
        {/* Filter Tabs */}
        <Tabs defaultValue="all" className="w-full mb-6">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all" onClick={() => setFilter("all")}>
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" onClick={() => setFilter("unread")}>
              No leídas ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="orders" onClick={() => setFilter("orders")}>
              Órdenes
            </TabsTrigger>
            <TabsTrigger value="alerts" onClick={() => setFilter("alerts")}>
              Alertas
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No hay notificaciones</p>
              <p className="text-sm">Cuando tengas nuevas notificaciones aparecerán aquí</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex">
          <Link
            href="/"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Inicio</span>
          </Link>
          <Link
            href="/buscar"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <Search className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Buscar</span>
          </Link>
          <Link
            href="/vender"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Vender</span>
          </Link>
          <Link
            href="/mensajes"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <MessageCircle className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Mensajes</span>
          </Link>
          <Link
            href="/perfil"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
