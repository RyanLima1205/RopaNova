"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, Building2, Banknote, Smartphone, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/contexts/AuthContext"
import { getPaymentMethods, getPaymentMethodDisplayName, type PaymentMethod } from "@/lib/services/paymentService"

const quickAmounts = [500, 1000, 2000, 5000, 10000, 15000]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 0 }).format(amount)
}

// Mapeo de los nombres de ícono Ionicons de paymentService.getPaymentMethodIcon() a lucide.
function PaymentMethodIcon({ type }: { type: PaymentMethod["type"] }) {
  switch (type) {
    case "bank_transfer":
      return <Building2 className="h-5 w-5 text-gray-500" />
    case "cash":
      return <Banknote className="h-5 w-5 text-gray-500" />
    case "mobile_payment":
      return <Smartphone className="h-5 w-5 text-gray-500" />
    default:
      return <CreditCard className="h-5 w-5 text-gray-500" />
  }
}

export default function RecargarPageGate() {
  return (
    <RequireAuth>
      <RecargarPage />
    </RequireAuth>
  )
}

function RecargarPage() {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingMethods, setLoadingMethods] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setLoadingMethods(false)
      return
    }
    setLoadingMethods(true)
    getPaymentMethods(user.id).then((methods) => {
      setPaymentMethods(methods)
      setSelectedMethod((current) => {
        if (current && methods.some((m) => m.id === current)) return current
        return methods.find((m) => m.isDefault)?.id ?? methods[0]?.id ?? null
      })
      setLoadingMethods(false)
    })
  }, [user?.id])

  const selectedPaymentMethod = paymentMethods.find((m) => m.id === selectedMethod)
  const numericAmount = Number.parseFloat(amount) || 0
  const isValidAmount = numericAmount >= 100 && numericAmount <= 50000

  // NOTA: igual que en mobile-app (RechargeWalletScreen.tsx), esto es una simulación —
  // no hay integración de pago real todavía, así que no se escribe nada en Firestore
  // (ni addTransaction ni updateWalletBalance). El saldo del wallet no cambia de verdad.
  // Cuando exista una pasarela real (p.ej. reutilizando el stub de Pago Azul del checkout),
  // esta función debe reemplazarse por una escritura real.
  const handleRecharge = () => {
    if (!amount || numericAmount < 100) return
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setShowConfirmation(true)
    }, 2000)
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <Link href="/wallet">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-gray-900">Recarga Exitosa</h1>
        </div>
        <div className="p-4 max-w-md mx-auto">
          <Card className="mt-6">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-brand-light flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-brand-ui" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Recarga Exitosa!</h2>
              <p className="text-sm text-gray-500 mb-6">Tu wallet ha sido recargado con {formatCurrency(numericAmount)}</p>
              <div className="w-full bg-gray-50 rounded-lg p-4 flex justify-between mb-6">
                <span className="font-medium text-gray-900">Total pagado:</span>
                <span className="font-bold text-brand-ui">{formatCurrency(numericAmount)}</span>
              </div>
              <div className="w-full space-y-3">
                <Link href="/wallet">
                  <Button className="w-full bg-brand-ui hover:bg-brand-dark">Ver mi Wallet</Button>
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
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/wallet">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold text-gray-900">Recargar Wallet</h1>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Amount */}
        <Card>
          <CardContent className="p-5">
            <p className="font-bold text-gray-900 mb-4">¿Cuánto quieres recargar?</p>
            <p className="text-sm font-medium text-gray-700 mb-2">Monto a recargar</p>
            <div className="relative mb-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RD$</span>
              <Input
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                className="pl-11 text-lg font-medium"
              />
            </div>
            {amount && !isValidAmount && (
              <p className="text-xs text-red-600 mb-3">El monto debe estar entre RD$100 y {formatCurrency(50000)}</p>
            )}

            <p className="text-xs text-gray-500 mt-4 mb-2">Montos rápidos</p>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((qa) => (
                <button
                  key={qa}
                  onClick={() => setAmount(String(qa))}
                  className="py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700"
                >
                  {formatCurrency(qa)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment methods */}
        <Card>
          <CardContent className="p-5">
            <p className="font-bold text-gray-900 mb-4">Método de pago</p>
            {loadingMethods ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-brand-ui" />
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center gap-1">
                <CreditCard className="h-10 w-10 text-gray-300 mb-1" />
                <p className="text-gray-600 font-medium text-sm">Aún no tienes métodos de pago</p>
                <p className="text-xs text-gray-400">Agrega una tarjeta, cuenta bancaria o pago móvil para recargar tu wallet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full flex items-center gap-3 p-4 border rounded-xl text-left ${
                      selectedMethod === method.id ? "border-brand-ui bg-brand-extraLight" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <PaymentMethodIcon type={method.type} />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{getPaymentMethodDisplayName(method)}</span>
                      {method.isDefault && (
                        <span className="text-[10px] bg-brand-light text-brand-dark px-1.5 py-0.5 rounded shrink-0">Predeterminado</span>
                      )}
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${selectedMethod === method.id ? "border-brand-ui bg-brand-ui" : "border-gray-300"}`} />
                  </button>
                ))}
              </div>
            )}
            <Link href="/configuracion/pagos/agregar">
              <button className="w-full mt-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600">+ Agregar nuevo método de pago</button>
            </Link>
          </CardContent>
        </Card>

        {/* Summary */}
        {amount && isValidAmount && (
          <Card>
            <CardContent className="p-5">
              <p className="font-bold text-gray-900 mb-4">Resumen de la transacción</p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Monto a recargar:</span>
                <span className="font-medium text-gray-900">{formatCurrency(numericAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 mb-4">
                <span className="font-medium text-gray-900">Total a pagar:</span>
                <span className="font-bold text-brand-ui text-lg">{formatCurrency(numericAmount)}</span>
              </div>
              <div className="flex items-start gap-2 bg-brand-extraLight border border-brand-light rounded-lg p-3">
                <ShieldCheck className="h-4 w-4 text-brand-ui shrink-0 mt-0.5" />
                <p className="text-xs text-brand-dark leading-relaxed">
                  Tu información está protegida con encriptación SSL de 256 bits. El dinero estará disponible en tu wallet
                  usando {selectedPaymentMethod ? getPaymentMethodDisplayName(selectedPaymentMethod) : "tu método de pago"}.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleRecharge}
          disabled={!amount || !isValidAmount || !selectedMethod || isProcessing}
          className="w-full bg-brand-ui hover:bg-brand-dark py-6"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
            </span>
          ) : (
            `Recargar ${amount ? formatCurrency(numericAmount) : "Wallet"}`
          )}
        </Button>
      </div>
    </div>
  )
}
