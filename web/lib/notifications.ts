// Notification service for managing push notifications
export class NotificationService {
  private static instance: NotificationService
  private permission: NotificationPermission = "default"

  private constructor() {
    this.checkPermission()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private checkPermission() {
    if ("Notification" in window) {
      this.permission = Notification.permission
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if ("Notification" in window) {
      this.permission = await Notification.requestPermission()
    }
    return this.permission
  }

  async sendNotification(title: string, options: NotificationOptions = {}) {
    if (this.permission !== "granted") {
      console.warn("Notification permission not granted")
      return
    }

    if ("serviceWorker" in navigator) {
      // Use service worker for better notification handling
      const registration = await navigator.serviceWorker.ready
      registration.showNotification(title, {
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        ...options,
      })
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: "/icon-192x192.png",
        ...options,
      })
    }
  }

  // Specific notification types for the Dominican resale app
  async sendNewOrderNotification(orderData: {
    buyerName: string
    productTitle: string
    amount: number
    orderId: string
  }) {
    await this.sendNotification("🛍️ Nueva orden recibida", {
      body: `${orderData.buyerName} compró tu ${orderData.productTitle} por RD$${orderData.amount.toLocaleString()}`,
      tag: `order-${orderData.orderId}`,
      data: { type: "new_order", orderId: orderData.orderId },
      actions: [
        { action: "view", title: "Ver orden" },
        { action: "message", title: "Enviar mensaje" },
      ],
    })
  }

  async sendLowStockAlert(stockData: { category: string; remainingStock: number; threshold: number }) {
    await this.sendNotification("⚠️ Stock bajo", {
      body: `Solo te quedan ${stockData.remainingStock} artículo(s) en ${stockData.category}`,
      tag: `low-stock-${stockData.category}`,
      data: { type: "low_stock", category: stockData.category },
      actions: [{ action: "restock", title: "Agregar productos" }],
    })
  }

  async sendPerformanceAlert(performanceData: {
    productTitle: string
    metric: string
    value: number
    timeframe: string
  }) {
    await this.sendNotification("📈 Producto destacado", {
      body: `Tu ${performanceData.productTitle} ha recibido ${performanceData.value}+ ${performanceData.metric} en ${performanceData.timeframe}`,
      tag: `performance-${performanceData.productTitle}`,
      data: { type: "performance_alert", product: performanceData.productTitle },
      actions: [{ action: "view", title: "Ver detalles" }],
    })
  }

  async sendPriceSuggestion(priceData: {
    productTitle: string
    currentPrice: number
    suggestedPrice: number
    reason: string
  }) {
    await this.sendNotification("💰 Sugerencia de precio", {
      body: `Considera reducir el precio de ${priceData.productTitle} de RD$${priceData.currentPrice.toLocaleString()} a RD$${priceData.suggestedPrice.toLocaleString()}`,
      tag: `price-suggestion-${priceData.productTitle}`,
      data: { type: "price_suggestion", product: priceData.productTitle },
      actions: [
        { action: "adjust", title: "Ajustar precio" },
        { action: "dismiss", title: "Ignorar" },
      ],
    })
  }

  async sendReviewNotification(reviewData: { reviewerName: string; rating: number; productTitle: string }) {
    await this.sendNotification("⭐ Nueva reseña", {
      body: `${reviewData.reviewerName} te dejó una reseña de ${reviewData.rating} estrella(s)`,
      tag: `review-${reviewData.reviewerName}`,
      data: { type: "review_received", reviewer: reviewData.reviewerName },
      actions: [
        { action: "view", title: "Ver reseña" },
        { action: "respond", title: "Responder" },
      ],
    })
  }

  async sendMessageNotification(messageData: { senderName: string; productTitle?: string }) {
    await this.sendNotification("💬 Nuevo mensaje", {
      body: `${messageData.senderName} te envió un mensaje${messageData.productTitle ? ` sobre ${messageData.productTitle}` : ""}`,
      tag: `message-${messageData.senderName}`,
      data: { type: "message_received", sender: messageData.senderName },
      actions: [{ action: "reply", title: "Responder" }],
    })
  }

  async sendWeeklySummary(summaryData: { salesCount: number; totalRevenue: number; period: string }) {
    await this.sendNotification("📊 Resumen semanal", {
      body: `${summaryData.period} vendiste ${summaryData.salesCount} artículo(s) por RD$${summaryData.totalRevenue.toLocaleString()}`,
      tag: "weekly-summary",
      data: { type: "weekly_summary" },
      actions: [{ action: "view", title: "Ver dashboard" }],
    })
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()

// Utility functions for notification management
export const scheduleNotification = (delay: number, callback: () => void) => {
  setTimeout(callback, delay)
}

export const scheduleRecurringNotification = (interval: number, callback: () => void) => {
  return setInterval(callback, interval)
}

// Dominican-specific notification helpers
export const formatDominicanCurrency = (amount: number) => {
  return `RD$${amount.toLocaleString("es-DO")}`
}

export const getDominicanTimeString = (date: Date) => {
  return date.toLocaleString("es-DO", {
    timeZone: "America/Santo_Domingo",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
