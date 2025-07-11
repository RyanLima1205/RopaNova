"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Flag, MessageCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getProduct } from "@/services/productService"
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed"
import { SellerProfileCard } from "@/components/seller-profile-card"
import { ConditionDetailsCard } from "@/components/condition-details-card"
import { SafetyFeaturesCard } from "@/components/safety-features-card"
import { MobileSwipeGallery } from "@/components/mobile-swipe-gallery"

interface Product {
  id: number
  title: string
  price: number
  originalPrice?: number
  images: string[]
  condition: string
  size: string
  brand: string
  category: string
  description: string
  seller: {
    id: string
    name: string
    username: string
    avatar: string
    rating: number
    reviewCount: number
    totalSales: number
    responseRate: number
    averageResponseTime: string
    memberSince: string
    location: string
    verified: boolean
    badges: Array<{ name: string; type: string }>
    bio: string
    stats: {
      thisMonth: {
        sales: number
        newListings: number
        responseTime: string
      }
    }
  }
  location: string
  postedDate: string
  views: number
  likes: number
  isLiked: boolean
  conditionDetails: {
    overall: string
    rating: number
    details: Array<{
      aspect: string
      condition: string
      description: string
    }>
    photos: string[]
  }
}

export default function ProductPage() {
  const params = useParams()
  const productId = Number.parseInt(params.id as string)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const { addToRecentlyViewed } = useRecentlyViewed()

  useEffect(() => {
    const fetchProduct = async () => {
      const productData = await getProduct(productId)
      if (productData) {
        setProduct(productData)
        setIsLiked(productData.isLiked)
        addToRecentlyViewed(productData)
      }
    }

    fetchProduct()
  }, [productId, addToRecentlyViewed])

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    )
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Mira este ${product.title} por solo RD$${product.price.toLocaleString()}`,
        url: window.location.href,
      })
    } else {
      // Fallback to WhatsApp sharing
      const message = `¡Mira este ${product.title} por solo RD$${product.price.toLocaleString()}! 🛍️\n\nVendedor: ${product.seller.name} ⭐${product.seller.rating}\nUbicación: ${product.location}\n\n${window.location.href}\n\n¡Disponible en VintedRD! 🇩🇴`
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")
    }
  }

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
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="p-2 -ml-2">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Flag className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      <div className="pb-20">
        {/* Mobile Swipe Gallery */}
        <MobileSwipeGallery
          images={product.images}
          title={product.title}
          onShare={handleShare}
          onFavorite={handleLike}
          isFavorited={isLiked}
        />

        <div className="p-4 space-y-4">
          {/* Price and Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-lg text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{product.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{product.brand}</Badge>
              <Badge variant="outline">{product.size}</Badge>
              <Badge variant="outline">{product.condition}</Badge>
            </div>
          </div>

          {/* Description - Moved above seller section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Descripción</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
            </CardContent>
          </Card>

          {/* Seller Profile Card */}
          <SellerProfileCard seller={product.seller} />

          {/* Condition Details Card */}
          <ConditionDetailsCard conditionDetails={product.conditionDetails} />

          {/* Safety Features Card */}
          <SafetyFeaturesCard sellerLocation={product.seller.location} productPrice={product.price} />

          {/* Product Details */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Detalles del Producto</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoría:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marca:</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Talla:</span>
                  <span className="font-medium">{product.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium">{product.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ubicación:</span>
                  <span className="font-medium">{product.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Publicado:</span>
                  <span className="font-medium">{product.postedDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 px-1">
            <span>{product.views} visualizaciones</span>
            <span>{product.likes} me gusta</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 bg-transparent">
            <MessageCircle className="h-4 w-4 mr-2" />
            Mensaje
          </Button>
          <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600">Comprar Ahora</Button>
        </div>
      </div>
    </div>
  )
}
