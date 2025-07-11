"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CookieSettingsPage } from "@/components/cookie-settings-page"

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/configuracion">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-gray-900">Cookies</h1>
        </div>
      </header>

      <div className="p-4">
        <CookieSettingsPage />
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
