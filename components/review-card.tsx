"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, Shield, ThumbsUp, MessageCircle, Check, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ReviewCardProps {
  review: any
  isSeller?: boolean
  showProduct?: boolean
  onResponseSubmit?: (reviewId: number, response: string) => void
  onPrivateMessage?: (reviewId: number, buyerId: string, message: string) => void
}

export function ReviewCard({
  review,
  isSeller = false,
  showProduct = false,
  onResponseSubmit,
  onPrivateMessage,
}: ReviewCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [showPrivateMessageDialog, setShowPrivateMessageDialog] = useState(false)
  const [responseText, setResponseText] = useState("")
  const [privateMessage, setPrivateMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingPrivate, setIsSubmittingPrivate] = useState(false)

  const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    }

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  const handleResponseSubmit = async () => {
    if (!responseText.trim()) return

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (onResponseSubmit) {
        onResponseSubmit(review.id, responseText)
      }

      setShowResponseForm(false)
      setResponseText("")
    } catch (error) {
      console.error("Error submitting response:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrivateMessageSubmit = async () => {
    if (!privateMessage.trim()) return

    setIsSubmittingPrivate(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (onPrivateMessage) {
        onPrivateMessage(review.id, review.buyerId || "buyer1", privateMessage)
      }

      setShowPrivateMessageDialog(false)
      setPrivateMessage("")
    } catch (error) {
      console.error("Error sending private message:", error)
    } finally {
      setIsSubmittingPrivate(false)
    }
  }

  const getPrivateMessageTemplate = () => {
    if (review.rating <= 3) {
      return `Hola ${review.buyerName.split(" ")[0]}, 

He visto tu reseña sobre ${review.productTitle || "tu compra reciente"} y me gustaría hablar contigo para resolver cualquier inconveniente que hayas tenido.

Tu satisfacción es muy importante para mí y me encantaría encontrar una solución.

¿Podrías contarme más detalles sobre lo que pasó?

Saludos,
María`
    } else {
      return `Hola ${review.buyerName.split(" ")[0]},

¡Muchas gracias por tu excelente reseña sobre ${review.productTitle || "tu compra"}! 

Me alegra mucho saber que estás contenta con tu compra. Clientes como tú hacen que mi trabajo sea muy gratificante.

Si necesitas algo más en el futuro, no dudes en contactarme.

¡Saludos!
María`
    }
  }

  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-b-0">
      {/* Buyer Information */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={review.buyerAvatar || "/placeholder.svg"} alt={review.buyerName} />
          <AvatarFallback>
            {review.buyerName
              .split(" ")
              .map((n: string) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{review.buyerName}</span>
            {review.verified && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            )}
            {review.hasPrivateConversation && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                <Mail className="h-3 w-3 mr-1" />
                Conversación privada
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-gray-500">{review.date}</span>
          </div>
          {showProduct && review.productTitle && (
            <p className="text-xs text-gray-600 mb-1">Producto: {review.productTitle}</p>
          )}
        </div>
      </div>

      {/* Review Content */}
      <p className="text-sm text-gray-700 mb-3 leading-relaxed">{review.comment}</p>

      {/* Category Ratings */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Comunicación</span>
          <StarRating rating={review.categories.comunicacion} size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Descripción</span>
          <StarRating rating={review.categories.descripcion} size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Envío</span>
          <StarRating rating={review.categories.envio} size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Calidad</span>
          <StarRating rating={review.categories.calidad} size="sm" />
        </div>
      </div>

      {/* Review Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-3">
          {review.photos.map((photo: string, index: number) => (
            <Image
              key={index}
              src={photo || "/placeholder.svg"}
              alt={`Foto de reseña ${index + 1}`}
              width={60}
              height={60}
              className="w-15 h-15 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="sm" className="text-xs text-gray-500 h-8">
          <ThumbsUp className="h-3 w-3 mr-1" />
          Útil ({review.helpful})
        </Button>

        {isSeller && (
          <div className="flex gap-2">
            {/* Private Message Button */}
            <Dialog open={showPrivateMessageDialog} onOpenChange={setShowPrivateMessageDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs h-8 text-blue-600 hover:bg-blue-50">
                  <Mail className="h-3 w-3 mr-1" />
                  Mensaje Privado
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Mensaje Privado a {review.buyerName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Reseña original:</p>
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">{review.comment}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Tu mensaje</label>
                    <Textarea
                      placeholder="Escribe tu mensaje privado..."
                      value={privateMessage}
                      onChange={(e) => setPrivateMessage(e.target.value)}
                      className="min-h-[120px] text-sm"
                    />
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 hover:bg-blue-50 h-6"
                        onClick={() => setPrivateMessage(getPrivateMessageTemplate())}
                      >
                        Usar plantilla sugerida
                      </Button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      <strong>Nota:</strong> Este mensaje será privado y solo lo verá {review.buyerName.split(" ")[0]}.
                      Úsalo para resolver problemas o agradecer por reseñas positivas.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setShowPrivateMessageDialog(false)
                        setPrivateMessage("")
                      }}
                      disabled={isSubmittingPrivate}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                      onClick={handlePrivateMessageSubmit}
                      disabled={!privateMessage.trim() || isSubmittingPrivate}
                    >
                      {isSubmittingPrivate ? "Enviando..." : "Enviar Mensaje"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Public Response Button */}
            {!review.sellerResponse && !showResponseForm && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-emerald-500 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                onClick={() => setShowResponseForm(true)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Responder
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Seller Response Form */}
      {isSeller && showResponseForm && (
        <div className="bg-gray-50 p-3 rounded-lg mb-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Respuesta pública a esta reseña</p>
          <Textarea
            placeholder="Escribe tu respuesta pública..."
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            className="min-h-[80px] text-sm mb-2"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                setShowResponseForm(false)
                setResponseText("")
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              className="text-xs h-8 bg-emerald-500 hover:bg-emerald-600"
              onClick={handleResponseSubmit}
              disabled={!responseText.trim() || isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Respuesta"}
            </Button>
          </div>
        </div>
      )}

      {/* Seller Response Display */}
      {review.sellerResponse && (
        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={review.sellerAvatar || "/placeholder.svg"} alt="Vendedor" />
              <AvatarFallback>V</AvatarFallback>
            </Avatar>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-900">Respuesta del Vendedor</span>
              <Badge
                variant="outline"
                className="ml-2 text-[10px] py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                <Check className="h-2 w-2 mr-1" />
                Vendedor
              </Badge>
            </div>
            <span className="text-xs text-gray-500 ml-auto">{review.sellerResponseDate || "Hace 2 días"}</span>
          </div>
          <p className="text-sm text-gray-700">{review.sellerResponse}</p>
        </div>
      )}
    </div>
  )
}
