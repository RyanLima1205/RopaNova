"use client"

import { useState, useEffect } from "react"
import type { Badge as BadgeType } from "@/lib/badges"
import { BadgeDisplay } from "@/components/badge-display"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Confetti } from "@/components/ui/confetti"
import { Trophy, Gift, Star } from "lucide-react"

interface BadgeNotificationProps {
  badges: BadgeType[]
  isOpen: boolean
  onClose: () => void
}

export function BadgeNotification({ badges, isOpen, onClose }: BadgeNotificationProps) {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen && badges.length > 0) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, badges])

  const currentBadge = badges[currentBadgeIndex]
  const totalPoints = badges.reduce((sum, badge) => sum + (badge.reward?.points || 0), 0)

  const handleNext = () => {
    if (currentBadgeIndex < badges.length - 1) {
      setCurrentBadgeIndex(currentBadgeIndex + 1)
    } else {
      onClose()
    }
  }

  const handleSkip = () => {
    onClose()
  }

  if (!currentBadge) return null

  return (
    <>
      {showConfetti && <Confetti />}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              ¡Felicitaciones!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Badge Display */}
            <div className="text-center">
              <div className="mb-4">
                <BadgeDisplay badge={currentBadge} size="lg" showDescription={false} className="mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-2">{currentBadge.name}</h3>
              <p className="text-gray-600 mb-4">{currentBadge.description}</p>
            </div>

            {/* Rewards */}
            {currentBadge.reward && (
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4 text-center">
                  <Gift className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                  <p className="font-medium text-emerald-800 mb-1">¡Has ganado {currentBadge.reward.points} puntos!</p>
                  {currentBadge.reward.benefits && (
                    <div className="text-sm text-emerald-700">
                      <p className="font-medium mb-1">Beneficios desbloqueados:</p>
                      <ul className="list-disc list-inside">
                        {currentBadge.reward.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Progress Indicator */}
            {badges.length > 1 && (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Insignia {currentBadgeIndex + 1} de {badges.length}
                </p>
                <div className="flex justify-center gap-1">
                  {badges.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentBadgeIndex ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Total Points */}
            {badges.length > 1 && (
              <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Star className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">Total de puntos ganados: {totalPoints}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {badges.length > 1 && currentBadgeIndex < badges.length - 1 ? (
                <>
                  <Button variant="outline" onClick={handleSkip} className="flex-1 bg-transparent">
                    Saltar Todo
                  </Button>
                  <Button onClick={handleNext} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                    Siguiente
                  </Button>
                </>
              ) : (
                <Button onClick={onClose} className="w-full bg-emerald-500 hover:bg-emerald-600">
                  ¡Genial!
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
