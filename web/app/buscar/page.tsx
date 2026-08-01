"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, X, SlidersHorizontal, ArrowUpDown, Check, Loader2, Home, Plus, MessageCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProducts, formatProductsLoadError } from "@/lib/services/productService"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { formatPrice } from "@/lib/formatters"
import { cleanProductImages } from "@/lib/imageUtils"
import { categories, getSubcategories } from "@/lib/categories"
import {
  intelligentSearch,
  sortProducts,
  applyAdvancedFilters,
  extractFilterOptions,
  SORT_OPTIONS,
  type SortOption,
  type AdvancedFilters as AdvancedFiltersType,
} from "@/lib/searchUtils"
import { searchCacheService } from "@/lib/searchCacheService"
import { useFavoriteProductIds } from "@/hooks/useFavoriteProductIds"
import { RecentlyViewedList } from "@/components/recently-viewed-list"
import type { Product, Subcategory } from "@/lib/types"

interface SellerInfo {
  id: string
  name: string
  storeName?: string
  accountType: string
  avatar?: string
  verified?: boolean
}

interface FirestoreProduct {
  id: string
  titulo: string
  precio: string
  condicionGeneral: string
  images: string[]
  createdAt: any
  categoria: string
  subcategoria: string
  marca: string
  color: string[]
  talla: string[]
  status: string
  userId: string
  seller?: SellerInfo
}

const firestoreProductToProduct = (fp: FirestoreProduct): Product => ({
  id: fp.id,
  title: fp.titulo,
  price: parseFloat(fp.precio) || 0,
  image: fp.images[0] || "",
  location: "",
  likes: 0,
  condition: fp.condicionGeneral,
  images: fp.images,
  createdAt: fp.createdAt,
  category: fp.categoria,
  subcategory: fp.subcategoria,
  brand: fp.marca,
  color: fp.color,
  sizes: fp.talla,
})

const PAGE_SIZE = 20

const DEFAULT_ADVANCED_FILTERS: AdvancedFiltersType = {
  sizes: [],
  colors: [],
  brands: [],
  locations: [],
  priceRange: { min: 0, max: 50000 },
  conditions: [],
  mainCategory: undefined,
  subCategory: undefined,
}

