"use client"

import { ArrowLeft, RotateCcw, PackageX, ShieldCheck, AlertTriangle, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { LegalDocsLinks } from "@/components/legal-docs-links"

export default function DevolucionesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link href="/configuracion" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">Política de Devoluciones</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Document Info Card */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-start gap-3">
            <RotateCcw className="h-6 w-6 text-emerald-600 mt-1" />
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 mb-2">Política de Devoluciones y Reembolsos de RopaNova</h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5" />
                  <div className="text-sm text-emerald-800">
                    <p className="font-medium mb-1">Protección al Comprador</p>
                    <p>
                      Si un artículo no llega, llega dañado o no corresponde con la descripción, puedes solicitar
                      una devolución o reembolso siguiendo el proceso descrito abajo.
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
                Alcance
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  RopaNova es un mercado (marketplace) que conecta compradores y vendedores de ropa de segunda
                  mano en República Dominicana. Cada venta se realiza directamente entre el comprador y el
                  vendedor; RopaNova actúa como intermediario y facilita el pago, el seguimiento del pedido y la
                  resolución de disputas descrita en esta política.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">2</span>
                Cancelación antes del envío
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  Mientras tu pedido esté en estado <strong>«Pendiente»</strong> (el vendedor aún no lo ha
                  confirmado), puedes cancelarlo sin costo desde la pantalla de detalle del pedido. Una vez que el
                  vendedor confirma el pedido, la cancelación deja de estar disponible y aplica el resto de esta
                  política.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">3</span>
                Motivos válidos para una devolución
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>El artículo no llegó dentro del plazo estimado.</li>
                  <li>El artículo llegó dañado o en mal estado.</li>
                  <li>El artículo no corresponde con la descripción, talla o fotos de la publicación.</li>
                  <li>El artículo es notoriamente falsificado cuando se anunció como original.</li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <div className="flex items-start gap-2">
                    <PackageX className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Seguro de envío opcional</p>
                      <p>
                        Si activaste el seguro opcional al momento de comprar (5% del subtotal), tu pedido tiene
                        cobertura completa: reembolso total si el producto no llega, llega dañado o no corresponde
                        con la descripción.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">4</span>
                Cómo solicitar una devolución
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>
                    Dentro de las <strong>48 horas</strong> siguientes a marcar el pedido como «Entregado» (o antes,
                    si nunca llegó), abre el detalle del pedido y contacta a soporte o al vendedor.
                  </li>
                  <li>Explica el motivo e incluye fotos o video del artículo recibido, cuando aplique.</li>
                  <li>Nuestro equipo revisa el caso junto con el vendedor y responde en un plazo máximo de 5 días hábiles.</li>
                  <li>Si procede, se acredita el reembolso según la sección 5.</li>
                </ol>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">5</span>
                Reembolsos
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>Cuando una devolución es aprobada, el reembolso se realiza de una de estas formas:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Crédito a tu Billetera RopaNova (disponible de inmediato).</li>
                  <li>Reverso al método de pago original utilizado en el checkout (Visa/Mastercard), sujeto a los tiempos del procesador de pago (Pago Azul), normalmente de 5 a 15 días hábiles.</li>
                </ul>
                <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 mt-2">
                  <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                  <p className="text-sm">
                    El costo de envío original solo se reembolsa cuando el motivo de la devolución es responsabilidad
                    del vendedor o de la entrega (artículo dañado, no llegó, no corresponde con la descripción).
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">6</span>
                Qué no cubre esta política
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                      <li>Cambio de opinión simple (talla, color o gusto) sin defecto ni error del vendedor.</li>
                      <li>Desgaste normal descrito correctamente en la publicación («Usado», «Bueno», etc.).</li>
                      <li>Solicitudes reportadas después de 48 horas de la entrega, salvo casos excepcionales.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-2 py-1 rounded">7</span>
                Disputas entre comprador y vendedor
              </h3>
              <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
                <p>
                  Si comprador y vendedor no llegan a un acuerdo, RopaNova puede mediar y tomar una decisión final
                  basada en la evidencia proporcionada por ambas partes. Reportar información falsa para obtener un
                  reembolso indebido puede resultar en la suspensión de la cuenta.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-emerald-600" />
            Contacto para Devoluciones
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

        <LegalDocsLinks current="/devoluciones" />

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pb-8">
          <p>© 2025 RopaNova. Todos los derechos reservados.</p>
          <p className="mt-1 text-amber-600">
            Documento en borrador — pendiente de revisión legal antes de su publicación definitiva.
          </p>
        </div>
      </div>
    </div>
  )
}
