"use client"

import type { Badge as BadgeType } from "@/lib/badges"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface BadgeDisplayProps {
  badge: BadgeType
  size?: "sm" | "md" | "lg"
  showProgress?: boolean
  showDescription?: boolean
  className?: string
}

export function BadgeDisplay({
  badge,
  size = "md",
  showProgress = false,
  showDescription = false,
  className,
}: BadgeDisplayProps) {
  const getLevelColor = (level: BadgeType["level"]) => {
    switch (level) {
      case "bronze":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "silver":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "gold":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "platinum":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "diamond":
        return "bg-blue-100 text-blue-700 border-blue-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const getRarityColor = (rarity: BadgeType["rarity"]) => {
    switch (rarity) {
      case "common":
        return "border-gray-300"
      case "rare":
        return "border-blue-400"
      case "epic":
        return "border-purple-400"
      case "legendary":
        return "border-yellow-400"
      default:
        return "border-gray-300"
    }
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm":
        return {
          container: "w-16 h-16",
          icon: "text-2xl",
          name: "text-xs",
          card: "p-2",
        }
      case "lg":
        return {
          container: "w-24 h-24",
          icon: "text-4xl",
          name: "text-sm",
          card: "p-4",
        }
      default:
        return {
          container: "w-20 h-20",
          icon: "text-3xl",
          name: "text-xs",
          card: "p-3",
        }
    }
  }

  const sizeClasses = getSizeClasses(size)

  const BadgeContent = () => (
    <Card
      className={cn(
        "relative transition-all duration-200 hover:scale-105",
        getRarityColor(badge.rarity),
        badge.unlocked ? "opacity-100" : "opacity-50 grayscale",
        className,
      )}
    >
      <CardContent className={cn("flex flex-col items-center justify-center text-center", sizeClasses.card)}>
        <div className={cn("mb-1", sizeClasses.icon)}>{badge.icon}</div>
        <h4 className={cn("font-medium line-clamp-2", sizeClasses.name)}>{badge.name}</h4>

        {badge.unlocked && (
          <Badge className={cn("mt-1 text-xs", getLevelColor(badge.level))} variant="outline">
            {badge.level.toUpperCase()}
          </Badge>
        )}

        {showProgress && !badge.unlocked && badge.progress !== undefined && badge.progress > 0 && (
          <div className="w-full mt-2">
            <Progress value={badge.progress} className="h-1" />
            <p className="text-xs text-gray-500 mt-1">{badge.progress}%</p>
          </div>
        )}

        {showDescription && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{badge.description}</p>}

        {badge.reward && badge.unlocked && (
          <div className="mt-2 text-xs text-emerald-600">+{badge.reward.points} puntos</div>
        )}

        {/* Rarity indicator */}
        <div
          className={cn(
            "absolute top-1 right-1 w-2 h-2 rounded-full",
            badge.rarity === "legendary" && "bg-yellow-400",
            badge.rarity === "epic" && "bg-purple-400",
            badge.rarity === "rare" && "bg-blue-400",
            badge.rarity === "common" && "bg-gray-400",
          )}
        />
      </CardContent>
    </Card>
  )

  if (showDescription || badge.reward?.benefits) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <BadgeContent />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">{badge.name}</p>
              <p className="text-sm">{badge.description}</p>
              {badge.reward && (
                <div className="text-sm">
                  <p className="text-emerald-600">Recompensa: +{badge.reward.points} puntos</p>
                  {badge.reward.benefits && (
                    <ul className="list-disc list-inside mt-1 text-xs">
                      {badge.reward.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <Badge className={cn("text-xs", getLevelColor(badge.level))} variant="outline">
                {badge.level.toUpperCase()} • {badge.rarity.toUpperCase()}
              </Badge>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return <BadgeContent />
}
