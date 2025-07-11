"use client"

import { useState, useEffect, useCallback } from "react"
import { notificationService } from "@/lib/notifications"

interface NotificationHookOptions {
  enableNewOrders?: boolean
  enableLowStock?: boolean
  enablePerformanceAlerts?: boolean
  enablePriceAlerts?: boolean
  enableReviews?: boolean
  enableMessages?: boolean
  lowStockThreshold?: number
}

export function useNotifications(options: NotificationHookOptions = {}) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported("Notification" in window)

    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    const newPermission = await notificationService.requestPermission()
    setPermission(newPermission)
    return newPermission
  }, [])

  // Notification trigger functions
  const notifyNewOrder = useCallback(
    async (orderData: { buyerName: string; productTitle: string; amount: number; orderId: string }) => {
      if (options.enableNewOrders !== false && permission === "granted") {
        await notificationService.sendNewOrderNotification(orderData)
      }
    },
    [options.enableNewOrders, permission],
  )

  const notifyLowStock = useCallback(
    async (stockData: { category: string; remainingStock: number }) => {
      const threshold = options.lowStockThreshold || 2
      if (options.enableLowStock !== false && permission === "granted" && stockData.remainingStock <= threshold) {
        await notificationService.sendLowStockAlert({
          ...stockData,
          threshold,
        })
      }
    },
    [options.enableLowStock, options.lowStockThreshold, permission],
  )

  const notifyPerformanceAlert = useCallback(
    async (performanceData: { productTitle: string; metric: string; value: number; timeframe: string }) => {
      if (options.enablePerformanceAlerts !== false && permission === "granted") {
        await notificationService.sendPerformanceAlert(performanceData)
      }
    },
    [options.enablePerformanceAlerts, permission],
  )

  const notifyPriceSuggestion = useCallback(
    async (priceData: { productTitle: string; currentPrice: number; suggestedPrice: number; reason: string }) => {
      if (options.enablePriceAlerts !== false && permission === "granted") {
        await notificationService.sendPriceSuggestion(priceData)
      }
    },
    [options.enablePriceAlerts, permission],
  )

  const notifyNewReview = useCallback(
    async (reviewData: { reviewerName: string; rating: number; productTitle: string }) => {
      if (options.enableReviews !== false && permission === "granted") {
        await notificationService.sendReviewNotification(reviewData)
      }
    },
    [options.enableReviews, permission],
  )

  const notifyNewMessage = useCallback(
    async (messageData: { senderName: string; productTitle?: string }) => {
      if (options.enableMessages !== false && permission === "granted") {
        await notificationService.sendMessageNotification(messageData)
      }
    },
    [options.enableMessages, permission],
  )

  const notifyWeeklySummary = useCallback(
    async (summaryData: { salesCount: number; totalRevenue: number; period: string }) => {
      if (permission === "granted") {
        await notificationService.sendWeeklySummary(summaryData)
      }
    },
    [permission],
  )

  return {
    permission,
    isSupported,
    requestPermission,
    notifyNewOrder,
    notifyLowStock,
    notifyPerformanceAlert,
    notifyPriceSuggestion,
    notifyNewReview,
    notifyNewMessage,
    notifyWeeklySummary,
  }
}
