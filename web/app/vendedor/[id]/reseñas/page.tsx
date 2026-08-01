"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Star, Shield, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewCard } from "@/components/review-card"

// Mock seller data
const sellerData = {
  id: "seller1",
  name: "María González",
  avatar: "/placeholder.svg?height=80&width=80&text=MG",
  rating: 4.8,
  reviewCount: 127,
  verifiedSeller: true,
  memberSince: "Miembro desde 2022",
  totalSales: 89,
  ratingBreakdown: {
    5: 89,
    4: 25,
    3: 8,
    2: 3,
    1: 2,
  },
  categoryAverages: {
    comunicacion: 4.9,
    descripcion: 4.7,
    envio: 4.6,
    calidad: 4.8,
  },
  responseRate: 92, // Percentage of reviews responded to
  averageResponseTime: "2 días", // Average time to respond to reviews
}

// Extended mock reviews data with seller responses
const allReviews = [
  {
    id: 1,
    buyerName: "Ana Rodríguez",
    buyerAvatar: "/placeholder.svg?height=40&width=40&text=AR",
    rating: 5,
    date: "Hace 1 semana",
    verified: true,
    productTitle: "Vestido Elegante de Noche Zara",
    comment:
      "Excelente vendedora! El vestido llegó exactamente como se describía. Muy buena comunicación y envío rápido. Definitivamente compraría de nuevo.",
    photos: [
      "/placeholder.svg?height=100&width=100&text=Review+Photo+1",
      "/placeholder.svg?height=100&width=100&text=Review+Photo+2",
    ],
    helpful: 12,
    categories: {
      comunicacion: 5,
      descripcion: 5,
      envio: 5,
      calidad: 5,
    },
    sellerResponse:
      "¡Muchas gracias por tu compra, Ana! Ha sido un placer atenderte y me alegra que estés contenta con el vestido. Espero verte de nuevo pronto.",
    sellerResponseDate: "Hace 6 días",
    sellerAvatar: "/placeholder.svg?height=40&width=40&text=MG",
  },
  {
    id: 2,
    buyerName: "Carmen López",
    buyerAvatar: "/placeholder.svg?height=40&width=40&text=CL",
    rating: 4,
    date: "Hace 2 semanas",
    verified: true,
    productTitle: "Bolso de Cuero Genuino Coach",
    comment:
      "Muy buena experiencia. El artículo estaba en perfectas condiciones. Solo tardó un poco más de lo esperado en llegar, pero la vendedora se mantuvo en comunicación.",
    photos: [],
    helpful: 8,
    categories: {
      comunicacion: 5,
      descripcion: 4,
      envio: 3,
      calidad: 4,
    },
    sellerResponse:
      "Gracias por tu compra, Carmen. Lamento la demora en el envío, tuvimos algunos problemas con el servicio de mensajería. Me alegra que al final todo haya salido bien y que estés satisfecha con el producto.",
    sellerResponseDate: "Hace 13 días",
    sellerAvatar: "/placeholder.svg?height=40&width=40&text=MG",
  },
  {
    id: 3,
    buyerName: "Isabella Martínez",
    buyerAvatar: "/placeholder.svg?height=40&width=40&text=IM",
    rating: 5,
    date: "Hace 3 semanas",
    verified: true,
    productTitle: "Zapatos de Tacón Steve Madden",
    comment:
      "¡Increíble! Mejor de lo que esperaba. María es súper profesional y los zapatos son hermosos. Llegaron súper bien empacados y rápido.",
    photos: ["/placeholder.svg?height=100&width=100&text=Review+Photo+3"],
    helpful: 15,
    categories: {
      comunicacion: 5,
      descripcion: 5,
      envio: 5,
      calidad: 5,
    },
  },
  {
    id: 4,
    buyerName: "Sofía Pérez",
    buyerAvatar: "/placeholder.svg?height=40&width=40&text=SP",
    rating: 3,
    date: "Hace 1 mes",
    verified: true,
    productTitle: "Jeans Skinny Levi's",
    comment:
      "El producto estaba bien, pero no exactamente como esperaba. La comunicación fue buena pero el envío tardó más de lo prometido.",
    photos: [],
    helpful: 3,
    categories: {
      comunicacion: 4,
      descripcion: 3,
      envio: 2,
      calidad: 3,
    },
    sellerResponse:
      "Hola Sofía, gracias por tu reseña honesta. Lamento que el producto no cumpliera completamente con tus expectativas. Respecto al envío, tuvimos un retraso con el servicio de mensajería que estaba fuera de nuestro control. Valoramos tu feedback y trabajaremos para mejorar la descripción de nuestros productos y el servicio de envío.",
    sellerResponseDate: "Hace 28 días",
    sellerAvatar: "/placeholder.svg?height=40&width=40&text=MG",
  },
  {
    id: 5,
    buyerName: "Valentina Castro",
    buyerAvatar: "/placeholder.svg?height=40&width=40&text=VC",
    rating: 5,
    date: "Hace 1 mes",
    verified: true,
    productTitle: "Chaqueta de Cuero Zara",
    comment:
      "Perfecta transacción. La chaqueta es exactamente como se veía en las fotos. María es muy confiable y profesional. Recomiendo 100%.",
    photos: [
      "/placeholder.svg?height=100&width=100&text=Review+Photo+4",
      "/placeholder.svg?height=100&width=100&text=Review+Photo+5",
    ],
    helpful: 9,
    categories: {
      comunicacion: 5,
      descripcion: 5,
      envio: 4,
      calidad: 5,
    },
    sellerResponse:
      "¡Gracias Valentina! Me alegra mucho que estés contenta con tu chaqueta. Ha sido un placer hacer negocios contigo.",
    sellerResponseDate: "Hace 29 días",
    sellerAvatar: "/placeholder.svg?height=40&width=40&text=MG",
  },
  {
    id: 6,
    buyerName: "Lucía Herrera",
    buyerAvatar: "/placeholder.svg?height=40&width=40&text=LH",
    rating: 4,
    date: "Hace 2 meses",
    verified: true,
    productTitle: "Vestido Floral Forever 21",
    comment:
      "Muy contenta con la compra. El vestido está en excelente estado y la atención fue muy buena. Solo el envío tardó un poco más de lo esperado.",
    photos: [],
    helpful: 6,
    categories: {
      comunicacion: 4,
      descripcion: 4,
      envio: 3,
      calidad: 4,
    },
  },
]

