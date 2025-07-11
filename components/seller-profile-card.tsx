"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Star,
  Shield,
  MessageCircle,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  Zap,
  CheckCircle,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SellerProfileCardProps {
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
}

export function SellerProfileCard({ seller }: SellerProfileCardProps) {
  const [showFullProfile, setShowFullProfile] = useState(false)

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case "verified":
        return <Shield className="h-3 w-3" />
      case "fast_response":
        return <Zap className="h-3 w-3" />
      case "top_seller":
        return <Award className="h-3 w-3" />
      default:
        return <CheckCircle className="h-3 w-3" />
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "verified":
        return "bg-emerald-50 text-emerald-600 border-emerald-200"
      case "fast_response":
        return "bg-blue-50 text-blue-600 border-blue-200"
      case "top_seller":
        return "bg-purple-50 text-purple-600 border-purple-200"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
      ))}
    </div>
  )

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-500" />
          Vendedor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Seller Info */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={seller.avatar || "/placeholder.svg"} alt={seller.name} />
              <AvatarFallback className="text-lg">
                {seller.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {seller.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <Shield className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{seller.name}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">{seller.username}</p>

            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={Math.round(seller.rating)} />
              <span className="text-sm font-medium">{seller.rating}</span>
              <span className="text-sm text-gray-500">({seller.reviewCount} reseñas)</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{seller.totalSales} ventas</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{seller.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {seller.badges.map((badge, index) => (
            <Badge key={index} variant="outline" className={`text-xs ${getBadgeColor(badge.type)}`}>
              {getBadgeIcon(badge.type)}
              <span className="ml-1">{badge.name}</span>
            </Badge>
          ))}
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-900">{seller.responseRate}%</span>
            </div>
            <p className="text-xs text-gray-600">Tasa de respuesta</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">{seller.averageResponseTime}</span>
            </div>
            <p className="text-xs text-gray-600">Tiempo de respuesta</p>
          </div>
        </div>

        {/* Bio */}
        {seller.bio && (
          <div>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{seller.bio}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar Mensaje
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="bg-transparent">
              <Phone className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>

            <Dialog open={showFullProfile} onOpenChange={setShowFullProfile}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-transparent">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Perfil
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Perfil de {seller.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Full Profile Header */}
                  <div className="text-center">
                    <Avatar className="h-20 w-20 mx-auto mb-3">
                      <AvatarImage src={seller.avatar || "/placeholder.svg"} alt={seller.name} />
                      <AvatarFallback className="text-xl">
                        {seller.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg">{seller.name}</h3>
                    <p className="text-gray-600">{seller.username}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <StarRating rating={Math.round(seller.rating)} />
                      <span className="font-medium">{seller.rating}</span>
                      <span className="text-gray-500">({seller.reviewCount})</span>
                    </div>
                  </div>

                  {/* Full Bio */}
                  <div>
                    <h4 className="font-medium mb-2">Acerca de</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{seller.bio}</p>
                  </div>

                  {/* Detailed Stats */}
                  <div>
                    <h4 className="font-medium mb-3">Estadísticas</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-emerald-50 rounded-lg">
                        <p className="text-xl font-bold text-emerald-600">{seller.totalSales}</p>
                        <p className="text-xs text-gray-600">Ventas totales</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xl font-bold text-blue-600">{seller.stats.thisMonth.sales}</p>
                        <p className="text-xs text-gray-600">Este mes</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-xl font-bold text-purple-600">{seller.responseRate}%</p>
                        <p className="text-xs text-gray-600">Respuesta</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-xl font-bold text-orange-600">{seller.stats.thisMonth.responseTime}</p>
                        <p className="text-xs text-gray-600">Tiempo promedio</p>
                      </div>
                    </div>
                  </div>

                  {/* Member Info */}
                  <div>
                    <h4 className="font-medium mb-3">Información</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Miembro desde {seller.memberSince}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{seller.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Link href={`/vendedor/${seller.id}/reseñas`}>
                      <Button variant="outline" className="w-full bg-transparent">
                        Ver todas las reseñas ({seller.reviewCount})
                      </Button>
                    </Link>
                    <Link href={`/vendedor/${seller.id}/productos`}>
                      <Button variant="outline" className="w-full bg-transparent">
                        Ver otros productos
                      </Button>
                    </Link>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
