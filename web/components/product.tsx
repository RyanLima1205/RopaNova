"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Heart, Share2, Flag, Eye, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SellerProfileCard } from "./seller-profile-card"
import { ConditionDetailsCard } from "./condition-details-card"
import { SafetyFeaturesCard } from "./safety-features-card"

interface ProductProps {
  product: {
    id: number | string
    title: string
    price: number
    originalPrice?: number
    condition: string
    location: string
    brand?: string
    size?: string
    color?: string
    material?: string
    images: string[]
    description?: string
    conditionDetails: any
    seller: any
    postedDate: string
    views: number
    favorites: number
    category: string
    subcategory: string
  }
}

export function Product({ product }: ProductProps) {
  const {
    title,
    price,
    originalPrice,
    condition,
    location,
    brand,
    size,
    color,
    material,
    images = ["/placeholder.svg?height=600&width=600&text=Producto"],
    description = "Sin descripción",
    conditionDetails,
    seller,
    postedDate,
    views,
    favorites,
    category,
    subcategory,
  } = product

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-DO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDiscountPercentage = () => {
    if (!originalPrice) return null
    return Math.round((1 - price / originalPrice) * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <span className="font-medium text-gray-900 truncate">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Flag className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Image Gallery */}
      <div className="bg-white">
        <div className="relative w-full aspect-square">
          <Image src={images[0] || "/placeholder.svg"} alt={title} fill className="object-cover" />
          {images.length > 1 && (
            <div className="absolute bottom-4 right-4">
              <Badge variant="secondary" className="bg-black/70 text-white border-0">
                1/{images.length}
              </Badge>
            </div>
          )}
        </div>

        {/* Image thumbnails */}
        {images.length > 1 && (
          <div className="p-4">
            <div className="flex gap-2 overflow-x-auto">
              {images.slice(1, 5).map((image, index) => (
                <div key={index} className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${title} ${index + 2}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {images.length > 5 && (
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{images.length - 5}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Product Info */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-xl font-bold text-gray-900 flex-1">{title}</h1>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <p className="text-2xl font-bold text-emerald-600">RD${price.toLocaleString("es-DO")}</p>
                {originalPrice && (
                  <>
                    <p className="text-lg text-gray-400 line-through">RD${originalPrice.toLocaleString("es-DO")}</p>
                    <Badge className="bg-red-100 text-red-700 border-red-200">-{getDiscountPercentage()}%</Badge>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant={condition === "Nuevo" ? "default" : "secondary"} className="text-xs">
                  {condition}
                </Badge>
                {size && (
                  <Badge variant="outline" className="text-xs">
                    Talla {size}
                  </Badge>
                )}
                {color && (
                  <Badge variant="outline" className="text-xs">
                    {color}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
              </div>

              {/* Product Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{views} vistas</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{favorites} favoritos</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Publicado {formatDate(postedDate)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Product Details */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Detalles del Producto</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {brand && (
                  <div>
                    <span className="text-gray-600">Marca:</span>
                    <span className="ml-2 font-medium">{brand}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Ubicación:</span>
                  <span className="ml-2 font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {location}
                  </span>
                </div>
                {material && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Material:</span>
                    <span className="ml-2 font-medium">{material}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Descripción</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Condition Details */}
        <ConditionDetailsCard conditionDetails={conditionDetails} />

        {/* Safety Features */}
        <SafetyFeaturesCard sellerLocation={location} productPrice={price} />

        {/* Seller Profile */}
        <SellerProfileCard seller={seller} />
      </div>

      {/* Bottom spacing for potential fixed elements */}
      <div className="h-20"></div>
    </div>
  )
}
