"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MessageCircle, Phone, Mail, Clock, CheckCircle, AlertCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function ContactoSoporte() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    categoria: "",
    prioridad: "",
    asunto: "",
    mensaje: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Link href="/configuracion/ayuda">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Contactar Soporte</h1>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="p-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-900 mb-2">¡Mensaje Enviado!</h2>
              <p className="text-green-700 mb-4">Hemos recibido tu solicitud de soporte. Te contactaremos pronto.</p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Número de ticket:</p>
                <p className="font-mono text-lg font-semibold text-gray-900">#VRD-{Date.now().toString().slice(-6)}</p>
              </div>
              <div className="space-y-2 text-sm text-green-700">
                <p>• Recibirás una confirmación por email</p>
                <p>• Tiempo de respuesta estimado: 2-24 horas</p>
                <p>• Puedes seguir el estado en tu perfil</p>
              </div>
              <div className="flex gap-3 mt-6">
                <Link href="/configuracion/ayuda" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Volver a Ayuda
                  </Button>
                </Link>
                <Link href="/perfil" className="flex-1">
                  <Button className="w-full">Ir a Mi Perfil</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/configuracion/ayuda">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Contactar Soporte</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Contact Methods */}
        <div className="grid gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <MessageCircle className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Chat en Vivo</h3>
                  <Badge className="bg-green-100 text-green-700 text-xs">En línea</Badge>
                </div>
              </div>
              <p className="text-blue-700 text-sm mb-3">Respuesta inmediata con nuestro equipo</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Iniciar Chat</Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Llamar</h3>
                <p className="text-sm text-gray-600 mb-2">+1 (809) 555-1234</p>
                <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                  <Clock className="h-3 w-3" />
                  <span>9AM-6PM</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Mail className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <p className="text-sm text-gray-600 mb-2">ayuda@vintedrd.com</p>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>24h respuesta</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar Mensaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compra">Problema con Compra</SelectItem>
                      <SelectItem value="venta">Problema con Venta</SelectItem>
                      <SelectItem value="pago">Pagos y Wallet</SelectItem>
                      <SelectItem value="cuenta">Mi Cuenta</SelectItem>
                      <SelectItem value="tecnico">Problema Técnico</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <Select value={formData.prioridad} onValueChange={(value) => handleInputChange("prioridad", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja (7 días)</SelectItem>
                      <SelectItem value="normal">Normal (2-3 días)</SelectItem>
                      <SelectItem value="alta">Alta (24 horas)</SelectItem>
                      <SelectItem value="urgente">Urgente (2-4 horas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                <Input
                  value={formData.asunto}
                  onChange={(e) => handleInputChange("asunto", e.target.value)}
                  placeholder="Describe brevemente tu problema"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje Detallado</label>
                <Textarea
                  value={formData.mensaje}
                  onChange={(e) => handleInputChange("mensaje", e.target.value)}
                  placeholder="Describe tu problema con el mayor detalle posible..."
                  rows={5}
                  required
                />
              </div>

              {/* Response Time Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 mb-1">Tiempos de Respuesta:</p>
                    <ul className="text-gray-600 space-y-0.5">
                      <li>
                        • <strong>Urgente:</strong> 2-4 horas (solo emergencias)
                      </li>
                      <li>
                        • <strong>Alta:</strong> 24 horas (problemas importantes)
                      </li>
                      <li>
                        • <strong>Normal:</strong> 2-3 días (consultas generales)
                      </li>
                      <li>
                        • <strong>Baja:</strong> 7 días (sugerencias)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensaje
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Quick Links */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Antes de contactarnos, revisa:</h3>
            <div className="space-y-2">
              <Link href="/configuracion/ayuda" className="block text-blue-600 hover:text-blue-700 text-sm">
                → Preguntas Frecuentes (FAQ)
              </Link>
              <Link href="/configuracion/ayuda" className="block text-blue-600 hover:text-blue-700 text-sm">
                → Guías de Compra y Venta
              </Link>
              <Link href="/configuracion/ayuda" className="block text-blue-600 hover:text-blue-700 text-sm">
                → Información de Pagos
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
