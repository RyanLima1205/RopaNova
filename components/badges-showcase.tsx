"use client"

import { useState } from "react"
import { type Badge as BadgeType, BadgeService } from "@/lib/badges"
import { BadgeDisplay } from "@/components/badge-display"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Star, TrendingUp, Heart, Award, Search, Target, Crown, Zap } from "lucide-react"

interface BadgesShowcaseProps {
  userStats: any
  showFilters?: boolean
  compact?: boolean
}

export function BadgesShowcase({ userStats, showFilters = true, compact = false }: BadgesShowcaseProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedRarity, setSelectedRarity] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  const userBadges = BadgeService.getUserBadges(userStats)
  const unlockedBadges = BadgeService.getUnlockedBadges(userBadges)
  const inProgressBadges = BadgeService.getInProgressBadges(userBadges)

  const filteredBadges = userBadges.filter((badge) => {
    const matchesSearch =
      badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || badge.category === selectedCategory
    const matchesRarity = selectedRarity === "all" || badge.rarity === selectedRarity
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "unlocked" && badge.unlocked) ||
      (selectedStatus === "locked" && !badge.unlocked) ||
      (selectedStatus === "progress" && !badge.unlocked && badge.progress! > 0)

    return matchesSearch && matchesCategory && matchesRarity && matchesStatus
  })

  const getCategoryIcon = (category: BadgeType["category"]) => {
    switch (category) {
      case "sales":
        return <TrendingUp className="h-4 w-4" />
      case "quality":
        return <Star className="h-4 w-4" />
      case "engagement":
        return <Heart className="h-4 w-4" />
      case "milestone":
        return <Trophy className="h-4 w-4" />
      case "special":
        return <Crown className="h-4 w-4" />
      default:
        return <Award className="h-4 w-4" />
    }
  }

  const getCategoryName = (category: BadgeType["category"]) => {
    switch (category) {
      case "sales":
        return "Ventas"
      case "quality":
        return "Calidad"
      case "engagement":
        return "Participación"
      case "milestone":
        return "Hitos"
      case "special":
        return "Especiales"
      default:
        return "Otros"
    }
  }

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
            <p className="text-lg font-bold text-yellow-700">{unlockedBadges.length}</p>
            <p className="text-xs text-yellow-600">Desbloqueadas</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Target className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold text-blue-700">{inProgressBadges.length}</p>
            <p className="text-xs text-blue-600">En Progreso</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <Zap className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
            <p className="text-lg font-bold text-emerald-700">
              {unlockedBadges.reduce((sum, badge) => sum + (badge.reward?.points || 0), 0)}
            </p>
            <p className="text-xs text-emerald-600">Puntos</p>
          </div>
        </div>

        {/* Recent Badges */}
        <div>
          <h4 className="font-medium mb-3">Insignias Recientes</h4>
          <div className="grid grid-cols-4 gap-2">
            {unlockedBadges.slice(0, 8).map((badge) => (
              <BadgeDisplay key={badge.id} badge={badge} size="sm" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold text-yellow-600">{unlockedBadges.length}</p>
            <p className="text-sm text-gray-600">Insignias Desbloqueadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-blue-600">{inProgressBadges.length}</p>
            <p className="text-sm text-gray-600">En Progreso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold text-emerald-600">
              {unlockedBadges.reduce((sum, badge) => sum + (badge.reward?.points || 0), 0)}
            </p>
            <p className="text-sm text-gray-600">Puntos Ganados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-purple-600">
              {unlockedBadges.filter((b) => b.rarity === "legendary").length}
            </p>
            <p className="text-sm text-gray-600">Legendarias</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar insignias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="quality">Calidad</SelectItem>
                  <SelectItem value="engagement">Participación</SelectItem>
                  <SelectItem value="milestone">Hitos</SelectItem>
                  <SelectItem value="special">Especiales</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Rareza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="common">Común</SelectItem>
                  <SelectItem value="rare">Rara</SelectItem>
                  <SelectItem value="epic">Épica</SelectItem>
                  <SelectItem value="legendary">Legendaria</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unlocked">Desbloqueadas</SelectItem>
                  <SelectItem value="progress">En Progreso</SelectItem>
                  <SelectItem value="locked">Bloqueadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="quality">Calidad</TabsTrigger>
          <TabsTrigger value="engagement">Social</TabsTrigger>
          <TabsTrigger value="milestone">Hitos</TabsTrigger>
          <TabsTrigger value="special">Especiales</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBadges.map((badge) => (
              <BadgeDisplay key={badge.id} badge={badge} showProgress={!badge.unlocked} showDescription={true} />
            ))}
          </div>
        </TabsContent>

        {(["sales", "quality", "engagement", "milestone", "special"] as const).map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  Insignias de {getCategoryName(category)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {BadgeService.getBadgesByCategory(filteredBadges, category).map((badge) => (
                    <BadgeDisplay key={badge.id} badge={badge} showProgress={!badge.unlocked} showDescription={true} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Progress Section */}
      {inProgressBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Próximas Insignias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProgressBadges.slice(0, 5).map((badge) => (
                <div key={badge.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{badge.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium">{badge.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={badge.progress} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{badge.progress}%</span>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300" variant="outline">
                    {badge.level.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
