"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Minus,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ShoppingBag,
  Gift,
  RefreshCw,
  Download,
  Search,
  DollarSign,
  PiggyBank,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock wallet data
const walletData = {
  balance: 3250.75,
  pendingEarnings: 1890.5,
  totalEarnings: 28450.25,
  totalSpent: 15670.0,
  monthlyStats: {
    earned: 4250.0,
    spent: 1890.5,
    transactions: 23,
  },
}

// Mock transactions
const transactions = [
  {
    id: 1,
    type: "sale",
    description: "Venta: Vestido floral marca Zara",
    amount: 1250.0,
    date: "2024-01-10T14:30:00",
    status: "completed",
    buyer: "María González",
    reference: "VRD-001234",
  },
  {
    id: 2,
    type: "withdrawal",
    description: "Retiro a Banco Popular",
    amount: -2000.0,
    date: "2024-01-09T10:15:00",
    status: "processing",
    reference: "WTH-005678",
    estimatedCompletion: "2024-01-11T16:00:00",
  },
  {
    id: 3,
    type: "purchase",
    description: "Compra: Zapatos Nike Air Max",
    amount: -850.0,
    date: "2024-01-08T16:45:00",
    status: "completed",
    seller: "Carlos Rodríguez",
    reference: "PUR-009876",
  },
  {
    id: 4,
    type: "refund",
    description: "Reembolso: Blusa defectuosa",
    amount: 450.0,
    date: "2024-01-07T11:20:00",
    status: "completed",
    reference: "REF-004321",
  },
  {
    id: 5,
    type: "bonus",
    description: "Bono por verificación de identidad",
    amount: 100.0,
    date: "2024-01-06T09:00:00",
    status: "completed",
    reference: "BON-001111",
  },
  {
    id: 6,
    type: "fee",
    description: "Comisión de venta (5%)",
    amount: -62.5,
    date: "2024-01-05T15:30:00",
    status: "completed",
    reference: "FEE-002222",
  },
  {
    id: 7,
    type: "deposit",
    description: "Recarga desde tarjeta Visa",
    amount: 1500.0,
    date: "2024-01-04T12:10:00",
    status: "completed",
    reference: "DEP-003333",
  },
  {
    id: 8,
    type: "sale",
    description: "Venta: Pantalón jeans Levi's",
    amount: 980.0,
    date: "2024-01-03T18:25:00",
    status: "completed",
    buyer: "Ana Martínez",
    reference: "VRD-004444",
  },
]

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [dateRange, setDateRange] = useState("all")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "purchase":
        return <ShoppingBag className="h-4 w-4 text-blue-600" />
      case "withdrawal":
        return <PiggyBank className="h-4 w-4 text-purple-600" />
      case "deposit":
        return <Plus className="h-4 w-4 text-emerald-600" />
      case "refund":
        return <RefreshCw className="h-4 w-4 text-orange-600" />
      case "bonus":
        return <Gift className="h-4 w-4 text-pink-600" />
      case "fee":
        return <Minus className="h-4 w-4 text-red-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50"
      case "processing":
        return "text-yellow-600 bg-yellow-50"
      case "failed":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getTransactionTypeLabel = (type: string) => {
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
      case "bonus":
        return "Bono"
      case "fee":
        return "Comisión"
      default:
        return "Transacción"
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus

    let matchesDate = true
    if (dateRange !== "all") {
      const transactionDate = new Date(transaction.date)
      const now = new Date()

      switch (dateRange) {
        case "today":
          matchesDate = transactionDate.toDateString() === now.toDateString()
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = transactionDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = transactionDate >= monthAgo
          break
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/perfil">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              <h1 className="font-semibold text-gray-900">VintedRD Wallet</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowBalance(!showBalance)} className="h-8 w-8">
            {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Wallet Balance Card */}
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-emerald-100 text-sm">Saldo disponible</p>
                <p className="text-4xl font-bold">{showBalance ? formatCurrency(walletData.balance) : "••••••"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-emerald-100 text-xs">Ganancias pendientes</p>
                  <p className="text-xl font-semibold">
                    {showBalance ? formatCurrency(walletData.pendingEarnings) : "••••"}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs">Total ganado</p>
                  <p className="text-xl font-semibold">
                    {showBalance ? formatCurrency(walletData.totalEarnings) : "••••"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Link href="/wallet/recargar" className="flex-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Recargar
                  </Button>
                </Link>
                <Link href="/wallet/retirar" className="flex-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    <PiggyBank className="h-4 w-4 mr-2" />
                    Retirar
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Este mes ganaste</p>
              <p className="font-bold text-green-600">
                {showBalance ? formatCurrency(walletData.monthlyStats.earned) : "••••"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
                <TrendingDown className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Este mes gastaste</p>
              <p className="font-bold text-blue-600">
                {showBalance ? formatCurrency(walletData.monthlyStats.spent) : "••••"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2">
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Transacciones</p>
              <p className="font-bold text-purple-600">{walletData.monthlyStats.transactions}</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Historial de Transacciones</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar transacciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="sale">Ventas</SelectItem>
                    <SelectItem value="purchase">Compras</SelectItem>
                    <SelectItem value="withdrawal">Retiros</SelectItem>
                    <SelectItem value="deposit">Recargas</SelectItem>
                    <SelectItem value="refund">Reembolsos</SelectItem>
                    <SelectItem value="bonus">Bonos</SelectItem>
                    <SelectItem value="fee">Comisiones</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="processing">Procesando</SelectItem>
                    <SelectItem value="failed">Fallido</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fechas</SelectItem>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron transacciones</p>
                  <p className="text-sm text-gray-400">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <Link key={transaction.id} href={`/wallet/transaccion/${transaction.id}`}>
                    <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{transaction.description}</p>
                          <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                            {transaction.status === "completed"
                              ? "Completado"
                              : transaction.status === "processing"
                                ? "Procesando"
                                : "Fallido"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatDate(transaction.date)}</span>
                          <span>•</span>
                          <span>{transaction.reference}</span>
                          {transaction.buyer && (
                            <>
                              <span>•</span>
                              <span>{transaction.buyer}</span>
                            </>
                          )}
                          {transaction.seller && (
                            <>
                              <span>•</span>
                              <span>{transaction.seller}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-bold ${transaction.amount > 0 ? "text-green-600" : "text-gray-900"}`}>
                          {transaction.amount > 0 ? "+" : ""}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {getStatusIcon(transaction.status)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {filteredTransactions.length > 0 && (
              <div className="mt-6 text-center">
                <Button variant="outline" size="sm">
                  Cargar más transacciones
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/wallet/recargar">
                <Button variant="outline" className="w-full h-16 flex-col gap-2 bg-transparent">
                  <Plus className="h-5 w-5" />
                  <span className="text-sm">Recargar Wallet</span>
                </Button>
              </Link>

              <Link href="/wallet/retirar">
                <Button variant="outline" className="w-full h-16 flex-col gap-2 bg-transparent">
                  <PiggyBank className="h-5 w-5" />
                  <span className="text-sm">Retirar Dinero</span>
                </Button>
              </Link>

              <Link href="/configuracion/pagos">
                <Button variant="outline" className="w-full h-16 flex-col gap-2 bg-transparent">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm">Métodos de Pago</span>
                </Button>
              </Link>

              <Link href="/wallet/configuracion">
                <Button variant="outline" className="w-full h-16 flex-col gap-2 bg-transparent">
                  <Wallet className="h-5 w-5" />
                  <span className="text-sm">Configurar Wallet</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
