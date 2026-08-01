"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  Settings,
  BarChart3,
  Star,
  Shield,
  MapPin,
  Calendar,
  Heart,
  ShoppingBag,
  MessageCircle,
  Edit,
  Camera,
  Home,
  Search,
  User,
  Eye,
  TrendingUp,
  Award,
  Target,
  DollarSign,
  Trophy,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BadgesShowcase } from "@/components/badges-showcase"

// Mock user data with enhanced features
const userData = {
  id: "user1",
  name: "María González",
  username: "@maria_vintage",
  avatar: "/placeholder.svg?height=100&width=100&text=MG",
  coverImage: "/placeholder.svg?height=200&width=400&text=Cover",
  bio: "Amante de la moda vintage y sostenible. Vendiendo piezas únicas desde 2022. ✨",
  location: "Santo Domingo, República Dominicana",
  memberSince: "Marzo 2022",
  verified: true,
  stats: {
    totalSales: 89,
    rating: 4.8,
    reviewCount: 127,
    followers: 234,
    following: 156,
    totalViews: 12450,
    totalEarnings: 45600,
    avgResponseTime: "2.3 horas",
    repeatCustomers: 23,
    sustainabilityScore: 85,
  },
  badges: [
    { name: "Vendedor Verificado", icon: Shield, color: "emerald", level: "verified" },
    { name: "Top Seller", icon: TrendingUp, color: "blue", level: "gold" },
    { name: "Respuesta Rápida", icon: MessageCircle, color: "purple", level: "silver" },
    { name: "Eco Warrior", icon: Target, color: "green", level: "bronze" },
    { name: "Quality Expert", icon: Award, color: "yellow", level: "gold" },
    { name: "Customer Favorite", icon: Heart, color: "red", level: "silver" },
  ],
  rewards: {
    points: 2450,
    level: "Gold Seller",
    nextLevel: "Platinum Seller",
    pointsToNext: 550,
    achievements: [
      { name: "Primera Venta", icon: "🎉", unlocked: true },
      { name: "10 Ventas", icon: "🔟", unlocked: true },
      { name: "50 Ventas", icon: "🏆", unlocked: true },
      { name: "100 Ventas", icon: "💯", unlocked: false },
      { name: "Vendedor del Mes", icon: "👑", unlocked: true },
      { name: "5 Estrellas", icon: "⭐", unlocked: true },
    ],
  },
  insights: {
    monthlySavings: 5200,
    itemsSold: 12,
    avgSalePrice: 2100,
    topCategory: "Vestidos",
    bestSellingMonth: "Diciembre",
    customerRetention: 78,
    priceAccuracy: 92,
    descriptionQuality: 88,
  },
  leaderboard: {
    cityRank: 15,
    categoryRank: 8,
    overallRank: 142,
    trending: "up",
  },
}

// Enhanced mock listings data
const myListings = [
  {
    id: 1,
    image: "/placeholder.svg?height=200&width=200",
    title: "Vestido Elegante de Noche Zara",
    price: 2500,
    condition: "Nuevo",
    status: "active",
    views: 234,
    favorites: 18,
    postedDate: "Hace 2 días",
    performance: "high",
    analytics: {
      clickRate: 8.5,
      favoriteRate: 7.7,
      inquiries: 5,
    },
  },
  {
    id: 2,
    image: "/placeholder.svg?height=200&width=200",
    title: "Bolso de Cuero Genuino Coach",
    price: 1800,
    condition: "Usado",
    status: "sold",
    views: 156,
    favorites: 12,
    postedDate: "Hace 1 semana",
    performance: "medium",
    analytics: {
      clickRate: 6.2,
      favoriteRate: 7.7,
      inquiries: 3,
      soldIn: "5 días",
    },
  },
  {
    id: 3,
    image: "/placeholder.svg?height=200&width=200",
    title: "Zapatos de Tacón Steve Madden",
    price: 2200,
    condition: "Nuevo",
    status: "active",
    views: 89,
    favorites: 7,
    postedDate: "Hace 3 días",
    performance: "low",
    analytics: {
      clickRate: 4.1,
      favoriteRate: 7.9,
      inquiries: 1,
    },
  },
]

