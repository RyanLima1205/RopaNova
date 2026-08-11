import { createHmac, timingSafeEqual } from 'crypto'
import { defineSecret, defineString } from 'firebase-functions/params'
import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

/**
 * Secret Manager — nunca hardcodear, nunca en Firestore. Los valores reales se
 * fijan con `firebase functions:secrets:set AZUL_MERCHANT_ID` /
 * `AZUL_AUTH_KEY` (juegos de secretos separados para sandbox y producción —
 * ver docs/briefing-integration-azul.md §3.4). Cualquier función que necesite
 * estos valores debe declararlos en su propio `secrets: [azulMerchantId, azulAuthKey]`.
 */
export const azulMerchantId = defineSecret('AZUL_MERCHANT_ID')
export const azulAuthKey = defineSecret('AZUL_AUTH_KEY')

/**
 * NO es secreto — variable de entorno normal (defineString, respaldada por
 * functions/.env*), no Secret Manager. Azul la entrega junto con los accesos
 * de cada entorno; cada MerchantId transige en una sola divisa.
 *
 * PENDIENTE DE CONFIRMACIÓN POR AZUL (Luis) — "$" es el valor esperado pero no
 * confirmado todavía. Mientras no llegue esa confirmación, un fallo de AuthHash
 * en pruebas de sandbox NO debe tratarse como bug de computeAuthHash — puede
 * ser simplemente que este valor esté mal. computeAuthHash en sí ya fue
 * verificada correcta contra la documentación oficial de Azul.
 */
export const azulCurrencyCode = defineString('AZUL_CURRENCY_CODE', { default: '$' })

/**
 * MerchantName/MerchantType — sin valor real conocido en este momento (a
 * diferencia de CurrencyCode, esto ni siquiera se ha discutido con Luis
 * todavía). "ROPANOVA" es una suposición razonable para MerchantName
 * (coincide con el descriptor AltMerchantName del briefing §3.5), pero no
 * está confirmada. MerchantType se deja vacía a propósito — un campo vacío
 * hace evidente en las pruebas que falta configurarlo, en vez de simular un
 * valor plausible que oculte el hueco.
 */
export const azulMerchantName = defineString('AZUL_MERCHANT_NAME', { default: 'ROPANOVA' })
export const azulMerchantType = defineString('AZUL_MERCHANT_TYPE', { default: '' })

export interface AzulRequestHashFields {
  MerchantId: string
  MerchantName: string
  MerchantType: string
  CurrencyCode: string
  OrderNumber: string
  /** Sin coma ni punto — los últimos 2 dígitos son los decimales (p.ej. "425000" = RD$4,250.00). */
  Amount: string
  ITBIS: string
  ApprovedUrl: string
  DeclinedUrl: string
  CancelUrl: string
  UseCustomField1: string
  CustomField1Label: string
  CustomField1Value: string
  UseCustomField2: string
  CustomField2Label: string
  CustomField2Value: string
}

export interface AzulResponseHashFields {
  OrderNumber: string
  Amount: string
  AuthorizationCode: string
  DateTime: string
  ResponseCode: string
  /** `ISOCode` en el orden de concatenación del hash de respuesta; Azul también lo nombra `IsoCode` en la lista de campos — mismo valor. */
  ISOCode: string
  ResponseMessage: string
  ErrorDescription: string
  RRN: string
}

/**
 * IMPORTANTE — a diferencia del hash de solicitud (donde nosotros construimos
 * los campos), estos vienen de Azul en la querystring de retorno. Deben pasarse
 * tal cual fueron leídos (p.ej. `searchParams.get('Amount')`), SIN reparsear ni
 * reformatear Amount como número, SIN reformatear DateTime, etc. Cualquier
 * transformación cambia la cadena concatenada y el hash jamás va a coincidir.
 */
function concatenateForHash(order: string[]): string {
  return order.join('')
}

