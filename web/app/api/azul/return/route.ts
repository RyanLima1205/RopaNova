import { NextRequest, NextResponse } from "next/server"

/**
 * Landing point Azul redirects the browser back to after the hosted Payment Page,
 * once live credentials are configured (see web/lib/azul/client.ts). Not used by
 * the current mocked flow — the checkout page creates the order directly when
 * AzulClient returns a mocked approval.
 *
 * TODO(azul-integration): verify Azul's response signature/hash before trusting
 * `approved`, look up the pending order draft by `orderDraftId` (persisted server-side
 * when /api/azul/checkout was called, not just round-tripped in the URL like this
 * stub does), create the Firestore order via lib/services/orderService.createOrder,
 * then redirect to the confirmation page.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const orderDraftId = params.get("orderDraftId") ?? ""
  const approved = params.get("approved") === "true"

  const confirmationUrl = new URL(
    `/checkout/confirmacion?orderDraftId=${encodeURIComponent(orderDraftId)}&approved=${approved}`,
    request.url,
  )
  return NextResponse.redirect(confirmationUrl)
}

export async function POST(request: NextRequest) {
  return GET(request)
}
