"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  Grid3X3,
  List,
  MapPin,
  Star,
  Heart,
  Share2,
  Home,
  MessageCircle,
  User,
  Camera,
  SlidersHorizontal,
  X,
  Verified,
  Clock,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

// Mock data for search results
const searchResults = [
  {
    id: 1,
    title: "Vestido Elegante de Noche Zara",
    price: 2500,
    originalPrice: 4200,
    brand: "Zara",
    size: "M",
    condition: "Nuevo",
    location: "Santo Domingo",
    distance: "2.3 km",
    image: "/placeholder.svg?height=300&width=300&text=Vestido",
    seller: {
      name: "María González",
      rating: 4.8,
      verified: true,
      responseTime: "1 hora",
      badges: ["Fast Responder", "Quality Seller"],
    },
    isNew: true,
    shippingOptions: ["pickup", "nationwide"],
    paymentMethods: ["cash", "bank", "mobile", "paypal"],
    favorites: 23,
    views: 156,
    postedDate: "2024-01-15",
  },
  {
    id: 2,
    title: "Bolso de Cuero Genuino Coach",
    price: 1800,
    originalPrice: 3500,
    brand: "Coach",
    size: "Único",
    condition: "Muy Bueno",
    location: "Santiago",
    distance: "45 km",
    image: "/placeholder.svg?height=300&width=300&text=Bolso",
    seller: {
      name: "Ana Rodríguez",
      rating: 4.9,
      verified: true,
      responseTime: "30 min",
      badges: ["Top Seller", "Eco Warrior"],
    },
    isNew: false,
    shippingOptions: ["pickup", "nationwide", "free"],
    paymentMethods: ["cash", "bank", "mobile"],
    favorites: 18,
    views: 89,
    postedDate: "2024-01-10",
  },
  {
    id: 3,
    title: "Zapatos de Tacón Steve Madden",
    price: 2200,
    originalPrice: 4800,
    brand: "Steve Madden",
    size: "38",
    condition: "Nuevo",
    location: "La Romana",
    distance: "120 km",
    image: "/placeholder.svg?height=300&width=300&text=Zapatos",
    seller: {
      name: "Carmen López",
      rating: 4.7,
      verified: false,
      responseTime: "2 horas",
      badges: ["Quality Seller"],
    },
    isNew: true,
    shippingOptions: ["pickup"],
    paymentMethods: ["cash", "bank"],
    favorites: 12,
    views: 67,
    postedDate: "2024-01-12",
  },
  {
    id: 4,
    title: "Uniforme Escolar Completo",
    price: 1200,
    originalPrice: 2400,
    brand: "Escolar",
    size: "12 años",
    condition: "Bueno",
    location: "Santo Domingo",
    distance: "5.1 km",
    image: "/placeholder.svg?height=300&width=300&text=Uniforme",
    seller: {
      name: "Rosa Martínez",
      rating: 4.6,
      verified: true,
      responseTime: "4 horas",
      badges: ["Reliable Seller"],
    },
    isNew: false,
    shippingOptions: ["pickup", "nationwide"],
    paymentMethods: ["cash", "mobile"],
    favorites: 8,
    views: 34,
    postedDate: "2024-01-08",
  },
  {
    id: 5,
    title: "Traje de Baño Bikini Victoria's Secret",
    price: 800,
    originalPrice: 1600,
    brand: "Victoria's Secret",
    size: "S",
    condition: "Muy Bueno",
    location: "Punta Cana",
    distance: "180 km",
    image: "/placeholder.svg?height=300&width=300&text=Bikini",
    seller: {
      name: "Isabella Pérez",
      rating: 4.9,
      verified: true,
      responseTime: "1 hora",
      badges: ["Fast Responder", "Beach Specialist"],
    },
    isNew: false,
    shippingOptions: ["pickup", "nationwide", "fast"],
    paymentMethods: ["cash", "bank", "mobile", "paypal"],
    favorites: 15,
    views: 78,
    postedDate: "2024-01-14",
  },
  {
    id: 6,
    title: "Blazer Profesional Calvin Klein Talla Grande",
    price: 3200,
    originalPrice: 6800,
    brand: "Calvin Klein",
    size: "XL",
    condition: "Nuevo",
    location: "Santo Domingo",
    distance: "1.8 km",
    image: "/placeholder.svg?height=300&width=300&text=Blazer",
    seller: {
      name: "Patricia Jiménez",
      rating: 4.8,
      verified: true,
      responseTime: "2 horas",
      badges: ["Professional Wear", "Plus Size Expert"],
    },
    isNew: true,
    shippingOptions: ["pickup", "nationwide"],
    paymentMethods: ["cash", "bank", "mobile", "paypal", "credit"],
    favorites: 19,
    views: 92,
    postedDate: "2024-01-16",
  },
]

