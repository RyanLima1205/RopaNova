"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Landing page for the live Pago Azul redirect flow (see app/api/azul/return/route.ts).
 * Not reached by the current mocked checkout — that flow confirms inline on
 * /producto/[id]/comprar. TODO(azul-integration): once wired for real, this page
 * (or the return route itself) should look up the order created server-side from
 * `orderDraftId` and show its order code here instead of relying on query params.
 */
export default function CheckoutConfirmacionPage() {
  const params = useSearchParams()
  const approved = params.get("approved") === "true"

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-3">
          {approved ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-semibold">¡Pago aprobado!</h2>
              <p className="text-sm text-gray-600">Tu pedido fue confirmado. Recibirás un recibo por correo.</p>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">Pago no completado</h2>
              <p className="text-sm text-gray-600">El pago con Pago Azul no se pudo procesar. Intenta de nuevo.</p>
            </>
          )}
          <Link href="/">
            <Button variant="outline">Volver al inicio</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
