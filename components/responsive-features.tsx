"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Smartphone, Monitor, Tablet, Zap, Shield, Globe, Palette, Code, ChevronRight } from "lucide-react"

export function ResponsiveFeatures() {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Designed for mobile devices first, then enhanced for larger screens",
      details: "Touch-friendly interfaces, optimized performance, and native-like experience",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      icon: Monitor,
      title: "Desktop Optimized",
      description: "Full-featured experience with advanced layouts and interactions",
      details: "Keyboard shortcuts, hover states, and multi-column layouts",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: Tablet,
      title: "Tablet Ready",
      description: "Perfect middle ground between mobile and desktop experiences",
      details: "Adaptive layouts that make the most of tablet screen real estate",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance across all devices and network conditions",
      details: "Lazy loading, code splitting, and efficient caching strategies",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Built with security best practices and reliable infrastructure",
      details: "HTTPS everywhere, secure authentication, and data protection",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
    {
      icon: Globe,
      title: "Cross Platform",
      description: "Works seamlessly across all browsers and operating systems",
      details: "Progressive Web App capabilities with offline support",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
    },
  ]

  const additionalFeatures = [
    { icon: Palette, title: "Customizable Themes", description: "Light and dark mode support" },
    { icon: Code, title: "Developer Friendly", description: "Clean code and documentation" },
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <Badge variant="outline" className="mb-4">
            Features
          </Badge>
          <h2 className="text-responsive-xl font-bold mb-4">Built for Every Screen Size</h2>
          <p className="text-responsive-lg text-muted-foreground max-w-3xl mx-auto">
            Our responsive design ensures your website looks and works perfectly on smartphones, tablets, laptops, and
            desktop computers.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid-responsive gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg tap-feedback ${
                  activeFeature === index ? "ring-2 ring-primary shadow-lg" : ""
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-full ${feature.bgColor} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-xs text-muted-foreground mb-4">{feature.details}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="tap-target"
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log(`Learn more about ${feature.title}`)
                    }}
                  >
                    Learn More
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {additionalFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="text-center hover:shadow-md transition-shadow tap-feedback">
                <CardContent className="pt-6">
                  <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Device Preview */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">See It In Action</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            {/* Mobile Preview */}
            <div className="relative">
              <div className="w-64 h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl">
                <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="bg-primary h-16 flex items-center justify-center">
                      <span className="text-primary-foreground font-semibold">Mobile View</span>
                    </div>
                    <div className="flex-1 p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-32 bg-gray-100 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">Mobile</Badge>
            </div>

            {/* Desktop Preview - Hidden on mobile */}
            <div className="relative hidden lg:block">
              <div className="w-96 h-64 bg-gray-900 rounded-lg p-2 shadow-2xl">
                <div className="w-full h-full bg-white rounded overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="bg-primary h-12 flex items-center justify-center">
                      <span className="text-primary-foreground font-semibold">Desktop View</span>
                    </div>
                    <div className="flex-1 p-6 grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-16 bg-gray-100 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-16 bg-gray-100 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-16 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">Desktop</Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
