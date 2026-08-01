"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Loader2,
  PiggyBank,
  ShoppingBag,
  Plus,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/contexts/AuthContext"
import {
  getWalletData,
  getTransactionsPaginated,
  type WalletData,
  type Transaction,
  type TransactionCursor,
} from "@/lib/services/paymentService"

const emptyWallet: WalletData = {
  userId: "",
  balance: 0,
  pendingEarnings: 0,
  totalEarnings: 0,
  currency: "DOP",
  lastUpdated: new Date(),
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 0 }).format(amount)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date)
}

function getTransactionIcon(type: string) {
  switch (type) {
    case "sale":
      return <TrendingUp className="h-[18px] w-[18px] text-brand-ui" />
    case "purchase":
      return <ShoppingBag className="h-[18px] w-[18px] text-blue-600" />
    case "withdrawal":
      return <PiggyBank className="h-4 w-4 text-purple-600" />
    case "deposit":
      return <Plus className="h-[18px] w-[18px] text-brand-ui" />
    case "refund":
      return <RefreshCw className="h-[18px] w-[18px] text-orange-600" />
    default:
      return <WalletIcon className="h-[18px] w-[18px] text-gray-500" />
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-brand-ui" />
    case "processing":
      return <Clock className="h-4 w-4 text-amber-600" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-brand-light text-brand-dark"
    case "processing":
      return "bg-amber-100 text-amber-700"
    case "failed":
      return "bg-red-100 text-red-700"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

function getTransactionTypeLabel(type: string) {
  switch (type) {
    case "sale":
      return "Venta"
    case "purchase":
      return "Compra"
    case "withdrawal":
      return "Retiro"
    case "deposit":
      return "Recarga"
    case "refund":
      return "Reembolso"
    default:
      return "Transacción"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Completado"
    case "processing":
      return "Procesando"
    case "cancelled":
      return "Cancelado"
    default:
      return "Fallido"
  }
}

export default function WalletPageGate() {
  return (
    <RequireAuth>
      <WalletPage />
    </RequireAuth>
  )
}

function WalletPage() {
  const { user } = useAuth()
  const [showBalance, setShowBalance] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [walletData, setWalletData] = useState<WalletData>(emptyWallet)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<TransactionCursor | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const loadWallet = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [wallet, page] = await Promise.all([getWalletData(user.id), getTransactionsPaginated(user.id, 20)])
      if (wallet) setWalletData(wallet)
      setTransactions(page.transactions)
      setCursor(page.cursor)
      setHasMore(page.hasMore)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadWallet()
  }, [loadWallet])

  const loadMore = async () => {
    if (!user?.id || loadingMore || !hasMore || !cursor) return
    setLoadingMore(true)
    try {
      const page = await getTransactionsPaginated(user.id, 20, cursor)
      setTransactions((prev) => [...prev, ...page.transactions])
      setCursor(page.cursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }

  const monthlyStats = useMemo(() => {
    const now = new Date()
    const monthTransactions = transactions.filter(
      (t) => t.createdAt.getMonth() === now.getMonth() && t.createdAt.getFullYear() === now.getFullYear(),
    )
    const earned = monthTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const spent = monthTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return { earned, spent, transactions: monthTransactions.length }
  }, [transactions])

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || t.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/perfil">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-brand-ui" />
            <span className="font-bold text-gray-900">RopaNova Wallet</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowBalance(!showBalance)}>
          {showBalance ? <EyeOff className="h-5 w-5 text-gray-600" /> : <Eye className="h-5 w-5 text-gray-600" />}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-brand-ui" />
        </div>
      ) : (
        <div className="p-4 max-w-lg mx-auto space-y-4">
          {/* Balance card */}
          <div className="bg-brand-ui rounded-2xl p-6 text-white space-y-4">
            <p className="text-brand-light text-sm">Saldo disponible</p>
            <p className="text-4xl font-bold">{showBalance ? formatCurrency(walletData.balance) : "••••••"}</p>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-brand-light text-xs">Ganancias pendientes</p>
                <p className="font-semibold">{showBalance ? formatCurrency(walletData.pendingEarnings) : "••••"}</p>
              </div>
              <div className="flex-1">
                <p className="text-brand-light text-xs">Total ganado</p>
                <p className="font-semibold">{showBalance ? formatCurrency(walletData.totalEarnings) : "••••"}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Link href="/wallet/recargar" className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 bg-white/20 border border-white/30 rounded-lg py-3 text-sm font-medium">
                  <Plus className="h-4 w-4" /> Recargar
                </button>
              </Link>
              <Link href="/wallet/retirar" className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 bg-white/20 border border-white/30 rounded-lg py-3 text-sm font-medium">
                  <PiggyBank className="h-4 w-4" /> Retirar
                </button>
              </Link>
            </div>
          </div>

          {/* Monthly stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <TrendingUp className="h-5 w-5 text-brand-ui mb-1.5" />
                <p className="text-xs text-gray-500 mb-1">Este mes ganaste</p>
                <p className="font-bold text-sm text-gray-900">{showBalance ? formatCurrency(monthlyStats.earned) : "••••"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <TrendingDown className="h-5 w-5 text-blue-600 mb-1.5" />
                <p className="text-xs text-gray-500 mb-1">Este mes gastaste</p>
                <p className="font-bold text-sm text-gray-900">{showBalance ? formatCurrency(monthlyStats.spent) : "••••"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <RefreshCw className="h-5 w-5 text-purple-600 mb-1.5" />
                <p className="text-xs text-gray-500 mb-1">Transacciones</p>
                <p className="font-bold text-sm text-gray-900">{monthlyStats.transactions}</p>
              </CardContent>
            </Card>
          </div>

          {/* Transactions */}
          <Card>
            <CardContent className="p-5">
              <p className="font-bold text-gray-900 mb-4">Historial de Transacciones</p>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar transacciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto mb-4 scrollbar-hide">
                {[
                  { value: "all", label: "Todos" },
                  { value: "sale", label: "Ventas" },
                  { value: "purchase", label: "Compras" },
                  { value: "withdrawal", label: "Retiros" },
                  { value: "deposit", label: "Recargas" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilterType(f.value)}
                    className={`px-3 py-1.5 rounded-full text-xs border shrink-0 ${
                      filterType === f.value ? "bg-brand-ui border-brand-ui text-white" : "bg-white border-gray-300 text-gray-500"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center gap-1">
                  <WalletIcon className="h-12 w-12 text-gray-200 mb-2" />
                  <p className="text-gray-600 font-medium">
                    {transactions.length === 0 ? "Aún no tienes transacciones" : "No se encontraron transacciones"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {transactions.length === 0
                      ? "Tus ventas, compras, recargas y retiros aparecerán aquí"
                      : "Intenta ajustar los filtros de búsqueda"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTransaction(t)}
                      className="w-full flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shrink-0">{getTransactionIcon(t.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900 truncate flex-1">{t.description}</span>
                          <Badge className={`text-[10px] px-1.5 py-0 ${getStatusBadgeClass(t.status)}`}>{getStatusLabel(t.status)}</Badge>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(t.createdAt)}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`font-bold text-sm ${t.amount > 0 ? "text-brand-ui" : "text-gray-900"}`}>
                          {t.amount > 0 ? "+" : ""}
                          {formatCurrency(Math.abs(t.amount))}
                        </span>
                        {getStatusIcon(t.status)}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full mt-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-600 font-medium flex items-center justify-center gap-2"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cargar más transacciones"}
                </button>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardContent className="p-5">
              <p className="font-bold text-gray-900 mb-4">Acciones Rápidas</p>
              <div className="grid grid-cols-3 gap-3">
                <Link href="/wallet/recargar">
                  <div className="h-20 border border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2">
                    <Plus className="h-6 w-6 text-brand-ui" />
                    <span className="text-xs text-gray-600 text-center">Recargar Wallet</span>
                  </div>
                </Link>
                <Link href="/wallet/retirar">
                  <div className="h-20 border border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2">
                    <PiggyBank className="h-5 w-5 text-brand-ui" />
                    <span className="text-xs text-gray-600 text-center">Retirar Dinero</span>
                  </div>
                </Link>
                <Link href="/configuracion/pagos">
                  <div className="h-20 border border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2">
                    <CreditCard className="h-6 w-6 text-brand-ui" />
                    <span className="text-xs text-gray-600 text-center">Métodos de Pago</span>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction detail dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent>
          {selectedTransaction && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">{getTransactionIcon(selectedTransaction.type)}</div>
                  <DialogTitle>{getTransactionTypeLabel(selectedTransaction.type)}</DialogTitle>
                </div>
              </DialogHeader>
              <p className={`text-4xl font-bold text-center ${selectedTransaction.amount > 0 ? "text-brand-ui" : "text-gray-900"}`}>
                {selectedTransaction.amount > 0 ? "+" : ""}
                {formatCurrency(Math.abs(selectedTransaction.amount))}
              </p>
              <div className="flex justify-center">
                <Badge className={getStatusBadgeClass(selectedTransaction.status)}>{getStatusLabel(selectedTransaction.status)}</Badge>
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Descripción</span>
                  <span className="font-medium text-gray-900 text-right">{selectedTransaction.description}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium text-gray-900">{formatDate(selectedTransaction.createdAt)}</span>
                </div>
                {selectedTransaction.relatedOrderId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pedido</span>
                    <span className="font-medium text-gray-900">#{selectedTransaction.relatedOrderId.slice(0, 8)}</span>
                  </div>
                )}
              </div>
              <Button onClick={() => setSelectedTransaction(null)} className="w-full bg-brand-ui hover:bg-brand-dark mt-2">
                Cerrar
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
