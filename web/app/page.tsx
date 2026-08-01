"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Heart, MessageCircle, User, Plus, Home, LayoutGrid, UserRound, Baby, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { formatPrice } from "@/lib/formatters"
import { getProducts, formatProductsLoadError } from "@/lib/services/productService"
import type { Product } from "@/lib/types"

// Mismas 5 categorías que mobile-app/src/data/categories.ts
const categories = [
  { id: "Todo", name: "Todo", icon: LayoutGrid },
  { id: "Mujer", name: "Mujer", icon: UserRound },
  { id: "Hombre", name: "Hombre", icon: User },
  { id: "Niño", name: "Niño", icon: Baby },
  { id: "Libro", name: "Libro", icon: BookOpen },
]

// Mismos 4 filtros rápidos que mobile-app/src/screens/HomeScreen.tsx (quickFilters)
const quickFilters = [
  { id: "this-week", label: "Esta Semana", icon: "📅" },
  { id: "under-1000", label: "Menos de RD$1,000", icon: "💰" },
  { id: "designer", label: "Marcas Diseñador", icon: "✨" },
  { id: "plus-size", label: "Talla Grande", icon: "👗" },
]

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("Todo")
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getProducts()
      .then((data) => {
        if (!cancelled) setProducts(data)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(formatProductsLoadError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggleQuickFilter = (id: string) => {
    setActiveQuickFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  // Misma lista de marcas de diseñador que mobile-app/src/screens/HomeScreen.tsx.
  // Nota: "Talla Grande" no filtra nada todavía en mobile tampoco (sin caso en el switch) — se
  // deja como chip seleccionable sin efecto, igual que en la app.
  const DESIGNER_BRANDS = ["Gucci", "Louis Vuitton", "Prada", "Chanel", "Hermès", "Zara", "H&M"]

  const featuredItems = useMemo(() => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return products.filter((p) => {
      const matchesCategory = selectedCategory === "Todo" || p.category === selectedCategory
      const matchesSearch = !searchQuery.trim() || p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      const matchesUnder1000 = !activeQuickFilters.includes("under-1000") || p.price < 1000
      const matchesDesigner =
        !activeQuickFilters.includes("designer") ||
        DESIGNER_BRANDS.some((brand) => p.brand?.toLowerCase().includes(brand.toLowerCase()))
      const matchesThisWeek =
        !activeQuickFilters.includes("this-week") || (p.createdAt && new Date(p.createdAt) >= oneWeekAgo)
      return matchesCategory && matchesSearch && matchesUnder1000 && matchesDesigner && matchesThisWeek
    })
  }, [products, selectedCategory, searchQuery, activeQuickFilters])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <img src="/ropanova-logo.svg" alt="RopaNova" className="h-9 w-auto" />
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

      {/* Hero Section — mismo degradado que mobile (primaryUI → primaryDark → primaryDeep) */}
      <div className="bg-gradient-to-br from-brand-ui via-brand-dark to-brand-deep text-white p-6">
        <h2 className="text-xl font-semibold mb-2">¡Bienvenido a RopaNova! 🇩🇴</h2>
        <p className="text-brand-light text-sm">Compra y vende ropa de segunda mano en República Dominicana</p>
      </div>

      {/* Category Tabs — íconos circulares, igual que mobile */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex overflow-x-auto gap-1 scrollbar-hide">
          {categories.map((category) => {
            const active = selectedCategory === category.id
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="flex flex-col items-center w-[68px] shrink-0"
              >
                <div
                  className={`h-[52px] w-[52px] rounded-full flex items-center justify-center mb-1 transition-colors ${
                    active ? "bg-brand-ui" : "bg-gray-100"
                  }`}
                >
                  <Icon className={`h-[22px] w-[22px] ${active ? "text-white" : "text-gray-500"}`} />
                </div>
                <span className={`text-xs text-center ${active ? "text-brand-ui font-medium" : "text-gray-500"}`}>
                  {category.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Filters — mismos 4 chips que mobile */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex overflow-x-auto gap-2 scrollbar-hide">
          {quickFilters.map((filter) => {
            const active = activeQuickFilters.includes(filter.id)
            return (
              <button
                key={filter.id}
                onClick={() => toggleQuickFilter(filter.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs shrink-0 transition-colors ${
                  active ? "bg-brand-extraLight border-brand-ui text-brand-ui" : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Featured Items */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Artículos Destacados</h3>
        {loading && <p className="text-sm text-gray-500 text-center py-8">Cargando productos…</p>}
        {!loading && loadError && <p className="text-sm text-red-600 text-center py-8">{loadError}</p>}
        {!loading && !loadError && featuredItems.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">Todavía no hay productos publicados.</p>
        )}
        {!loading && !loadError && featuredItems.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {featuredItems.map((item) => (
              <Link key={item.id} href={`/producto/${item.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-40 object-cover"
                    />
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
                      <span className="font-bold text-brand-ui text-sm">{formatPrice(item.price)}</span>
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
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/vender">
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <Plus className="h-8 w-8 text-brand-ui mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Vender</h4>
              <p className="text-xs text-gray-500">Publica tu artículo</p>
            </Card>
          </Link>
          <Link href="/buscar">
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <Search className="h-8 w-8 text-brand-ui mx-auto mb-2" />
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
            <Home className="h-5 w-5 text-brand-ui" />
            <span className="text-xs text-brand-ui mt-1">Inicio</span>
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
