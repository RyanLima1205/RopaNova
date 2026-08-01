"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

/** Redirige a /login si no hay sesión — mismo criterio que App.tsx en mobile-app (isAuthenticated ? Stack : AuthNavigator). */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [loading, isAuthenticated, router])

  if (loading || !isAuthenticated) return null

  return <>{children}</>
}