export default function BuscarPage() {
  const { favoriteProductIds } = useFavoriteProductIds()

  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<FirestoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedCategory, setSelectedCategory] = useState("1")
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)

  const [selectedSortOption, setSelectedSortOption] = useState<SortOption>(SORT_OPTIONS[0])
  const [showSortSheet, setShowSortSheet] = useState(false)
  const [showFilterSheet, setShowFilterSheet] = useState(false)

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersType>(DEFAULT_ADVANCED_FILTERS)
  const [draftFilters, setDraftFilters] = useState<AdvancedFiltersType>(DEFAULT_ADVANCED_FILTERS)

  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  const availableFilterOptions = useMemo(() => {
    return extractFilterOptions(products.map(firestoreProductToProduct))
  }, [products])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProducts()

      const firestoreProducts: FirestoreProduct[] = await Promise.all(
        data.map(async (product) => {
          let sellerInfo: SellerInfo | undefined
          if (product.seller?.id) {
            try {
              const userDoc = await getDoc(doc(db, "users", product.seller.id))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                sellerInfo = {
                  id: product.seller.id,
                  name: userData.name || product.seller.name || "Vendedor",
                  storeName: userData.storeName || userData.name || product.seller.name || "Vendedor",
                  accountType: userData.accountType || product.seller.accountType || "private",
                  avatar: userData.avatar || product.seller.avatar || "",
                  verified: userData.verified || product.seller.verified || false,
                }
              }
            } catch {
              sellerInfo = {
                id: product.seller.id,
                name: product.seller.name || "Vendedor",
                storeName: product.seller.name || "Vendedor",
                accountType: product.seller.accountType || "private",
                avatar: product.seller.avatar || "",
                verified: product.seller.verified || false,
              }
            }
          }

          let extractedSizes: string[] = []
          if (product.id) {
            try {
              const productDoc = await getDoc(doc(db, "products", product.id))
              if (productDoc.exists()) {
                const productData = productDoc.data()
                if (productData.stock && Array.isArray(productData.stock)) {
                  extractedSizes = productData.stock
                    .map((item: any) => item.talla)
                    .filter((size: string) => size && size.trim() !== "")
                }
              }
            } catch {
              // sin tallas — se deja el arreglo vacío
            }
          }

          return {
            id: product.id,
            titulo: product.title,
            precio: String(product.price),
            condicionGeneral: product.condition,
            images: product.images || [],
            createdAt: product.createdAt,
            categoria: product.category || "",
            subcategoria: product.subcategory || "",
            marca: product.brand || "",
            color: product.color || [],
            talla: extractedSizes.length > 0 ? extractedSizes : product.sizes && product.sizes.length > 0 ? product.sizes : ["Única"],
            status: "active",
            userId: product.seller?.id || "",
            seller: sellerInfo,
          }
        }),
      )

      setProducts(firestoreProducts)
      setLoadError(null)
      searchCacheService.cacheFilterOptions(extractFilterOptions(firestoreProducts.map(firestoreProductToProduct)))
    } catch (error: unknown) {
      setProducts([])
      setLoadError(formatProductsLoadError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Filtrado reactivo — se recalcula en cada cambio, igual que el efecto de mobile
  // (que también dependía de searchQuery y por tanto filtraba en cada pulsación).
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    if (searchQuery.trim()) {
      const converted = filtered.map(firestoreProductToProduct)
      const intelligentFiltered = intelligentSearch(converted, searchQuery)
      const keptIds = new Set(intelligentFiltered.map((p) => p.id))
      filtered = filtered.filter((fp) => keptIds.has(fp.id))
    }

    if (selectedCategory !== "1") {
      const categoryName = categories.find((c) => c.id === selectedCategory)?.name
      if (categoryName && categoryName !== "Todo") {
        filtered = filtered.filter((product) => product.categoria === categoryName)
        if (selectedSubcategory) {
          filtered = filtered.filter((product) => product.subcategoria === selectedSubcategory.name)
        }
      }
    }

    filtered = filtered.filter((product) => {
      const price = parseFloat(product.precio.replace(/[^\d.]/g, "")) || 0
      return price >= advancedFilters.priceRange.min && price <= advancedFilters.priceRange.max
    })

    if (advancedFilters.conditions.length > 0) {
      filtered = filtered.filter((product) => advancedFilters.conditions.includes(product.condicionGeneral))
    }

    const convertedForFilters = filtered.map(firestoreProductToProduct)
    const advancedFilteredResults = applyAdvancedFilters(convertedForFilters, advancedFilters)
    const sorted = sortProducts(advancedFilteredResults, selectedSortOption)

    const sortedIds = sorted.map((p) => p.id)
    return filtered.filter((fp) => sortedIds.includes(fp.id)).sort((a, b) => sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id))
  }, [products, searchQuery, selectedCategory, selectedSubcategory, advancedFilters, selectedSortOption])

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
  }, [searchQuery, selectedCategory, selectedSubcategory, advancedFilters, selectedSortOption])

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return
    searchCacheService.addToSearchHistory(searchQuery, filteredProducts.length)
  }

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSelectedSubcategory(null)
  }

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filteredProducts.length))
  }

  const openFilterSheet = () => {
    setDraftFilters(advancedFilters)
    setShowFilterSheet(true)
  }

  const applyDraftFilters = () => {
    setAdvancedFilters(draftFilters)
    setShowFilterSheet(false)
  }

  const clearDraftFilters = () => {
    setDraftFilters(DEFAULT_ADVANCED_FILTERS)
  }

  const visibleProducts = filteredProducts.slice(0, displayCount)
  const activeFilterCount =
    (advancedFilters.conditions.length > 0 ? 1 : 0) +
    (advancedFilters.brands.length > 0 ? 1 : 0) +
    (advancedFilters.priceRange.min > 0 || advancedFilters.priceRange.max < 50000 ? 1 : 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar artículos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              className="pl-9 pr-9"
            />
            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={openFilterSheet} className="relative shrink-0 bg-transparent">
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-ui text-white text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <RecentlyViewedList />

      {/* Category chips — siempre visibles en web (a diferencia de mobile, donde este bloque
          nunca se activaba porque nada llamaba a setShowFilters(true)) */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex overflow-x-auto gap-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryPress(category.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm border shrink-0 transition-colors ${
                selectedCategory === category.id
                  ? "bg-brand-ui border-brand-ui text-white"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        {selectedCategory !== "1" && getSubcategories(selectedCategory).length > 0 && (
          <div className="flex overflow-x-auto gap-2 mt-2 scrollbar-hide">
            {getSubcategories(selectedCategory).map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(selectedSubcategory?.id === sub.id ? null : sub)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full text-xs border shrink-0 transition-colors ${
                  selectedSubcategory?.id === sub.id
                    ? "bg-brand-ui border-brand-ui text-white"
                    : "bg-white border-gray-200 text-gray-500"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm text-gray-500">{filteredProducts.length} resultados</span>
        <button onClick={() => setShowSortSheet(true)} className="flex items-center gap-1 text-sm text-gray-600">
          <ArrowUpDown className="h-3.5 w-3.5" />
          {selectedSortOption.label}
        </button>
      </div>

      {/* Results */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
            <p className="text-sm text-gray-500">Cargando productos...</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-600 mb-3">{loadError}</p>
            <Button variant="outline" onClick={() => loadProducts()}>
              Reintentar
            </Button>
          </div>
        ) : visibleProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {visibleProducts.map((item) => (
                <Link key={item.id} href={`/producto/${item.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={cleanProductImages(item)[0] || "/placeholder.svg"}
                        alt={item.titulo}
                        className="w-full h-36 object-cover"
                      />
                      {item.status === "sold" && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge className="bg-red-500 text-white">VENDIDO</Badge>
                        </div>
                      )}
                      {favoriteProductIds.includes(item.id) && (
                        <Badge variant="secondary" className="absolute top-1.5 right-1.5 text-xs bg-white/90">
                          ♥
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-2.5">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.titulo}</p>
                      <p className="text-sm font-bold text-brand-ui mb-1">{formatPrice(parseFloat(item.precio) || 0)}</p>
                      <div className="flex items-center gap-1 flex-wrap mb-1">
                        <Badge variant="outline" className="text-xs">
                          {item.condicionGeneral}
                        </Badge>
                        {item.marca && (
                          <Badge variant="outline" className="text-xs">
                            {item.marca}
                          </Badge>
                        )}
                      </div>
                      {item.seller && (
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                          {item.seller.storeName || item.seller.name}
                          {item.seller.verified && <Check className="h-3 w-3 text-brand-ui shrink-0" />}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {displayCount < filteredProducts.length ? (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={handleLoadMore}>
                  Cargar más productos
                </Button>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400 mt-6">No hay más productos</p>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">No se encontraron resultados</p>
            <p className="text-sm text-gray-500 mt-1">Intenta ajustar tus filtros o buscar algo diferente</p>
          </div>
        )}
      </div>

      {/* Sort sheet */}
      <Sheet open={showSortSheet} onOpenChange={setShowSortSheet}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Ordenar por</SheetTitle>
          </SheetHeader>
          <div className="mt-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setSelectedSortOption(option)
                  setShowSortSheet(false)
                }}
                className="w-full flex items-center justify-between py-3 border-b last:border-b-0 text-left"
              >
                <span className={selectedSortOption.id === option.id ? "text-brand-ui font-medium" : "text-gray-700"}>
                  {option.label}
                </span>
                {selectedSortOption.id === option.id && <Check className="h-4 w-4 text-brand-ui" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Simplified filter sheet — price range, condition, brand.
          TODO: full AdvancedFilters parity (size-by-subcategory, color swatches,
          "near me" distance filter) is a separate follow-up task. */}
      <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 mt-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Precio (RD$)</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Mínimo"
                  value={draftFilters.priceRange.min || ""}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, min: Number(e.target.value) || 0 },
                    }))
                  }
                />
                <span className="text-gray-400">—</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="Máximo"
                  value={draftFilters.priceRange.max === 50000 ? "" : draftFilters.priceRange.max}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, max: Number(e.target.value) || 50000 },
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Condición</p>
              <div className="flex flex-wrap gap-2">
                {availableFilterOptions.conditions.map((condition) => {
                  const active = draftFilters.conditions.includes(condition)
                  return (
                    <button
                      key={condition}
                      onClick={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          conditions: active
                            ? prev.conditions.filter((c) => c !== condition)
                            : [...prev.conditions, condition],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-sm border ${
                        active ? "bg-brand-ui border-brand-ui text-white" : "bg-white border-gray-200 text-gray-600"
                      }`}
                    >
                      {condition}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Marca</p>
              <Select
                value={draftFilters.brands[0] ?? "all"}
                onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, brands: value === "all" ? [] : [value] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las marcas</SelectItem>
                  {availableFilterOptions.brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="mt-6 flex-row gap-2">
            <Button variant="outline" onClick={clearDraftFilters} className="flex-1 bg-transparent">
              Limpiar filtros
            </Button>
            <Button onClick={applyDraftFilters} className="flex-1 bg-brand-ui hover:bg-brand-dark">
              Aplicar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2">
            <Home className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Inicio</span>
          </Link>
          <Link href="/buscar" className="flex flex-col items-center p-2">
            <Search className="h-5 w-5 text-brand-ui" />
            <span className="text-xs text-brand-ui mt-1">Buscar</span>
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
    </div>
  )
}
