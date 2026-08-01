"use client"

import { ArrowLeft, Truck, MapPin, PackageCheck, ShieldCheck, Clock } from "lucide-react"
import Link from "next/link"
import { LegalDocsLinks } from "@/components/legal-docs-links"

export default function EntregaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link href="/configuracion" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">Política de Envío y Entrega</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Document Info Card */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-start gap-3">
            <Truck className="h-6 w-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 mb-2">Política de Envío y Entrega de RopaNova</h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600 mt-0.5" />
                  <div className="text-sm text-emerald-800">
                    <p className="font-medium mb-1">Cobertura en toda República Dominicana</p>
                    <p>
                      Cada vendedor define qué modalidades de entrega ofrece para sus artículos. Verás las opciones
                      disponibles y su costo antes de confirmar tu compra.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">1</span>
                Modalidades de entrega
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Según lo que habilite cada vendedor, un artículo puede ofrecer una o varias de estas opciones:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Recoger en persona:</strong> coordinas con el vendedor un punto de encuentro, sin costo de envío.</li>
                  <li><strong>Envío a domicilio:</strong> el costo varía según la ciudad de entrega y se muestra en el checkout antes de pagar.</li>
                  <li><strong>Envío a punto de recogida:</strong> gratis, coordinado directamente con el vendedor.</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">2</span>
                Costos de envío
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  El costo del envío a domicilio lo fija cada vendedor por ciudad y se suma al subtotal junto con la
                  comisión de servicio (5%) antes de confirmar el pago. Todos los montos se muestran en pesos
                  dominicanos (RD$ / DOP).
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">3</span>
                Tiempos estimados
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>Confirmación del vendedor</span>
                  <span className="font-medium">Hasta 24-48 horas</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>Envío a domicilio (Santo Domingo y Santiago)</span>
                  <span className="font-medium">1-3 días hábiles</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>Envío a domicilio (resto del país)</span>
                  <span className="font-medium">2-5 días hábiles</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>Recogida en persona / punto de recogida</span>
                  <span className="font-medium">Según coordinación con el vendedor</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Los tiempos son estimados y pueden variar según el vendedor y la disponibilidad del transportista.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">4</span>
                Seguimiento de tu pedido
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Cada pedido pasa por estos estados, visibles en «Mis Pedidos»:</p>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">Pendiente</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">Confirmado</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-purple-100 text-purple-800">Enviado</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-green-100 text-green-800">Entregado</span>
                </div>
                <p>
                  Cuando el vendedor marca el pedido como «Enviado», puede añadir un número de guía/tracking y una
                  fecha estimada de entrega, visibles en el detalle del pedido.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">5</span>
                Seguro de envío opcional
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Al momento de comprar puedes añadir un seguro opcional (5% del subtotal) que cubre reembolso
                      total si el paquete no llega, llega dañado o no corresponde con la descripción. Ver la{" "}
                      <Link href="/devoluciones" className="underline font-medium">
                        Política de Devoluciones
                      </Link>{" "}
                      para el proceso completo.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">6</span>
                Si tu pedido no llega a tiempo
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  Si el tiempo estimado de entrega venció y el estado no cambió, contacta primero al vendedor desde
                  el chat del pedido. Si no obtienes respuesta en 48 horas, comunícate con soporte de RopaNova con tu
                  código de pedido a mano.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-emerald-600" />
            Contacto sobre Envíos
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span>ayuda@ropanova.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Teléfono:</span>
                <span>+1 (809) 555-0123</span>
              </div>
            </div>
          </div>
        </div>

        <LegalDocsLinks current="/entrega" />

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pb-8">
          <p>© 2025 RopaNova. Todos los derechos reservados.</p>
          <p className="mt-1 text-amber-600 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" /> Documento en borrador — pendiente de revisión antes de su publicación definitiva.
          </p>
        </div>
      </div>
    </div>
  )
}
