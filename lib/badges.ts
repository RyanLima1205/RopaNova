export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: "sales" | "quality" | "engagement" | "special" | "milestone"
  level: "bronze" | "silver" | "gold" | "platinum" | "diamond"
  requirement: {
    type: "sales_count" | "rating_average" | "response_time" | "reviews_count" | "revenue" | "special"
    value: number
    timeframe?: "all_time" | "monthly" | "yearly"
  }
  reward?: {
    points: number
    benefits?: string[]
  }
  rarity: "common" | "rare" | "epic" | "legendary"
  unlocked?: boolean
  unlockedAt?: string
  progress?: number
}

export const BADGE_DEFINITIONS: Badge[] = [
  // Sales Milestones
  {
    id: "first_sale",
    name: "Primera Venta",
    description: "Completaste tu primera venta exitosa",
    icon: "🎉",
    category: "milestone",
    level: "bronze",
    requirement: { type: "sales_count", value: 1, timeframe: "all_time" },
    reward: { points: 50 },
    rarity: "common",
  },
  {
    id: "sales_10",
    name: "Vendedor Activo",
    description: "Alcanzaste 10 ventas exitosas",
    icon: "🔟",
    category: "sales",
    level: "bronze",
    requirement: { type: "sales_count", value: 10, timeframe: "all_time" },
    reward: { points: 100, benefits: ["Prioridad en búsquedas"] },
    rarity: "common",
  },
  {
    id: "sales_25",
    name: "Vendedor Experimentado",
    description: "Completaste 25 ventas exitosas",
    icon: "🏅",
    category: "sales",
    level: "silver",
    requirement: { type: "sales_count", value: 25, timeframe: "all_time" },
    reward: { points: 200, benefits: ["Descuento en comisiones"] },
    rarity: "rare",
  },
  {
    id: "sales_50",
    name: "Vendedor Profesional",
    description: "Alcanzaste 50 ventas exitosas",
    icon: "🏆",
    category: "sales",
    level: "gold",
    requirement: { type: "sales_count", value: 50, timeframe: "all_time" },
    reward: { points: 350, benefits: ["Listados destacados gratis", "Soporte prioritario"] },
    rarity: "epic",
  },
  {
    id: "sales_100",
    name: "Vendedor Elite",
    description: "Completaste 100 ventas exitosas",
    icon: "💯",
    category: "sales",
    level: "platinum",
    requirement: { type: "sales_count", value: 100, timeframe: "all_time" },
    reward: { points: 500, benefits: ["Verificación automática", "Analytics avanzados"] },
    rarity: "legendary",
  },

  // Quality Badges
  {
    id: "five_star_seller",
    name: "Vendedor 5 Estrellas",
    description: "Mantén una calificación promedio de 4.8+ con al menos 10 reseñas",
    icon: "⭐",
    category: "quality",
    level: "gold",
    requirement: { type: "rating_average", value: 4.8, timeframe: "all_time" },
    reward: { points: 300, benefits: ["Badge de calidad visible"] },
    rarity: "epic",
  },
  {
    id: "fast_responder",
    name: "Respuesta Rápida",
    description: "Responde mensajes en menos de 2 horas en promedio",
    icon: "⚡",
    category: "engagement",
    level: "silver",
    requirement: { type: "response_time", value: 2, timeframe: "monthly" },
    reward: { points: 150, benefits: ["Badge de respuesta rápida"] },
    rarity: "rare",
  },
  {
    id: "customer_favorite",
    name: "Favorito de Clientes",
    description: "Recibe más de 50 reseñas positivas",
    icon: "❤️",
    category: "quality",
    level: "gold",
    requirement: { type: "reviews_count", value: 50, timeframe: "all_time" },
    reward: { points: 250, benefits: ["Destacado en perfil"] },
    rarity: "epic",
  },

  // Revenue Milestones
  {
    id: "revenue_10k",
    name: "Emprendedor",
    description: "Genera RD$10,000 en ventas totales",
    icon: "💰",
    category: "milestone",
    level: "silver",
    requirement: { type: "revenue", value: 10000, timeframe: "all_time" },
    reward: { points: 200 },
    rarity: "rare",
  },
  {
    id: "revenue_50k",
    name: "Empresario",
    description: "Alcanza RD$50,000 en ventas totales",
    icon: "💎",
    category: "milestone",
    level: "gold",
    requirement: { type: "revenue", value: 50000, timeframe: "all_time" },
    reward: { points: 400, benefits: ["Acceso a herramientas pro"] },
    rarity: "epic",
  },
  {
    id: "revenue_100k",
    name: "Magnate de la Moda",
    description: "Supera RD$100,000 en ventas totales",
    icon: "👑",
    category: "milestone",
    level: "diamond",
    requirement: { type: "revenue", value: 100000, timeframe: "all_time" },
    reward: { points: 750, benefits: ["Cuenta VIP", "Gestor personal"] },
    rarity: "legendary",
  },

  // Special Badges
  {
    id: "early_adopter",
    name: "Pionero",
    description: "Uno de los primeros 1000 usuarios de VintedRD",
    icon: "🚀",
    category: "special",
    level: "platinum",
    requirement: { type: "special", value: 1000 },
    reward: { points: 500, benefits: ["Badge exclusivo", "Acceso beta"] },
    rarity: "legendary",
  },
  {
    id: "monthly_top_seller",
    name: "Vendedor del Mes",
    description: "Fuiste el vendedor #1 del mes",
    icon: "🏅",
    category: "special",
    level: "diamond",
    requirement: { type: "special", value: 1 },
    reward: { points: 1000, benefits: ["Reconocimiento público", "Promoción gratuita"] },
    rarity: "legendary",
  },
  {
    id: "eco_warrior",
    name: "Guerrero Eco",
    description: "Contribuye a la moda sostenible con 25+ ventas",
    icon: "🌱",
    category: "special",
    level: "gold",
    requirement: { type: "sales_count", value: 25, timeframe: "all_time" },
    reward: { points: 300, benefits: ["Badge de sostenibilidad"] },
    rarity: "epic",
  },
]

