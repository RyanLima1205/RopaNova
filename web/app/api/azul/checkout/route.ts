import { NextRequest, NextResponse } from "next/server"
import { createPaymentPageRequest } from "@/lib/azul/client"

/**
 * Starts a Pago Azul payment. Runs server-side so AZUL_AUTH_KEY never reaches the
 * browser. See web/lib/azul/client.ts for the mocked-vs-live behavior.
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { orderDraftId, amountCents, itbisCents, orderNumber, returnUrl } = body ?? {}

  if (!orderDraftId || !amountCents || !orderNumber || !returnUrl) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 })
  }

  try {
    const result = await createPaymentPageRequest({
      orderDraftId,
      amountCents,
      itbisCents: itbisCents ?? 0,
      orderNumber,
      returnUrl,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "AZUL_ERROR", message: (error as Error).message }, { status: 502 })
  }
}
