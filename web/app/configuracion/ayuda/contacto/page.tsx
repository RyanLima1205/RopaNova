"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, Phone, Mail, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

const categories = [
  { id: "compra", title: "Problema con Compra" },
  { id: "venta", title: "Problema con Venta" },
  { id: "pago", title: "Pagos y Wallet" },
  { id: "cuenta", title: "Mi Cuenta" },
  { id: "tecnico", title: "Problema Técnico" },
  { id: "otro", title: "Otro" },
]

const priorities = [
  { id: "baja", title: "Baja (7 días)" },
  { id: "normal", title: "Normal (2-3 días)" },
  { id: "alta", title: "Alta (24 horas)" },
  { id: "urgente", title: "Urgente (2-4 horas)" },
]

export default function ContactoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ nombre: "", email: "", categoria: "", prioridad: "", asunto: "", mensaje: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [ticketNumber, setTicketNumber] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isComplete =
    formData.nombre.trim() && formData.email.trim() && formData.categoria && formData.prioridad && formData.asunto.trim() && formData.mensaje.trim()

  // NOTA: igual que en mobile-app (ContactSupportScreen.tsx), este formulario es enteramente simulado —
  // no hay backend, Firestore ni sistema de tickets real detrás. Solo espera 2s y muestra un número de
  // ticket falso. Se porta fielmente (mismo comportamiento no funcional que mobile), igual que se hizo con
  // la recarga de wallet. El prefijo del ticket se cambia de "VRD-" (VintedRD, remanente pre-rebrand) a
  // "RN-" para reflejar el rebrand a RopaNova.
  const handleSubmit = async () => {
    if (!isComplete) {
      toast({ title: "Por favor completa todos los campos", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setTicketNumber(`RN-${Date.now().toString().slice(-6)}`)
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleChatSupport = () => {
    toast({ title: "Chat en Vivo", description: "Conectando con soporte..." })
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Contactar Soporte</h1>
        </div>
        <div className="p-4 max-w-md mx-auto">
          <div className="bg-green-50 border border-green-100 rounded-xl p-6 mt-4 flex flex-col items-center text-center">
            <CheckCircle2 className="h-16 w-16 text-brand-ui mb-4" />
            <h2 className="text-xl font-bold text-green-900 mb-2">¡Mensaje Enviado!</h2>
            <p className="text-sm text-green-700 mb-6">Hemos recibido tu solicitud de soporte. Te contactaremos pronto.</p>
            <div className="w-full bg-white rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Número de ticket:</p>
              <p className="font-mono font-bold text-gray-900">#{ticketNumber}</p>
            </div>
            <div className="w-full text-sm text-green-700 space-y-1 mb-6">
              <p>• Recibirás una confirmación por email</p>
              <p>• Tiempo de respuesta estimado: 2-24 horas</p>
              <p>• Puedes seguir el estado en tu perfil</p>
            </div>
            <div className="w-full flex gap-3">
              <Link href="/configuracion/ayuda" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Volver a Ayuda
                </Button>
              </Link>
              <Link href="/perfil" className="flex-1">
                <Button className="w-full bg-brand-ui hover:bg-brand-dark">Ir a Mi Perfil</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Contactar Soporte</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Chat card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="h-6 w-6 text-blue-700" />
            <div>
              <p className="font-bold text-blue-900">Chat en Vivo</p>
              <span className="text-[10px] bg-green-100 text-green-800 font-medium px-1.5 py-0.5 rounded">En línea</span>
            </div>
          </div>
          <p className="text-sm text-blue-800 mb-3">Respuesta inmediata con nuestro equipo</p>
          <Button className="w-full bg-blue-700 hover:bg-blue-800" onClick={handleChatSupport}>
            Iniciar Chat
          </Button>
        </div>

        {/* Contact grid */}
        <div className="grid grid-cols-2 gap-3">
          <a href="tel:+18095551234" className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center text-center">
            <Phone className="h-8 w-8 text-brand-ui mb-2" />
            <p className="font-bold text-gray-900 text-sm mb-1">Llamar</p>
            <p className="text-xs text-gray-500 mb-2">+1 (809) 555-1234</p>
            <span className="text-[10px] text-brand-ui">9AM-6PM</span>
          </a>
          <a href="mailto:ayuda@ropanova.com" className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center text-center">
            <Mail className="h-8 w-8 text-violet-600 mb-2" />
            <p className="font-bold text-gray-900 text-sm mb-1">Email</p>
            <p className="text-xs text-gray-500 mb-2">ayuda@ropanova.com</p>
            <span className="text-[10px] text-gray-400">24h respuesta</span>
          </a>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            <p className="font-bold text-gray-900">Enviar Mensaje</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1.5">Nombre Completo</p>
              <Input placeholder="Tu nombre" value={formData.nombre} onChange={(e) => handleInputChange("nombre", e.target.value)} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1.5">Email</p>
              <Input placeholder="tu@email.com" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 mb-1.5">Categoría</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleInputChange("categoria", c.id)}
                  className={`px-3 py-1.5 rounded-md text-xs border ${
                    formData.categoria === c.id ? "border-blue-600 bg-blue-50 text-blue-600 font-medium" : "border-gray-200 text-gray-500"
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 mb-1.5">Prioridad</p>
            <div className="flex flex-wrap gap-2">
              {priorities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleInputChange("prioridad", p.id)}
                  className={`px-3 py-1.5 rounded-md text-xs border ${
                    formData.prioridad === p.id ? "border-blue-600 bg-blue-50 text-blue-600 font-medium" : "border-gray-200 text-gray-500"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 mb-1.5">Asunto</p>
            <Input placeholder="Describe brevemente tu problema" value={formData.asunto} onChange={(e) => handleInputChange("asunto", e.target.value)} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 mb-1.5">Mensaje Detallado</p>
            <Textarea
              placeholder="Describe tu problema con el mayor detalle posible..."
              value={formData.mensaje}
              onChange={(e) => handleInputChange("mensaje", e.target.value)}
              rows={5}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-medium text-gray-900">Tiempos de Respuesta:</p>
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              <p>
                • <span className="font-bold">Urgente:</span> 2-4 horas (solo emergencias)
              </p>
              <p>
                • <span className="font-bold">Alta:</span> 24 horas (problemas importantes)
              </p>
              <p>
                • <span className="font-bold">Normal:</span> 2-3 días (consultas generales)
              </p>
              <p>
                • <span className="font-bold">Baja:</span> 7 días (sugerencias)
              </p>
            </div>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={!isComplete || isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" /> Enviar Mensaje
              </span>
            )}
          </Button>
        </div>

        {/* FAQ quick links */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-3">Antes de contactarnos, revisa:</p>
          {/* NOTA: en mobile estos enlaces no tienen onPress — son texto no interactivo, se porta igual. */}
          <div className="space-y-2 text-sm text-blue-600">
            <p>→ Preguntas Frecuentes (FAQ)</p>
            <p>→ Guías de Compra y Venta</p>
            <p>→ Información de Pagos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
