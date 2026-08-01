"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Building2, Loader2, Clock, ShieldCheck, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/contexts/AuthContext"
import {
  getWalletData,
  getPaymentMethods,
  getPaymentMethodDisplayName,
  addTransaction,
  updateWalletBalance,
  type PaymentMethod,
} from "@/lib/services/paymentService"

const MIN_WITHDRAW_AMOUNT = 500

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 0 }).format(amount)
}

export default function RetirarPageGate() {
  return (
    <RequireAuth>
      <RetirarPage />
    </RequireAuth>
  )
}

function RetirarPage() {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [bankAccounts, setBankAccounts] = useState<PaymentMethod[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [showBalance, setShowBalance] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    getWalletData(user.id).then((wallet) => {
      if (wallet) setWalletBalance(wallet.balance)
    })
    setLoadingAccounts(true)
    getPaymentMethods(user.id).then((methods) => {
      const banks = methods.filter((m) => m.type === "bank_transfer")
      setBankAccounts(banks)
      setSelectedAccount((current) => {
        if (current && banks.some((b) => b.id === current)) return current
        return banks.find((b) => b.isDefault)?.id ?? banks[0]?.id ?? null
      })
      setLoadingAccounts(false)
    })
  }, [user?.id])

  const selectedBankAccount = bankAccounts.find((a) => a.id === selectedAccount)
  const numericAmount = Number.parseFloat(amount) || 0
  const remainingBalance = walletBalance - numericAmount
  const isValidAmount = numericAmount >= MIN_WITHDRAW_AMOUNT && numericAmount <= walletBalance && !!selectedAccount

  const handleMaxAmount = () => setAmount(String(Math.max(0, walletBalance)))

  const handleWithdraw = async () => {
    if (!amount || !isValidAmount || !selectedAccount || !user?.id) return
    setIsProcessing(true)
    try {
      const accountLabel = selectedBankAccount ? getPaymentMethodDisplayName(selectedBankAccount) : "cuenta bancaria"
      await addTransaction(user.id, {
        userId: user.id,
        type: "withdrawal",
        description: `Retiro a ${accountLabel}`,
        amount: -numericAmount,
        status: "processing",
        paymentMethodId: selectedAccount,
      })
      await updateWalletBalance(user.id, numericAmount, "subtract")
      setShowConfirmation(true)
    } catch {
      toast({ title: "No se pudo procesar el retiro. Intenta de nuevo.", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
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
          <h1 className="font-semibold text-gray-900">Retiro Solicitado</h1>
        </div>
        <div className="p-4 max-w-md mx-auto">
          <Card className="mt-6">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Retiro Solicitado!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Tu solicitud de retiro por {formatCurrency(numericAmount)} está siendo procesada
              </p>
              <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monto a retirar:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(numericAmount)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Cuenta destino:</span>
                  <span className="font-medium text-gray-900">{selectedBankAccount ? getPaymentMethodDisplayName(selectedBankAccount) : ""}</span>
                </div>
              </div>
              <div className="w-full flex items-start gap-2 bg-blue-50 rounded-lg p-3 mb-6">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed text-left">
                  El monto aparecerá en tu cuenta bancaria en los próximos 2 días hábiles (lunes a viernes, de 9:00 AM a 5:00 PM).
                </p>
              </div>
              <div className="w-full space-y-3">
                <Link href="/wallet">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Ver mi Wallet</Button>
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
        <h1 className="font-semibold text-gray-900">Retirar Dinero</h1>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Balance */}
        <div className="bg-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-sm">Saldo disponible</span>
            <button onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <EyeOff className="h-4 w-4 text-blue-100" /> : <Eye className="h-4 w-4 text-blue-100" />}
            </button>
          </div>
          <p className="text-3xl font-bold mb-3">{showBalance ? formatCurrency(walletBalance) : "••••••"}</p>
          {amount && isValidAmount && (
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-xs text-white/90 mb-0.5">Saldo después del retiro:</p>
              <p className="text-sm font-medium">{showBalance ? formatCurrency(remainingBalance) : "••••"}</p>
            </div>
          )}
        </div>

        {/* Amount */}
        <Card>
          <CardContent className="p-5">
            <p className="font-bold text-gray-900 mb-4">¿Cuánto quieres retirar?</p>
            <p className="text-sm font-medium text-gray-700 mb-2">Monto a retirar</p>
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
              <p className="text-xs text-red-600 mb-3">
                {numericAmount > walletBalance
                  ? "Saldo insuficiente"
                  : !selectedAccount
                    ? "Selecciona una cuenta bancaria destino"
                    : `El monto mínimo a retirar es ${formatCurrency(MIN_WITHDRAW_AMOUNT)}`}
              </p>
            )}
            <button onClick={handleMaxAmount} className="mt-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700">
              Retirar máximo disponible
            </button>
          </CardContent>
        </Card>

        {/* Bank accounts */}
        <Card>
          <CardContent className="p-5">
            <p className="font-bold text-gray-900 mb-4">Cuenta bancaria destino</p>
            {loadingAccounts ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center gap-1">
                <Building2 className="h-10 w-10 text-gray-300 mb-1" />
                <p className="text-gray-600 font-medium text-sm">Aún no tienes cuentas bancarias</p>
                <p className="text-xs text-gray-400">Agrega una cuenta bancaria para poder retirar tu saldo</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bankAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccount(account.id)}
                    className={`w-full flex items-center gap-3 p-4 border rounded-lg text-left ${
                      selectedAccount === account.id ? "border-blue-600 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{getPaymentMethodDisplayName(account)}</span>
                      {account.isDefault && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">Predeterminada</span>}
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${selectedAccount === account.id ? "border-blue-600 bg-blue-600" : "border-gray-300"}`} />
                  </button>
                ))}
              </div>
            )}
            <Link href="/configuracion/pagos/agregar">
              <button className="w-full mt-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600">+ Agregar nueva cuenta bancaria</button>
            </Link>
          </CardContent>
        </Card>

        {/* Summary */}
        {amount && isValidAmount && (
          <Card>
            <CardContent className="p-5">
              <p className="font-bold text-gray-900 mb-4">Resumen del retiro</p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Monto a retirar:</span>
                <span className="font-medium text-gray-900">{formatCurrency(numericAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 mb-4">
                <span className="font-medium text-gray-900">Recibirás en tu cuenta:</span>
                <span className="font-bold text-blue-600 text-lg">{formatCurrency(numericAmount)}</span>
              </div>
              <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">Los retiros se procesan en días hábiles de 9:00 AM a 5:00 PM.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <p className="font-bold text-gray-900">Información importante</p>
            </div>
            <ul className="space-y-2.5">
              {[
                "Los retiros se procesan únicamente en días hábiles (lunes a viernes)",
                "El horario de procesamiento es de 9:00 AM a 5:00 PM",
                "El monto aparecerá en tu cuenta bancaria en los próximos 2 días hábiles",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button
          onClick={handleWithdraw}
          disabled={!amount || !isValidAmount || isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 py-6"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
            </span>
          ) : (
            `Retirar ${amount ? formatCurrency(numericAmount) : "Dinero"}`
          )}
        </Button>
      </div>
    </div>
  )
}
