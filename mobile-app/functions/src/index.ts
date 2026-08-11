import { setGlobalOptions } from 'firebase-functions'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'

export { payTest, azulApproved, azulDeclined, azulCancelled } from './azul'

admin.initializeApp()
setGlobalOptions({ maxInstances: 10, region: 'us-central1' })

const db = admin.firestore()

async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
) {
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })
}

async function getUserData(userId: string): Promise<{
  expoPushToken?: string
  notificationPrefs?: { messages?: boolean; orderStatus?: boolean; newSales?: boolean }
} | null> {
  const snap = await db.doc(`users/${userId}`).get()
  if (!snap.exists) return null
  return snap.data() as any
}

function isPrefEnabled(
  prefs: { messages?: boolean; orderStatus?: boolean; newSales?: boolean } | undefined,
  key: 'messages' | 'orderStatus' | 'newSales',
): boolean {
  if (!prefs) return true // default: all enabled
  return prefs[key] !== false
}

// Trigger 1 — nuevo mensaje → notificar al otro participante
export const onNewMessage = onDocumentCreated(
  'conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    const message = event.data?.data()
    if (!message) return

    const conversationId = event.params.conversationId
    const senderId = message.senderId as string

    const convSnap = await db.doc(`conversations/${conversationId}`).get()
    if (!convSnap.exists) return

    const conv = convSnap.data()
    const participants: string[] = conv?.participants || []
    const recipientId = participants.find((p) => p !== senderId)
    if (!recipientId) return

    const recipientData = await getUserData(recipientId)
    if (!recipientData?.expoPushToken) return
    if (!isPrefEnabled(recipientData.notificationPrefs, 'messages')) return

    const senderSnap = await db.doc(`users/${senderId}`).get()
    const senderData = senderSnap.data()
    const senderName =
      senderData?.storeName ||
      `${senderData?.name || ''} ${senderData?.lastname || ''}`.trim() ||
      senderData?.username ||
      'Alguien'

    const text = message.type === 'image' ? '📷 Imagen' : (message.text || 'Nuevo mensaje')

    await sendPushNotification(
      recipientData.expoPushToken,
      `Mensaje de ${senderName}`,
      text,
      { type: 'message', conversationId },
    )
  },
)

// Trigger 2 — nueva orden → notificar al vendedor
export const onNewOrder = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const order = event.data?.data()
    if (!order) return

    const orderId = event.params.orderId
    const sellerId = order.sellerId as string
    if (!sellerId) return

    const sellerData = await getUserData(sellerId)
    if (!sellerData?.expoPushToken) return
    if (!isPrefEnabled(sellerData.notificationPrefs, 'newSales')) return

    const productTitle = order.productTitle || 'un producto'
    const amount = order.amount ? `RD$${Number(order.amount).toLocaleString('es-DO')}` : ''

    await sendPushNotification(
      sellerData.expoPushToken,
      '¡Nueva venta! 🎉',
      `Vendiste "${productTitle}"${amount ? ` por ${amount}` : ''}`,
      { type: 'order', orderId },
    )
  },
)

