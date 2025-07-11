"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, Info, Eye, CheckCircle, AlertCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface ConditionDetailsCardProps {
  conditionDetails: {
    overall: string
    rating: number
    details: Array<{
      aspect: string
      condition: string
      description: string
    }>
    photos: string[]
  }
}

export function ConditionDetailsCard({ conditionDetails }: ConditionDetailsCardProps) {
  const [showPhotos, setShowPhotos] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(0)

  const getConditionIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "perfecta":
      case "incluidas":
      case "nuevo":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "buena":
      case "muy buena":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "aceptable":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "mala":
      case "dañada":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "perfecta":
      case "incluidas":
      case "nuevo":
        return "bg-green-50 text-green-700 border-green-200"
      case "buena":
      case "muy buena":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "aceptable":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "mala":
      case "dañada":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getOverallConditionScore = () => {
    return (conditionDetails.rating / 5) * 100
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Estado del Producto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Condition */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900">Estado General</h3>
              <p className="text-sm text-gray-600">Evaluación completa del producto</p>
            </div>
            <Badge variant="outline" className={`${getConditionColor(conditionDetails.overall)} font-medium`}>
              {conditionDetails.overall}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Puntuación de estado</span>
              <span className="font-medium">{conditionDetails.rating}/5</span>
            </div>
            <Progress value={getOverallConditionScore()} className="h-2" />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= conditionDetails.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Aspects */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Detalles por Aspecto</h4>
          <div className="space-y-3">
            {conditionDetails.details.map((detail, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">{getConditionIcon(detail.condition)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-sm text-gray-900">{detail.aspect}</h5>
                    <Badge variant="outline" className={`text-xs ${getConditionColor(detail.condition)}`}>
                      {detail.condition}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{detail.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Condition Photos */}
        {conditionDetails.photos && conditionDetails.photos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Fotos del Estado</h4>
              <Dialog open={showPhotos} onOpenChange={setShowPhotos}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-transparent">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver todas ({conditionDetails.photos.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Fotos del Estado del Producto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Main Photo */}
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={conditionDetails.photos[selectedPhoto] || "/placeholder.svg"}
                        alt={`Estado del producto ${selectedPhoto + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Photo Thumbnails */}
                    {conditionDetails.photos.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {conditionDetails.photos.map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedPhoto(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                              selectedPhoto === index ? "border-emerald-500" : "border-gray-200"
                            }`}
                          >
                            <Image
                              src={photo || "/placeholder.svg"}
                              alt={`Miniatura ${index + 1}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-gray-600 text-center">
                      Foto {selectedPhoto + 1} de {conditionDetails.photos.length}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Photo Preview Grid */}
            <div className="grid grid-cols-3 gap-2">
              {conditionDetails.photos.slice(0, 3).map((photo, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image src={photo || "/placeholder.svg"} alt={`Estado ${index + 1}`} fill className="object-cover" />
                  {index === 2 && conditionDetails.photos.length > 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">+{conditionDetails.photos.length - 3}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust Indicator */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="font-medium text-emerald-800 text-sm">Estado Verificado</span>
          </div>
          <p className="text-xs text-emerald-700">
            El vendedor ha proporcionado fotos detalladas y descripción completa del estado del producto.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
