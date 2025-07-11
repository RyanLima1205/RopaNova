"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Users, DollarSign, Eye, Star, MessageCircle, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("7d")

  // Mock dashboard data
  const stats = {
    totalSales: 89,
    totalRevenue: 45600,
    activeListings: 12,
    totalViews: 2340,
    averageRating: 4.8,
    responseRate: 92,
    conversionRate: 8.5,
    repeatCustomers: 23,
  }

  const recentSales = [
    {
      id: 1,
      item: "Vestido Elegante de Noche Zara",
      price: 2500,
      buyer: "Ana Rodríguez",
      date: "Hace 2 horas",
      status: "completed",
    },
    {
      id: 2,
      item: "Bolso de Cuero Genuino Coach",
      price: 1800,
      buyer: "Carmen López",
      date: "Hace 1 día",
      status: "completed",
    },
    {
      id: 3,
      item: "Zapatos de Tacón Steve Madden",
      price: 2200,
      buyer: "Isabella Martínez",
      date: "Hace 2 días",
      status: "pending",
    },
  ]

  const topPerformingItems = [
    {
      id: 1,
      item: "Vestidos de Noche",
      sales: 15,
      revenue: 37500,
      growth: 25,
    },
    {
      id: 2,
      item: "Bolsos de Cuero",
      sales: 8,
      revenue: 14400,
      growth: 12,
    },
    {
      id: 3,
      item: "Zapatos de Tacón",
      sales: 12,
      revenue: 26400,
      growth: -5,
    },
  ]

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
            <h1 className="font-semibold text-gray-900">Dashboard de Vendedor</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={timeRange === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("7d")}
              className={timeRange === "7d" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-transparent"}
            >
              7 días
            </Button>
            <Button
              variant={timeRange === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("30d")}
              className={timeRange === "30d" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-transparent"}
            >
              30 días
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 pb-20 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ventas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
                </div>
                <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+12% vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ingresos</p>
                  <p className="text-2xl font-bold text-gray-900">RD${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+8% vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Publicaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeListings}</p>
                </div>
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-gray-500">Activas actualmente</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Calificación</p>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-gray-500">Basado en 127 reseñas</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tasa de Respuesta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-emerald-600">{stats.responseRate}%</span>
                <MessageCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <Progress value={stats.responseRate} className="h-2 mb-2" />
              <p className="text-xs text-gray-500">Excelente tiempo de respuesta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-blue-600">{stats.conversionRate}%</span>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <Progress value={stats.conversionRate * 10} className="h-2 mb-2" />
              <p className="text-xs text-gray-500">Visitas que se convierten en ventas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Clientes Recurrentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-purple-600">{stats.repeatCustomers}</span>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500">Compradores que han vuelto</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ventas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900 mb-1">{sale.item}</h4>
                    <p className="text-xs text-gray-500">Comprado por {sale.buyer}</p>
                    <p className="text-xs text-gray-400">{sale.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">RD${sale.price.toLocaleString()}</p>
                    <Badge
                      variant={sale.status === "completed" ? "default" : "secondary"}
                      className={`text-xs ${sale.status === "completed" ? "bg-emerald-100 text-emerald-700" : ""}`}
                    >
                      {sale.status === "completed" ? "Completada" : "Pendiente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorías Más Vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformingItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900">{item.item}</h4>
                    <p className="text-xs text-gray-500">{item.sales} ventas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">RD${item.revenue.toLocaleString()}</p>
                    <div className="flex items-center gap-1">
                      {item.growth > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                      )}
                      <span className={`text-xs ${item.growth > 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.growth > 0 ? "+" : ""}
                        {item.growth}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/vender">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600">Publicar Nuevo Artículo</Button>
              </Link>
              <Link href="/mensajes">
                <Button variant="outline" className="w-full bg-transparent">
                  Ver Mensajes
                </Button>
              </Link>
              <Link href="/perfil">
                <Button variant="outline" className="w-full bg-transparent">
                  Editar Perfil
                </Button>
              </Link>
              <Link href="/configuracion">
                <Button variant="outline" className="w-full bg-transparent">
                  Configuración
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
