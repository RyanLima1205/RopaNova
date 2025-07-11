"use client"

import { useState } from "react"
import { Search, Heart, MessageCircle, User, Plus, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

const categories = ["Todo", "Mujer", "Hombre", "Niños", "Hogar", "Electrónicos", "Deportes", "Libros"]

const featuredItems = [
  {
    id: 1,
    title: "Vestido Floral Zara",
    price: 1500,
    originalPrice: 3000,
    image: "/placeholder.svg?height=200&width=200&text=Vestido+Floral",
    condition: "Como nuevo",
    location: "Santo Domingo",
    likes: 12,
  },
  {
    id: 2,
    title: "Sneakers Nike Air Max",
    price: 2800,
    originalPrice: 4500,
    image: "/placeholder.svg?height=200&width=200&text=Nike+Sneakers",
    condition: "Muy bueno",
    location: "Santiago",
    likes: 8,
  },
  {
    id: 3,
    title: "Bolso Michael Kors",
    price: 3200,
    originalPrice: 6000,
    image: "/placeholder.svg?height=200&width=200&text=Bolso+MK",
    condition: "Bueno",
    location: "La Romana",
    likes: 15,
  },
  {
    id: 4,
    title: "Camisa Ralph Lauren",
    price: 1200,
    originalPrice: 2500,
    image: "/placeholder.svg?height=200&width=200&text=Camisa+RL",
    condition: "Como nuevo",
    location: "Puerto Plata",
    likes: 6,
  },
]

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("Todo")
  const [searchQuery, setSearchQuery] = useState("")

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-emerald-600">VintedRD</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Heart className="h-5 w-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar artículos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6">
        <h2 className="text-xl font-semibold mb-2">¡Bienvenido a VintedRD! 🇩🇴</h2>
        <p className="text-emerald-100 text-sm">Compra y vende ropa de segunda mano en República Dominicana</p>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto px-4 py-3 gap-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap ${
                selectedCategory === category ? "bg-emerald-500 hover:bg-emerald-600" : "border-gray-300"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Items */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Artículos Destacados</h3>
        <div className="grid grid-cols-2 gap-3">
          {featuredItems.map((item) => (
            <Link key={item.id} href={`/producto/${item.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-40 object-cover" />
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white">
                    <Heart className="h-4 w-4 text-gray-600" />
                  </Button>
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="text-xs bg-white/90">
                      {item.condition}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">{item.title}</h4>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-bold text-emerald-600 text-sm">{formatPrice(item.price)}</span>
                    {item.originalPrice && (
                      <span className="text-xs text-gray-500 line-through">{formatPrice(item.originalPrice)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.location}</span>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{item.likes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/vender">
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <Plus className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Vender</h4>
              <p className="text-xs text-gray-500">Publica tu artículo</p>
            </Card>
          </Link>
          <Link href="/buscar">
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <Search className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Buscar</h4>
              <p className="text-xs text-gray-500">Encuentra lo que buscas</p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2">
            <Home className="h-5 w-5 text-emerald-500" />
            <span className="text-xs text-emerald-500 mt-1">Inicio</span>
          </Link>
          <Link href="/buscar" className="flex flex-col items-center p-2">
            <Search className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Buscar</span>
          </Link>
          <Link href="/vender" className="flex flex-col items-center p-2">
            <Plus className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Vender</span>
          </Link>
          <Link href="/mensajes" className="flex flex-col items-center p-2">
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Mensajes</span>
          </Link>
          <Link href="/perfil" className="flex flex-col items-center p-2">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Perfil</span>
          </Link>
        </div>
      </div>

      {/* Bottom Padding */}
      <div className="h-16"></div>
    </div>
  )
}
