"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Flag, MessageCircle, Home, MapPin, Info, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getProduct, checkIfFavorited, addToFavorites, removeFromFavorites } from "@/lib/services/productService"
import { formatPrice } from "@/lib/formatters"
import type { Product } from "@/lib/types"
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "@/hooks/use-toast"
import { db } from "@/lib/firebaseConfig"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { createConversationIfNeeded } from "@/lib/services/chatService"
import { SellerProfileCard } from "@/components/seller-profile-card"
import { ConditionDetailsCard } from "@/components/condition-details-card"
import { SafetyFeaturesCard } from "@/components/safety-features-card"
import { MobileSwipeGallery } from "@/components/mobile-swipe-gallery"

const REPORT_REASONS = [
  "Producto falso o engañoso",
  "Precio incorrecto o sospechoso",
  "Fotos inapropiadas",
  "Vendedor fraudulento",
  "Contenido prohibido",
  "Otro",
]

/** Mismos umbrales que mobile-app ProductDetailScreen.tsx (getConditionColor / getConditionLabel). */
function getConditionColor(value: number) {
  if (value >= 9) return "#1F7EF5"
  if (value >= 7) return "#eab308"
  return "#ef4444"
}
function getConditionLabel(value: number) {
  if (value >= 9) return "Excelente"
  if (value >= 7) return "Bueno"
  if (value >= 5) return "Regular"
  return "Malo"
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [selectedSize, setSelectedSize] = useState("")
  const [contactLoading, setContactLoading] = useState(false)
  const { addToRecentlyViewed } = useRecentlyViewed()

  const [showReportSheet, setShowReportSheet] = useState(false)
  const [showReportInput, setShowReportInput] = useState(false)
  const [reportCustomReason, setReportCustomReason] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchProduct = async () => {
      const productData = await getProduct(productId)
      if (cancelled) return
      if (productData) {
        setProduct(productData)
        if (productData.stock && productData.stock.length === 1) {
          setSelectedSize(productData.stock[0]?.talla || "")
        }
        if (user?.id) {
          const favorited = await checkIfFavorited(productId, user.id)
          if (!cancelled) setIsFavorited(favorited)
        }
        addToRecentlyViewed(productData)
      } else {
        setNotFound(true)
      }
    }

    fetchProduct()
    return () => {
      cancelled = true
    }
  }, [productId, user?.id, addToRecentlyViewed])

  const isOwnProduct = Boolean(user?.id && product?.seller?.id && user.id === product.seller.id)

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Este producto no está disponible.</p>
          <Link href="/" className="text-brand-ui hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-ui mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    )
  }

  const handleToggleFavorite = async () => {
    if (!user?.id) {
      toast({ title: "Inicio de sesión requerido", description: "Inicia sesión para agregar a favoritos" })
      return
    }
    try {
      if (isFavorited) {
        await removeFromFavorites(productId, user.id)
        setIsFavorited(false)
        setProduct((p) => (p ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p))
      } else {
        await addToFavorites(productId, user.id, product)
        setIsFavorited(true)
        setProduct((p) => (p ? { ...p, likes: (p.likes || 0) + 1 } : p))
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar tus favoritos", variant: "destructive" })
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Mira este ${product.title} por solo ${formatPrice(product.price)}`,
        url: window.location.href,
      })
    } else {
      const message = `¡Mira este ${product.title} por solo ${formatPrice(product.price)}! 🛍️\n\nVendedor: ${product.seller?.name ?? ""} ⭐${product.seller?.rating ?? ""}\nUbicación: ${product.location}\n\n${window.location.href}\n\n¡Disponible en RopaNova! 🇩🇴`
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")
    }
  }

  const handleContactSeller = async () => {
    if (!user?.id) {
      toast({ title: "Inicio de sesión requerido", description: "Inicia sesión para contactar al vendedor" })
      return
    }
    if (!product.seller?.id) {
      toast({ title: "Error", description: "No se pudo contactar al vendedor", variant: "destructive" })
      return
    }
    setContactLoading(true)
    try {
      const conversationId = await createConversationIfNeeded(user.id, product.seller.id, {
        id: product.id,
        title: product.title,
      })
      const qs = new URLSearchParams({
        productId: product.id,
        productTitle: product.title,
        productPrice: String(product.price),
        productImage: product.images?.[0] || product.image || "",
        sellerId: product.seller.id,
        sellerName: product.seller.name,
      })
      if (selectedSize) qs.set("selectedSize", selectedSize)
      router.push(`/mensajes/${conversationId}?${qs.toString()}`)
    } catch {
      toast({ title: "Error", description: "No se pudo abrir el chat", variant: "destructive" })
    }
    setContactLoading(false)
  }

  const handleBuyNow = () => {
    if (product.stock && product.stock.length > 1 && !selectedSize) {
      toast({ title: "Selección requerida", description: "Por favor selecciona una talla antes de Comprar" })
      return
    }
    const sizeToBuy = selectedSize || (product.stock && product.stock.length === 1 ? product.stock[0].talla : "")
    if (!sizeToBuy) {
      toast({ title: "Error", description: "No hay tallas disponibles para este producto", variant: "destructive" })
      return
    }
    router.push(`/producto/${product.id}/comprar?size=${encodeURIComponent(sizeToBuy)}`)
  }

  const handleOpenReport = () => {
    if (!user?.id) {
      toast({ title: "Inicio de sesión requerido", description: "Inicia sesión para reportar este anuncio." })
      return
    }
    if (isOwnProduct) {
      toast({ title: "No permitido", description: "No puedes reportar tu propio anuncio." })
      return
    }
    setReportCustomReason("")
    setShowReportInput(false)
    setShowReportSheet(true)
  }

  const handleSubmitReport = async (reason: string) => {
    if (!user?.id) return
    setReportSubmitting(true)
    try {
      await addDoc(collection(db, "reports"), {
        productId,
        productTitle: product.title,
        sellerId: product.seller?.id ?? null,
        reporterId: user.id,
        reason,
        createdAt: serverTimestamp(),
      })
      setShowReportSheet(false)
      toast({
        title: "Reporte enviado",
        description: "Gracias por ayudarnos a mantener RopaNova seguro. Revisaremos tu reporte a la brevedad.",
      })
    } catch {
      toast({ title: "Error", description: "No se pudo enviar el reporte. Intenta de nuevo.", variant: "destructive" })
    }
    setReportSubmitting(false)
  }

  const hasMeasurements =
    product.measurements &&
    (product.measurements.chest ||
      product.measurements.waist ||
      product.measurements.length ||
      product.measurements.shoulders ||
      product.measurements.hips ||
      product.measurements.inseam)

  const measurementLabels: Record<string, string> = {
    chest: "Pecho/Busto",
    waist: "Cintura",
    length: "Largo",
    shoulders: "Hombros",
    hips: "Cadera",
    inseam: "Entrepierna",
  }

  const hasConditionBars = Boolean(product.estadoGeneral || product.estadoTelaMaterial)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="p-2 -ml-2">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <div className="flex items-center gap-2">
            {!isOwnProduct && (
              <Button variant="ghost" size="sm" onClick={handleOpenReport}>
                <Flag className="h-5 w-5 text-gray-600" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="pb-20">
        {/* Mobile Swipe Gallery */}
        <MobileSwipeGallery
          images={product.images && product.images.length > 0 ? product.images : [product.image]}
          title={product.title}
          onShare={handleShare}
          onFavorite={handleToggleFavorite}
          isFavorited={isFavorited}
        />

        <div className="p-4 space-y-4">
          {/* Price and Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-lg text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{product.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {product.brand && <Badge variant="outline">{product.brand}</Badge>}
              {product.sizes?.map((size) => (
                <Badge key={size} variant="outline">
                  {size}
                </Badge>
              ))}
              <Badge variant="outline">{product.condition}</Badge>
            </div>
          </div>

          {/* Selección de talla */}
          {product.stock && product.stock.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {product.stock.length === 1 ? "Talla Disponible" : "Selecciona tu Talla"}
                </h3>
                {product.stock.length > 1 && <p className="text-xs text-gray-500 mb-3">Toca una talla para seleccionarla</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.stock.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (product.stock && product.stock.length > 1) setSelectedSize(item.talla)
                      }}
                      disabled={product.stock.length === 1}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                        selectedSize === item.talla ? "border-brand-ui bg-brand-extraLight text-brand-dark" : "border-gray-200 text-gray-700"
                      }`}
                    >
                      {item.talla}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Descripción</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
            </CardContent>
          </Card>

          {/* Seller Profile Card */}
          {product.seller && <SellerProfileCard seller={product.seller} />}

          {/* Condition Details Card */}
          {product.conditionDetails && <ConditionDetailsCard conditionDetails={product.conditionDetails} />}

          {/* Estado del Producto — barras con datos reales (estadoGeneral / estadoTelaMaterial) */}
          {hasConditionBars && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Estado del Producto</h3>
                {typeof product.estadoGeneral === "number" && product.estadoGeneral > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-600">Evaluación General</span>
                      <span className="font-medium" style={{ color: getConditionColor(product.estadoGeneral) }}>
                        {product.estadoGeneral}/10 - {getConditionLabel(product.estadoGeneral)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(product.estadoGeneral / 10) * 100}%`, backgroundColor: getConditionColor(product.estadoGeneral) }}
                      />
                    </div>
                  </div>
                )}
                {typeof product.estadoTelaMaterial === "number" && product.estadoTelaMaterial > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-600">Estado de la Tela</span>
                      <span className="font-medium" style={{ color: getConditionColor(product.estadoTelaMaterial) }}>
                        {product.estadoTelaMaterial}/10 - {getConditionLabel(product.estadoTelaMaterial)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(product.estadoTelaMaterial / 10) * 100}%`,
                          backgroundColor: getConditionColor(product.estadoTelaMaterial),
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Medidas */}
          {hasMeasurements && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Medidas</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(measurementLabels).map(([key, label]) => {
                    const value = product.measurements?.[key as keyof typeof product.measurements]
                    if (!value) return null
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{label}:</span>
                        <span className="font-medium">{value} cm</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entrega y Envío */}
          {product.tipoDeEntregaPermitida && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Entrega y Envío</h3>

                {product.tipoDeEntregaPermitida.recogidaEnPersona && (
                  <div className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-brand-ui" />
                      <span className="text-sm font-medium text-gray-900">Recogida en persona</span>
                      <Badge variant="secondary" className="text-[10px] ml-auto">
                        GRATIS
                      </Badge>
                    </div>
                    {product.ciudadRecogidaEnPersona && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5" /> {product.ciudadRecogidaEnPersona} · Acordar con vendedor
                      </div>
                    )}
                  </div>
                )}

                {product.tipoDeEntregaPermitida.envioADomicilio && (
                  <div className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Envío a domicilio</span>
                    </div>
                    {product.ciudadesParaEnvioADomicilio && product.ciudadesParaEnvioADomicilio.length > 0 && (
                      <>
                        <div className="space-y-1.5">
                          {product.ciudadesParaEnvioADomicilio.map((cityData, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1 text-gray-600">
                                <MapPin className="h-3 w-3" /> {cityData.ciudad}
                              </span>
                              <span className="font-medium text-gray-900">{formatPrice(parseInt(cityData.precio) || 0)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-start gap-1.5 mt-2 text-xs text-brand-dark">
                          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          Solo disponible en {product.ciudadesParaEnvioADomicilio.map((c) => c.ciudad).join(", ")}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {product.tipoDeEntregaPermitida.envioAPuntoDeRecogida && (
                  <div className="border border-gray-100 rounded-lg p-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-gray-900">Envío a punto de recogida</span>
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      GRATIS
                    </Badge>
                  </div>
                )}

                {product.instruccionesParaEntrega && (
                  <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {product.instruccionesParaEntrega}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Safety Features Card */}
          <SafetyFeaturesCard sellerLocation={product.seller?.location ?? product.location} productPrice={product.price} />

          {/* Product Details */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Detalles del Producto</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoría:</span>
                  <span className="font-medium">{product.category || "—"}</span>
                </div>
                {product.subcategory && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subcategoría:</span>
                    <span className="font-medium">{product.subcategory}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Marca:</span>
                  <span className="font-medium">{product.brand || "—"}</span>
                </div>
                {product.material && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Material:</span>
                    <span className="font-medium">{product.material}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium">{product.condition}</span>
                </div>
                {product.autenticidad && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Autenticidad:</span>
                    <span className="font-medium">{product.autenticidad}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Ubicación:</span>
                  <span className="font-medium">{product.location || "—"}</span>
                </div>
                {product.postedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Publicado:</span>
                    <span className="font-medium">{product.postedDate}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 px-1">
            <span>{product.views ?? 0} visualizaciones</span>
            <span>{product.likes ?? 0} me gusta</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleContactSeller} disabled={contactLoading}>
            {contactLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
            Mensaje
          </Button>
          <Button className="flex-1 bg-brand-ui hover:bg-brand-dark" onClick={handleBuyNow}>
            Comprar Ahora
          </Button>
        </div>
      </div>

      {/* Report Sheet */}
      <Sheet open={showReportSheet} onOpenChange={(open) => !reportSubmitting && setShowReportSheet(open)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          {showReportInput ? (
            <>
              <button
                onClick={() => {
                  setShowReportInput(false)
                  setReportCustomReason("")
                }}
                className="flex items-center gap-1 text-sm text-gray-500 mb-3"
              >
                <ArrowLeft className="h-4 w-4" /> Volver
              </button>
              <SheetHeader className="text-left">
                <SheetTitle>Otro motivo</SheetTitle>
              </SheetHeader>
              <p className="text-sm text-gray-500 mt-1 mb-3">Describe brevemente el problema con este anuncio.</p>
              <Textarea
                value={reportCustomReason}
                onChange={(e) => setReportCustomReason(e.target.value.slice(0, 300))}
                rows={4}
                placeholder="Escribe aquí..."
              />
              <p className="text-xs text-gray-400 text-right mt-1 mb-3">{reportCustomReason.length}/300</p>
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={!reportCustomReason.trim() || reportSubmitting}
                onClick={() => handleSubmitReport(reportCustomReason.trim())}
              >
                {reportSubmitting ? "Enviando..." : "Enviar reporte"}
              </Button>
            </>
          ) : (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>Reportar anuncio</SheetTitle>
              </SheetHeader>
              <p className="text-sm text-gray-500 mt-1 mb-3">¿Por qué quieres reportar este anuncio?</p>
              <div className="divide-y divide-gray-100">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    disabled={reportSubmitting}
                    onClick={() => (reason === "Otro" ? setShowReportInput(true) : handleSubmitReport(reason))}
                    className="w-full text-left py-3 text-sm text-gray-900 disabled:opacity-60"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-3" onClick={() => setShowReportSheet(false)} disabled={reportSubmitting}>
                Cancelar
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
