"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Users,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  UserCheck,
  AlertTriangle,
  Info,
  Settings,
  Globe,
  Smartphone,
  Camera,
  Heart,
  Star,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock privacy settings
const initialPrivacySettings = {
  profile: {
    showEmail: false,
    showPhone: false,
    showLocation: true,
    showLastSeen: true,
    showOnlineStatus: true,
    profileVisibility: "public", // public, friends, private
  },
  messaging: {
    allowMessages: true,
    allowMessagesFrom: "everyone", // everyone, verified, following
    readReceipts: true,
    typingIndicators: true,
    messageRequests: true,
  },
  activity: {
    showPurchases: false,
    showSales: true,
    showFavorites: false,
    showFollowing: true,
    showReviews: true,
    activityStatus: true,
  },
  search: {
    searchableByEmail: false,
    searchableByPhone: false,
    searchableByName: true,
    showInSuggestions: true,
    indexProfile: true,
  },
  notifications: {
    allowNotifications: true,
    marketingEmails: false,
    productUpdates: true,
    securityAlerts: true,
  },
  data: {
    dataCollection: true,
    analytics: false,
    personalization: true,
    thirdPartySharing: false,
  },
}

export default function PrivacidadPage() {
  const [settings, setSettings] = useState(initialPrivacySettings)
  const [isSaving, setIsSaving] = useState(false)

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const getVisibilityText = (value: string) => {
    switch (value) {
      case "public":
        return "Público - Todos pueden ver"
      case "friends":
        return "Seguidores - Solo quienes sigues"
      case "private":
        return "Privado - Solo tú"
      default:
        return value
    }
  }

  const getMessagingText = (value: string) => {
    switch (value) {
      case "everyone":
        return "Todos los usuarios"
      case "verified":
        return "Solo usuarios verificados"
      case "following":
        return "Solo quienes sigo"
      default:
        return value
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/configuracion">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-gray-900">Privacidad y Seguridad</h1>
          </div>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600">
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Privacy Overview */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Tu privacidad es importante. Controla qué información compartes y con quién. Los cambios se aplican
            inmediatamente.
          </AlertDescription>
        </Alert>

        {/* Profile Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Privacidad del Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Visibilidad del perfil</span>
                </div>
              </div>
              <Select
                value={settings.profile.profileVisibility}
                onValueChange={(value) => updateSetting("profile", "profileVisibility", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Público - Todos pueden ver</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Seguidores - Solo quienes sigues</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Privado - Solo tú</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Mostrar correo electrónico</p>
                    <p className="text-sm text-gray-500">Otros usuarios pueden ver tu email</p>
                  </div>
                </div>
                <Switch
                  checked={settings.profile.showEmail}
                  onCheckedChange={(checked) => updateSetting("profile", "showEmail", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Mostrar teléfono</p>
                    <p className="text-sm text-gray-500">Visible en tu perfil público</p>
                  </div>
                </div>
                <Switch
                  checked={settings.profile.showPhone}
                  onCheckedChange={(checked) => updateSetting("profile", "showPhone", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Mostrar ubicación</p>
                    <p className="text-sm text-gray-500">Ciudad y provincia en tu perfil</p>
                  </div>
                </div>
                <Switch
                  checked={settings.profile.showLocation}
                  onCheckedChange={(checked) => updateSetting("profile", "showLocation", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Mostrar última conexión</p>
                    <p className="text-sm text-gray-500">Cuándo estuviste activo por última vez</p>
                  </div>
                </div>
                <Switch
                  checked={settings.profile.showLastSeen}
                  onCheckedChange={(checked) => updateSetting("profile", "showLastSeen", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Estado en línea</p>
                    <p className="text-sm text-gray-500">Mostrar cuando estás conectado</p>
                  </div>
                </div>
                <Switch
                  checked={settings.profile.showOnlineStatus}
                  onCheckedChange={(checked) => updateSetting("profile", "showOnlineStatus", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messaging Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Privacidad de Mensajes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Permitir mensajes</p>
                <p className="text-sm text-gray-500">Otros usuarios pueden enviarte mensajes</p>
              </div>
              <Switch
                checked={settings.messaging.allowMessages}
                onCheckedChange={(checked) => updateSetting("messaging", "allowMessages", checked)}
              />
            </div>

            {settings.messaging.allowMessages && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Permitir mensajes de</span>
                    </div>
                  </div>
                  <Select
                    value={settings.messaging.allowMessagesFrom}
                    onValueChange={(value) => updateSetting("messaging", "allowMessagesFrom", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Todos los usuarios</SelectItem>
                      <SelectItem value="verified">Solo usuarios verificados</SelectItem>
                      <SelectItem value="following">Solo quienes sigo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Confirmaciones de lectura</p>
                    <p className="text-sm text-gray-500">Mostrar cuando lees mensajes</p>
                  </div>
                  <Switch
                    checked={settings.messaging.readReceipts}
                    onCheckedChange={(checked) => updateSetting("messaging", "readReceipts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Indicadores de escritura</p>
                    <p className="text-sm text-gray-500">Mostrar cuando estás escribiendo</p>
                  </div>
                  <Switch
                    checked={settings.messaging.typingIndicators}
                    onCheckedChange={(checked) => updateSetting("messaging", "typingIndicators", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Solicitudes de mensaje</p>
                    <p className="text-sm text-gray-500">Filtrar mensajes de desconocidos</p>
                  </div>
                  <Switch
                    checked={settings.messaging.messageRequests}
                    onCheckedChange={(checked) => updateSetting("messaging", "messageRequests", checked)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Activity Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-500" />
              Privacidad de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Mostrar compras</p>
                  <p className="text-sm text-gray-500">Artículos que has comprado</p>
                </div>
              </div>
              <Switch
                checked={settings.activity.showPurchases}
                onCheckedChange={(checked) => updateSetting("activity", "showPurchases", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Mostrar ventas</p>
                  <p className="text-sm text-gray-500">Artículos que has vendido</p>
                </div>
              </div>
              <Switch
                checked={settings.activity.showSales}
                onCheckedChange={(checked) => updateSetting("activity", "showSales", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Mostrar favoritos</p>
                  <p className="text-sm text-gray-500">Artículos que te gustan</p>
                </div>
              </div>
              <Switch
                checked={settings.activity.showFavorites}
                onCheckedChange={(checked) => updateSetting("activity", "showFavorites", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Mostrar seguidos</p>
                  <p className="text-sm text-gray-500">Usuarios que sigues</p>
                </div>
              </div>
              <Switch
                checked={settings.activity.showFollowing}
                onCheckedChange={(checked) => updateSetting("activity", "showFollowing", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Mostrar reseñas</p>
                  <p className="text-sm text-gray-500">Reseñas que has escrito</p>
                </div>
              </div>
              <Switch
                checked={settings.activity.showReviews}
                onCheckedChange={(checked) => updateSetting("activity", "showReviews", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Estado de actividad</p>
                  <p className="text-sm text-gray-500">Mostrar tu actividad reciente</p>
                </div>
              </div>
              <Switch
                checked={settings.activity.activityStatus}
                onCheckedChange={(checked) => updateSetting("activity", "activityStatus", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-500" />
              Privacidad de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Búsqueda por email</p>
                <p className="text-sm text-gray-500">Otros pueden encontrarte por tu email</p>
              </div>
              <Switch
                checked={settings.search.searchableByEmail}
                onCheckedChange={(checked) => updateSetting("search", "searchableByEmail", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Búsqueda por teléfono</p>
                <p className="text-sm text-gray-500">Otros pueden encontrarte por tu teléfono</p>
              </div>
              <Switch
                checked={settings.search.searchableByPhone}
                onCheckedChange={(checked) => updateSetting("search", "searchableByPhone", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Búsqueda por nombre</p>
                <p className="text-sm text-gray-500">Aparecer en resultados de búsqueda</p>
              </div>
              <Switch
                checked={settings.search.searchableByName}
                onCheckedChange={(checked) => updateSetting("search", "searchableByName", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sugerencias de usuarios</p>
                <p className="text-sm text-gray-500">Aparecer en sugerencias de seguimiento</p>
              </div>
              <Switch
                checked={settings.search.showInSuggestions}
                onCheckedChange={(checked) => updateSetting("search", "showInSuggestions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Indexar perfil</p>
                <p className="text-sm text-gray-500">Permitir indexación en motores de búsqueda</p>
              </div>
              <Switch
                checked={settings.search.indexProfile}
                onCheckedChange={(checked) => updateSetting("search", "indexProfile", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Privacidad de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Estas configuraciones afectan cómo recopilamos y usamos tus datos para mejorar tu experiencia.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recopilación de datos</p>
                <p className="text-sm text-gray-500">Permitir recopilación para mejorar el servicio</p>
              </div>
              <Switch
                checked={settings.data.dataCollection}
                onCheckedChange={(checked) => updateSetting("data", "dataCollection", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Análisis de uso</p>
                <p className="text-sm text-gray-500">Ayudar a mejorar la app con datos anónimos</p>
              </div>
              <Switch
                checked={settings.data.analytics}
                onCheckedChange={(checked) => updateSetting("data", "analytics", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Personalización</p>
                <p className="text-sm text-gray-500">Usar datos para personalizar tu experiencia</p>
              </div>
              <Switch
                checked={settings.data.personalization}
                onCheckedChange={(checked) => updateSetting("data", "personalization", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Compartir con terceros</p>
                <p className="text-sm text-gray-500">Compartir datos con socios de confianza</p>
              </div>
              <Switch
                checked={settings.data.thirdPartySharing}
                onCheckedChange={(checked) => updateSetting("data", "thirdPartySharing", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-600" />
              Acciones de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/configuracion/cambiar-password">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Lock className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </Button>
            </Link>

            <Link href="/configuracion/sesiones">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Smartphone className="h-4 w-4 mr-2" />
                Gestionar Sesiones Activas
              </Button>
            </Link>

            <Link href="/configuracion/verificacion">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <UserCheck className="h-4 w-4 mr-2" />
                Verificación de Identidad
              </Button>
            </Link>

            <Link href="/configuracion/bloqueos">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <EyeOff className="h-4 w-4 mr-2" />
                Usuarios Bloqueados
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Privacy Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Consejos de Privacidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">💡 Perfil Público vs Privado</p>
              <p className="text-sm text-blue-700">
                Un perfil público te ayuda a vender más, pero considera qué información personal compartes.
              </p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-1">🔒 Verificación Recomendada</p>
              <p className="text-sm text-green-700">
                Los usuarios verificados generan más confianza y tienen mejor tasa de ventas.
              </p>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Información Sensible</p>
              <p className="text-sm text-yellow-700">
                Nunca compartas información bancaria o documentos de identidad por mensajes privados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
