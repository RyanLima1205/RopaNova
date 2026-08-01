"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, Eye, EyeOff, Clock, Shield, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock bank accounts
const bankAccounts = [
  {
    id: 1,
    bankName: "Banco Popular Dominicano",
    accountNumber: "****-****-****-4532",
    accountType: "Cuenta Corriente",
    isDefault: true,
    processingTime: "1-2 días hábiles",
    fee: 25,
    minAmount: 500,
    maxAmount: 25000,
  },
  {
    id: 2,
    bankName: "Banco de Reservas",
    accountNumber: "****-****-****-8901",
    accountType: "Cuenta de Ahorros",
    isDefault: false,
    processingTime: "2-3 días hábiles",
    fee: 30,
    minAmount: 1000,
    maxAmount: 50000,
  },
  {
    id: 3,
    bankName: "BHD León",
    accountNumber: "****-****-****-2345",
    accountType: "Cuenta Corriente",
    isDefault: false,
    processingTime: "1-2 días hábiles",
    fee: 20,
    minAmount: 500,
    maxAmount: 30000,
  },
]

// Mock wallet balance
const walletBalance = 3250.75

export default function WithdrawMoneyPage() {
  const [amount, setAmount] = useState("")
  const [selectedAccount, setSelectedAccount] = useState(1)
  const [showBalance, setShowBalance] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const selectedBankAccount = bankAccounts.find((account) => account.id === selectedAccount)
  const numericAmount = Number.parseFloat(amount) || 0
  const fee = selectedBankAccount ? selectedBankAccount.fee : 0
  const totalDeduction = numericAmount + fee
  const remainingBalance = walletBalance - totalDeduction

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleMaxAmount = () => {
    const maxPossible = Math.min(
      walletBalance - (selectedBankAccount?.fee || 0),
      selectedBankAccount?.maxAmount || 25000,
    )
    setAmount(Math.max(0, maxPossible).toString())
  }

  const handleWithdraw = async () => {
    if (!amount || !isValidAmount) return

    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      setShowConfirmation(true)
    }, 2000)
  }

  const isValidAmount =
    numericAmount >= (selectedBankAccount?.minAmount || 500) &&
    numericAmount <= (selectedBankAccount?.maxAmount || 25000) &&
    totalDeduction <= walletBalance

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
            <h1 className="font-semibold text-gray-900">Retiro Solicitado</h1>
          </div>
        </header>

        <div className="p-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Retiro Solicitado!</h2>
              <p className="text-gray-600 mb-6">
                Tu solicitud de retiro por {formatCurrency(numericAmount)} está siendo procesada
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Monto a retirar:</span>
                  <span className="font-medium">{formatCurrency(numericAmount)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Comisión:</span>
                  <span className="font-medium">{formatCurrency(fee)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Banco destino:</span>
                  <span className="font-medium text-sm">{selectedBankAccount?.bankName}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Tiempo estimado:</span>
                  <span className="font-medium text-blue-600">{selectedBankAccount?.processingTime}</span>
                </div>
              </div>

              <Alert className="mb-6 text-left">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Recibirás una notificación cuando el dinero esté disponible en tu cuenta bancaria. Los retiros se
                  procesan en días hábiles de 9:00 AM a 5:00 PM.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Link href="/wallet">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600">Ver mi Wallet</Button>
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
          <h1 className="font-semibold text-gray-900">Retirar Dinero</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Available Balance */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">Saldo disponible</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalance(!showBalance)}
                className="h-6 w-6 text-blue-100 hover:bg-blue-400/20"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-3xl font-bold mb-4">{showBalance ? formatCurrency(walletBalance) : "••••••"}</p>

            {amount && isValidAmount && (
              <div className="bg-blue-400/20 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span>Saldo después del retiro:</span>
                  <span className="font-medium">{showBalance ? formatCurrency(remainingBalance) : "••••"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amount Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">¿Cuánto quieres retirar?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Monto a retirar</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">RD$</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-12 text-lg font-medium"
                  min={selectedBankAccount?.minAmount || 500}
                  max={Math.min(walletBalance, selectedBankAccount?.maxAmount || 25000)}
                />
              </div>
              {amount && !isValidAmount && (
                <p className="text-sm text-red-600 mt-1">
                  {totalDeduction > walletBalance
                    ? "Saldo insuficiente (incluye comisión)"
                    : `El monto debe estar entre ${formatCurrency(selectedBankAccount?.minAmount || 500)} y ${formatCurrency(selectedBankAccount?.maxAmount || 25000)}`}
                </p>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={handleMaxAmount} className="bg-transparent">
              Retirar máximo disponible
            </Button>
          </CardContent>
        </Card>

        {/* Bank Account Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cuenta bancaria destino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAccount === account.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedAccount(account.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-gray-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{account.bankName}</p>
                      {account.isDefault && <Badge className="bg-blue-100 text-blue-700 text-xs">Predeterminada</Badge>}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {account.accountType} • {account.accountNumber}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{account.processingTime}</span>
                      </div>
                      <span className="text-xs text-gray-600">Comisión: {formatCurrency(account.fee)}</span>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      selectedAccount === account.id ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    }`}
                  >
                    {selectedAccount === account.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Link href="/configuracion/pagos/agregar">
              <Button variant="outline" className="w-full mt-3 bg-transparent">
                + Agregar nueva cuenta bancaria
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Transaction Summary */}
        {amount && isValidAmount && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen del retiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto a retirar:</span>
                  <span className="font-medium">{formatCurrency(numericAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comisión:</span>
                  <span className="font-medium">{formatCurrency(fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total deducido del wallet:</span>
                  <span className="font-medium text-red-600">{formatCurrency(totalDeduction)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-medium">Recibirás en tu cuenta:</span>
                  <span className="font-bold text-blue-600 text-lg">{formatCurrency(numericAmount)}</span>
                </div>
              </div>

              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Los retiros se procesan en días hábiles de 9:00 AM a 5:00 PM. Tiempo estimado:{" "}
                  {selectedBankAccount?.processingTime}.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Important Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Información importante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Los retiros se procesan únicamente en días hábiles (lunes a viernes)</p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>El horario de procesamiento es de 9:00 AM a 5:00 PM</p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Recibirás una notificación cuando el dinero esté disponible en tu cuenta</p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Las comisiones varían según el banco destino</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="pb-6">
          <Button
            onClick={handleWithdraw}
            disabled={!amount || !isValidAmount || isProcessing}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Procesando...
              </div>
            ) : (
              `Retirar ${amount ? formatCurrency(numericAmount) : "Dinero"}`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
