"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Search, Heart, MessageCircle, User, Plus, Home, LayoutGrid, UserRound, Baby, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { formatPrice } from "@/lib/formatters"
import { getProducts, formatProductsLoadError } from "@/lib/services/productService"
import { checkIfFavorited, addToFavorites, removeFromFavorites } from "@/lib/services/productService"
import { categories as categoriesData, getSubcategories, getCategoryName, getSubcategoryName } from "@/lib/categories"
import { useAuth } from "@/contexts/AuthContext"
import { useFavoriteProductIds } from "@/hooks/useFavoriteProductIds"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"

// Mismos íconos que mobile-app/src/data/categories.ts (Ionicons name -> lucide)
const categoryIcons: Record<string, typeof LayoutGrid> = {
  "1": LayoutGrid,
  "2": UserRound,
  "3": User,
  "4": Baby,
  "5": BookOpen,
}

// Mismos 9 filtros rápidos que mobile-app/src/screens/HomeScreen.tsx (quickFilters)
const quickFilters = [
  { id: "this-week", label: "Esta Semana", icon: "📅" },
  { id: "under-1000", label: "Menos de RD$1,000", icon: "💰" },
  { id: "designer", label: "Marcas Diseñador", icon: "✨" },
  { id: "plus-size", label: "Talla Grande", icon: "👗" },
  { id: "new", label: "Nuevo", icon: "🆕" },
  { id: "second-hand", label: "Segunda Mano", icon: "♻️" },
  { id: "professional", label: "Ropa Profesional", icon: "💼" },
  { id: "beach", label: "Ropa de Playa", icon: "🏖️" },
  { id: "verified", label: "Vendedores Verificados", icon: "✅" },
]

// Misma lista de marcas de diseñador que mobile-app/src/screens/HomeScreen.tsx.
const DESIGNER_BRANDS = ["Gucci", "Louis Vuitton", "Prada", "Chanel", "Hermès", "Zara", "H&M"]

/**
 * Igual que mobile-app getVisibleQuickFilters(): en la categoría Libro solo aplican
 * algunos filtros, y professional/beach se ocultan cuando hay subcategoría seleccionada.
 * "plus-size", "professional", "beach" y "verified" son chips decorativos sin lógica de
 * filtro asociada en mobile tampoco (no tienen case en el switch) — se portan igual.
 */
function getVisibleQuickFilters(selectedCategory: string, selectedSubcategory: string | null) {
  if (selectedCategory === "5") {
    return quickFilters.filter((f) => ["this-week", "under-1000", "new", "second-hand", "verified"].includes(f.id))
  }
  if (selectedSubcategory) {
    return quickFilters.filter((f) => f.id !== "professional" && f.id !== "beach")
  }
  return quickFilters
}

export default function HomePage() {
  const { user } = useAuth()
  const { favoriteProductIds, refreshFavoriteProductIds } = useFavoriteProductIds()
  const [selectedCategory, setSelectedCategory] = useState("1")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
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

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSelectedSubcategory(null)
  }

  const handleSubcategoryPress = (subcategoryId: string) => {
    setSelectedSubcategory((prev) => (prev === subcategoryId ? null : subcategoryId))
  }

  const toggleQuickFilter = (id: string) => {
    setActiveQuickFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  const handleToggleFavorite = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user?.id) {
      toast({ title: "Inicia sesión para agregar a favoritos" })
      return
    }
    const isFavorited = favoriteProductIds.includes(product.id)
    try {
      if (isFavorited) {
        await removeFromFavorites(product.id, user.id)
      } else {
        await addToFavorites(product.id, user.id, product)
      }
      await refreshFavoriteProductIds()
    } catch {
      toast({ title: "No se pudo actualizar tus favoritos", variant: "destructive" })
    }
  }

  const featuredItems = useMemo(() => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const categoryName = getCategoryName(selectedCategory)
    const subcategoryName = selectedSubcategory ? getSubcategoryName(selectedCategory, selectedSubcategory) : null

    return products.filter((p) => {
      const matchesCategory = selectedCategory === "1" || p.category === categoryName
      const matchesSubcategory = !subcategoryName || p.subcategory === subcategoryName
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch = !q || p.title.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q)
      const matchesUnder1000 = !activeQuickFilters.includes("under-1000") || p.price < 1000
      const matchesDesigner =
        !activeQuickFilters.includes("designer") ||
        DESIGNER_BRANDS.some((brand) => p.brand?.toLowerCase().includes(brand.toLowerCase()))
      const matchesThisWeek =
        !activeQuickFilters.includes("this-week") || (p.createdAt && new Date(p.createdAt) >= oneWeekAgo)
      const matchesNew = !activeQuickFilters.includes("new") || p.condition?.toLowerCase().includes("nuevo")
      const matchesSecondHand =
        !activeQuickFilters.includes("second-hand") || !p.condition?.toLowerCase().includes("nuevo")
      return (
        matchesCategory &&
        matchesSubcategory &&
        matchesSearch &&
        matchesUnder1000 &&
        matchesDesigner &&
        matchesThisWeek &&
        matchesNew &&
        matchesSecondHand
      )
    })
  }, [products, selectedCategory, selectedSubcategory, searchQuery, activeQuickFilters])

  const visibleSubcategories = selectedCategory !== "1" ? getSubcategories(selectedCategory) : []
  const visibleQuickFilters = getVisibleQuickFilters(selectedCategory, selectedSubcategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <img src="/ropanova-logo.svg" alt="RopaNova" className="h-9 w-auto" />
            <div className="flex items-center gap-2">
              <Link href="/favoritos">
                <Button variant="ghost" size="sm">
                  <Heart className="h-5 w-5 text-gray-600" />
                </Button>
              </Link>
              <Link href="/mensajes">
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-5 w-5 text-gray-600" />
                </Button>
              </Link>
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
          {categoriesData.map((category) => {
            const active = selectedCategory === category.id
            const Icon = categoryIcons[category.id] ?? LayoutGrid
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryPress(category.id)}
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

      {/* Subcategory Tabs — solo si hay una categoría específica seleccionada */}
      {visibleSubcategories.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex overflow-x-auto gap-2 scrollbar-hide">
            {visibleSubcategories.map((sub) => {
              const active = selectedSubcategory === sub.id
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSubcategoryPress(sub.id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs shrink-0 transition-colors ${
                    active ? "bg-brand-ui text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {sub.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex overflow-x-auto gap-2 scrollbar-hide">
          {visibleQuickFilters.map((filter) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedCategory === "1" ? "Artículos Destacados" : `${featuredItems.length} productos encontrados`}
        </h3>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white"
                      onClick={(e) => handleToggleFavorite(e, item)}
                    >
                      <Heart
                        className={`h-4 w-4 ${favoriteProductIds.includes(item.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                      />
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
