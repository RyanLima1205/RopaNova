"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, X, Clock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed"

interface RecentlyViewedSectionProps {
  favorites: number[]
  onToggleFavorite: (itemId: number) => void
}

export function RecentlyViewedSection({ favorites, onToggleFavorite }: RecentlyViewedSectionProps) {
  const { recentlyViewed, removeFromRecentlyViewed, clearRecentlyViewed, getTimeAgo } = useRecentlyViewed()
  const [showAll, setShowAll] = useState(false)

  if (recentlyViewed.length === 0) {
    return null
  }

  const displayItems = showAll ? recentlyViewed : recentlyViewed.slice(0, 6)

  return (
    <section className="bg-white mb-2">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Visto Recientemente</h2>
            <Badge variant="secondary" className="text-xs">
              {recentlyViewed.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {recentlyViewed.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-emerald-600 hover:text-emerald-700"
              >
                {showAll ? "Ver menos" : `Ver todos (${recentlyViewed.length})`}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecentlyViewed}
              className="text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {displayItems.map((item) => (
            <div key={`${item.id}-${item.viewedAt}`} className="relative">
              <Link href={`/producto/${item.id}`}>
                <Card className="w-full bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="relative">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        width={200}
                        height={200}
                        className="h-48 w-full object-cover rounded-t-lg"
                      />

                      {/* Remove from recently viewed */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 h-6 w-6 bg-black/50 hover:bg-black/70 text-white rounded-full"
                        onClick={(e) => {
                          e.preventDefault()
                          removeFromRecentlyViewed(item.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>

                      {/* Favorite button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
                        onClick={(e) => {
                          e.preventDefault()
                          onToggleFavorite(item.id)
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.includes(item.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                          }`}
                        />
                      </Button>

                      {/* Recently viewed indicator */}
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-xs bg-black/70 text-white border-0">
                          <Eye className="h-3 w-3 mr-1" />
                          {getTimeAgo(item.viewedAt)}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">{item.title}</h3>
                      <p className="text-lg font-bold text-emerald-600 mb-1">RD${item.price.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={item.condition === "Nuevo" ? "default" : "secondary"} className="text-xs">
                          {item.condition}
                        </Badge>
                        {item.size && (
                          <Badge variant="outline" className="text-xs">
                            Talla {item.size}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{item.location}</p>
                      <p className="text-xs text-gray-400">{item.brand}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>

        {/* Empty state when all items are removed */}
        {recentlyViewed.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No has visto ningún artículo recientemente</p>
            <p className="text-gray-400 text-xs mt-1">Los artículos que veas aparecerán aquí</p>
          </div>
        )}
      </div>
    </section>
  )
}
