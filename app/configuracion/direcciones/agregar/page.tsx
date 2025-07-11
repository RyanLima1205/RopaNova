"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home, Building2, MapPin, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Dominican provinces
const provinces = [
  "Distrito Nacional",
  "Azua",
  "Baoruco",
  "Barahona",
  "Dajabón",
  "Duarte",
  "Elías Piña",
  "El Seibo",
  "Espaillat",
  "Hato Mayor",
  "Hermanas Mirabal",
  "Independencia",
  "La Altagracia",
  "La Romana",
  "La Vega",
  "María Trinidad Sánchez",
  "Monseñor Nouel",
  "Monte Cristi",
  "Monte Plata",
  "Pedernales",
  "Peravia",
  "Puerto Plata",
  "Samaná",
  "San Cristóbal",
  "San José de Ocoa",
  "San Juan",
  "San Pedro de Macorís",
  "Sánchez Ramírez",
  "Santiago",
  "Santiago Rodríguez",
  "Santo Domingo",
  "Valverde",
]

// Major cities by province
const citiesByProvince: { [key: string]: string[] } = {
  "Distrito Nacional": ["Santo Domingo"],
  "Santo Domingo": ["Los Alcarrizos", "Pedro Brand", "Boca Chica", "San Antonio de Guerra"],
  Santiago: ["Santiago de los Caballeros", "Tamboril", "Villa González", "Licey al Medio"],
  "La Altagracia": ["Punta Cana", "Higüey", "Bávaro", "Cap Cana"],
  "Puerto Plata": ["Puerto Plata", "Playa Dorada", "Costa Dorada", "Cofresí"],
  "La Romana": ["La Romana", "Casa de Campo", "Bayahíbe"],
  "San Cristóbal": ["San Cristóbal", "Nigua", "Villa Altagracia", "Bajos de Haina"],
  "La Vega": ["La Vega", "Constanza", "Jarabacoa", "Bonao"],
}

const addressTypes = [
  {
    id: "home",
    label: "Casa",
    description: "Tu dirección residencial",
    icon: Home,
  },
  {
    id: "work",
    label: "Trabajo",
    description: "Tu dirección laboral",
    icon: Building2,
  },
  {
    id: "other",
    label: "Otra",
    description: "Otra dirección importante",
    icon: MapPin,
  },
]

export default function AgregarDireccionPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState("home")
  const [formData, setFormData] = useState({
    name: "",
    recipientName: "",
    phone: "",
    street: "",
    sector: "",
    city: "",
    province: "",
    postalCode: "",
    references: "",
    makeDefault: false,
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")

    // Handle different formats
    if (digits.length === 0) return ""
    if (digits.length <= 3) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`

    // Handle with country code
    if (digits.startsWith("1") && digits.length === 11) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "")
    const validPrefixes = ["809", "829", "849"]

    if (digits.length === 10) {
      return validPrefixes.includes(digits.slice(0, 3))
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      return validPrefixes.includes(digits.slice(1, 4))
    }
    return false
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "phone") {
      value = formatPhoneNumber(value)
    }

    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre de la dirección es requerido"
    }
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "El nombre del destinatario es requerido"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido"
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Formato de teléfono inválido (809, 829, 849)"
    }
    if (!formData.street.trim()) {
      newErrors.street = "La dirección es requerida"
    }
    if (!formData.sector.trim()) {
      newErrors.sector = "El sector es requerido"
    }
    if (!formData.city.trim()) {
      newErrors.city = "La ciudad es requerida"
    }
    if (!formData.province) {
      newErrors.province = "La provincia es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Navigate back to addresses page
    router.push("/configuracion/direcciones")
  }

  const availableCities = formData.province ? citiesByProvince[formData.province] || [] : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/configuracion/direcciones">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-gray-900">Agregar Dirección</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Address Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipo de Dirección</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {addressTypes.map((type) => {
                const IconComponent = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      selectedType === type.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <IconComponent
                      className={`h-5 w-5 ${selectedType === type.id ? "text-emerald-600" : "text-gray-600"}`}
                    />
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${selectedType === type.id ? "text-emerald-900" : "text-gray-900"}`}>
                        {type.label}
                      </p>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                    {selectedType === type.id && <Check className="h-5 w-5 text-emerald-600" />}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Address Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de la Dirección</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Address Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Dirección *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Casa Principal, Oficina, etc."
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Recipient Name */}
              <div className="space-y-2">
                <Label htmlFor="recipientName">Nombre del Destinatario *</Label>
                <Input
                  id="recipientName"
                  placeholder="Nombre completo de quien recibe"
                  value={formData.recipientName}
                  onChange={(e) => handleInputChange("recipientName", e.target.value)}
                  className={errors.recipientName ? "border-red-500" : ""}
                />
                {errors.recipientName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.recipientName}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  placeholder="(809) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="street">Dirección *</Label>
                <Input
                  id="street"
                  placeholder="Calle, número, apartamento"
                  value={formData.street}
                  onChange={(e) => handleInputChange("street", e.target.value)}
                  className={errors.street ? "border-red-500" : ""}
                />
                {errors.street && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.street}
                  </p>
                )}
              </div>

              {/* Sector */}
              <div className="space-y-2">
                <Label htmlFor="sector">Sector/Barrio *</Label>
                <Input
                  id="sector"
                  placeholder="Ej: Piantini, Naco, Los Cacicazgos"
                  value={formData.sector}
                  onChange={(e) => handleInputChange("sector", e.target.value)}
                  className={errors.sector ? "border-red-500" : ""}
                />
                {errors.sector && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.sector}
                  </p>
                )}
              </div>

              {/* Province and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => {
                      handleInputChange("province", value)
                      handleInputChange("city", "") // Reset city when province changes
                    }}
                  >
                    <SelectTrigger className={errors.province ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.province && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.province}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  {availableCities.length > 0 ? (
                    <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
                      <SelectTrigger className={errors.city ? "border-red-500" : ""}>
                        <SelectValue placeholder="Selecciona ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Otra ciudad</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="city"
                      placeholder="Nombre de la ciudad"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className={errors.city ? "border-red-500" : ""}
                    />
                  )}
                  {errors.city && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Postal Code */}
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  placeholder="Ej: 10101"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                />
              </div>

              {/* References */}
              <div className="space-y-2">
                <Label htmlFor="references">Referencias</Label>
                <Textarea
                  id="references"
                  placeholder="Puntos de referencia para facilitar la entrega"
                  value={formData.references}
                  onChange={(e) => handleInputChange("references", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Make Default */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="makeDefault"
                  checked={formData.makeDefault}
                  onCheckedChange={(checked) => handleInputChange("makeDefault", checked as boolean)}
                />
                <Label htmlFor="makeDefault" className="text-sm">
                  Establecer como dirección predeterminada
                </Label>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Dirección"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Información de entrega:</strong> Las entregas se realizan de lunes a viernes de 8:00 AM a 6:00 PM, y
            sábados de 8:00 AM a 2:00 PM. Asegúrate de que alguien esté disponible para recibir el paquete.
          </AlertDescription>
        </Alert>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
