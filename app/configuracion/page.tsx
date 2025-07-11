"use client"

import {
  ArrowLeft,
  ChevronRight,
  User,
  Shield,
  CreditCard,
  MapPin,
  Ruler,
  Wallet,
  HelpCircle,
  FileText,
  Cookie,
  Scale,
} from "lucide-react"
import Link from "next/link"

export default function ConfiguracionPage() {
  const configItems = [
    {
      title: "Mi Cuenta",
      description: "Información personal y configuración",
      icon: User,
      href: "/configuracion/cuenta",
      badge: null,
    },
    {
      title: "Privacidad y Seguridad",
      description: "Configuración de privacidad y verificación",
      icon: Shield,
      href: "/configuracion/privacidad",
      badge: null,
    },
    {
      title: "Métodos de Pago",
      description: "Tarjetas y cuentas bancarias",
      icon: CreditCard,
      href: "/configuracion/pagos",
      badge: null,
    },
    {
      title: "Direcciones",
      description: "Direcciones de envío y facturación",
      icon: MapPin,
      href: "/configuracion/direcciones",
      badge: null,
    },
    {
      title: "Unidades de Medida",
      description: "Sistema métrico y moneda",
      icon: Ruler,
      href: "/configuracion/unidades",
      badge: null,
    },
    {
      title: "VintedRD Wallet",
      description: "Gestiona tu billetera digital",
      icon: Wallet,
      href: "/wallet",
      badge: null,
    },
    {
      title: "Centro de Ayuda",
      description: "Preguntas frecuentes y soporte",
      icon: HelpCircle,
      href: "/configuracion/ayuda",
      badge: null,
    },
    {
      title: "Cookies",
      description: "Configuración de cookies y privacidad",
      icon: Cookie,
      href: "/configuracion/cookies",
      badge: null,
    },
    {
      title: "Términos y Condiciones",
      description: "Términos de uso de la plataforma",
      icon: FileText,
      href: "/terminos",
      badge: null,
    },
    {
      title: "Política de Privacidad",
      description: "Cómo protegemos tu información",
      icon: Scale,
      href: "/privacidad",
      badge: null,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link href="/perfil" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">Configuración</h1>
        </div>
      </div>

      {/* Configuration Items */}
      <div className="p-4">
        <div className="bg-white rounded-lg border divide-y">
          {configItems.map((item) => {
            const IconComponent = item.icon
            return (
              <Link key={item.title} href={item.href}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <IconComponent className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        {item.badge && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20"></div>
    </div>
  )
}
