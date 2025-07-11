"use client"

import { useState, useEffect } from "react"
import { productService } from "../services/productService"

export const useProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newProducts, setNewProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const [featured, recent] = await Promise.all([
        productService.getFeaturedProducts(),
        productService.getRecentProducts(),
      ])

      setFeaturedProducts(featured)
      setNewProducts(recent)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshProducts = async () => {
    await loadProducts()
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return {
    featuredProducts,
    newProducts,
    loading,
    refreshProducts,
  }
}
