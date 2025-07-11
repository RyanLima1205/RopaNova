"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  Shield,
  CreditCard,
  Package,
  User,
  Star,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

interface HelpCategory {
  id: string
  title: string
  icon: any
  description: string
  articles: number
}

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "¿Cómo puedo vender mi ropa en VintedRD?",
    answer:
      'Para vender tu ropa, ve a la sección "Vender", toma fotos de tu artículo, completa la información del producto incluyendo talla, color, condición y precio. Una vez publicado, los compradores podrán contactarte.',
    category: "vender",
  },
  {
    id: "2",
    question: "¿Cuáles son las formas de pago disponibles?",
    answer:
      "Aceptamos tarjetas de crédito/débito, transferencias bancarias, y pagos móviles. También puedes usar tu VintedRD Wallet para transacciones más rápidas.",
    category: "pagos",
  },
  {
    id: "3",
    question: "¿Cómo funciona el envío en República Dominicana?",
    answer:
      "Trabajamos con servicios de mensajería locales. El costo de envío se calcula según la distancia y peso. Puedes coordinar entrega en persona en Santo Domingo y Santiago.",
    category: "envios",
  },
  {
    id: "4",
    question: "¿Qué hago si tengo un problema con mi compra?",
    answer:
      "Puedes contactar al vendedor directamente a través de mensajes. Si no se resuelve, nuestro equipo de soporte te ayudará. Tienes 48 horas para reportar problemas.",
    category: "comprar",
  },
  {
    id: "5",
    question: "¿Cómo puedo verificar mi cuenta?",
    answer:
      "Ve a Configuración > Verificación de Cuenta. Necesitarás subir una foto de tu cédula y una selfie. La verificación toma 24-48 horas.",
    category: "cuenta",
  },
  {
    id: "6",
    question: "¿Puedo devolver un artículo?",
    answer:
      "Las devoluciones dependen de la política del vendedor. Revisa la descripción del producto antes de comprar. Para artículos con problemas no descritos, contacta soporte.",
    category: "comprar",
  },
  {
    id: "7",
    question: "¿Cómo retiro dinero de mi VintedRD Wallet?",
    answer:
      'Ve a tu Wallet, selecciona "Retirar", elige tu banco (Popular, Reservas, BHD León), ingresa los datos de tu cuenta y confirma. El proceso toma 1-3 días hábiles.',
    category: "pagos",
  },
  {
    id: "8",
    question: "¿Qué medidas de seguridad tienen?",
    answer:
      "Verificamos cuentas, moderamos publicaciones, ofrecemos sistema de reseñas, y protegemos pagos. Nunca compartas información personal fuera de la app.",
    category: "seguridad",
  },
]

const helpCategories: HelpCategory[] = [
  {
    id: "comprar",
    title: "Comprar",
    icon: Package,
    description: "Todo sobre cómo comprar artículos",
    articles: 12,
  },
  {
    id: "vender",
    title: "Vender",
    icon: Star,
    description: "Guías para vender tu ropa",
    articles: 15,
  },
  {
    id: "pagos",
    title: "Pagos y Wallet",
    icon: CreditCard,
    description: "Información sobre pagos y retiros",
    articles: 8,
  },
  {
    id: "envios",
    title: "Envíos",
    icon: Package,
    description: "Todo sobre entregas y envíos",
    articles: 6,
  },
  {
    id: "cuenta",
    title: "Mi Cuenta",
    icon: User,
    description: "Configuración y verificación",
    articles: 10,
  },
  {
    id: "seguridad",
    title: "Seguridad",
    icon: Shield,
    description: "Consejos de seguridad y privacidad",
    articles: 7,
  },
]

export default function CentroAyuda() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/configuracion">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Centro de Ayuda</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar en el centro de ayuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-gray-900 mb-3">¿Necesitas ayuda inmediata?</h2>

            <Link
              href="/configuracion/ayuda/contacto"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Chat en Vivo</p>
                <p className="text-sm text-gray-500">Respuesta inmediata</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>

            <a
              href="tel:+18095551234"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Phone className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Llamar Soporte</p>
                <p className="text-sm text-gray-500">Lun-Vie 9AM-6PM</p>
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400" />
            </a>

            <a
              href="mailto:ayuda@vintedrd.com"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Enviar Email</p>
                <p className="text-sm text-gray-500">Respuesta en 24h</p>
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400" />
            </a>
          </CardContent>
        </Card>

        {/* Help Categories */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Categorías de Ayuda</h2>
            <div className="grid grid-cols-2 gap-3">
              {helpCategories.map((category) => {
                const IconComponent = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedCategory === category.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <IconComponent
                      className={`h-6 w-6 mb-2 ${selectedCategory === category.id ? "text-blue-600" : "text-gray-600"}`}
                    />
                    <p className="font-medium text-gray-900 text-sm">{category.title}</p>
                    <p className="text-xs text-gray-500">{category.articles} artículos</p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Preguntas Frecuentes</h2>
              {selectedCategory && (
                <button onClick={() => setSelectedCategory(null)} className="text-sm text-blue-600 hover:text-blue-700">
                  Ver todas
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron resultados</p>
                  <p className="text-sm text-gray-400">Intenta con otros términos de búsqueda</p>
                </div>
              ) : (
                filteredFAQs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900 pr-4">{faq.question}</p>
                      {expandedFAQ === faq.id ? (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="px-4 pb-4">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Safety Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Consejos de Seguridad</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Nunca compartas información personal fuera de la app</li>
                <li>• Prefiere entregas en lugares públicos y seguros</li>
                <li>• Verifica la identidad del vendedor antes de comprar</li>
                <li>• Usa el sistema de pagos de VintedRD para mayor protección</li>
              </ul>
              <Link
                href="/configuracion/ayuda/seguridad"
                className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium mt-2 hover:text-blue-700"
              >
                Ver más consejos
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Información de Contacto</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">+1 (809) 555-1234</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">ayuda@vintedrd.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Chat en vivo disponible:</p>
                  <p className="text-gray-500">Lunes a Viernes 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
