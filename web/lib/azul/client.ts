/**
 * Pago Azul (Dominican Republic card processor) integration point.
 *
 * STATUS: scaffolded, no live credentials. `isConfigured()` is false until
 * AZUL_MERCHANT_ID / AZUL_AUTH_KEY are set (see web/.env.example), so
 * `createPaymentPageRequest` returns a mocked "approved" result and the
 * checkout flow in app/producto/[id]/comprar never actually leaves RopaNova —
 * useful for building/testing the rest of the flow before Azul grants sandbox
 * access.
 *
 * SECURITY: this module must only ever run server-side (API routes / server
 * actions). AZUL_AUTH_KEY is a merchant secret — never expose it to the
 * browser, and never build a raw card-number/CVV input that posts to your
 * own server. Azul's "Payment Page" is a *hosted, redirect-based* checkout:
 * the cardholder enters their card details on Azul's own page, so RopaNova
 * never touches raw PAN/CVV data and stays out of PCI-DSS SAQ D scope. Keep
 * it that way — do not replace this with a client-side card form.
 *
 * Docs (once you have merchant access): https://dev.azul.com.do
 */

export interface AzulPaymentRequest {
  /** RopaNova order draft reference — used to look up the pending order when Azul redirects back. */
  orderDraftId: string
  /** Total amount in DOP, in cents (Azul's API expects integer cents). */
  amountCents: number
  itbisCents: number
  orderNumber: string
  returnUrl: string
}

export interface AzulPaymentResult {
  approved: boolean
  mocked: boolean
  authorizationCode?: string
  responseMessage: string
  dateTime: string
  /** Present only in "live" mode — where to send the customer to enter card details. */
  redirectUrl?: string
  /** Present only in "live" mode — hidden form fields to POST alongside the redirect. */
  formFields?: Record<string, string>
}

function isConfigured(): boolean {
  return Boolean(process.env.AZUL_MERCHANT_ID && process.env.AZUL_AUTH_KEY)
}

export async function createPaymentPageRequest(req: AzulPaymentRequest): Promise<AzulPaymentResult> {
  if (!isConfigured()) {
    // No sandbox/production credentials yet — short-circuit with a mocked approval
    // so the rest of the checkout flow (order creation, confirmation, email receipt)
    // can be built and tested end-to-end.
    return {
      approved: true,
      mocked: true,
      authorizationCode: `MOCK-${Date.now().toString(36).toUpperCase()}`,
      responseMessage: "APROBADA (simulada — Pago Azul no está configurado)",
      dateTime: new Date().toISOString(),
    }
  }

  // TODO(azul-integration): once AZUL_MERCHANT_ID / AZUL_AUTH_KEY are set, build the
  // real Payment Page request per Azul's docs — merchant fields, amount/itbis in cents,
  // a hash/signature over the fields using AZUL_AUTH_KEY, and the redirect URL to their
  // hosted checkout. Return { approved: false, mocked: false, redirectUrl, formFields, ... }
  // and have the client auto-submit an HTML form to `redirectUrl` with `formFields`.
  throw new Error(
    "Pago Azul credentials are set but the live request builder is not implemented yet — see TODO in web/lib/azul/client.ts",
  )
}

export { isConfigured as isAzulConfigured }