/**
 * AuthHash de solicitud — Azul Payment Page (Documento E-Commerce AZUL, 2023-08, §3.3).
 * Orden de concatenación exacto (sin separadores) + AuthKey al final, codificado en
 * UTF-16LE, HMAC-SHA512, resultado en hexadecimal minúsculas.
 *
 * Clave HMAC = bytes UTF-8 del AuthKey; mensaje = cadena concatenada en UTF-16LE.
 * Confirmado contra el PDF oficial de Azul: el ejemplo PHP oficial agrega AuthKey
 * al final del mensaje Y lo usa como clave HMAC en octetos crudos (UTF-8), con el
 * mensaje en UTF-16LE — exactamente lo implementado aquí.
 *
 * Evitar cualquier carácter acentuado en MerchantName y en los CustomField*Label/
 * Value: el ejemplo oficial convierte esos campos desde ASCII, así que una tilde o
 * una ñ ahí produce una firma que Azul no reconstruirá igual del lado suyo.
 */
export function computeAuthHash(fields: AzulRequestHashFields, authKey: string): string {
  const message = concatenateForHash([
    fields.MerchantId,
    fields.MerchantName,
    fields.MerchantType,
    fields.CurrencyCode,
    fields.OrderNumber,
    fields.Amount,
    fields.ITBIS,
    fields.ApprovedUrl,
    fields.DeclinedUrl,
    fields.CancelUrl,
    fields.UseCustomField1,
    fields.CustomField1Label,
    fields.CustomField1Value,
    fields.UseCustomField2,
    fields.CustomField2Label,
    fields.CustomField2Value,
    authKey,
  ])

  return createHmac('sha512', Buffer.from(authKey, 'utf8'))
    .update(Buffer.from(message, 'utf16le'))
    .digest('hex')
    .toLowerCase()
}

/** SHA-512 en hexadecimal = 128 caracteres. Cualquier otra cosa no es un hash válido. */
const HEX_SHA512 = /^[0-9a-f]{128}$/

/**
 * Verificación del AuthHash de respuesta — Azul Payment Page, §3.3. Recalcula el
 * hash con el mismo AuthKey y compara en tiempo constante contra el AuthHash
 * recibido. Sin esto, cualquiera puede fabricar una URL de retorno "aprobada" y
 * hacer pasar un pedido como pagado — es el punto de seguridad más crítico de
 * toda la integración (ver §3.3 y §3.11.1 del briefing).
 *
 * `receivedAuthHash` puede venir con cualquier contenido (querystring controlada
 * por el cliente) — si no es hexadecimal de 128 caracteres, `Buffer.from(x, 'hex')`
 * no lanza pero produce un buffer más corto/vacío, y `timingSafeEqual` lanza
 * RangeError al comparar tamaños distintos. Se valida el formato ANTES de tocar
 * Buffer/timingSafeEqual, así una respuesta mal formada se rechaza limpiamente
 * (false) en vez de tumbar la función con un 500.
 */
export function verifyResponseAuthHash(fields: AzulResponseHashFields, authKey: string, receivedAuthHash: string): boolean {
  const receivedNormalized = receivedAuthHash.trim().toLowerCase()
  if (!HEX_SHA512.test(receivedNormalized)) return false

  const message = concatenateForHash([
    fields.OrderNumber,
    fields.Amount,
    fields.AuthorizationCode,
    fields.DateTime,
    fields.ResponseCode,
    fields.ISOCode,
    fields.ResponseMessage,
    fields.ErrorDescription,
    fields.RRN,
    authKey,
  ])

  const computed = createHmac('sha512', Buffer.from(authKey, 'utf8'))
    .update(Buffer.from(message, 'utf16le'))
    .digest('hex')
    .toLowerCase()

  return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(receivedNormalized, 'hex'))
}

