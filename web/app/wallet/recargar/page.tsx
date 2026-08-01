"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, Smartphone, Building2, Shield, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock payment methods
const paymentMethods = [
  {
    id: 1,
    type: "card",
    name: "Visa terminada en 4532",
    icon: CreditCard,
    isDefault: true,
    processingTime: "Inmediato",
    fee: 0,
    maxAmount: 50000,
  },
  {
    id: 2,
    type: "card",
    name: "Mastercard terminada en 8901",
    icon: CreditCard,
    isDefault: false,
    processingTime: "Inmediato",
    fee: 0,
    maxAmount: 50000,
  },
  {
    id: 3,
    type: "bank",
    name: "Banco Popular Dominicano",
    icon: Building2,
    isDefault: false,
    processingTime: "1-2 días hábiles",
    fee: 25,
    maxAmount: 100000,
  },
  {
    id: 4,
    type: "mobile",
    name: "Tigo Money",
    icon: Smartphone,
    isDefault: false,
    processingTime: "Inmediato",
    fee: 15,
    maxAmount: 25000,
  },
]

// Quick amount options
const quickAmounts = [500, 1000, 2000, 5000, 10000, 15000]

export default function RechargeWalletPage() {
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const selectedPaymentMethod = paymentMethods.find((method) => method.id === selectedMethod)
  const numericAmount = Number.parseFloat(amount) || 0
  const fee = selectedPaymentMethod ? selectedPaymentMethod.fee : 0
  const totalAmount = numericAmount + fee

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString())
  }

  const handleRecharge = async () => {
    if (!amount || numericAmount < 100) return

    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      setShowConfirmation(true)
    }, 2000)
  }

  const isValidAmount = numericAmount >= 100 && numericAmount <= (selectedPaymentMethod?.maxAmount || 50000)

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-4 py-3 flex items-center gap-3">
            <Link href="/wallet">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-gray-900">Recarga Exitosa</h1>
          </div>
        </header>

        <div className="p-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Recarga Exitosa!</h2>
              <p className="text-gray-600 mb-6">Tu wallet ha sido recargado con {formatCurrency(numericAmount)}</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Monto recargado:</span>
                  <span className="font-medium">{formatCurrency(numericAmount)}</span>
                </div>
                {fee > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Comisión:</span>
                    <span className="font-medium">{formatCurrency(fee)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total pagado:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/wallet">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600">Ver mi Wallet</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full bg-transparent">
                    Ir al Inicio
                  </Button>
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
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/wallet">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-gray-900">Recargar Wallet</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Amount Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">¿Cuánto quieres recargar?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Monto a recargar</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">RD$</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-12 text-lg font-medium"
                  min="100"
                  max="50000"
                />
              </div>
              {amount && !isValidAmount && (
                <p className="text-sm text-red-600 mt-1">
                  El monto debe estar entre RD$100 y {formatCurrency(selectedPaymentMethod?.maxAmount || 50000)}
                </p>
              )}
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <Label className="text-sm text-gray-600">Montos rápidos</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(quickAmount)}
                    className="bg-transparent"
                  >
                    {formatCurrency(quickAmount)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Método de pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{method.name}</p>
                        {method.isDefault && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">Predeterminado</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{method.processingTime}</span>
                        </div>
                        {method.fee > 0 && (
                          <span className="text-xs text-gray-600">Comisión: {formatCurrency(method.fee)}</span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedMethod === method.id ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                      }`}
                    >
                      {selectedMethod === method.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            <Link href="/configuracion/pagos/agregar">
              <Button variant="outline" className="w-full mt-3 bg-transparent">
                + Agregar nuevo método de pago
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Transaction Summary */}
        {amount && isValidAmount && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen de la transacción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto a recargar:</span>
                  <span className="font-medium">{formatCurrency(numericAmount)}</span>
                </div>
                {fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comisión:</span>
                    <span className="font-medium">{formatCurrency(fee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-medium">Total a pagar:</span>
                  <span className="font-bold text-emerald-600 text-lg">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Tu información está protegida con encriptación SSL de 256 bits. El dinero estará disponible en tu
                  wallet {selectedPaymentMethod?.processingTime.toLowerCase()}.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Action Button */}
        <div className="pb-6">
          <Button
            onClick={handleRecharge}
            disabled={!amount || !isValidAmount || isProcessing}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Procesando...
              </div>
            ) : (
              `Recargar ${amount ? formatCurrency(numericAmount) : "Wallet"}`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
