"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Building2, Smartphone, ShieldCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RequireAuth } from "@/components/require-auth"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { addPaymentMethod } from "@/lib/services/paymentService"

const dominicanBanks = [
  { id: "popular", name: "Banco Popular Dominicano" },
  { id: "reservas", name: "Banco de Reservas" },
  { id: "bhd", name: "Banco BHD León" },
  { id: "scotiabank", name: "Scotiabank" },
  { id: "banreservas", name: "BanReservas" },
  { id: "promerica", name: "Banco Promerica" },
  { id: "santa_cruz", name: "Banco Santa Cruz" },
  { id: "caribe", name: "Banco Caribe" },
]

const mobileProviders = [
  { id: "tpago", name: "Tpago", description: "Pago móvil de Tricom" },
  { id: "azul", name: "Azul Mobile", description: "App móvil de Banco Azul" },
  { id: "bhd_app", name: "BHD App", description: "Aplicación BHD León" },
  { id: "popular_app", name: "Popular App", description: "Banco Popular móvil" },
]

type PaymentType = "bank_transfer" | "mobile_payment"

function formatPhoneNumber(value: string) {
  const cleaned = value.replace(/\D/g, "")
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value
}

export default function AgregarPagoPageGate() {
  return (
    <RequireAuth>
      <AgregarPagoPage />
    </RequireAuth>
  )
}

function AgregarPagoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [paymentType, setPaymentType] = useState<PaymentType>("bank_transfer")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    bankId: "",
    accountNumber: "",
    accountType: "checking",
    accountHolderName: "",
    mobileProvider: "",
    phoneNumber: "",
    makeDefault: false,
    // NOTA: mobile recolecta este checkbox pero nunca lo usa en ningún lado (ni en la llamada a
    // addPaymentMethod ni en ninguna lógica posterior) — se porta fielmente por ser inofensivo, pero
    // actualmente no tiene efecto.
    saveForFuture: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (paymentType === "bank_transfer") {
      if (!formData.bankId) newErrors.bankId = "Banco requerido"
      if (!formData.accountNumber) newErrors.accountNumber = "Número de cuenta requerido"
      if (!formData.accountHolderName) newErrors.accountHolderName = "Nombre del titular requerido"
    } else {
      if (!formData.mobileProvider) newErrors.mobileProvider = "Proveedor requerido"
      if (!formData.phoneNumber) newErrors.phoneNumber = "Número de teléfono requerido"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    if (!user?.id) {
      toast({ title: "Debes iniciar sesión para agregar un método de pago", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      let paymentMethodData: any = { isDefault: formData.makeDefault, isActive: true, isVerified: false }
      if (paymentType === "bank_transfer") {
        const selectedBank = dominicanBanks.find((b) => b.id === formData.bankId)
        paymentMethodData = {
          ...paymentMethodData,
          type: "bank_transfer",
          name: `${selectedBank?.name} - ${formData.accountNumber.slice(-4)}`,
          details: {
            bankName: selectedBank?.name || "",
            accountNumber: formData.accountNumber,
            accountHolder: formData.accountHolderName,
            accountType: formData.accountType,
          },
        }
      } else {
        const selectedProvider = mobileProviders.find((p) => p.id === formData.mobileProvider)
        paymentMethodData = {
          ...paymentMethodData,
          type: "mobile_payment",
          name: `${selectedProvider?.name} - ${formData.phoneNumber}`,
          details: { provider: selectedProvider?.name || "", phoneNumber: formData.phoneNumber },
        }
      }
      await addPaymentMethod(user.id, paymentMethodData)
      toast({ title: "¡Éxito!", description: "Método de pago agregado correctamente" })
      router.back()
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "No se pudo agregar el método de pago. Inténtalo de nuevo.", variant: "destructive" })
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-gray-900">Agregar Método de Pago</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Tipo de pago */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-1">Selecciona el tipo de pago</p>
          <p className="text-sm text-gray-500 mb-4">Elige cómo quieres recibir tus pagos</p>

          <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 mb-2 flex items-center gap-3 opacity-70">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-500 text-sm">Tarjeta de Crédito/Débito</p>
              <p className="text-xs text-gray-400">Próximamente: enlace seguro con proveedor de pagos (sin ingresar PAN/CVV en la app)</p>
            </div>
            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded shrink-0">Próximamente</span>
          </div>

          <button
            onClick={() => setPaymentType("bank_transfer")}
            className={`w-full border rounded-lg p-3 mb-2 flex items-center gap-3 text-left ${
              paymentType === "bank_transfer" ? "border-brand-ui bg-brand-extraLight" : "border-gray-200"
            }`}
          >
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">Transferencia Bancaria</p>
              <p className="text-xs text-gray-500">Bancos dominicanos principales</p>
            </div>
          </button>

          <button
            onClick={() => setPaymentType("mobile_payment")}
            className={`w-full border rounded-lg p-3 flex items-center gap-3 text-left ${
              paymentType === "mobile_payment" ? "border-brand-ui bg-brand-extraLight" : "border-gray-200"
            }`}
          >
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">Pago Móvil</p>
              <p className="text-xs text-gray-500">Tpago, Azul Mobile, BHD App</p>
            </div>
            <span className="text-[10px] bg-green-100 text-brand-dark px-1.5 py-0.5 rounded shrink-0">Popular</span>
          </button>
        </div>

        {/* Formulario */}
        {paymentType === "bank_transfer" ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-gray-900" />
              <p className="font-bold text-gray-900">Información Bancaria</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1.5">Banco</p>
              <Select value={formData.bankId || undefined} onValueChange={(v) => handleInputChange("bankId", v)}>
                <SelectTrigger className={errors.bankId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecciona tu banco" />
                </SelectTrigger>
                <SelectContent>
                  {dominicanBanks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bankId && <p className="text-xs text-red-600 mt-1">{errors.bankId}</p>}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1.5">Tipo de Cuenta</p>
              <RadioGroup value={formData.accountType} onValueChange={(v) => handleInputChange("accountType", v)} className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-900">
                  <RadioGroupItem value="checking" /> Corriente
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-900">
                  <RadioGroupItem value="savings" /> Ahorros
                </label>
              </RadioGroup>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1.5">Número de Cuenta</p>
              <Input
                placeholder="Número de cuenta bancaria"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange("accountNumber", e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className={errors.accountNumber ? "border-red-500" : ""}
              />
              {errors.accountNumber && <p className="text-xs text-red-600 mt-1">{errors.accountNumber}</p>}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1.5">Nombre del Titular</p>
              <Input
                placeholder="Como aparece en la cuenta"
                value={formData.accountHolderName}
                onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                className={errors.accountHolderName ? "border-red-500" : ""}
              />
              {errors.accountHolderName && <p className="text-xs text-red-600 mt-1">{errors.accountHolderName}</p>}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="h-4 w-4 text-gray-900" />
              <p className="font-bold text-gray-900">Pago Móvil</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1.5">Proveedor</p>
              <Select value={formData.mobileProvider || undefined} onValueChange={(v) => handleInputChange("mobileProvider", v)}>
                <SelectTrigger className={errors.mobileProvider ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecciona el proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {mobileProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mobileProvider && <p className="text-xs text-red-600 mt-1">{errors.mobileProvider}</p>}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1.5">Número de Teléfono</p>
              <Input
                placeholder="(809) 123-4567"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", formatPhoneNumber(e.target.value))}
                type="tel"
                className={errors.phoneNumber ? "border-red-500" : ""}
              />
              {errors.phoneNumber && <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>}
            </div>
          </div>
        )}

        {/* Opciones */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="font-bold text-gray-900">Opciones</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={formData.makeDefault} onCheckedChange={(v) => handleInputChange("makeDefault", Boolean(v))} />
            <span className="text-sm text-gray-900">Hacer este método predeterminado</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={formData.saveForFuture} onCheckedChange={(v) => handleInputChange("saveForFuture", Boolean(v))} />
            <span className="text-sm text-gray-900">Guardar para futuros pagos</span>
          </label>
        </div>

        {/* Seguridad */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-brand-ui shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Tu información está segura</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Los datos de tarjeta no se capturan en la app: cuando esté disponible, usarás un flujo seguro con el
                proveedor de pagos. Para transferencia y pago móvil, solo guardamos lo que indicas para retiros y
                métodos de pago en RopaNova.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button className="flex-1 bg-brand-ui hover:bg-brand-dark" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoading ? "Agregando..." : "Agregar Método"}
          </Button>
        </div>
      </div>
    </div>
  )
}
