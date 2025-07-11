"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, Building2, Smartphone, Shield, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

// Dominican banks
const dominican_banks = [
  { id: "popular", name: "Banco Popular Dominicano", code: "001" },
  { id: "reservas", name: "Banco de Reservas", code: "002" },
  { id: "bhd", name: "Banco BHD León", code: "003" },
  { id: "scotiabank", name: "Scotiabank", code: "004" },
  { id: "banreservas", name: "BanReservas", code: "005" },
  { id: "promerica", name: "Banco Promerica", code: "006" },
  { id: "santa_cruz", name: "Banco Santa Cruz", code: "007" },
  { id: "caribe", name: "Banco Caribe", code: "008" },
]

// Mobile payment providers
const mobile_providers = [
  { id: "tpago", name: "Tpago", description: "Pago móvil de Tricom" },
  { id: "azul", name: "Azul Mobile", description: "App móvil de Banco Azul" },
  { id: "bhd_app", name: "BHD App", description: "Aplicación BHD León" },
  { id: "popular_app", name: "Popular App", description: "Banco Popular móvil" },
]

export default function AgregarMetodoPagoPage() {
  const [paymentType, setPaymentType] = useState("card")
  const [showCardNumber, setShowCardNumber] = useState(false)
  const [formData, setFormData] = useState({
    // Card data
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",

    // Bank transfer data
    bankId: "",
    accountNumber: "",
    accountType: "checking",
    accountHolderName: "",

    // Mobile payment data
    mobileProvider: "",
    phoneNumber: "",

    // General
    makeDefault: false,
    saveForFuture: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (paymentType === "card") {
      if (!formData.cardNumber) newErrors.cardNumber = "Número de tarjeta requerido"
      if (!formData.expiryMonth) newErrors.expiryMonth = "Mes de vencimiento requerido"
      if (!formData.expiryYear) newErrors.expiryYear = "Año de vencimiento requerido"
      if (!formData.cvv) newErrors.cvv = "CVV requerido"
      if (!formData.cardholderName) newErrors.cardholderName = "Nombre del titular requerido"
    } else if (paymentType === "bank_transfer") {
      if (!formData.bankId) newErrors.bankId = "Banco requerido"
      if (!formData.accountNumber) newErrors.accountNumber = "Número de cuenta requerido"
      if (!formData.accountHolderName) newErrors.accountHolderName = "Nombre del titular requerido"
    } else if (paymentType === "mobile_payment") {
      if (!formData.mobileProvider) newErrors.mobileProvider = "Proveedor requerido"
      if (!formData.phoneNumber) newErrors.phoneNumber = "Número de teléfono requerido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    // Redirect back to payment methods
    // router.push('/configuracion/pagos')
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return v
    }
  }

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return value
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/configuracion/pagos">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-gray-900">Agregar Método de Pago</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Payment Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecciona el tipo de pago</CardTitle>
            <p className="text-sm text-gray-600">Elige cómo quieres recibir tus pagos</p>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentType} onValueChange={setPaymentType} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="card" id="card" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label htmlFor="card" className="font-medium cursor-pointer">
                      Tarjeta de Crédito/Débito
                    </Label>
                    <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 text-xs">Recomendado</Badge>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <Label htmlFor="bank_transfer" className="font-medium cursor-pointer">
                      Transferencia Bancaria
                    </Label>
                    <p className="text-sm text-gray-500">Bancos dominicanos principales</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="mobile_payment" id="mobile_payment" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <Label htmlFor="mobile_payment" className="font-medium cursor-pointer">
                      Pago Móvil
                    </Label>
                    <p className="text-sm text-gray-500">Tpago, Azul Mobile, BHD App</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 text-xs">Popular</Badge>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Payment Method Form */}
        <form onSubmit={handleSubmit}>
          {paymentType === "card" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Información de la Tarjeta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      type={showCardNumber ? "text" : "password"}
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange("cardNumber", formatCardNumber(e.target.value))}
                      maxLength={19}
                      className={errors.cardNumber ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowCardNumber(!showCardNumber)}
                    >
                      {showCardNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="expiryMonth">Mes</Label>
                    <Select
                      value={formData.expiryMonth}
                      onValueChange={(value) => handleInputChange("expiryMonth", value)}
                    >
                      <SelectTrigger className={errors.expiryMonth ? "border-red-500" : ""}>
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={month.toString().padStart(2, "0")}>
                            {month.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.expiryMonth && <p className="text-red-500 text-sm mt-1">{errors.expiryMonth}</p>}
                  </div>

                  <div>
                    <Label htmlFor="expiryYear">Año</Label>
                    <Select
                      value={formData.expiryYear}
                      onValueChange={(value) => handleInputChange("expiryYear", value)}
                    >
                      <SelectTrigger className={errors.expiryYear ? "border-red-500" : ""}>
                        <SelectValue placeholder="YYYY" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.expiryYear && <p className="text-red-500 text-sm mt-1">{errors.expiryYear}</p>}
                  </div>

                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      className={errors.cvv ? "border-red-500" : ""}
                    />
                    {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="cardholderName">Nombre del Titular</Label>
                  <Input
                    id="cardholderName"
                    placeholder="Como aparece en la tarjeta"
                    value={formData.cardholderName}
                    onChange={(e) => handleInputChange("cardholderName", e.target.value)}
                    className={errors.cardholderName ? "border-red-500" : ""}
                  />
                  {errors.cardholderName && <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {paymentType === "bank_transfer" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información Bancaria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bankId">Banco</Label>
                  <Select value={formData.bankId} onValueChange={(value) => handleInputChange("bankId", value)}>
                    <SelectTrigger className={errors.bankId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona tu banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {dominican_banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bankId && <p className="text-red-500 text-sm mt-1">{errors.bankId}</p>}
                </div>

                <div>
                  <Label htmlFor="accountType">Tipo de Cuenta</Label>
                  <RadioGroup
                    value={formData.accountType}
                    onValueChange={(value) => handleInputChange("accountType", value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="checking" id="checking" />
                      <Label htmlFor="checking">Corriente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="savings" id="savings" />
                      <Label htmlFor="savings">Ahorros</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="accountNumber">Número de Cuenta</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Número de cuenta bancaria"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange("accountNumber", e.target.value.replace(/\D/g, ""))}
                    className={errors.accountNumber ? "border-red-500" : ""}
                  />
                  {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
                </div>

                <div>
                  <Label htmlFor="accountHolderName">Nombre del Titular</Label>
                  <Input
                    id="accountHolderName"
                    placeholder="Como aparece en la cuenta"
                    value={formData.accountHolderName}
                    onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                    className={errors.accountHolderName ? "border-red-500" : ""}
                  />
                  {errors.accountHolderName && <p className="text-red-500 text-sm mt-1">{errors.accountHolderName}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {paymentType === "mobile_payment" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Pago Móvil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mobileProvider">Proveedor</Label>
                  <Select
                    value={formData.mobileProvider}
                    onValueChange={(value) => handleInputChange("mobileProvider", value)}
                  >
                    <SelectTrigger className={errors.mobileProvider ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona el proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mobile_providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-sm text-gray-500">{provider.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.mobileProvider && <p className="text-red-500 text-sm mt-1">{errors.mobileProvider}</p>}
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Número de Teléfono</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="(809) 123-4567"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", formatPhoneNumber(e.target.value))}
                    className={errors.phoneNumber ? "border-red-500" : ""}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="makeDefault"
                  checked={formData.makeDefault}
                  onCheckedChange={(checked) => handleInputChange("makeDefault", checked as boolean)}
                />
                <Label htmlFor="makeDefault" className="text-sm">
                  Hacer este método predeterminado
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveForFuture"
                  checked={formData.saveForFuture}
                  onCheckedChange={(checked) => handleInputChange("saveForFuture", checked as boolean)}
                />
                <Label htmlFor="saveForFuture" className="text-sm">
                  Guardar para futuros pagos
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Tu información está segura</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Utilizamos encriptación SSL de 256 bits y cumplimos con los estándares PCI DSS para proteger tu
                    información financiera.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Link href="/configuracion/pagos" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
              {isLoading ? "Agregando..." : "Agregar Método"}
            </Button>
          </div>
        </form>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
