"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardBrandLogos } from "@/components/card-brand-logos"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/contexts/AuthContext"
import { getProduct } from "@/lib/services/productService"
import { createOrder } from "@/lib/services/orderService"
import { getAddresses, formatAddressShort, touchAddressLastUsed, type SavedAddress } from "@/lib/services/addressService"
import { formatPrice } from "@/lib/formatters"
import type { Product } from "@/lib/types"
import {
  generateShippingOptions,
  computeCheckoutTotals,
  buildShippingLabel,
  cleanSizeQuantities,
  totalUnitsFromQuantities,
  formatSizeOrderSummary,
  productAllowsHomeDelivery,
} from "@/lib/orderCheckout"

/** Dirección legal de RopaNova mostrada en el checkout, junto a los medios de pago aceptados. */
const RN_LEGAL_ADDRESS = "[Completar con la dirección legal de RopaNova], Santo Domingo, República Dominicana"

export default function ComprarPageGate() {
  return (
    <RequireAuth>
      <ComprarPage />
    </RequireAuth>
  )
}

function ComprarPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({})
  const [selectedShipping, setSelectedShipping] = useState("")
  const [selectedDeliveryCity, setSelectedDeliveryCity] = useState("")
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [includeInsurance, setIncludeInsurance] = useState(true)

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [confirmedOrderCode, setConfirmedOrderCode] = useState<string | null>(null)

  useEffect(() => {
    getProduct(productId).then((data) => {
      setProduct(data)
      setLoading(false)
      if (data?.stock?.length) {
        setSizeQuantities({ [data.stock[0].talla]: 1 })
      } else {
        setSizeQuantities({ Único: 1 })
      }
    })
  }, [productId])

  const shippingOptions = useMemo(() => (product ? generateShippingOptions(product) : []), [product])

  useEffect(() => {
    if (shippingOptions.length > 0 && !selectedShipping) {
      setSelectedShipping(shippingOptions[0].id)
    }
  }, [shippingOptions, selectedShipping])

  const selectedShippingOption = shippingOptions.find((o) => o.id === selectedShipping)
  const homeDeliveryAllowed = product ? productAllowsHomeDelivery(product) : false
  const needsAddress = homeDeliveryAllowed && selectedShipping === "home_delivery" && Boolean(selectedDeliveryCity)

  useEffect(() => {
    if (!needsAddress || !user) return
    getAddresses(user.id).then((rows) => {
      setAddresses(rows)
      const def = rows.find((a) => a.isDefault) ?? rows[0]
      if (def) setSelectedAddressId(def.id)
    })
  }, [needsAddress, user])

  const totals = product
    ? computeCheckoutTotals(product, sizeQuantities, selectedShipping, selectedDeliveryCity, shippingOptions, includeInsurance)
    : null

  const canSubmit =
    Boolean(product) &&
    totalUnitsFromQuantities(sizeQuantities) > 0 &&
    Boolean(selectedShipping) &&
    (!homeDeliveryAllowed || selectedShipping !== "home_delivery" || (Boolean(selectedDeliveryCity) && Boolean(selectedAddressId)))

  const handlePay = async () => {
    if (!product || !user || !totals) return
    setError("")
    setIsProcessing(true)
    try {
      const draftId = `draft-${Date.now().toString(36)}`
      const res = await fetch("/api/azul/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderDraftId: draftId,
          amountCents: Math.round(totals.total * 100),
          itbisCents: 0,
          orderNumber: draftId,
          returnUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      })
      const result = await res.json()

      if (!res.ok || result.error) {
        setError("No se pudo iniciar el pago con Pago Azul. Intenta de nuevo.")
        setIsProcessing(false)
        return
      }

      if (result.redirectUrl) {
        // Modo Azul en vivo: redirigir al Payment Page hospedado por Azul.
        const form = document.createElement("form")
        form.method = "POST"
        form.action = result.redirectUrl
        for (const [key, value] of Object.entries(result.formFields ?? {})) {
          const input = document.createElement("input")
          input.type = "hidden"
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        }
        document.body.appendChild(form)
        form.submit()
        return
      }

      if (!result.approved) {
        setError(result.responseMessage || "El pago fue rechazado por Pago Azul.")
        setIsProcessing(false)
        return
      }

      const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
      const shippingLabel = buildShippingLabel(
        shippingOptions,
        selectedShipping,
        selectedDeliveryCity,
        selectedAddress ? formatAddressShort(selectedAddress) : undefined,
      )

      const { orderCode } = await createOrder({
        buyerId: user.id,
        sellerId: product.seller?.id ?? "",
        productId: product.id,
        amount: totals.total,
        productTitle: product.title,
        lineSummary: formatSizeOrderSummary(sizeQuantities),
        unitCount: totals.unitCount,
        productImage: product.image,
        sellerName: product.seller?.storeName || product.seller?.name || "Vendedor",
        sellerAvatar: product.seller?.avatar ?? "",
        shippingLabel,
        shippingMethodId: selectedShipping,
        deliveryCity: selectedDeliveryCity,
        deliveryAddressId: selectedAddress?.id,
        deliveryAddressSummary: selectedAddress ? formatAddressShort(selectedAddress) : undefined,
        includeInsurance,
        sizeQuantities: cleanSizeQuantities(sizeQuantities),
      })

      if (selectedAddress) {
        touchAddressLastUsed(user.id, selectedAddress.id).catch(() => {})
      }

      setConfirmedOrderCode(orderCode)
    } catch {
      setError("Ocurrió un error al procesar el pago. Intenta de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Producto no disponible.</p>
      </div>
    )
  }

  if (confirmedOrderCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-semibold">¡Pedido confirmado!</h2>
            <p className="text-sm text-gray-600">
              Código de pedido: <span className="font-mono font-medium">{confirmedOrderCode}</span>
            </p>
            <p className="text-xs text-gray-500">
              Te enviaremos un recibo por correo electrónico y podrás seguir el estado del pedido desde tu cuenta.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Link href="/">
                <Button variant="outline">Seguir comprando</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link href={`/producto/${productId}`} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">Confirmar compra</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Product summary */}
        <Card>
          <CardContent className="p-4 flex gap-3">
            <img src={product.image || "/placeholder.svg"} alt={product.title} className="w-16 h-16 object-cover rounded-md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{product.title}</p>
              <p className="text-emerald-600 font-bold text-sm">{formatPrice(product.price)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Sizes/quantities */}
        {product.stock && product.stock.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="font-medium text-sm mb-2">Talla y cantidad</p>
              {product.stock.map((s) => (
                <div key={s.talla} className="flex items-center justify-between text-sm">
                  <span>Talla {s.talla}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setSizeQuantities((prev) => ({ ...prev, [s.talla]: Math.max(0, (prev[s.talla] ?? 0) - 1) }))
                      }
                    >
                      -
                    </Button>
                    <span className="w-6 text-center">{sizeQuantities[s.talla] ?? 0}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setSizeQuantities((prev) => ({
                          ...prev,
                          [s.talla]: Math.min(s.cantidad, (prev[s.talla] ?? 0) + 1),
                        }))
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Shipping */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="font-medium text-sm">Método de entrega</p>
            <RadioGroup value={selectedShipping} onValueChange={setSelectedShipping} className="space-y-2">
              {shippingOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${
                    selectedShipping === opt.id ? "border-emerald-600 bg-emerald-50" : "border-gray-200"
                  }`}
                >
                  <RadioGroupItem value={opt.id} className="mt-1" />
                  <div>
                    <div className="font-medium text-sm">{opt.name}</div>
                    <div className="text-xs text-gray-500">{opt.description}</div>
                  </div>
                </label>
              ))}
              {shippingOptions.length === 0 && (
                <p className="text-sm text-gray-500">Este vendedor no configuró métodos de entrega.</p>
              )}
            </RadioGroup>

            {selectedShipping === "home_delivery" && selectedShippingOption?.cities && (
              <div>
                <p className="text-sm font-medium mb-1 mt-2">Ciudad de entrega</p>
                <Select value={selectedDeliveryCity} onValueChange={setSelectedDeliveryCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedShippingOption.cities.map((c) => (
                      <SelectItem key={c.ciudad} value={c.ciudad}>
                        {c.ciudad} — RD${Number(c.precio).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsAddress && (
              <div className="pt-2">
                <p className="text-sm font-medium mb-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Dirección de entrega
                </p>
                {addresses.length === 0 ? (
                  <Link href="/configuracion/direcciones/agregar" className="text-sm text-emerald-600 hover:underline">
                    Agregar una dirección
                  </Link>
                ) : (
                  <RadioGroup value={selectedAddressId ?? ""} onValueChange={setSelectedAddressId} className="space-y-2">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 rounded-lg border p-2 cursor-pointer text-sm ${
                          selectedAddressId === addr.id ? "border-emerald-600 bg-emerald-50" : "border-gray-200"
                        }`}
                      >
                        <RadioGroupItem value={addr.id} className="mt-1" />
                        <span>{formatAddressShort(addr)}</span>
                      </label>
                    ))}
                  </RadioGroup>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insurance */}
        <Card>
          <CardContent className="p-4">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={includeInsurance} onCheckedChange={(v) => setIncludeInsurance(v === true)} className="mt-0.5" />
              <span>
                <span className="font-medium">Añadir seguro de envío (5%)</span>
                <br />
                <span className="text-gray-500 text-xs">
                  Cobertura completa: reembolso total si el producto no llega, llega dañado o no corresponde con la
                  descripción.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Totals */}
        {totals && (
          <Card>
            <CardContent className="p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span>{formatPrice(totals.shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Comisión de servicio</span>
                <span>{formatPrice(totals.serviceFee)}</span>
              </div>
              {includeInsurance && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Seguro</span>
                  <span>{formatPrice(totals.insuranceFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                <span>Total</span>
                <span className="text-emerald-600">{formatPrice(totals.total)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">Pago seguro con Pago Azul</p>
              <CardBrandLogos />
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                Serás redirigido a la página de pago de Pago Azul para ingresar los datos de tu tarjeta de forma
                segura. RopaNova nunca almacena el número completo de tu tarjeta.
              </p>
            </div>
            <div className="text-xs text-gray-400 pt-1 border-t">
              <p className="font-medium text-gray-500">RopaNova, SRL</p>
              <p>{RN_LEGAL_ADDRESS}</p>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            disabled={!canSubmit || isProcessing}
            onClick={handlePay}
          >
            {isProcessing ? "Procesando pago..." : totals ? `Pagar ${formatPrice(totals.total)}` : "Pagar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
