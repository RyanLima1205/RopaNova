"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, Star, Users, Zap } from "lucide-react"

export function ResponsiveHero() {
  const [email, setEmail] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Email submitted:", email)
    alert("Thanks for signing up!")
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">Trusted by 10,000+ users</span>
            </div>

            <h1 className="text-responsive-xl font-bold tracking-tight mb-6">
              Build Amazing Websites That Work on <span className="text-primary">Every Device</span>
            </h1>

            <p className="text-responsive-lg text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Create responsive, fast, and beautiful websites that provide an excellent experience on desktop, tablet,
              and mobile devices.
            </p>

            {/* CTA Form */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8 max-w-md mx-auto lg:mx-0">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 tap-target"
                required
              />
              <Button type="submit" className="tap-target tap-feedback">
                Get Started Free
              </Button>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-md mx-auto lg:mx-0">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-xs text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">4.9</div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative mx-auto max-w-lg">
              {/* Desktop mockup */}
              <div className="hidden sm:block relative">
                <div className="bg-gray-900 rounded-lg p-2 shadow-2xl">
                  <div className="bg-white rounded-md aspect-video flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <Play className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">Desktop Experience</h3>
                      <p className="text-sm text-muted-foreground">Full-featured interface</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile mockup */}
              <div className="sm:absolute sm:-bottom-8 sm:-right-8 sm:w-48">
                <div className="bg-gray-900 rounded-2xl p-2 shadow-2xl">
                  <div className="bg-white rounded-xl aspect-[9/16] flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <Play className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">Mobile Ready</h4>
                      <p className="text-xs text-muted-foreground">Touch optimized</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 rounded-full animate-bounce opacity-60"></div>
            <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-purple-500 rounded-full animate-pulse opacity-60"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
