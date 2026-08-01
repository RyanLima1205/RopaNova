"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Eye,
  EyeOff,
  Wallet,
  Download,
  Info,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Building2,
  Banknote,
  Smartphone,
  MoreVertical,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RequireAuth } from "@/components/require-auth"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import {
  getPaymentMethods,
  getWalletData,
  getRecentTransactions,
  getPaymentPreferences,
  updatePaymentPreferences,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  formatCurrency,
  getTransactionStatusLabel,
  type PaymentMethod,
  type WalletData,
  type Transaction,
  type PaymentPreferences,
} from "@/lib/services/paymentService"

function PaymentMethodIcon({ type }: { type: PaymentMethod["type"] }) {
  switch (type) {
    case "bank_transfer":
      return <Building2 className="h-5 w-5 text-brand-ui" />
    case "mobile_payment":
      return <Smartphone className="h-5 w-5 text-blue-500" />
    case "cash":
      return <Banknote className="h-5 w-5 text-yellow-500" />
    default:
      return <CreditCard className="h-5 w-5 text-gray-500" />
  }
}

function TransactionIcon({ type }: { type: Transaction["type"] }) {
  switch (type) {
    case "sale":
      return <TrendingUp className="h-4 w-4 text-brand-ui" />
    case "withdrawal":
      return <Download className="h-4 w-4 text-blue-600" />
    case "purchase":
      return <CreditCard className="h-4 w-4 text-orange-600" />
    default:
      return <Banknote className="h-4 w-4 text-gray-500" />
  }
}

function statusColor(status: Transaction["status"]) {
  switch (status) {
    case "completed":
      return "text-brand-ui"
    case "processing":
      return "text-yellow-600"
    case "failed":
      return "text-red-600"
    default:
      return "text-gray-500"
  }
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffHours < 1) return "Hace menos de 1 hora"
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`
  if (diffDays === 1) return "Ayer"
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? "s" : ""}`
  return date.toLocaleDateString("es-DO")
}

export default function PagosPageGate() {
  return (
    <RequireAuth>
      <PagosPage />
    </RequireAuth>
  )
}

function PagosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [preferences, setPreferences] = useState<PaymentPreferences | null>(null)
  const [showBalance, setShowBalance] = useState(true)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null)

  const loadAllData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [methodsData, walletInfo, transactionsData, prefsData] = await Promise.all([
        getPaymentMethods(user.id),
        getWalletData(user.id),
        getRecentTransactions(user.id, 10),
        getPaymentPreferences(user.id),
      ])
      setPaymentMethods(methodsData)
      setWalletData(walletInfo)
      setTransactions(transactionsData)
      setPreferences(prefsData)
    } catch {
      toast({ title: "No se pudieron cargar los datos de pago", variant: "destructive" })
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    setLoading(true)
    loadAllData()
  }, [loadAllData])

  const handleAutoWithdrawToggle = async (value: boolean) => {
    if (!user?.id) return
    try {
      await updatePaymentPreferences(user.id, { autoWithdraw: value })
      setPreferences((prev) => (prev ? { ...prev, autoWithdraw: value } : prev))
    } catch {
      toast({ title: "No se pudo actualizar la configuración", variant: "destructive" })
    }
  }

  const handleSetDefault = async (methodId: string) => {
    if (!user?.id) return
    try {
      await setDefaultPaymentMethod(user.id, methodId)
      await loadAllData()
      toast({ title: "Método establecido como predeterminado" })
    } catch {
      toast({ title: "No se pudo establecer como predeterminado", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!user?.id || !deleteTarget) return
    try {
      await deletePaymentMethod(user.id, deleteTarget.id)
      await loadAllData()
      toast({ title: "Método eliminado correctamente" })
    } catch {
      toast({ title: "No se pudo eliminar el método", variant: "destructive" })
    }
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
        <p className="text-sm text-gray-500">Cargando métodos de pago...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Métodos de Pago</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push("/configuracion/pagos/agregar")}>
          <Plus className="h-5 w-5 text-brand-ui" />
        </Button>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Wallet */}
        {walletData && (
          <div className="bg-brand-ui rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                <span className="font-bold text-lg">RopaNova Wallet</span>
              </div>
              <button onClick={() => setShowBalance((v) => !v)}>
                {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-sm text-brand-light mt-3">Saldo disponible</p>
            <p className="text-3xl font-bold mt-0.5">{showBalance ? formatCurrency(walletData.balance) : "••••••"}</p>
            <div className="flex justify-between mt-3">
              <div>
                <p className="text-xs text-brand-light">Ganancias pendientes</p>
                <p className="font-bold">{showBalance ? formatCurrency(walletData.pendingEarnings) : "••••"}</p>
              </div>
              <div>
                <p className="text-xs text-brand-light">Total ganado</p>
                <p className="font-bold">{showBalance ? formatCurrency(walletData.totalEarnings) : "••••"}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Link href="/wallet/recargar" className="flex-1">
                <Button className="w-full bg-brand-dark hover:bg-brand-deep">
                  <Plus className="h-4 w-4 mr-1" /> Recargar
                </Button>
              </Link>
              <Link href="/wallet/retirar" className="flex-1">
                <Button className="w-full bg-brand-dark hover:bg-brand-deep">
                  <Download className="h-4 w-4 mr-1" /> Retirar
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-brand-extraLight border-l-4 border-brand-ui rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-brand-ui shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-brand-dark text-sm mb-1">¿Cómo recargar o retirar?</p>
              <p className="text-xs text-brand-dark leading-relaxed">
                <span className="font-bold">Recargar:</span> Apple Pay / Google Pay (simulado), Pago Móvil o
                transferencia. Tarjeta bancaria en la app: próximamente con proveedor seguro.
                <br />
                <span className="font-bold">Retirar:</span> Transfiere tu saldo a tu cuenta bancaria registrada.
              </p>
            </div>
          </div>
        </div>

        {/* Auto-withdraw */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-gray-900 mb-3">Configuración de Retiros</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Retiro Automático</p>
              <p className="text-xs text-gray-500">
                Retira automáticamente cuando alcances RD${preferences?.autoWithdrawThreshold || 1000}
              </p>
            </div>
            <Switch checked={preferences?.autoWithdraw || false} onCheckedChange={handleAutoWithdrawToggle} />
          </div>
          {preferences?.autoWithdraw && (
            <div className="bg-blue-50 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-600">Método de retiro predeterminado</span>
              </div>
              <p className="text-xs text-blue-600">
                {preferences.autoWithdrawMethodId
                  ? paymentMethods.find((m) => m.id === preferences.autoWithdrawMethodId)?.name || "No configurado"
                  : "No configurado"}
              </p>
              {/* NOTA: en mobile, "Cambiar método" es un TouchableOpacity sin onPress — no hace nada. Se porta como texto inerte. */}
              <span className="text-xs font-bold text-blue-600 mt-1 inline-block opacity-60 cursor-default">Cambiar método</span>
            </div>
          )}
        </div>

        {/* Transactions */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-gray-900">Transacciones Recientes</p>
              {/* NOTA: mobile no tiene onPress en "Ver todas" — dead link, se porta como texto inerte. */}
              <span className="text-xs font-bold text-gray-400 opacity-60 cursor-default">Ver todas</span>
            </div>
            <div className="divide-y">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <TransactionIcon type={t.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{t.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{formatRelativeDate(t.createdAt)}</span>
                      <span className={`text-xs ${statusColor(t.status)}`}>{getTransactionStatusLabel(t.status)}</span>
                    </div>
                  </div>
                  <span className={`font-bold ${t.amount > 0 ? "text-brand-ui" : "text-gray-900"}`}>
                    {t.amount > 0 ? "+" : ""}
                    {formatCurrency(Math.abs(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment methods */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-bold text-gray-900">Métodos de pago</p>
              <p className="text-xs text-gray-500">Transferencia, pago móvil y otros (tarjeta: próximamente)</p>
            </div>
            <Link href="/configuracion/pagos/agregar">
              <Button size="sm" variant="outline" className="text-brand-ui border-brand-light bg-brand-extraLight hover:bg-brand-light">
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </Link>
          </div>
          {paymentMethods.length === 0 ? (
            <div className="py-8 flex flex-col items-center text-center gap-1">
              <CreditCard className="h-10 w-10 text-gray-300 mb-1" />
              <p className="text-gray-600 font-medium text-sm">Sin métodos guardados</p>
              <p className="text-xs text-gray-400">Agrega transferencia o pago móvil para retiros y pagos</p>
            </div>
          ) : (
            <div className="divide-y">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center gap-3 py-2.5">
                  <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <PaymentMethodIcon type={method.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900 truncate">{method.name}</span>
                      {method.isDefault && (
                        <span className="text-[10px] bg-brand-light text-brand-dark px-1.5 py-0.5 rounded shrink-0">Predeterminado</span>
                      )}
                      {method.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-brand-ui shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {method.type === "bank_transfer" && method.details.bankName}
                      {method.type === "mobile_payment" && method.details.provider}
                      {method.type === "cash" && method.details.preferredLocation}
                      {method.lastUsed ? ` • ${formatRelativeDate(method.lastUsed)}` : ""}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled={method.isDefault} onClick={() => handleSetDefault(method.id)}>
                        {method.isDefault ? "Predeterminado ✓" : "Establecer como predeterminado"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(method)}>
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-brand-ui" />
            <p className="font-bold text-gray-900">Seguridad de Pagos</p>
          </div>
          {[
            { title: "Encriptación SSL 256-bit", desc: "Todos los datos de pago están protegidos" },
            { title: "Cumplimiento PCI DSS", desc: "Estándares internacionales de seguridad" },
            { title: "Protección contra fraude", desc: "Monitoreo 24/7 de transacciones" },
          ].map((row) => (
            <div key={row.title} className="flex items-start gap-2 mt-2">
              <CheckCircle2 className="h-4 w-4 text-brand-ui shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-900">{row.title}</p>
                <p className="text-xs text-gray-500">{row.desc}</p>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 mt-3">
            <ShieldAlert className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-600">Consejo de Seguridad</p>
              <p className="text-xs text-blue-600">Nunca compartas tu información de pago fuera de la aplicación RopaNova.</p>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar &quot;{deleteTarget?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