export class BadgeService {
  static calculateProgress(badge: Badge, userStats: any): number {
    const { requirement } = badge
    let currentValue = 0

    switch (requirement.type) {
      case "sales_count":
        currentValue = userStats.totalSales || 0
        break
      case "rating_average":
        currentValue = userStats.rating || 0
        break
      case "response_time":
        // Convert hours to number for comparison (lower is better)
        const responseTime = Number.parseFloat(userStats.averageResponseTime?.replace(" horas", "") || "24")
        currentValue = requirement.value / responseTime // Invert for progress calculation
        break
      case "reviews_count":
        currentValue = userStats.reviewCount || 0
        break
      case "revenue":
        currentValue = userStats.totalEarnings || 0
        break
      case "special":
        // Special badges are manually awarded
        return badge.unlocked ? 100 : 0
    }

    const progress = Math.min((currentValue / requirement.value) * 100, 100)
    return Math.round(progress)
  }

  static checkBadgeEligibility(badge: Badge, userStats: any): boolean {
    const progress = this.calculateProgress(badge, userStats)
    return progress >= 100
  }

  static getUserBadges(userStats: any): Badge[] {
    return BADGE_DEFINITIONS.map((badge) => ({
      ...badge,
      unlocked: this.checkBadgeEligibility(badge, userStats),
      progress: this.calculateProgress(badge, userStats),
      unlockedAt: badge.unlocked ? new Date().toISOString() : undefined,
    }))
  }

  static getNewlyEarnedBadges(previousStats: any, currentStats: any): Badge[] {
    const previousBadges = this.getUserBadges(previousStats)
    const currentBadges = this.getUserBadges(currentStats)

    return currentBadges.filter((currentBadge, index) => {
      const previousBadge = previousBadges[index]
      return currentBadge.unlocked && !previousBadge.unlocked
    })
  }

  static getBadgesByCategory(badges: Badge[], category: Badge["category"]): Badge[] {
    return badges.filter((badge) => badge.category === category)
  }

  static getBadgesByRarity(badges: Badge[], rarity: Badge["rarity"]): Badge[] {
    return badges.filter((badge) => badge.rarity === rarity)
  }

  static getUnlockedBadges(badges: Badge[]): Badge[] {
    return badges.filter((badge) => badge.unlocked)
  }

  static getInProgressBadges(badges: Badge[]): Badge[] {
    return badges.filter((badge) => !badge.unlocked && badge.progress! > 0)
  }
}
