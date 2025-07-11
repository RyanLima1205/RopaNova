"use client"

import { useState, useEffect } from "react"
import { Cookie, Shield, Settings, BarChart3, Target, Save, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CookiePreferences {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
}

export function CookieSettingsPage() {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences)
  const [isSaving, setIsSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalPreferences, setOriginalPreferences] = useState<CookiePreferences>(defaultPreferences)

  useEffect(() => {
    // Load saved preferences
    const consent = localStorage.getItem("vintedrd-cookie-consent")
    const consentDate = localStorage.getItem("vintedrd-cookie-consent-date")

    if (consent) {
      try {
        const savedPreferences = JSON.parse(consent)
        setPreferences(savedPreferences)
        setOriginalPreferences(savedPreferences)
      } catch (error) {
        console.error("Error parsing cookie preferences:", error)
      }
    }

    if (consentDate) {
      setLastUpdated(consentDate)
    }
  }, [])

  useEffect(() => {
    // Check if preferences have changed
    const changed = JSON.stringify(preferences) !== JSON.stringify(originalPreferences)
    setHasChanges(changed)
  }, [preferences, originalPreferences])

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === "necessary") return // Can't disable necessary cookies
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const savePreferences = async () => {
    setIsSaving(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Save to localStorage
    const now = new Date().toISOString()
    localStorage.setItem("vintedrd-cookie-consent", JSON.stringify(preferences))
    localStorage.setItem("vintedrd-cookie-consent-date", now)

    // Apply cookie settings
    if (typeof window !== "undefined") {
      window.gtag?.("consent", "update", {
        analytics_storage: preferences.analytics ? "granted" : "denied",
        ad_storage: preferences.marketing ? "granted" : "denied",
        functionality_storage: preferences.functional ? "granted" : "denied",
      })
    }

    setLastUpdated(now)
    setOriginalPreferences(preferences)
    setIsSaving(false)
  }

  const resetToDefaults = () => {
    setPreferences(defaultPreferences)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-DO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Cookie className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Cookies</h1>
          <p className="text-sm text-gray-600">Controla qué tipos de cookies quieres permitir en VintedRD</p>
        </div>
      </div>

      {/* Status Alert */}
      {lastUpdated && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Última actualización: {formatDate(lastUpdated)}
            {hasChanges && " • Tienes cambios sin guardar"}
          </AlertDescription>
        </Alert>
      )}

      {/* Cookie Categories */}
      <div className="space-y-4">
        {/* Necessary Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Cookies Necesarias
              <Badge variant="secondary" className="text-xs">
                Requeridas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  Estas cookies son esenciales para el funcionamiento básico del sitio web. Incluyen funciones como
                  autenticación, seguridad y navegación básica.
                </p>
                <div className="text-xs text-gray-500">
                  <strong>Ejemplos:</strong> Sesión de usuario, tokens de seguridad, preferencias de idioma básicas
                </div>
              </div>
              <Switch checked={true} disabled className="ml-4" />
            </div>
          </CardContent>
        </Card>

        {/* Functional Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              Cookies Funcionales
              <Badge variant="outline" className="text-xs">
                Opcional
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  Mejoran la funcionalidad del sitio recordando tus preferencias y configuraciones personalizadas para
                  ofrecerte una mejor experiencia.
                </p>
                <div className="text-xs text-gray-500">
                  <strong>Ejemplos:</strong> Preferencias de visualización, filtros guardados, configuración de
                  notificaciones
                </div>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) => updatePreference("functional", checked)}
                className="ml-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analytics Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Cookies Analíticas
              <Badge variant="outline" className="text-xs">
                Opcional
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  Nos ayudan a entender cómo los usuarios interactúan con nuestro sitio web para poder mejorarlo. Todos
                  los datos son anónimos y agregados.
                </p>
                <div className="text-xs text-gray-500">
                  <strong>Ejemplos:</strong> Google Analytics, métricas de rendimiento, análisis de comportamiento
                </div>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) => updatePreference("analytics", checked)}
                className="ml-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Marketing Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Cookies de Marketing
              <Badge variant="outline" className="text-xs">
                Opcional
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  Permiten mostrar anuncios personalizados y medir la efectividad de nuestras campañas publicitarias
                  tanto en nuestro sitio como en sitios de terceros.
                </p>
                <div className="text-xs text-gray-500">
                  <strong>Ejemplos:</strong> Facebook Pixel, Google Ads, remarketing, anuncios personalizados
                </div>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) => updatePreference("marketing", checked)}
                className="ml-4"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button
          onClick={savePreferences}
          disabled={isSaving || !hasChanges}
          className="bg-emerald-500 hover:bg-emerald-600 flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
        <Button variant="outline" onClick={resetToDefaults} disabled={isSaving} className="flex-1 bg-transparent">
          <RotateCcw className="h-4 w-4 mr-2" />
          Restablecer
        </Button>
      </div>

      {/* Additional Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-medium text-blue-900">Información Adicional</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Puedes cambiar estas configuraciones en cualquier momento desde tu perfil.</p>
              <p>• Los cambios se aplican inmediatamente y afectan tu experiencia de navegación.</p>
              <p>
                • Para más información sobre cómo usamos las cookies, consulta nuestra{" "}
                <a href="/privacidad" className="underline font-medium">
                  Política de Privacidad
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
