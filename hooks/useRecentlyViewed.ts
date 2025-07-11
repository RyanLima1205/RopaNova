"use client"

import { useState, useEffect, useCallback } from "react"

export interface RecentlyViewedItem {
  id: number
  title: string
  price: number
  image: string
  condition: string
  location: string
  brand: string
  size?: string
  viewedAt: string
}

const STORAGE_KEY = "vinted-rd-recently-viewed"
const MAX_ITEMS = 10

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const items = JSON.parse(stored)
          setRecentlyViewed(items)
        }
      } catch (error) {
        console.error("Error loading recently viewed items:", error)
      }
    }
  }, [])

  // Save to localStorage whenever recentlyViewed changes
  useEffect(() => {
    if (typeof window !== "undefined" && recentlyViewed.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed))
      } catch (error) {
        console.error("Error saving recently viewed items:", error)
      }
    }
  }, [recentlyViewed])

  const addToRecentlyViewed = useCallback((item: Omit<RecentlyViewedItem, "viewedAt">) => {
    const newItem: RecentlyViewedItem = { ...item, viewedAt: new Date().toISOString() }
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((existing) => existing.id !== item.id)
      return [newItem, ...filtered].slice(0, MAX_ITEMS)
    })
  }, [])

  const removeFromRecentlyViewed = useCallback((itemId: number) => {
    setRecentlyViewed((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([])
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY)
  }, [])

  const getTimeAgo = (viewedAt: string) => {
    const now = new Date()
    const viewed = new Date(viewedAt)
    const diffInMinutes = Math.floor((now.getTime() - viewed.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Ahora mismo"
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Hace ${diffInHours}h`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Hace ${diffInDays}d`

    return viewed.toLocaleDateString("es-DO")
  }

  return {
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
    getTimeAgo,
  }
}
