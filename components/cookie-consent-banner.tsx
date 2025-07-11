"use client"

import { useState, useEffect } from "react"
import { X, Settings, Cookie, Shield, BarChart3, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface CookiePreferences {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always true, can't be disabled
  functional: false,
  analytics: false,
  marketing: false,
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("vintedrd-cookie-consent")
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(consent)
        setPreferences(savedPreferences)
      } catch (error) {
        console.error("Error parsing cookie preferences:", error)
      }
    }
  }, [])

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === "necessary") return // Can't disable necessary cookies
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const savePreferences = async (prefs: CookiePreferences) => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Save to localStorage
    localStorage.setItem("vintedrd-cookie-consent", JSON.stringify(prefs))
    localStorage.setItem("vintedrd-cookie-consent-date", new Date().toISOString())

    // Apply cookie settings (in real app, this would configure actual cookies)
    if (typeof window !== "undefined") {
      // Set consent flags for different cookie types
      window.gtag?.("consent", "update", {
        analytics_storage: prefs.analytics ? "granted" : "denied",
        ad_storage: prefs.marketing ? "granted" : "denied",
        functionality_storage: prefs.functional ? "granted" : "denied",
      })
    }

    setIsLoading(false)
    setIsVisible(false)
    setShowSettings(false)
  }

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    }
    setPreferences(allAccepted)
    savePreferences(allAccepted)
  }

  const acceptNecessaryOnly = () => {
    savePreferences(defaultPreferences)
  }

  const acceptSelected = () => {
    savePreferences(preferences)
  }

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <Card className="mx-auto max-w-4xl shadow-2xl border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="h-6 w-6 text-amber-500" />
                <CardTitle className="text-lg">Configuración de Cookies</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVisible(false)}
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {!showSettings ? (
              // Simple consent view
              <>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Utilizamos cookies para mejorar tu experiencia en VintedRD, personalizar contenido, analizar el
                    tráfico y mostrar anuncios relevantes. Al continuar navegando, aceptas nuestro uso de cookies según
                    nuestra{" "}
                    <a href="/privacidad" className="text-emerald-600 hover:underline font-medium">
                      Política de Privacidad
                    </a>
                    .
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Seguras
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Analíticas
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      Personalizadas
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    onClick={acceptAll}
                    disabled={isLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 flex-1"
                  >
                    {isLoading ? "Guardando..." : "Aceptar Todas"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowSettings(true)} className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Personalizar
                  </Button>
                  <Button variant="ghost" onClick={acceptNecessaryOnly} disabled={isLoading} className="flex-1">
                    Solo Necesarias
                  </Button>
                </div>
              </>
            ) : (
              // Detailed settings view
              <>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p className="mb-3">
                      Personaliza qué tipos de cookies quieres permitir. Puedes cambiar estas configuraciones en
                      cualquier momento desde la configuración de tu cuenta.
                    </p>
                  </div>

                  {/* Necessary Cookies */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3 flex-1">
                        <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">Cookies Necesarias</h4>
                            <Badge variant="secondary" className="text-xs">
                              Requeridas
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            Esenciales para el funcionamiento básico del sitio web, como autenticación y seguridad. No
                            se pueden desactivar.
                          </p>
                        </div>
                      </div>
                      <Switch checked={true} disabled className="ml-3" />
                    </div>

                    <Separator />

                    {/* Functional Cookies */}
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-start gap-3 flex-1">
                        <Settings className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">Cookies Funcionales</h4>
                            <Badge variant="outline" className="text-xs">
                              Opcional
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            Mejoran la funcionalidad del sitio recordando tus preferencias, idioma y configuraciones
                            personalizadas.
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.functional}
                        onCheckedChange={(checked) => updatePreference("functional", checked)}
                        className="ml-3"
                      />
                    </div>

                    <Separator />

                    {/* Analytics Cookies */}
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-start gap-3 flex-1">
                        <BarChart3 className="h-5 w-5 text-purple-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">Cookies Analíticas</h4>
                            <Badge variant="outline" className="text-xs">
                              Opcional
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            Nos ayudan a entender cómo usas el sitio para mejorarlo. Los datos son anónimos y agregados.
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.analytics}
                        onCheckedChange={(checked) => updatePreference("analytics", checked)}
                        className="ml-3"
                      />
                    </div>

                    <Separator />

                    {/* Marketing Cookies */}
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-start gap-3 flex-1">
                        <Target className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">Cookies de Marketing</h4>
                            <Badge variant="outline" className="text-xs">
                              Opcional
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            Permiten mostrar anuncios personalizados y medir la efectividad de nuestras campañas
                            publicitarias.
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.marketing}
                        onCheckedChange={(checked) => updatePreference("marketing", checked)}
                        className="ml-3"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button
                    onClick={acceptSelected}
                    disabled={isLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 flex-1"
                  >
                    {isLoading ? "Guardando..." : "Guardar Preferencias"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1">
                    Volver
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