const quickFilters = [
  { id: "new-today", label: "Nuevo Hoy", icon: "🆕", active: false },
  { id: "under-1000", label: "Menos de RD$1,000", icon: "💰", active: false },
  { id: "designer", label: "Marcas Diseñador", icon: "✨", active: false },
  { id: "plus-size", label: "Talla Grande", icon: "👗", active: false },
  { id: "professional", label: "Ropa Profesional", icon: "💼", active: false },
  { id: "beach", label: "Ropa de Playa", icon: "🏖️", active: false },
  { id: "school", label: "Uniformes Escolares", icon: "🎒", active: false },
  { id: "verified", label: "Vendedores Verificados", icon: "✅", active: false },
]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("relevance")

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [distanceFilter, setDistanceFilter] = useState("all")
  const [sellerRating, setSellerRating] = useState("all")
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [responseTime, setResponseTime] = useState("all")
  const [shippingOptions, setShippingOptions] = useState<string[]>([])
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])

  const [filteredResults, setFilteredResults] = useState(searchResults)

  const categories = ["Mujer", "Hombre", "Niños", "Belleza", "Electrónica", "Hogar"]
  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44"]
  const conditions = ["Nuevo", "Muy Bueno", "Bueno", "Aceptable"]
  const brands = ["Zara", "H&M", "Nike", "Adidas", "Coach", "Calvin Klein", "Victoria's Secret"]

  const toggleQuickFilter = (filterId: string) => {
    setActiveQuickFilters((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId],
    )
  }

  const clearAllFilters = () => {
    setActiveQuickFilters([])
    setPriceRange([0, 10000])
    setSelectedCategories([])
    setSelectedSizes([])
    setSelectedConditions([])
    setSelectedBrands([])
    setDistanceFilter("all")
    setSellerRating("all")
    setVerifiedOnly(false)
    setResponseTime("all")
    setShippingOptions([])
    setPaymentMethods([])
  }

  // Filter logic
  useEffect(() => {
    let filtered = searchResults

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.brand.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply quick filters
    if (activeQuickFilters.includes("new-today")) {
      const today = new Date().toISOString().split("T")[0]
      filtered = filtered.filter((item) => item.postedDate === today || item.isNew)
    }

    if (activeQuickFilters.includes("under-1000")) {
      filtered = filtered.filter((item) => item.price < 1000)
    }

    if (activeQuickFilters.includes("designer")) {
      const designerBrands = ["Coach", "Calvin Klein", "Victoria's Secret", "Steve Madden"]
      filtered = filtered.filter((item) => designerBrands.includes(item.brand))
    }

    if (activeQuickFilters.includes("plus-size")) {
      filtered = filtered.filter(
        (item) =>
          ["XL", "XXL", "44", "46"].some((size) => item.size.includes(size)) ||
          item.title.toLowerCase().includes("talla grande"),
      )
    }

    if (activeQuickFilters.includes("professional")) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes("blazer") ||
          item.title.toLowerCase().includes("profesional") ||
          item.title.toLowerCase().includes("oficina"),
      )
    }

    if (activeQuickFilters.includes("beach")) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes("bikini") ||
          item.title.toLowerCase().includes("baño") ||
          item.title.toLowerCase().includes("playa"),
      )
    }

    if (activeQuickFilters.includes("school")) {
      filtered = filtered.filter(
        (item) => item.title.toLowerCase().includes("uniforme") || item.title.toLowerCase().includes("escolar"),
      )
    }

    if (activeQuickFilters.includes("verified")) {
      filtered = filtered.filter((item) => item.seller.verified)
    }

    // Apply price range
    filtered = filtered.filter((item) => item.price >= priceRange[0] && item.price <= priceRange[1])

    // Apply other filters
    if (selectedCategories.length > 0) {
      // This would need proper category mapping in real implementation
    }

    if (verifiedOnly) {
      filtered = filtered.filter((item) => item.seller.verified)
    }

    if (sellerRating !== "all") {
      const minRating = Number.parseFloat(sellerRating)
      filtered = filtered.filter((item) => item.seller.rating >= minRating)
    }

    if (distanceFilter !== "all") {
      const maxDistance = Number.parseInt(distanceFilter)
      filtered = filtered.filter((item) => {
        const distance = Number.parseFloat(item.distance)
        return distance <= maxDistance
      })
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "newest":
        filtered.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
        break
      case "distance":
        filtered.sort((a, b) => Number.parseFloat(a.distance) - Number.parseFloat(b.distance))
        break
      case "rating":
        filtered.sort((a, b) => b.seller.rating - a.seller.rating)
        break
      default:
        // Keep original order for relevance
        break
    }

    setFilteredResults(filtered)
  }, [
    searchQuery,
    activeQuickFilters,
    priceRange,
    selectedCategories,
    verifiedOnly,
    sellerRating,
    distanceFilter,
    sortBy,
  ])

  const shareToWhatsApp = (item: any) => {
    const message = `¡Mira este ${item.title} por solo RD$${item.price.toLocaleString()}! 🛍️\n\nVendedor: ${item.seller.name} ⭐${item.seller.rating}\nUbicación: ${item.location}\n\n¡Disponible en VintedRD! 🇩🇴`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const ProductCard = ({ item, isListView = false }: { item: any; isListView?: boolean }) => (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-0">
        <Link href={`/producto/${item.id}`}>
          <div className={`${isListView ? "flex" : ""}`}>
            <div className={`relative ${isListView ? "w-24 h-24 flex-shrink-0" : "aspect-square"}`}>
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                fill
                className={`object-cover ${isListView ? "rounded-l-lg" : "rounded-t-lg"}`}
              />
              {item.isNew && <Badge className="absolute top-2 left-2 bg-emerald-500 text-white text-xs">NUEVO</Badge>}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            <div className={`${isListView ? "flex-1 p-3" : "p-3"}`}>
              <div className="flex items-start justify-between mb-1">
                <h3 className={`font-medium text-gray-900 line-clamp-2 ${isListView ? "text-sm" : "text-sm"}`}>
                  {item.title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    shareToWhatsApp(item)
                  }}
                >
                  <Share2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg font-bold text-emerald-600">RD${item.price.toLocaleString()}</p>
                {item.originalPrice && (
                  <p className="text-sm text-gray-400 line-through">RD${item.originalPrice.toLocaleString()}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1 mb-2">
                <Badge variant={item.condition === "Nuevo" ? "default" : "secondary"} className="text-xs">
                  {item.condition}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {item.size}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {item.brand}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{item.location}</span>
                  <span>({item.distance})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{item.seller.rating}</span>
                  {item.seller.verified && <Verified className="h-3 w-3 text-blue-500" />}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{item.seller.name}</span>
                <div className="flex items-center gap-2">
                  <span>{item.views} vistas</span>
                  <span>{item.favorites} ❤️</span>
                </div>
              </div>

              {/* Seller badges */}
              {item.seller.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.seller.badges.slice(0, 2).map((badge, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar ropa, zapatos, accesorios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-0 rounded-full"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {quickFilters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeQuickFilters.includes(filter.id) ? "default" : "outline"}
                size="sm"
                className={`whitespace-nowrap text-xs flex-shrink-0 ${
                  activeQuickFilters.includes(filter.id) ? "bg-emerald-500 hover:bg-emerald-600" : "bg-transparent"
                }`}
                onClick={() => toggleQuickFilter(filter.id)}
              >
                <span className="mr-1">{filter.icon}</span>
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Controls Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dialog open={showFilters} onOpenChange={setShowFilters}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-transparent">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtros
                  {(activeQuickFilters.length > 0 || verifiedOnly) && (
                    <Badge className="ml-2 bg-emerald-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {activeQuickFilters.length + (verifiedOnly ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Filtros de Búsqueda</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="seller">Vendedor</TabsTrigger>
                    <TabsTrigger value="delivery">Entrega</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    {/* Price Range */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Rango de Precio: RD${priceRange[0].toLocaleString()} - RD${priceRange[1].toLocaleString()}
                      </Label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={10000}
                        min={0}
                        step={100}
                        className="w-full"
                      />
                    </div>

                    <Separator />

                    {/* Categories */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Categorías</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={category}
                              checked={selectedCategories.includes(category)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCategories([...selectedCategories, category])
                                } else {
                                  setSelectedCategories(selectedCategories.filter((c) => c !== category))
                                }
                              }}
                            />
                            <Label htmlFor={category} className="text-sm">
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Condition */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Estado</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {conditions.map((condition) => (
                          <div key={condition} className="flex items-center space-x-2">
                            <Checkbox
                              id={condition}
                              checked={selectedConditions.includes(condition)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedConditions([...selectedConditions, condition])
                                } else {
                                  setSelectedConditions(selectedConditions.filter((c) => c !== condition))
                                }
                              }}
                            />
                            <Label htmlFor={condition} className="text-sm">
                              {condition}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Distance */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Distancia</Label>
                      <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Cualquier distancia</SelectItem>
                          <SelectItem value="5">Dentro de 5 km</SelectItem>
                          <SelectItem value="10">Dentro de 10 km</SelectItem>
                          <SelectItem value="25">Dentro de 25 km</SelectItem>
                          <SelectItem value="city">Misma ciudad</SelectItem>
                          <SelectItem value="province">Misma provincia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="seller" className="space-y-4">
                    {/* Seller Rating */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Calificación del Vendedor</Label>
                      <Select value={sellerRating} onValueChange={setSellerRating}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Cualquier calificación</SelectItem>
                          <SelectItem value="5">5 estrellas únicamente</SelectItem>
                          <SelectItem value="4">4+ estrellas</SelectItem>
                          <SelectItem value="3">3+ estrellas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Verified Sellers */}
                    <div className="flex items-center space-x-2">
                      <Checkbox id="verified" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                      <Label htmlFor="verified" className="text-sm">
                        Solo vendedores verificados
                      </Label>
                    </div>

                    <Separator />

                    {/* Response Time */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tiempo de Respuesta</Label>
                      <Select value={responseTime} onValueChange={setResponseTime}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Cualquier tiempo</SelectItem>
                          <SelectItem value="1">Responde en 1 hora</SelectItem>
                          <SelectItem value="24">Responde el mismo día</SelectItem>
                          <SelectItem value="48">Responde en 24 horas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="delivery" className="space-y-4">
                    {/* Shipping Options */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Opciones de Entrega</Label>
                      <div className="space-y-2">
                        {[
                          { id: "pickup", label: "Solo recogida", icon: <MapPin className="h-4 w-4" /> },
                          { id: "nationwide", label: "Envío nacional", icon: <Truck className="h-4 w-4" /> },
                          { id: "free", label: "Envío gratis", icon: <Truck className="h-4 w-4" /> },
                          { id: "fast", label: "Entrega rápida", icon: <Clock className="h-4 w-4" /> },
                        ].map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={option.id}
                              checked={shippingOptions.includes(option.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setShippingOptions([...shippingOptions, option.id])
                                } else {
                                  setShippingOptions(shippingOptions.filter((o) => o !== option.id))
                                }
                              }}
                            />
                            <Label htmlFor={option.id} className="text-sm flex items-center gap-2">
                              {option.icon}
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Methods */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Métodos de Pago</Label>
                      <div className="space-y-2">
                        {[
                          { id: "cash", label: "Efectivo", icon: "💵" },
                          { id: "bank", label: "Transferencia bancaria", icon: "🏦" },
                          { id: "mobile", label: "Pago móvil", icon: "📱" },
                          { id: "paypal", label: "PayPal", icon: "💳" },
                          { id: "credit", label: "Tarjeta de crédito", icon: "💳" },
                        ].map((method) => (
                          <div key={method.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={method.id}
                              checked={paymentMethods.includes(method.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setPaymentMethods([...paymentMethods, method.id])
                                } else {
                                  setPaymentMethods(paymentMethods.filter((m) => m !== method.id))
                                }
                              }}
                            />
                            <Label htmlFor={method.id} className="text-sm flex items-center gap-2">
                              <span>{method.icon}</span>
                              {method.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={clearAllFilters} className="flex-1 bg-transparent">
                    Limpiar Todo
                  </Button>
                  <Button onClick={() => setShowFilters(false)} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                    Aplicar Filtros
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevancia</SelectItem>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                <SelectItem value="distance">Distancia</SelectItem>
                <SelectItem value="rating">Mejor calificados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              className={`h-8 w-8 ${viewMode === "grid" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-transparent"}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              className={`h-8 w-8 ${viewMode === "list" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-transparent"}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">{filteredResults.length} resultados encontrados</p>
          {(activeQuickFilters.length > 0 || verifiedOnly) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-emerald-600 hover:text-emerald-700"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {activeQuickFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeQuickFilters.map((filterId) => {
              const filter = quickFilters.find((f) => f.id === filterId)
              return filter ? (
                <Badge
                  key={filterId}
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 border-emerald-200"
                >
                  {filter.icon} {filter.label}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-emerald-200"
                    onClick={() => toggleQuickFilter(filterId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ) : null
            })}
          </div>
        )}

        {/* Products Grid/List */}
        <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
          {filteredResults.map((item) => (
            <ProductCard key={item.id} item={item} isListView={viewMode === "list"} />
          ))}
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No se encontraron resultados</p>
            <p className="text-sm mb-4">Intenta ajustar tus filtros o buscar algo diferente</p>
            <Button variant="outline" onClick={clearAllFilters} className="bg-transparent">
              Limpiar todos los filtros
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex">
          <Link
            href="/"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Inicio</span>
          </Link>
          <Link href="/buscar" className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-emerald-500">
            <Search className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Buscar</span>
          </Link>
          <Link
            href="/vender"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Vender</span>
          </Link>
          <Link
            href="/mensajes"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <MessageCircle className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Mensajes</span>
          </Link>
          <Link
            href="/perfil"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Perfil</span>
          </Link>
        </div>
      </nav>

      {/* Bottom spacing for fixed navigation */}
      <div className="h-16"></div>
    </div>
  )
}
