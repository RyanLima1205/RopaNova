"use client"

import { useState } from "react"
import { Shield, Clock, Users, AlertTriangle, Phone, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

interface SafetyFeaturesCardProps {
  sellerLocation: string
  productPrice: number
}

export function SafetyFeaturesCard({ sellerLocation, productPrice }: SafetyFeaturesCardProps) {
  const [showFullGuide, setShowFullGuide] = useState(false)

  const paymentMethods = [
    {
      name: "Efectivo",
      icon: "💵",
      protection: "Limitada",
      fee: "Gratis",
      description: "Pago en persona durante el encuentro",
      protectionLevel: "limited",
      tips: [
        "Lleva el dinero exacto",
        "Cuenta el dinero en presencia del vendedor",
        "Pide recibo o comprobante",
        "Verifica el producto antes de pagar",
      ],
    },
    {
      name: "Transferencia Bancular",
      icon: "🏦",
      protection: "Media",
      fee: "RD$0-50",
      description: "Popular, BHD, Banreservas, Scotia",
      protectionLevel: "medium",
      tips: [
        "Usa bancos reconocidos",
        "Guarda el comprobante de transferencia",
        "Verifica los datos del vendedor",
        "No transfieras antes de ver el producto",
      ],
    },
    {
      name: "Pago Móvil",
      icon: "📱",
      protection: "Media",
      fee: "RD$5-25",
      description: "Azul, Popular Digital, BHD App",
      protectionLevel: "medium",
      tips: [
        "Usa apps oficiales de bancos",
        "Confirma el número del vendedor",
        "Toma captura del pago exitoso",
        "Mantén historial de transacciones",
      ],
    },
    {
      name: "PayPal",
      icon: "💳",
      protection: "Muy Alta",
      fee: "3.5% + RD$15",
      description: "Protección internacional completa",
      protectionLevel: "high",
      tips: [
        "Usa 'Bienes y Servicios'",
        "Nunca uses 'Amigos y Familia'",
        "Documenta la transacción",
        "Reporta problemas dentro de 180 días",
      ],
    },
  ]

  const getProtectionColor = (level: string) => {
    switch (level) {
      case "limited":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "high":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const safetyTips = {
    before: [
      "Verifica la identidad del vendedor",
      "Lee todas las reseñas y calificaciones",
      "Confirma detalles del producto por mensaje",
      "Acuerda lugar público para el encuentro",
      "Informa a alguien sobre tu cita",
      "Lleva acompañante si es posible",
    ],
    during: [
      "Encuentra en lugar público y bien iluminado",
      "Inspecciona el producto cuidadosamente",
      "Verifica que coincida con las fotos",
      "Prueba el artículo si es necesario",
      "No te sientas presionado a comprar",
      "Confía en tu instinto",
    ],
    after: [
      "Deja una reseña honesta",
      "Reporta cualquier problema",
      "Guarda comprobantes de pago",
      "Contacta soporte si hay disputas",
      "Comparte tu experiencia",
      "Bloquea vendedores problemáticos",
    ],
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-emerald-500" />
          Información de Seguridad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* VintedRD Protection Badge */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span className="font-medium text-emerald-800">Protección VintedRD</span>
          </div>
          <p className="text-sm text-emerald-700">Soporte 24/7 • Mediación de disputas • Verificación de vendedores</p>
        </div>

        {/* Payment Methods Preview */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Métodos de Pago Seguros</h4>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.slice(0, 4).map((method, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{method.icon}</span>
                  <span className="text-sm font-medium">{method.name}</span>
                </div>
                <Badge variant="outline" className={`text-xs ${getProtectionColor(method.protectionLevel)}`}>
                  {method.protection}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Safety Tips */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Consejos Rápidos</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• Encuentra en lugares públicos</p>
            <p>• Verifica el producto antes de pagar</p>
            <p>• Usa métodos de pago seguros</p>
          </div>
        </div>

        {/* Full Safety Guide Button */}
        <Dialog open={showFullGuide} onOpenChange={setShowFullGuide}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full bg-transparent">
              Ver Guía Completa de Seguridad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                Guía Completa de Seguridad
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="payments" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="payments">Pagos</TabsTrigger>
                <TabsTrigger value="safety">Seguridad</TabsTrigger>
              </TabsList>

              <TabsContent value="payments" className="space-y-4">
                <div className="space-y-4">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{method.icon}</span>
                          <span className="font-medium">{method.name}</span>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getProtectionColor(method.protectionLevel)} mb-1`}
                          >
                            {method.protection}
                          </Badge>
                          <p className="text-xs text-gray-500">{method.fee}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                      <div className="space-y-1">
                        {method.tips.map((tip, tipIndex) => (
                          <p key={tipIndex} className="text-xs text-gray-500">
                            • {tip}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="safety" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Antes del Encuentro
                    </h4>
                    <div className="space-y-1">
                      {safetyTips.before.map((tip, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {tip}
                        </p>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Durante el Encuentro
                    </h4>
                    <div className="space-y-1">
                      {safetyTips.during.map((tip, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {tip}
                        </p>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Después del Encuentro
                    </h4>
                    <div className="space-y-1">
                      {safetyTips.after.map((tip, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {tip}
                        </p>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Contactos de Emergencia
                    </h4>
                    <div className="space-y-1 text-sm text-red-700">
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        Policía Nacional: 911
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        DIGESETT: *611
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        Soporte VintedRD: (809) 555-0123
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
