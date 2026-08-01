"use client"

import {
  ArrowLeft,
  ChevronRight,
  User,
  Shield,
  CreditCard,
  Package,
  Bell,
  MapPin,
  Ruler,
  Wallet,
  HelpCircle,
  FileText,
  Cookie,
  Scale,
  RotateCcw,
  Truck,
} from "lucide-react"
import Link from "next/link"
import { RequireAuth } from "@/components/require-auth"
import { toast } from "@/hooks/use-toast"

export default function ConfiguracionPageGate() {
  return (
    <RequireAuth>
      <ConfiguracionPage />
    </RequireAuth>
  )
}

function ConfiguracionPage() {
  const configItems = [
    {
      title: "Mi Cuenta",
      description: "Información personal y configuración",
      icon: User,
      href: "/configuracion/cuenta",
    },
    {
      title: "Métodos de Pago",
      description: "Tarjetas y cuentas bancarias",
      icon: CreditCard,
      href: "/configuracion/pagos",
    },
    {
      // Mobile navega a OrdersScreen (historial de compras), que aún no está portado a web. TODO: crear /pedidos.
      title: "Mis Pedidos",
      description: "Historial de tus compras",
      icon: Package,
      href: null,
    },
    {
      title: "Notificaciones",
      description: "Mensajes, pedidos y nuevas ventas",
      icon: Bell,
      href: "/notificaciones",
    },
    {
      title: "Privacidad y Seguridad",
      description: "Configuración de privacidad y verificación",
      icon: Shield,
      href: "/configuracion/privacidad",
    },
    {
      title: "Direcciones",
      description: "Direcciones de envío y facturación",
      icon: MapPin,
      href: "/configuracion/direcciones",
    },
    {
      title: "Unidades de Medida",
      description: "Sistema métrico y moneda",
      icon: Ruler,
      href: "/configuracion/unidades",
    },
    {
      title: "RopaNova Wallet",
      description: "Gestiona tu billetera digital",
      icon: Wallet,
      href: "/wallet",
    },
    {
      title: "Centro de Ayuda",
      description: "Preguntas frecuentes y soporte",
      icon: HelpCircle,
      href: "/configuracion/ayuda",
    },
    {
      title: "Cookies",
      description: "Configuración de cookies y privacidad",
      icon: Cookie,
      href: "/configuracion/cookies",
    },
    {
      title: "Términos y Condiciones",
      description: "Términos de uso de la plataforma",
      icon: FileText,
      href: "/terminos",
    },
    {
      title: "Política de Privacidad",
      description: "Cómo protegemos tu información",
      icon: Scale,
      href: "/privacidad",
    },
    {
      title: "Política de Devoluciones",
      description: "Cancelaciones, reembolsos y disputas",
      icon: RotateCcw,
      href: "/devoluciones",
    },
    {
      title: "Envío y Entrega",
      description: "Modalidades, costos y tiempos de entrega",
      icon: Truck,
      href: "/entrega",
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
            const row = (
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <IconComponent className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            )
            if (!item.href) {
              return (
                <button
                  key={item.title}
                  className="w-full text-left"
                  onClick={() => toast({ title: "Próximamente", description: "El historial de pedidos estará disponible pronto." })}
                >
                  {row}
                </button>
              )
            }
            return (
              <Link key={item.title} href={item.href}>
                {row}
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
