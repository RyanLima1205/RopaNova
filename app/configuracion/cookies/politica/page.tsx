"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Cookie,
  Shield,
  Settings,
  BarChart3,
  Target,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CookiePolicyPage() {
  const cookieData = [
    // Necessary Cookies
    {
      category: "necessary",
      name: "vintedrd_session",
      purpose: "Mantiene tu sesión activa mientras navegas",
      duration: "Hasta cerrar el navegador",
      provider: "VintedRD",
      type: "HTTP Cookie",
    },
    {
      category: "necessary",
      name: "csrf_token",
      purpose: "Protege contra ataques de falsificación de solicitudes",
      duration: "24 horas",
      provider: "VintedRD",
      type: "HTTP Cookie",
    },
    {
      category: "necessary",
      name: "auth_token",
      purpose: "Autentica tu identidad de forma segura",
      duration: "30 días",
      provider: "VintedRD",
      type: "HTTP Cookie",
    },
    {
      category: "necessary",
      name: "language_pref",
      purpose: "Recuerda tu idioma preferido",
      duration: "1 año",
      provider: "VintedRD",
      type: "HTTP Cookie",
    },
    // Functional Cookies
    {
      category: "functional",
      name: "user_preferences",
      purpose: "Guarda tus configuraciones personalizadas",
      duration: "1 año",
      provider: "VintedRD",
      type: "Local Storage",
    },
    {
      category: "functional",
      name: "search_filters",
      purpose: "Recuerda tus filtros de búsqueda favoritos",
      duration: "6 meses",
      provider: "VintedRD",
      type: "Local Storage",
    },
    {
      category: "functional",
      name: "notification_settings",
      purpose: "Almacena tus preferencias de notificaciones",
      duration: "1 año",
      provider: "VintedRD",
      type: "Local Storage",
    },
    {
      category: "functional",
      name: "recently_viewed",
      purpose: "Mantiene el historial de productos vistos recientemente",
      duration: "30 días",
      provider: "VintedRD",
      type: "Local Storage",
    },
    // Analytics Cookies
    {
      category: "analytics",
      name: "_ga",
      purpose: "Distingue usuarios únicos para análisis estadístico",
      duration: "2 años",
      provider: "Google Analytics",
      type: "HTTP Cookie",
    },
    {
      category: "analytics",
      name: "_ga_*",
      purpose: "Mantiene el estado de la sesión para Google Analytics 4",
      duration: "2 años",
      provider: "Google Analytics",
      type: "HTTP Cookie",
    },
    {
      category: "analytics",
      name: "_gid",
      purpose: "Distingue usuarios únicos (identificador de corta duración)",
      duration: "24 horas",
      provider: "Google Analytics",
      type: "HTTP Cookie",
    },
    {
      category: "analytics",
      name: "hotjar_*",
      purpose: "Analiza el comportamiento del usuario en el sitio",
      duration: "1 año",
      provider: "Hotjar",
      type: "HTTP Cookie",
    },
    // Marketing Cookies
    {
      category: "marketing",
      name: "_fbp",
      purpose: "Rastrea visitantes en sitios web para anuncios de Facebook",
      duration: "3 meses",
      provider: "Facebook",
      type: "HTTP Cookie",
    },
    {
      category: "marketing",
      name: "_fbc",
      purpose: "Almacena información de clics en anuncios de Facebook",
      duration: "3 meses",
      provider: "Facebook",
      type: "HTTP Cookie",
    },
    {
      category: "marketing",
      name: "google_ads_*",
      purpose: "Personaliza anuncios y mide efectividad de campañas",
      duration: "90 días",
      provider: "Google Ads",
      type: "HTTP Cookie",
    },
    {
      category: "marketing",
      name: "retargeting_pixel",
      purpose: "Permite mostrar anuncios personalizados en otros sitios",
      duration: "180 días",
      provider: "VintedRD",
      type: "Pixel",
    },
  ]

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case "necessary":
        return {
          icon: Shield,
          color: "text-green-500",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          title: "Cookies Necesarias",
          badge: "Requeridas",
        }
      case "functional":
        return {
          icon: Settings,
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          title: "Cookies Funcionales",
          badge: "Opcional",
        }
      case "analytics":
        return {
          icon: BarChart3,
          color: "text-purple-500",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          title: "Cookies Analíticas",
          badge: "Opcional",
        }
      case "marketing":
        return {
          icon: Target,
          color: "text-orange-500",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          title: "Cookies de Marketing",
          badge: "Opcional",
        }
      default:
        return {
          icon: Cookie,
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          title: "Otras Cookies",
          badge: "Opcional",
        }
    }
  }

  const groupedCookies = cookieData.reduce(
    (acc, cookie) => {
      if (!acc[cookie.category]) {
        acc[cookie.category] = []
      }
      acc[cookie.category].push(cookie)
      return acc
    },
    {} as Record<string, typeof cookieData>,
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/configuracion/cookies">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900">Política de Cookies</h1>
            <p className="text-xs text-gray-600">Detalles completos de todas las cookies utilizadas</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-6 w-6 text-amber-500" />
              ¿Qué son las Cookies?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web.
              Nos ayudan a recordar tus preferencias, mejorar tu experiencia y proporcionar funcionalidades
              personalizadas.
            </p>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                En VintedRD utilizamos cookies de manera responsable y transparente. Tienes control total sobre qué
                cookies aceptar, excepto las estrictamente necesarias para el funcionamiento del sitio.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Shield className="h-6 w-6 text-green-500 mx-auto mb-1" />
                <div className="text-xs font-medium text-green-800">Seguras</div>
                <div className="text-xs text-green-600">Protegemos tu privacidad</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Settings className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                <div className="text-xs font-medium text-blue-800">Personalizables</div>
                <div className="text-xs text-blue-600">Tú decides qué aceptar</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                <div className="text-xs font-medium text-purple-800">Analíticas</div>
                <div className="text-xs text-purple-600">Mejoramos el servicio</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Globe className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                <div className="text-xs font-medium text-orange-800">Transparentes</div>
                <div className="text-xs text-orange-600">Información completa</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Categories */}
        {Object.entries(groupedCookies).map(([category, cookies]) => {
          const categoryInfo = getCategoryInfo(category)
          const IconComponent = categoryInfo.icon

          return (
            <Card key={category} className={`${categoryInfo.borderColor} border-2`}>
              <CardHeader className={categoryInfo.bgColor}>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className={`h-5 w-5 ${categoryInfo.color}`} />
                  {categoryInfo.title}
                  <Badge variant={category === "necessary" ? "secondary" : "outline"} className="text-xs">
                    {categoryInfo.badge}
                  </Badge>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {cookies.length} cookies
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {cookies.map((cookie, index) => (
                    <div key={cookie.name}>
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{cookie.name}</h4>
                              <p className="text-xs text-gray-600 mt-1">{cookie.purpose}</p>
                            </div>
                            <Badge variant="outline" className="text-xs ml-3">
                              {cookie.type}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">
                                <strong>Duración:</strong> {cookie.duration}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">
                                <strong>Proveedor:</strong> {cookie.provider}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < cookies.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Third-party Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Servicios de Terceros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Utilizamos servicios de terceros confiables para mejorar tu experiencia. Cada servicio tiene sus propias
              políticas de privacidad:
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Google Analytics</div>
                    <div className="text-xs text-gray-600">Análisis de tráfico y comportamiento</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                    Ver Política
                  </a>
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">F</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Facebook Pixel</div>
                    <div className="text-xs text-gray-600">Publicidad personalizada y remarketing</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">
                    Ver Política
                  </a>
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">H</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Hotjar</div>
                    <div className="text-xs text-gray-600">Análisis de experiencia de usuario</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.hotjar.com/legal/policies/privacy/" target="_blank" rel="noopener noreferrer">
                    Ver Política
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Management */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Settings className="h-5 w-5" />
              Gestión de Cookies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-blue-800 space-y-3">
              <p>
                <strong>Controla tus cookies:</strong> Puedes gestionar tus preferencias de cookies en cualquier momento
                desde la configuración de tu cuenta o desde tu navegador.
              </p>

              <div className="space-y-2">
                <p>
                  <strong>Desde VintedRD:</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
                  <li>Ve a Configuración → Cookies</li>
                  <li>Activa o desactiva categorías específicas</li>
                  <li>Los cambios se aplican inmediatamente</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p>
                  <strong>Desde tu navegador:</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
                  <li>Chrome: Configuración → Privacidad y seguridad → Cookies</li>
                  <li>Firefox: Preferencias → Privacidad y seguridad</li>
                  <li>Safari: Preferencias → Privacidad</li>
                  <li>Edge: Configuración → Cookies y permisos del sitio</li>
                </ul>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <strong>Importante:</strong> Desactivar ciertas cookies puede afectar la funcionalidad del sitio. Las
                cookies necesarias no se pueden desactivar ya que son esenciales para el funcionamiento básico.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 pt-2">
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/configuracion/cookies">Gestionar Cookies</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/privacidad">Política de Privacidad</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              ¿Tienes Preguntas?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-700">
              Si tienes preguntas sobre nuestro uso de cookies o necesitas ayuda con la configuración:
            </p>

            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span>cookies@vintedrd.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Soporte:</span>
                <span>ayuda@vintedrd.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Teléfono:</span>
                <span>+1 (809) 555-0123</span>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Responderemos a todas las consultas sobre cookies dentro de 48 horas.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pb-8">
          <p>© 2025 VintedRD. Todos los derechos reservados.</p>
          <p>Política de cookies actualizada el 10 de enero de 2025</p>
        </div>
      </div>
    </div>
  )
}
