"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Home, Building2, MapPin, Check, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RequireAuth } from "@/components/require-auth"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { addAddress, getAddress, updateAddress, type AddressType } from "@/lib/services/addressService"

const provinces = [
  "Distrito Nacional", "Azua", "Baoruco", "Barahona", "Dajabón", "Duarte", "Elías Piña", "El Seibo",
  "Espaillat", "Hato Mayor", "Hermanas Mirabal", "Independencia", "La Altagracia", "La Romana", "La Vega",
  "María Trinidad Sánchez", "Monseñor Nouel", "Monte Cristi", "Monte Plata", "Pedernales", "Peravia",
  "Puerto Plata", "Samaná", "San Cristóbal", "San José de Ocoa", "San Juan", "San Pedro de Macorís",
  "Sánchez Ramírez", "Santiago", "Santiago Rodríguez", "Santo Domingo", "Valverde",
]

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

const addressTypes: { id: AddressType; label: string; description: string; icon: typeof Home }[] = [
  { id: "home", label: "Casa", description: "Tu dirección residencial", icon: Home },
  { id: "work", label: "Trabajo", description: "Tu dirección laboral", icon: Building2 },
  { id: "other", label: "Otra", description: "Otra dirección importante", icon: MapPin },
]

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.length === 0) return ""
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.startsWith("1") && digits.length === 11) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

function validatePhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  const validPrefixes = ["809", "829", "849"]
  if (digits.length === 10) return validPrefixes.includes(digits.slice(0, 3))
  if (digits.length === 11 && digits.startsWith("1")) return validPrefixes.includes(digits.slice(1, 4))
  return false
}

export default function AgregarDireccionPageGate() {
  return (
    <RequireAuth>
      <AgregarDireccionPage />
    </RequireAuth>
  )
}

function AgregarDireccionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const addressId = searchParams.get("addressId") || undefined
  const isEditing = Boolean(addressId)
  const { user } = useAuth()

  const [selectedType, setSelectedType] = useState<AddressType>("home")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(isEditing)
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isEditing || !user?.id || !addressId) {
      setLoadingExisting(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const existing = await getAddress(user.id, addressId)
        if (cancelled) return
        if (!existing) {
          toast({ title: "Dirección no encontrada.", variant: "destructive" })
          router.back()
          return
        }
        setSelectedType(existing.type)
        setFormData({
          name: existing.name,
          recipientName: existing.recipient,
          phone: existing.phone,
          street: existing.street,
          sector: existing.sector,
          city: existing.city,
          province: existing.province,
          postalCode: existing.postalCode,
          references: existing.references,
          makeDefault: existing.isDefault,
        })
      } catch {
        if (!cancelled) {
          toast({ title: "No se pudo cargar la dirección.", variant: "destructive" })
          router.back()
        }
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [addressId, isEditing, router, user?.id])

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "phone") value = formatPhoneNumber(value as string)
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "El nombre de la dirección es requerido"
    if (!formData.recipientName.trim()) newErrors.recipientName = "El nombre del destinatario es requerido"
    if (!formData.phone.trim()) newErrors.phone = "El teléfono es requerido"
    else if (!validatePhone(formData.phone)) newErrors.phone = "Formato de teléfono inválido (809, 829, 849)"
    if (!formData.street.trim()) newErrors.street = "La dirección es requerida"
    if (!formData.sector.trim()) newErrors.sector = "El sector es requerido"
    if (!formData.city.trim()) newErrors.city = "La ciudad es requerida"
    if (!formData.province) newErrors.province = "La provincia es requerida"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    if (!user?.id) {
      toast({ title: "Inicia sesión para guardar una dirección." })
      return
    }
    const payload = {
      type: selectedType,
      name: formData.name,
      recipient: formData.recipientName,
      phone: formData.phone,
      street: formData.street,
      sector: formData.sector,
      city: formData.city,
      province: formData.province,
      postalCode: formData.postalCode,
      references: formData.references,
      isDefault: formData.makeDefault,
    }
    setIsSubmitting(true)
    try {
      if (isEditing && addressId) {
        await updateAddress(user.id, addressId, payload)
        toast({ title: "Éxito", description: "Dirección actualizada correctamente" })
      } else {
        await addAddress(user.id, payload)
        toast({ title: "Éxito", description: "Dirección guardada correctamente" })
      }
      router.back()
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la dirección. Inténtalo de nuevo.", variant: "destructive" })
    }
    setIsSubmitting(false)
  }

  const availableCities = formData.province ? citiesByProvince[formData.province] || [] : []

  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-gray-900">{isEditing ? "Editar Dirección" : "Agregar Dirección"}</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Tipo */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-3">Tipo de Dirección</p>
          <div className="space-y-3">
            {addressTypes.map((type) => {
              const Icon = type.icon
              const selected = selectedType === type.id
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`w-full flex items-center gap-3 border-2 rounded-lg p-3 text-left ${
                    selected ? "border-brand-ui bg-brand-extraLight" : "border-gray-200"
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${selected ? "text-brand-ui" : "text-gray-500"}`} />
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${selected ? "text-brand-dark" : "text-gray-900"}`}>{type.label}</p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                  {selected && <Check className="h-5 w-5 text-brand-ui" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="font-bold text-gray-900 mb-1">Información de la Dirección</p>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1.5">Nombre de la Dirección *</p>
            <Input
              placeholder="Ej: Casa Principal, Oficina, etc."
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1.5">Nombre del Destinatario *</p>
            <Input
              placeholder="Nombre completo de quien recibe"
              value={formData.recipientName}
              onChange={(e) => handleInputChange("recipientName", e.target.value)}
              className={errors.recipientName ? "border-red-500" : ""}
            />
            {errors.recipientName && <p className="text-xs text-red-600 mt-1">{errors.recipientName}</p>}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1.5">Teléfono *</p>
            <Input
              placeholder="(809) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              type="tel"
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1.5">Dirección *</p>
            <Input
              placeholder="Calle, número, apartamento"
              value={formData.street}
              onChange={(e) => handleInputChange("street", e.target.value)}
              className={errors.street ? "border-red-500" : ""}
            />
            {errors.street && <p className="text-xs text-red-600 mt-1">{errors.street}</p>}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1.5">Sector/Barrio *</p>
            <Input
              placeholder="Ej: Piantini, Naco, Los Cacicazgos"
              value={formData.sector}
              onChange={(e) => handleInputChange("sector", e.target.value)}
              className={errors.sector ? "border-red-500" : ""}
            />
            {errors.sector && <p className="text-xs text-red-600 mt-1">{errors.sector}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1.5">Provincia *</p>
              <Select
                value={formData.province || undefined}
                onValueChange={(v) => {
                  handleInputChange("province", v)
                  handleInputChange("city", "")
                }}
              >
                <SelectTrigger className={errors.province ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecciona provincia" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.province && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1.5">Ciudad *</p>
              {availableCities.length > 0 ? (
                <Select value={formData.city || undefined} onValueChange={(v) => handleInputChange("city", v)}>
                  <SelectTrigger className={errors.city ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecciona ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value="Otra ciudad">Otra ciudad</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Nombre de la ciudad"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className={errors.city ? "border-red-500" : ""}
                />
              )}
              {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1.5">Código Postal</p>
            <Input
              placeholder="Ej: 10101"
              value={formData.postalCode}
              onChange={(e) => handleInputChange("postalCode", e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1.5">Referencias</p>
            <Textarea
              placeholder="Puntos de referencia para facilitar la entrega"
              value={formData.references}
              onChange={(e) => handleInputChange("references", e.target.value)}
              rows={3}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={formData.makeDefault} onCheckedChange={(v) => handleInputChange("makeDefault", Boolean(v))} />
            <span className="text-sm text-gray-900">Establecer como dirección predeterminada</span>
          </label>
          <Button className="w-full bg-brand-ui hover:bg-brand-dark py-6" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isSubmitting ? "Guardando..." : "Guardar Dirección"}
          </Button>
        </div>

        {/* Info entrega */}
        <div className="bg-brand-extraLight border border-brand-light rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-brand-ui shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-brand-dark mb-1">Información de entrega</p>
              <p className="text-xs text-brand-dark leading-relaxed">
                Las entregas se realizan de lunes a viernes de 8:00 AM a 6:00 PM, y sábados de 8:00 AM a 2:00 PM.
                Asegúrate de que alguien esté disponible para recibir el paquete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
