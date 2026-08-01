"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  ShoppingBag,
  Star,
  CreditCard,
  Package,
  User,
  Shield,
} from "lucide-react"
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
  icon: typeof ShoppingBag
  description: string
  articles: number
}

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "¿Cómo puedo vender mi ropa en RopaNova?",
    answer:
      'Para vender tu ropa, ve a la sección "Vender", toma fotos de tu artículo, completa la información del producto incluyendo talla, color, condición y precio. Una vez publicado, los compradores podrán contactarte.',
    category: "vender",
  },
  {
    id: "2",
    question: "¿Cuáles son las formas de pago disponibles?",
    answer:
      "Aceptamos tarjetas de crédito/débito, transferencias bancarias, y pagos móviles. También puedes usar tu RopaNova Wallet para transacciones más rápidas.",
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
    answer: "Ve a Configuración > Verificación de Cuenta. Necesitarás subir una foto de tu cédula y una selfie. La verificación toma 24-48 horas.",
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
    question: "¿Cómo retiro dinero de mi RopaNova Wallet?",
    answer:
      'Ve a tu Wallet, selecciona "Retirar", elige tu banco (Popular, Reservas, BHD León), ingresa los datos de tu cuenta y confirma. El proceso toma 1-3 días hábiles.',
    category: "pagos",
  },
  {
    id: "8",
    question: "¿Qué medidas de seguridad tienen?",
    answer: "Verificamos cuentas, moderamos publicaciones, ofrecemos sistema de reseñas, y protegemos pagos. Nunca compartas información personal fuera de la app.",
    category: "seguridad",
  },
]

const helpCategories: HelpCategory[] = [
  { id: "comprar", title: "Comprar", icon: ShoppingBag, description: "Todo sobre cómo comprar artículos", articles: 12 },
  { id: "vender", title: "Vender", icon: Star, description: "Guías para vender tu ropa", articles: 15 },
  { id: "pagos", title: "Pagos y Wallet", icon: CreditCard, description: "Información sobre pagos y retiros", articles: 8 },
  { id: "envios", title: "Envíos", icon: Package, description: "Todo sobre entregas y envíos", articles: 6 },
  { id: "cuenta", title: "Mi Cuenta", icon: User, description: "Configuración y verificación", articles: 10 },
  { id: "seguridad", title: "Seguridad", icon: Shield, description: "Consejos de seguridad y privacidad", articles: 7 },
]

export default function AyudaPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Centro de Ayuda</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar en el centro de ayuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-3">¿Necesitas ayuda inmediata?</p>
          <div className="space-y-2">
            <Link
              href="/configuracion/ayuda/contacto"
              className="flex items-center gap-3 border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
            >
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Chat en Vivo</p>
                <p className="text-xs text-gray-500">Respuesta inmediata</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            <a href="tel:+18095551234" className="flex items-center gap-3 border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
              <Phone className="h-5 w-5 text-brand-ui" />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Llamar Soporte</p>
                <p className="text-xs text-gray-500">Lun-Vie 9AM-6PM</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
            <a href="mailto:ayuda@ropanova.com" className="flex items-center gap-3 border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
              <Mail className="h-5 w-5 text-violet-600" />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Enviar Email</p>
                <p className="text-xs text-gray-500">Respuesta en 24h</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Categorías */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-3">Categorías de Ayuda</p>
          <div className="grid grid-cols-2 gap-3">
            {helpCategories.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  className={`text-left p-4 rounded-lg border ${isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}
                >
                  <Icon className={`h-6 w-6 mb-2 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                  <p className={`text-sm font-medium mb-1 ${isSelected ? "text-blue-600" : "text-gray-900"}`}>{cat.title}</p>
                  <p className="text-xs text-gray-500">{cat.articles} artículos</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-900">Preguntas Frecuentes</p>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)} className="text-sm text-blue-600 font-medium">
                Ver todas
              </button>
            )}
          </div>
          {filteredFAQs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center gap-1">
              <AlertCircle className="h-10 w-10 text-gray-300 mb-1" />
              <p className="text-gray-500 text-sm">No se encontraron resultados</p>
              <p className="text-xs text-gray-400">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFAQs.map((faq) => {
                const isExpanded = expandedFAQ === faq.id
                return (
                  <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedFAQ(isExpanded ? null : faq.id)}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left"
                    >
                      <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                    </button>
                    {isExpanded && <p className="px-4 pb-4 text-sm text-gray-500 leading-relaxed">{faq.answer}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Consejos de seguridad */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <p className="font-bold text-gray-900">Consejos de Seguridad</p>
          </div>
          <div className="space-y-1 text-sm text-gray-500 mb-3">
            <p>• Nunca compartas información personal fuera de la app</p>
            <p>• Prefiere entregas en lugares públicos y seguros</p>
            <p>• Verifica la identidad del vendedor antes de comprar</p>
            <p>• Usa el sistema de pagos de RopaNova para mayor protección</p>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-3">Información de Contacto</p>
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" /> +1 (809) 555-1234
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" /> ayuda@ropanova.com
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p>Chat en vivo disponible:</p>
                <p className="text-xs text-gray-400">Lunes a Viernes 9:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