// Mock favorites data
const myFavorites = [
  {
    id: 4,
    image: "/placeholder.svg?height=200&width=200",
    title: "Chaqueta de Cuero Vintage",
    price: 4500,
    condition: "Usado",
    seller: "Ana Rodríguez",
    location: "Santiago",
  },
  {
    id: 5,
    image: "/placeholder.svg?height=200&width=200",
    title: "Jeans Skinny Levi's 511",
    price: 1500,
    condition: "Usado",
    seller: "Carlos Martínez",
    location: "La Romana",
  },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("publicaciones")

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
      ))}
    </div>
  )

  const getBadgeIcon = (badge: any) => {
    const IconComponent = badge.icon
    return <IconComponent className="h-3 w-3 mr-1" />
  }

  const getBadgeColor = (level: string) => {
    switch (level) {
      case "gold":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "silver":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "bronze":
        return "bg-orange-100 text-orange-700 border-orange-300"
      default:
        return "bg-blue-100 text-blue-700 border-blue-300"
    }
  }

  const ListingCard = ({ item }: { item: any }) => (
    <Link href={`/producto/${item.id}`}>
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="relative">
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.title}
              width={200}
              height={200}
              className="h-48 w-full object-cover rounded-t-lg"
            />
            {item.status === "sold" && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                <Badge className="bg-red-500 text-white">VENDIDO</Badge>
              </div>
            )}
            {item.performance === "high" && (
              <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs">🔥 POPULAR</Badge>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">{item.title}</h3>
            <p className="text-lg font-bold text-emerald-600 mb-1">RD${item.price.toLocaleString()}</p>
            <Badge variant={item.condition === "Nuevo" ? "default" : "secondary"} className="text-xs mb-2">
              {item.condition}
            </Badge>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{item.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  <span>{item.favorites}</span>
                </div>
              </div>
              <span>{item.postedDate}</span>
            </div>
            {/* Performance Analytics */}
            {item.analytics && (
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Tasa de clics:</span>
                  <span className={item.analytics.clickRate > 6 ? "text-green-600" : "text-yellow-600"}>
                    {item.analytics.clickRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Consultas:</span>
                  <span>{item.analytics.inquiries}</span>
                </div>
                {item.analytics.soldIn && (
                  <div className="flex justify-between">
                    <span>Vendido en:</span>
                    <span className="text-green-600">{item.analytics.soldIn}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  const FavoriteCard = ({ item }: { item: any }) => (
    <Link href={`/producto/${item.id}`}>
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="relative">
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.title}
              width={200}
              height={200}
              className="h-48 w-full object-cover rounded-t-lg"
            />
          </div>
          <div className="p-3">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">{item.title}</h3>
            <p className="text-lg font-bold text-emerald-600 mb-1">RD${item.price.toLocaleString()}</p>
            <Badge variant={item.condition === "Nuevo" ? "default" : "secondary"} className="text-xs mb-2">
              {item.condition}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{item.location}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Por {item.seller}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )

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
            <h1 className="font-semibold text-gray-900">Mi Perfil</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                <BarChart3 className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/configuracion">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Header */}
      <div className="bg-white">
        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-r from-emerald-400 to-blue-500">
          <Image src={userData.coverImage || "/placeholder.svg"} alt="Cover" fill className="object-cover" />
          <Button variant="ghost" size="icon" className="absolute bottom-2 right-2 h-8 w-8 bg-white/80 hover:bg-white">
            <Camera className="h-4 w-4" />
          </Button>
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4">
          <div className="flex items-end gap-4 -mt-12">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white">
                <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
                <AvatarFallback className="text-2xl">
                  {userData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-0 right-0 h-6 w-6 bg-white border border-gray-200 rounded-full"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 mt-4">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{userData.name}</h2>
                {userData.verified && <Shield className="h-5 w-5 text-emerald-500" />}
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  <Crown className="h-3 w-3 mr-1" />
                  {userData.rewards.level}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm">{userData.username}</p>
            </div>
          </div>

          <p className="text-gray-700 text-sm mt-3 mb-3">{userData.bio}</p>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{userData.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Miembro desde {userData.memberSince}</span>
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{userData.stats.totalSales}</p>
              <p className="text-xs text-gray-600">Ventas</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <StarRating rating={userData.stats.rating} />
                <span className="text-sm font-medium">{userData.stats.rating}</span>
              </div>
              <p className="text-xs text-gray-600">{userData.stats.reviewCount} reseñas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{userData.stats.followers}</p>
              <p className="text-xs text-gray-600">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">RD${userData.stats.totalEarnings.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Ganado</p>
            </div>
          </div>

          {/* Rewards Progress */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">{userData.rewards.points} puntos</span>
              </div>
              <span className="text-xs text-yellow-600">
                {userData.rewards.pointsToNext} para {userData.rewards.nextLevel}
              </span>
            </div>
            <Progress
              value={(userData.rewards.points / (userData.rewards.points + userData.rewards.pointsToNext)) * 100}
              className="h-2 bg-yellow-200"
            />
          </div>

          {/* Enhanced Badges */}
          <div className="flex gap-2 flex-wrap mb-4">
            {userData.badges.slice(0, 4).map((badge, index) => (
              <Badge key={index} variant="outline" className={`text-xs ${getBadgeColor(badge.level)}`}>
                {getBadgeIcon(badge)}
                {badge.name}
              </Badge>
            ))}
            {userData.badges.length > 4 && (
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                +{userData.badges.length - 4} más
              </Badge>
            )}
          </div>

          {/* Personal Shopping Insights */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Ahorro Personal</span>
            </div>
            <p className="text-sm text-emerald-700">
              Has ahorrado RD${userData.insights.monthlySavings.toLocaleString()} este mes comprando segunda mano
            </p>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="mt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white border-b">
            <TabsList className="grid grid-cols-4 w-full h-12 bg-transparent">
              <TabsTrigger
                value="publicaciones"
                className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600"
              >
                Publicaciones ({myListings.length})
              </TabsTrigger>
              <TabsTrigger
                value="favoritos"
                className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600"
              >
                Favoritos ({myFavorites.length})
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600"
              >
                Insights
              </TabsTrigger>
              <TabsTrigger
                value="rewards"
                className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600"
              >
                Recompensas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="publicaciones" className="mt-0">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {myListings.map((item) => (
                  <ListingCard key={item.id} item={item} />
                ))}
              </div>
              {myListings.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No tienes publicaciones</p>
                  <p className="text-sm mb-4">Comienza a vender tus artículos</p>
                  <Link href="/vender">
                    <Button className="bg-emerald-500 hover:bg-emerald-600">Publicar Artículo</Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favoritos" className="mt-0">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {myFavorites.map((item) => (
                  <FavoriteCard key={item.id} item={item} />
                ))}
              </div>
              {myFavorites.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No tienes favoritos</p>
                  <p className="text-sm mb-4">Guarda los artículos que te gusten</p>
                  <Link href="/buscar">
                    <Button variant="outline" className="bg-transparent">
                      Explorar Productos
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            <div className="p-4 space-y-4">
              {/* Personal Shopping Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Insights Personales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-600">
                        RD${userData.insights.monthlySavings.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Ahorrado este mes</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{userData.insights.itemsSold}</p>
                      <p className="text-sm text-gray-600">Artículos vendidos</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Precio promedio de venta:</span>
                      <span className="font-medium">RD${userData.insights.avgSalePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Categoría más vendida:</span>
                      <span className="font-medium">{userData.insights.topCategory}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Mejor mes de ventas:</span>
                      <span className="font-medium">{userData.insights.bestSellingMonth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seller Performance Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Rendimiento como Vendedor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Retención de clientes</span>
                      <span className="text-sm text-gray-600">{userData.insights.customerRetention}%</span>
                    </div>
                    <Progress value={userData.insights.customerRetention} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Precisión de precios</span>
                      <span className="text-sm text-gray-600">{userData.insights.priceAccuracy}%</span>
                    </div>
                    <Progress value={userData.insights.priceAccuracy} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Calidad de descripción</span>
                      <span className="text-sm text-gray-600">{userData.insights.descriptionQuality}%</span>
                    </div>
                    <Progress value={userData.insights.descriptionQuality} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-lg font-bold text-purple-600">{userData.stats.repeatCustomers}</p>
                      <p className="text-xs text-gray-600">Clientes recurrentes</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-lg font-bold text-orange-600">{userData.stats.sustainabilityScore}</p>
                      <p className="text-xs text-gray-600">Puntuación eco</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leaderboard Position */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Posición en Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium text-yellow-800">En tu ciudad</p>
                        <p className="text-sm text-yellow-600">Santo Domingo</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-700">#{userData.leaderboard.cityRank}</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">Subiendo</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-800">En {userData.insights.topCategory}</p>
                        <p className="text-sm text-blue-600">Tu categoría principal</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700">#{userData.leaderboard.categoryRank}</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">Subiendo</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">Ranking general</p>
                        <p className="text-sm text-gray-600">Todos los vendedores</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-700">#{userData.leaderboard.overallRank}</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">Subiendo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="mt-0">
            <div className="p-4 space-y-4">
              <BadgesShowcase userStats={userData.stats} showFilters={true} compact={false} />
            </div>
          </TabsContent>
        </Tabs>
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
          <Link
            href="/buscar"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
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
          <Link href="/perfil" className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-emerald-500">
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