/** Sandbox únicamente — ver docs/AZUL_SANDBOX_TESTING.md. */
const AZUL_TEST_PAYMENT_PAGE_URL = 'https://pruebas.azul.com.do/paymentpage/Default.aspx'

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * SOLO PARA VALIDAR LA CADENA COMPLETA — no es el endpoint de checkout real.
 *
 * - Monto/ITBIS: fijos en duro (RD$1,000.00 / exonerado). El cálculo dinámico
 *   de ITBIS desde el carrito NO se construye aquí — eso se valida aparte
 *   antes de codificar la fórmula. Ver briefing §2.7 (ITBIS es la parte
 *   incluida en el total, nunca sumada encima).
 * - No hay lookup de pedido real, no toca Firestore, no toca /orders ni
 *   /azulTransactions. No implementa retención, comisión ni reversión a
 *   boutiques — esas reglas no están definidas (briefing §7).
 * - ApprovedUrl/DeclinedUrl/CancelUrl apuntan a pay.ropanova.com, cuyo
 *   registro ante Azul no está confirmado todavía — un primer intento puede
 *   volver con INVALID_BASEDOMAIN; no es un bug de esta función.
 * - Ninguna de las tres rutas de retorno (/aprobada, /declinada, /cancelada)
 *   está implementada todavía — no se pidió en este pase.
 */