// Trigger 2b — nueva orden → recibo por correo al comprador
// Requiere la extensión Firebase "Trigger Email" (firestore-send-email) instalada,
// escribiendo a la colección `mail` — ver mobile-app/docs o `firebase ext:install firestore-send-email`.
export const onOrderCreatedSendReceipt = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const order = event.data?.data()
    if (!order) return

    const orderId = event.params.orderId
    const buyerId = order.buyerId as string
    if (!buyerId) return

    const buyerSnap = await db.doc(`users/${buyerId}`).get()
    const buyerEmail = buyerSnap.exists ? (buyerSnap.data()?.email as string | undefined) : undefined
    if (!buyerEmail) return

    const buyerData = buyerSnap.data()
    const buyerName =
      buyerData?.storeName ||
      `${buyerData?.name || ''} ${buyerData?.lastname || ''}`.trim() ||
      buyerData?.username ||
      'Cliente'

    const orderCode = (order.orderCode as string) || orderId
    const productTitle = (order.productTitle as string) || 'tu producto'
    const lineSummary = (order.lineSummary as string) || ''
    const shippingLabel = (order.shippingLabel as string) || ''
    const sellerName = (order.sellerName as string) || 'el vendedor'
    const amount = Number(order.amount) || 0
    const amountLabel = `RD$${amount.toLocaleString('es-DO')}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
        <h2 style="color: #146CE0;">¡Gracias por tu compra en RopaNova!</h2>
        <p>Hola ${buyerName},</p>
        <p>Confirmamos tu pedido. Aquí está tu recibo:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #667085;">Código de pedido</td><td style="padding: 6px 0; text-align: right; font-weight: bold;">${orderCode}</td></tr>
          <tr><td style="padding: 6px 0; color: #667085;">Producto</td><td style="padding: 6px 0; text-align: right;">${productTitle}</td></tr>
          ${lineSummary ? `<tr><td style="padding: 6px 0; color: #667085;">Detalle</td><td style="padding: 6px 0; text-align: right;">${lineSummary}</td></tr>` : ''}
          <tr><td style="padding: 6px 0; color: #667085;">Vendedor</td><td style="padding: 6px 0; text-align: right;">${sellerName}</td></tr>
          ${shippingLabel ? `<tr><td style="padding: 6px 0; color: #667085;">Entrega</td><td style="padding: 6px 0; text-align: right;">${shippingLabel}</td></tr>` : ''}
          <tr><td style="padding: 10px 0; border-top: 1px solid #E4E7EC; font-weight: bold;">Total pagado</td><td style="padding: 10px 0; border-top: 1px solid #E4E7EC; text-align: right; font-weight: bold; color: #146CE0;">${amountLabel}</td></tr>
        </table>
        <p style="font-size: 13px; color: #667085;">
          Puedes ver el estado de tu pedido en cualquier momento desde la sección "Mis Pedidos" en RopaNova.
        </p>
        <p style="font-size: 12px; color: #98A2B3; margin-top: 24px;">
          RopaNova, SRL — [Completar con la dirección legal de RopaNova], Santo Domingo, República Dominicana
        </p>
      </div>
    `

    await db.collection('mail').add({
      to: buyerEmail,
      message: {
        subject: `Recibo de tu pedido ${orderCode} — RopaNova`,
        html,
      },
    })
  },
)

// Trigger 3 — retiro completado → notificar al usuario
export const onWithdrawalCompleted = onDocumentUpdated(
  'users/{userId}/transactions/{txId}',
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return
    if (after.type !== 'withdrawal') return
    if (before.status === after.status) return
    if (after.status !== 'completed') return

    const userId = event.params.userId
    const userData = await getUserData(userId)
    if (!userData?.expoPushToken) return

    const rawAmount = after.amount ? Math.abs(Number(after.amount)) : 0
    const amountLabel = rawAmount > 0 ? `RD$${rawAmount.toLocaleString('es-DO')}` : ''

    await sendPushNotification(
      userData.expoPushToken,
      '💸 Retiro completado',
      `Tu retiro${amountLabel ? ` de ${amountLabel}` : ''} fue acreditado en tu cuenta bancaria`,
      { type: 'wallet', userId },
    )
  },
)

// Trigger 4 — cambio de estado de orden → notificar al comprador
export const onOrderStatusChange = onDocumentUpdated(
  'orders/{orderId}',
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return
    if (before.status === after.status) return

    const orderId = event.params.orderId
    const buyerId = after.buyerId as string
    if (!buyerId) return

    const buyerData = await getUserData(buyerId)
    if (!buyerData?.expoPushToken) return
    if (!isPrefEnabled(buyerData.notificationPrefs, 'orderStatus')) return

    const statusMessages: Record<string, string> = {
      confirmed: '✅ Tu pedido fue confirmado por el vendedor',
      shipped: '🚚 Tu pedido está en camino',
      delivered: '📦 Tu pedido fue entregado',
      cancelled: '❌ Tu pedido fue cancelado',
    }

    const body = statusMessages[after.status as string]
    if (!body) return

    const productTitle = after.productTitle || 'tu producto'

    await sendPushNotification(
      buyerData.expoPushToken,
      `Pedido: ${productTitle}`,
      body,
      { type: 'order_status', orderId },
    )
  },
)
