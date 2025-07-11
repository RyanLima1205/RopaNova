"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useNotifications } from "@/hooks/useNotifications"

interface NotificationContextType {
  permission: NotificationPermission
  isSupported: boolean
  requestPermission: () => Promise<NotificationPermission>
  notifyNewOrder: (orderData: any) => Promise<void>
  notifyLowStock: (stockData: any) => Promise<void>
  notifyPerformanceAlert: (performanceData: any) => Promise<void>
  notifyPriceSuggestion: (priceData: any) => Promise<void>
  notifyNewReview: (reviewData: any) => Promise<void>
  notifyNewMessage: (messageData: any) => Promise<void>
  notifyWeeklySummary: (summaryData: any) => Promise<void>
  /*  👇 NEW  */
  notifyBadgeEarned: (badgeData: {
    badgeName: string
    badgeIcon: string
    points: number
    level: string
  }) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const notifications = useNotifications({
    enableNewOrders: true,
    enableLowStock: true,
    enablePerformanceAlerts: true,
    enablePriceAlerts: true,
    enableReviews: true,
    enableMessages: true,
    /* you can later add      enableBadges: true, */
    lowStockThreshold: 2,
  })

  /* -------- fallback in case useNotifications doesn’t yet return this method -------- */
  if (!("notifyBadgeEarned" in notifications)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ;(notifications as any).notifyBadgeEarned = async () => {}
  }
  /* ---------------------------------------------------------------------------------- */

  return (
    <NotificationContext.Provider value={notifications as NotificationContextType}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider")
  }
  return context
}