export const payTest = onRequest(
  { secrets: [azulMerchantId, azulAuthKey], region: 'us-central1' },
  (_req, res) => {
    const orderNumber = `TEST-${Date.now()}`

    const fields: AzulRequestHashFields = {
      MerchantId: azulMerchantId.value(),
      MerchantName: azulMerchantName.value(),
      MerchantType: azulMerchantType.value(),
      CurrencyCode: azulCurrencyCode.value(),
      OrderNumber: orderNumber,
      Amount: '100000',
      ITBIS: '000',
      ApprovedUrl: 'https://pay.ropanova.com/aprobada',
      DeclinedUrl: 'https://pay.ropanova.com/declinada',
      CancelUrl: 'https://pay.ropanova.com/cancelada',
      UseCustomField1: '0',
      CustomField1Label: '',
      CustomField1Value: '',
      UseCustomField2: '0',
      CustomField2Label: '',
      CustomField2Value: '',
    }

    const authHash = computeAuthHash(fields, azulAuthKey.value())

    const hiddenInputs = Object.entries({ ...fields, AuthHash: authHash })
      .map(([name, value]) => `  <input type="hidden" name="${name}" value="${escapeHtmlAttr(value)}" />`)
      .join('\n')

    res.set('Content-Type', 'text/html; charset=utf-8')
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>RopaNova — Redirigiendo…</title>
</head>
<body>
  <p>Redirigiendo a la pasarela de pago…</p>
  <form id="azulForm" method="POST" action="${AZUL_TEST_PAYMENT_PAGE_URL}">
${hiddenInputs}
  </form>
  <script>document.getElementById('azulForm').submit();</script>
</body>
</html>`)
  },
)

// ==========================================================================
// PAYOUT — fórmulas fijadas por el negocio (ver docs/azul-etat.md). Todo en
// centavos enteros, floor en cada paso. NO incluye retención ni reversión —
// eso es fase siguiente (briefing §7, valores no arrestados aún).
// ==========================================================================

export type SellerPlan = 'START' | 'PRO' | 'ELITE'

/** Tasa de comisión en puntos base sobre 10000 (START=10%, PRO=7%, ELITE=5.5%). */
const COMMISSION_RATE_BPS: Record<SellerPlan, number> = {
  START: 1000,
  PRO: 700,
  ELITE: 550,
}

const MIN_COMMISSION_GROSS_CENTS = 6000

export interface SellerPayout {
  gmvCents: number
  sellerPlan: SellerPlan
  buyerFeeCents: number
  azulFeeCents: number
  commissionRateBps: number
  commissionGrossCents: number
  commissionNetCents: number
  payoutCents: number
}

/**
 * Fórmulas confirmadas y validadas contra la tabla de referencia
 * (GMV=RD$1,000, plan START → payout RD$840.15, frais Azul 3.4%).
 */
export function computeSellerPayout(gmvCents: number, sellerPlan: SellerPlan): SellerPayout {
  const buyerFeeCents = Math.floor((gmvCents * 25) / 1000)
  const azulFeeCents = Math.floor(((gmvCents + buyerFeeCents) * 34) / 1000)
  const commissionRateBps = COMMISSION_RATE_BPS[sellerPlan]
  const commissionGrossCents = Math.max(Math.floor((gmvCents * commissionRateBps) / 10000), MIN_COMMISSION_GROSS_CENTS)
  const commissionNetCents = commissionGrossCents - Math.floor((commissionGrossCents * 18) / 118)
  const payoutCents = gmvCents - commissionGrossCents - buyerFeeCents - azulFeeCents
  return { gmvCents, sellerPlan, buyerFeeCents, azulFeeCents, commissionRateBps, commissionGrossCents, commissionNetCents, payoutCents }
}

// ==========================================================================
// RUTAS DE RETORNO — /aprobada, /declinada, /cancelada
// ==========================================================================

function qs(query: Record<string, unknown>, key: string): string {
  const v = query[key]
  if (typeof v === 'string') return v
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  return ''
}

/** Azul documenta el campo de respuesta como `IsoCode` en un lugar y `ISOCode` en otro — se leen ambos. */
function readAzulResponseFields(query: Record<string, unknown>): AzulResponseHashFields {
  return {
    OrderNumber: qs(query, 'OrderNumber'),
    Amount: qs(query, 'Amount'),
    AuthorizationCode: qs(query, 'AuthorizationCode'),
    DateTime: qs(query, 'DateTime'),
    ResponseCode: qs(query, 'ResponseCode'),
    ISOCode: qs(query, 'IsoCode') || qs(query, 'ISOCode'),
    ResponseMessage: qs(query, 'ResponseMessage'),
    ErrorDescription: qs(query, 'ErrorDescription'),
    RRN: qs(query, 'RRN'),
  }
}

/** Clave de idempotencia: OrderNumber + AzulOrderId. Sin AzulOrderId (raro pero posible), OrderNumber solo. */
function azulTransactionDocId(orderNumber: string, azulOrderId: string): string {
  return azulOrderId ? `${orderNumber}_${azulOrderId}` : orderNumber
}

const AZUL_DEEP_LINK_BASE = 'ropanova://payment-result'

/**
 * /aprobada — la más crítica. Firma inválida o ausente → 400, CERO escritura.
 * Firma válida → transacción Firestore idempotente (get-then-set, get y set del
 * mismo doc dentro de la misma transacción evita el doble procesamiento de una
 * misma respuesta Azul entregada dos veces — reintento de red, recarga, etc.).
 */
export const azulApproved = onRequest({ secrets: [azulAuthKey], region: 'us-central1' }, async (req, res) => {
  const query = req.query as Record<string, unknown>
  const fields = readAzulResponseFields(query)
  const azulOrderId = qs(query, 'AzulOrderId')
  const receivedAuthHash = qs(query, 'AuthHash')

  if (!fields.OrderNumber || !receivedAuthHash) {
    res.status(400).send('Missing required Azul response fields')
    return
  }

  if (!verifyResponseAuthHash(fields, azulAuthKey.value(), receivedAuthHash)) {
    console.error('azulApproved: invalid AuthHash — posible respuesta falsificada', { orderNumber: fields.OrderNumber })
    res.status(400).send('Invalid signature')
    return
  }

  const db = admin.firestore()
  const ref = db.collection('azulTransactions').doc(azulTransactionDocId(fields.OrderNumber, azulOrderId))

  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (snap.exists) return 'already-processed' as const

    const amountCents = parseInt(fields.Amount, 10) || 0
    // PLACEHOLDER de fase de prueba: payTest todavía no separa GMV de buyerFee
    // (Amount es un monto de prueba fijo, sin pedido real detrás). gmvCents =
    // amountCents hasta que esta ruta esté conectada a un pedido real con su
    // propio GMV. TODO: leer GMV del pedido real, no derivarlo de Amount.
    const gmvCents = amountCents
    // TODO: leer desde users/{sellerId}.plan cuando ese campo se use de verdad.
    const sellerPlan: SellerPlan = 'START'
    const payout = computeSellerPayout(gmvCents, sellerPlan)

    tx.set(ref, {
      status: 'approved',
      orderNumber: fields.OrderNumber,
      azulOrderId,
      amountRaw: fields.Amount,
      amountCents,
      authorizationCode: fields.AuthorizationCode,
      dateTime: fields.DateTime,
      responseCode: fields.ResponseCode,
      isoCode: fields.ISOCode,
      responseMessage: fields.ResponseMessage,
      errorDescription: fields.ErrorDescription,
      rrn: fields.RRN,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...payout,
      // Reservados, no activados — se completan cuando el pedido pase a 'shipped'
      // (mecanismo de liberación aún no construido, ver docs/azul-etat.md).
      retentionStartsAt: null,
      retentionReleasesAt: null,
      retentionReleased: false,
    })
    return 'created' as const
  })

  console.log('azulApproved', { orderNumber: fields.OrderNumber, azulOrderId, authorizationCode: fields.AuthorizationCode, rrn: fields.RRN, outcome })

  res.redirect(302, `${AZUL_DEEP_LINK_BASE}?orderNumber=${encodeURIComponent(fields.OrderNumber)}&status=approved`)
})

/**
 * /declinada — misma verificación de firma, mismo criterio de rechazo limpio.
 * Escribe 'declined', JAMÁS un campo que pueda leerse como pagado. Sirve una
 * página HTML real con el ResponseMessage de Azul (no un simple deep-link,
 * para que el mensaje sea legible antes de volver a la app).
 */
export const azulDeclined = onRequest({ secrets: [azulAuthKey], region: 'us-central1' }, async (req, res) => {
  const query = req.query as Record<string, unknown>
  const fields = readAzulResponseFields(query)
  const azulOrderId = qs(query, 'AzulOrderId')
  const receivedAuthHash = qs(query, 'AuthHash')

  if (!fields.OrderNumber || !receivedAuthHash) {
    res.status(400).send('Missing required Azul response fields')
    return
  }

  if (!verifyResponseAuthHash(fields, azulAuthKey.value(), receivedAuthHash)) {
    console.error('azulDeclined: invalid AuthHash — posible respuesta falsificada', { orderNumber: fields.OrderNumber })
    res.status(400).send('Invalid signature')
    return
  }

  const db = admin.firestore()
  const ref = db.collection('azulTransactions').doc(azulTransactionDocId(fields.OrderNumber, azulOrderId))

  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (snap.exists) return 'already-processed' as const

    tx.set(ref, {
      status: 'declined',
      orderNumber: fields.OrderNumber,
      azulOrderId,
      amountRaw: fields.Amount,
      amountCents: parseInt(fields.Amount, 10) || 0,
      authorizationCode: fields.AuthorizationCode,
      dateTime: fields.DateTime,
      responseCode: fields.ResponseCode,
      isoCode: fields.ISOCode,
      responseMessage: fields.ResponseMessage,
      errorDescription: fields.ErrorDescription,
      rrn: fields.RRN,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return 'created' as const
  })

  console.log('azulDeclined', { orderNumber: fields.OrderNumber, azulOrderId, responseCode: fields.ResponseCode, outcome })

  const message = fields.ResponseMessage || fields.ErrorDescription || 'Tu pago fue rechazado.'
  const deepLink = `${AZUL_DEEP_LINK_BASE}?orderNumber=${encodeURIComponent(fields.OrderNumber)}&status=declined`

  res.set('Content-Type', 'text/html; charset=utf-8')
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RopaNova — Pago rechazado</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 48px 24px; background: #f9fafb; color: #111827;">
  <h1 style="color: #b91c1c; font-size: 22px;">Pago rechazado</h1>
  <p style="font-size: 16px; color: #374151; max-width: 420px; margin: 16px auto;">${escapeHtmlAttr(message)}</p>
  <a href="${deepLink}" style="display: inline-block; margin-top: 24px; padding: 14px 28px; background: #111827; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">Volver a RopaNova</a>
</body>
</html>`)
})

/**
 * /cancelada — el comprador se echó atrás en la página de Azul. Ningún dato
 * sensible en juego (no hubo intento de cobro procesado), así que no hay
 * verificación de firma que hacer. Sin escritura Firestore: el pedido queda
 * exactamente en su estado previo al intento de pago.
 */
export const azulCancelled = onRequest({ region: 'us-central1' }, (req, res) => {
  const orderNumber = qs(req.query as Record<string, unknown>, 'OrderNumber')
  console.log('azulCancelled', { orderNumber })
  res.redirect(302, `${AZUL_DEEP_LINK_BASE}?orderNumber=${encodeURIComponent(orderNumber)}&status=cancelled`)
})
