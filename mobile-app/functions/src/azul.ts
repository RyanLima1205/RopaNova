import { createHmac, timingSafeEqual } from 'crypto'
import { defineSecret, defineString } from 'firebase-functions/params'

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
