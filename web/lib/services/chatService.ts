import { logger } from "../logger"
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  QueryDocumentSnapshot,
} from "firebase/firestore"
import { app } from "../firebaseConfig"

export type ChatMessage = {
  id: string
  senderId: string
  type: "text" | "image"
  text?: string
  imageUrl?: string
  createdAt: any
  readBy?: string[]
}

export type Conversation = {
  id: string
  participants: string[]
  lastMessage?: { text?: string; type: "text" | "image" }
  lastAt?: any
  unreadCountByUser?: Record<string, number>
  productRef?: { id: string; title?: string }
  pinnedBy?: string[]
}

const db = getFirestore(app)

export async function createConversationIfNeeded(
  userAId: string,
  userBId: string,
  productRef?: { id: string; title?: string },
): Promise<string> {
  const participants = [userAId, userBId].sort()
  const convId = participants.join("_")

  const convRef = doc(db, "conversations", convId)
  const snap = await getDoc(convRef)
  if (!snap.exists()) {
    await setDoc(convRef, {
      participants,
      lastAt: serverTimestamp(),
      unreadCountByUser: { [userAId]: 0, [userBId]: 0 },
      productRef: productRef ? { id: productRef.id, title: productRef.title || "" } : null,
    })
  }
  return convId
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  payload: { text?: string; imageUrl?: string },
): Promise<void> {
  const messagesCol = collection(db, "conversations", conversationId, "messages")
  const isImage = !!payload.imageUrl
  await addDoc(messagesCol, {
    senderId,
    type: isImage ? "image" : "text",
    text: payload.text || "",
    imageUrl: payload.imageUrl || "",
    createdAt: serverTimestamp(),
  })

  const convRef = doc(db, "conversations", conversationId)
  const convSnap = await getDoc(convRef)
  if (convSnap.exists()) {
    const conv = convSnap.data() as Conversation
    const participants = conv.participants || []
    const updates: any = {
      lastAt: serverTimestamp(),
      lastMessage: { text: isImage ? "📷 Imagen" : payload.text || "", type: isImage ? "image" : "text" },
    }
    participants.forEach((uid) => {
      if (uid !== senderId) {
        updates[`unreadCountByUser.${uid}`] = increment(1)
      }
    })
    await updateDoc(convRef, updates)
  }
}

export function subscribeToConversations(
  userId: string,
  cb: (conversations: Conversation[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean) => void,
  onError?: (e: any) => void,
) {
  const convCol = collection(db, "conversations")
  const qy = query(convCol, where("participants", "array-contains", userId), orderBy("lastAt", "desc"), limit(50))

  return onSnapshot(
    qy,
    (snap) => {
      const list: Conversation[] = []
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any
        if (data.participants && Array.isArray(data.participants) && data.participants.includes(userId)) {
          list.push({ id: docSnap.id, ...data })
        }
      })
      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
      const hasMore = snap.docs.length === 50
      cb(list, lastDoc, hasMore)
    },
    (error) => {
      logger.error("subscribeToConversations error:", error)
      onError?.(error)
    },
  )
}

/** Misma consulta que la suscripción en tiempo real, para refrescar manualmente. */
export async function fetchConversationsOnce(
  userId: string,
): Promise<{ conversations: Conversation[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
  const convCol = collection(db, "conversations")
  const qy = query(convCol, where("participants", "array-contains", userId), orderBy("lastAt", "desc"), limit(50))
  const snap = await getDocs(qy)
  const list: Conversation[] = []
  snap.forEach((docSnap) => {
    const data = docSnap.data() as any
    if (data.participants && Array.isArray(data.participants) && data.participants.includes(userId)) {
      list.push({ id: docSnap.id, ...data })
    }
  })
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
  return { conversations: list, lastDoc, hasMore: snap.docs.length === 50 }
}

export async function fetchMoreConversations(
  userId: string,
  afterDoc: QueryDocumentSnapshot,
): Promise<{ conversations: Conversation[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
  const convCol = collection(db, "conversations")
  const qy = query(
    convCol,
    where("participants", "array-contains", userId),
    orderBy("lastAt", "desc"),
    startAfter(afterDoc),
    limit(50),
  )
  const snap = await getDocs(qy)
  const list: Conversation[] = []
  snap.forEach((docSnap) => {
    const data = docSnap.data() as any
    if (data.participants && Array.isArray(data.participants) && data.participants.includes(userId)) {
      list.push({ id: docSnap.id, ...data })
    }
  })
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
  return { conversations: list, lastDoc, hasMore: snap.docs.length === 50 }
}

const MESSAGES_PAGE_SIZE = 30

export function subscribeToMessages(
  conversationId: string,
  cb: (messages: ChatMessage[], oldestDoc: QueryDocumentSnapshot | null) => void,
  onError?: (e: any) => void,
) {
  const messagesCol = collection(db, "conversations", conversationId, "messages")
  const qy = query(messagesCol, orderBy("createdAt", "desc"), limit(MESSAGES_PAGE_SIZE))
  return onSnapshot(
    qy,
    (snap) => {
      const list: ChatMessage[] = []
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any
        list.push({ id: docSnap.id, ...data })
      })
      const oldestDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
      cb(list, oldestDoc)
    },
    (error) => {
      logger.error("subscribeToMessages error:", error)
      onError?.(error)
    },
  )
}

export async function fetchOlderMessages(
  conversationId: string,
  afterDoc: QueryDocumentSnapshot,
): Promise<{ messages: ChatMessage[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
  const messagesCol = collection(db, "conversations", conversationId, "messages")
  const qy = query(messagesCol, orderBy("createdAt", "desc"), startAfter(afterDoc), limit(MESSAGES_PAGE_SIZE))
  const snap = await getDocs(qy)
  const messages: ChatMessage[] = []
  snap.forEach((docSnap) => {
    const data = docSnap.data() as any
    messages.push({ id: docSnap.id, ...data })
  })
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null
  return { messages, lastDoc, hasMore: snap.docs.length === MESSAGES_PAGE_SIZE }
}

export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  const convRef = doc(db, "conversations", conversationId)
  const snap = await getDoc(convRef)
  if (!snap.exists()) return
  const data = snap.data() as Conversation
  if (!data.unreadCountByUser) return
  if (data.unreadCountByUser[userId] && data.unreadCountByUser[userId] > 0) {
    await updateDoc(convRef, { [`unreadCountByUser.${userId}`]: 0 })
  }
}

export async function pinConversation(conversationId: string, userId: string): Promise<void> {
  const convRef = doc(db, "conversations", conversationId)
  const snap = await getDoc(convRef)
  if (!snap.exists()) return

  const data = snap.data() as Conversation
  const pinnedBy = data.pinnedBy || []
  const isPinned = pinnedBy.includes(userId)
  const newPinnedBy = isPinned ? pinnedBy.filter((id) => id !== userId) : [...pinnedBy, userId]

  await updateDoc(convRef, { pinnedBy: newPinnedBy })
}

export function isConversationPinned(conversation: Conversation, userId: string): boolean {
  return conversation.pinnedBy?.includes(userId) || false
}