export default function SellerReviewsPage() {
  const [reviewFilter, setReviewFilter] = useState("todos")
  const [activeTab, setActiveTab] = useState("todas")
  const [reviews, setReviews] = useState(allReviews)

  const handleSellerResponse = (reviewId: number, responseText: string) => {
    setReviews(
      reviews.map((review) => {
        if (review.id === reviewId) {
          return {
            ...review,
            sellerResponse: responseText,
            sellerResponseDate: "Justo ahora",
            sellerAvatar: sellerData.avatar,
          }
        }
        return review
      }),
    )
  }

  const filteredReviews = reviews.filter((review) => {
    // First filter by tab
    if (activeTab === "respondidas" && !review.sellerResponse) return false
    if (activeTab === "sin_responder" && review.sellerResponse) return false

    // Then filter by rating/other filters
    if (reviewFilter === "todos") return true
    if (reviewFilter === "5") return review.rating === 5
    if (reviewFilter === "4") return review.rating === 4
    if (reviewFilter === "3") return review.rating === 3
    if (reviewFilter === "2") return review.rating === 2
    if (reviewFilter === "1") return review.rating === 1
    if (reviewFilter === "fotos") return review.photos && review.photos.length > 0
    return true
  })

  const respondedCount = reviews.filter((review) => review.sellerResponse).length
  const pendingCount = reviews.filter((review) => !review.sellerResponse).length

  const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    }

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/producto/1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <span className="font-medium text-gray-900">Reseñas del Vendedor</span>
          </div>
        </div>
      </header>

      {/* Seller Summary */}
      <section className="bg-white">
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={sellerData.avatar || "/placeholder.svg"} alt={sellerData.name} />
              <AvatarFallback>
                {sellerData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-gray-900">{sellerData.name}</h1>
                {sellerData.verifiedSeller && <Shield className="h-4 w-4 text-emerald-500" />}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={sellerData.rating} size="md" />
                <span className="text-lg font-semibold">{sellerData.rating}</span>
                <span className="text-gray-500">({sellerData.reviewCount} reseñas)</span>
              </div>
              <p className="text-sm text-gray-600">{sellerData.totalSales} ventas completadas</p>
            </div>
          </div>

          {/* Response Stats */}
          <div className="mb-6 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <h3 className="font-semibold text-gray-900 mb-2">Estadísticas de Respuesta</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tasa de Respuesta</p>
                <p className="text-lg font-semibold text-emerald-600">{sellerData.responseRate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tiempo Promedio</p>
                <p className="text-lg font-semibold text-emerald-600">{sellerData.averageResponseTime}</p>
              </div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Distribución de Calificaciones</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = sellerData.ratingBreakdown[rating as keyof typeof sellerData.ratingBreakdown]
                const percentage = (count / sellerData.reviewCount) * 100
                return (
                  <div key={rating} className="flex items-center gap-3 text-sm">
                    <span className="w-3">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="w-8 text-gray-500">{count}</span>
                    <span className="w-12 text-gray-500">{percentage.toFixed(0)}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category Averages */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Promedios por Categoría</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(sellerData.categoryAverages).map(([category, average]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{category}</span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(average)} size="sm" />
                    <span className="text-sm font-medium">{average}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Tabs and Filter */}
      <section className="bg-white mt-2">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Todas las Reseñas ({reviews.length})</h2>
            <Select value={reviewFilter} onValueChange={setReviewFilter}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="5">5 estrellas</SelectItem>
                <SelectItem value="4">4 estrellas</SelectItem>
                <SelectItem value="3">3 estrellas</SelectItem>
                <SelectItem value="2">2 estrellas</SelectItem>
                <SelectItem value="1">1 estrella</SelectItem>
                <SelectItem value="fotos">Con fotos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="todas">Todas ({reviews.length})</TabsTrigger>
              <TabsTrigger value="respondidas">Respondidas ({respondedCount})</TabsTrigger>
              <TabsTrigger value="sin_responder">Pendientes ({pendingCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-4">
          {filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isSeller={true}
                  showProduct={true}
                  onResponseSubmit={handleSellerResponse}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No hay reseñas que coincidan con los filtros seleccionados.</p>
            </div>
          )}
        </div>
      </section>

      {/* Bottom spacing */}
      <div className="h-8"></div>
    </div>
  )
}
