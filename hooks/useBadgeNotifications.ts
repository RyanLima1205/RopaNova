"use client"

import { useEffect, useState } from "react"
import { type Badge, BadgeService } from "@/lib/badges"
import { useNotificationContext } from "@/components/notification-provider"

interface UseBadgeNotificationsProps {
  userStats: any
  previousStats?: any
}

export function useBadgeNotifications({ userStats, previousStats }: UseBadgeNotificationsProps) {
  const [newBadges, setNewBadges] = useState<Badge[]>([])
  const notifications = useNotificationContext()

  useEffect(() => {
    if (previousStats && userStats) {
      const earnedBadges = BadgeService.getNewlyEarnedBadges(previousStats, userStats)

      if (earnedBadges.length > 0) {
        setNewBadges(earnedBadges)

        // Show notifications for new badges
        earnedBadges.forEach((badge) => {
          notifications.notifyBadgeEarned({
            badgeName: badge.name,
            badgeIcon: badge.icon,
            points: badge.reward?.points || 0,
            level: badge.level,
          })
        })
      }
    }
  }, [userStats, previousStats, notifications])

  const clearNewBadges = () => {
    setNewBadges([])
  }

  return {
    newBadges,
    clearNewBadges,
    hasNewBadges: newBadges.length > 0,
  }
}
