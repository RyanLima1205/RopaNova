"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  CreditCard,
  Building2,
  Smartphone,
  DollarSign,
  Shield,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Wallet,
  Clock,
  TrendingUp,
  PiggyBank,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock payment methods data
const paymentMethods = [
  {
    id: 1,
    type: "card",
    name: "Visa **** 4532",
    bank: "Banco Popular Dominicano",
    expiry: "12/26",
    isDefault: true,
    isVerified: true,
    lastUsed: "Hace 2 días",
    logo: "/placeholder.svg?height=32&width=50&text=VISA",
  },
  {
    id: 2,
    type: "card",
    name: "Mastercard **** 8901",
    bank: "Banco de Reservas",
    expiry: "08/25",
    isDefault: false,
    isVerified: true,
    lastUsed: "Hace 1 semana",
    logo: "/placeholder.svg?height=32&width=50&text=MC",
  },
  {
    id: 3,
    type: "bank",
    name: "Transferencia Bancaria",
    bank: "Banco BHD León",
    account: "****7890",
    isDefault: false,
    isVerified: true,
    lastUsed: "Hace 3 días",
    logo: "/placeholder.svg?height=32&width=50&text=BHD",
  },
]

// Dominican payment options
const dominican_payment_options = [
  {
    id: "card",
    name: "Tarjeta de Crédito/Débito",
    description: "Visa, Mastercard, American Express",
    icon: CreditCard,
    popular: true,
    fees: "Sin comisión",
    processingTime: "Inmediato",
  },
  {
    id: "bank_transfer",
    name: "Transferencia Bancaria",
    description: "Bancos dominicanos principales",
    icon: Building2,
    popular: true,
    fees: "RD$25",
    processingTime: "1-2 días hábiles",
  },
  {
    id: "mobile_payment",
    name: "Pago Móvil",
    description: "Tpago, Azul Mobile, BHD App",
    icon: Smartphone,
    popular: false,
    fees: "RD$15",
    processingTime: "Inmediato",
  },
  {
    id: "cash",
    name: "Efectivo (Encuentro)",
    description: "Pago en persona al recoger",
    icon: DollarSign,
    popular: true,
    fees: "Gratis",
    processingTime: "En el momento",
  },
]

// VintedRD Wallet data
const walletData = {
  balance: 2450.0,
  pendingEarnings: 890.5,
  totalEarnings: 15670.25,
  recentTransactions: [
    {
      id: 1,
      type: "sale",
      description: "Venta: Vestido floral",
      amount: 850.0,
      date: "Hace 2 horas",
      status: "completed",
    },
    {
      id: 2,
      type: "withdrawal",
      description: "Retiro a Banco Popular",
      amount: -1200.0,
      date: "Ayer",
      status: "processing",
    },
    {
      id: 3,
      type: "purchase",
      description: "Compra: Zapatos Nike",
      amount: -450.0,
      date: "Hace 3 días",
      status: "completed",
    },
  ],
}

export default function MetodosPagoPage() {
  const [showBalance, setShowBalance] = useState(true)
  const [autoWithdraw, setAutoWithdraw] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <PiggyBank className="h-4 w-4 text-blue-600" />
      case "purchase":
        return <CreditCard className="h-4 w-4 text-orange-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "processing":
        return "text-yellow-600"
      case "failed":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/configuracion">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-gray-900">Métodos de Pago</h1>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* VintedRD Wallet */}
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                <CardTitle className="text-white">VintedRD Wallet</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-white hover:bg-white/20"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-emerald-100 text-sm">Saldo disponible</p>
                <p className="text-3xl font-bold">{showBalance ? formatCurrency(walletData.balance) : "••••••"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-emerald-100 text-xs">Ganancias pendientes</p>
                  <p className="text-lg font-semibold">
                    {showBalance ? formatCurrency(walletData.pendingEarnings) : "••••"}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs">Total ganado</p>
                  <p className="text-lg font-semibold">
                    {showBalance ? formatCurrency(walletData.totalEarnings) : "••••"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Recargar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <PiggyBank className="h-4 w-4 mr-2" />
                  Retirar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto-withdrawal Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración de Retiros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Retiro Automático</p>
                <p className="text-sm text-gray-500">Retira automáticamente cuando alcances RD$1,000</p>
              </div>
              <Switch checked={autoWithdraw} onCheckedChange={setAutoWithdraw} />
            </div>

            {autoWithdraw && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Método de retiro predeterminado</p>
                </div>
                <p className="text-sm text-blue-700">Banco Popular - Cuenta **** 4532</p>
                <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto">
                  Cambiar método
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Transacciones Recientes</CardTitle>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {walletData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{transaction.date}</span>
                      <span>•</span>
                      <span className={getStatusColor(transaction.status)}>
                        {transaction.status === "completed"
                          ? "Completado"
                          : transaction.status === "processing"
                            ? "Procesando"
                            : "Fallido"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-gray-900"}`}>
                      {transaction.amount > 0 ? "+" : ""}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Métodos de Pago Guardados</CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <img src={method.logo || "/placeholder.svg"} alt={method.name} className="h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{method.name}</p>
                      {method.isDefault && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">Predeterminado</Badge>
                      )}
                      {method.isVerified && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{method.bank}</span>
                      {method.type === "card" && (
                        <>
                          <span>•</span>
                          <span>Vence {method.expiry}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{method.lastUsed}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {!method.isDefault && (
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          Hacer predeterminado
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Payment Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Opciones de Pago Disponibles</CardTitle>
            <p className="text-sm text-gray-600">Métodos de pago populares en República Dominicana</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {dominican_payment_options.map((option) => {
                const IconComponent = option.icon
                return (
                  <div
                    key={option.id}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{option.name}</p>
                        {option.popular && <Badge className="bg-blue-100 text-blue-700 text-xs">Popular</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{option.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{option.fees}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{option.processingTime}</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      Agregar
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Seguridad de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Encriptación SSL 256-bit</p>
                  <p className="text-xs text-gray-500">Todos los datos de pago están protegidos</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Cumplimiento PCI DSS</p>
                  <p className="text-xs text-gray-500">Estándares internacionales de seguridad</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Protección contra fraude</p>
                  <p className="text-xs text-gray-500">Monitoreo 24/7 de transacciones</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">Consejo de Seguridad</p>
              </div>
              <p className="text-sm text-blue-700">
                Nunca compartas tu información de pago fuera de la aplicación VintedRD.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
