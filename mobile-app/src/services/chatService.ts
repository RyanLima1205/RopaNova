import { getFirestore, collection, doc, setDoc, updateDoc, getDoc, getDocs, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, limit, increment } from 'firebase/firestore'
import { app } from '../firebaseConfig'

import { logger } from '../utils/logger'
export type ChatMessage = {
  id: string
  senderId: string
  type: 'text' | 'image'
  text?: string
  imageUrl?: string
  createdAt: any
  readBy?: string[]
}

export type Conversation = {
  id: string
  participants: string[]
  lastMessage?: {
    text?: string
    type: 'text' | 'image'
  }
  lastAt?: any
  unreadCountByUser?: Record<string, number>
  productRef?: { id: string; title?: string }
  pinnedBy?: string[] // Liste des userId qui ont épinglé cette conversation
}

const db = getFirestore(app)

export async function createConversationIfNeeded(userAId: string, userBId: string, productRef?: { id: string; title?: string }): Promise<string> {
  const participants = [userAId, userBId].sort()
  const convKey = participants.join('_')
  const convId = convKey // clé déterministe pour éviter doublons

  const convRef = doc(db, 'conversations', convId)
  const snap = await getDoc(convRef)
  if (!snap.exists()) {
    await setDoc(convRef, {
      participants,
      lastAt: serverTimestamp(),
      unreadCountByUser: {
        [userAId]: 0,
        [userBId]: 0,
      },
      productRef: productRef ? { id: productRef.id, title: productRef.title || '' } : null,
    })
  }
  return convId
}

export async function sendMessage(conversationId: string, senderId: string, payload: { text?: string; imageUrl?: string }): Promise<void> {
  const messagesCol = collection(db, 'conversations', conversationId, 'messages')
  const isImage = !!payload.imageUrl
  await addDoc(messagesCol, {
    senderId,
    type: isImage ? 'image' : 'text',
    text: payload.text || '',
    imageUrl: payload.imageUrl || '',
    createdAt: serverTimestamp(),
  })

  const convRef = doc(db, 'conversations', conversationId)
  const convSnap = await getDoc(convRef)
  if (convSnap.exists()) {
    const conv = convSnap.data() as Conversation
    const participants = conv.participants || []
    // Incrémenter pour tous sauf l'expéditeur
    const updates: any = {
      lastAt: serverTimestamp(),
      lastMessage: { text: isImage ? '📷 Imagen' : (payload.text || ''), type: isImage ? 'image' : 'text' },
    }
    participants.forEach(uid => {
      if (uid !== senderId) {
        updates[`unreadCountByUser.${uid}`] = increment(1)
      }
    })
    await updateDoc(convRef, updates)
  }
}

export function subscribeToConversations(userId: string, cb: (conversations: Conversation[]) => void, onError?: (e: any) => void) {
  const convCol = collection(db, 'conversations')
  logger.log('🔍 subscribeToConversations - userId:', userId)

  const qy = query(
    convCol,
    where('participants', 'array-contains', userId),
    limit(50),
  )
  logger.log('🔍 subscribeToConversations - requête (participants array-contains)')
  
  return onSnapshot(qy, (snap) => {
    logger.log('🔍 subscribeToConversations - snapshot reçu, docs:', snap.docs.length)
    const list: Conversation[] = []
    snap.forEach(docSnap => {
      const data = docSnap.data() as any
      logger.log('🔍 subscribeToConversations - doc:', docSnap.id, 'participants:', data.participants)
      
      // Filtrer côté client pour débugger
      if (data.participants && Array.isArray(data.participants) && data.participants.includes(userId)) {
        list.push({ id: docSnap.id, ...data })
        logger.log('✅ subscribeToConversations - conversation ajoutée:', docSnap.id)
      } else {
        logger.log('❌ subscribeToConversations - conversation ignorée:', docSnap.id, 'participants:', data.participants)
      }
    })
    
    // Trier côté client
    list.sort((a, b) => {
      const aTime = a.lastAt?.toDate?.() || new Date(0)
      const bTime = b.lastAt?.toDate?.() || new Date(0)
      return bTime.getTime() - aTime.getTime()
    })
    
    logger.log('🔍 subscribeToConversations - conversations finales:', list.length)
    cb(list)
  }, (error) => {
    logger.log('💥 subscribeToConversations error:', error)
    onError && onError(error)
  })
}

/** Même requête que l’abonnement temps réel, pour pull-to-refresh explicite. */
export async function fetchConversationsOnce(userId: string): Promise<Conversation[]> {
  const convCol = collection(db, 'conversations')
  const qy = query(convCol, where('participants', 'array-contains', userId), limit(50))
  const snap = await getDocs(qy)
  const list: Conversation[] = []
  snap.forEach((docSnap) => {
    const data = docSnap.data() as any
    if (data.participants && Array.isArray(data.participants) && data.participants.includes(userId)) {
      list.push({ id: docSnap.id, ...data })
    }
  })
  list.sort((a, b) => {
    const aTime = a.lastAt?.toDate?.() || new Date(0)
    const bTime = b.lastAt?.toDate?.() || new Date(0)
    return bTime.getTime() - aTime.getTime()
  })
  return list
}

export function subscribeToMessages(conversationId: string, cb: (messages: ChatMessage[]) => void, onError?: (e: any) => void) {
  const messagesCol = collection(db, 'conversations', conversationId, 'messages')
  const qy = query(messagesCol, orderBy('createdAt', 'desc'), limit(30))
  return onSnapshot(qy, (snap) => {
    const list: ChatMessage[] = []
    snap.forEach(docSnap => {
      const data = docSnap.data() as any
      list.push({ id: docSnap.id, ...data })
    })
    cb(list)
  }, (error) => {
    logger.log('💥 subscribeToMessages error:', error)
    onError && onError(error)
  })
}

export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  const convRef = doc(db, 'conversations', conversationId)
  const snap = await getDoc(convRef)
  if (!snap.exists()) return
  const data = snap.data() as Conversation
  if (!data.unreadCountByUser) return
  if (data.unreadCountByUser[userId] && data.unreadCountByUser[userId] > 0) {
    await updateDoc(convRef, { [`unreadCountByUser.${userId}`]: 0 })
  }
}

export async function pinConversation(conversationId: string, userId: string): Promise<void> {
  const convRef = doc(db, 'conversations', conversationId)
  const snap = await getDoc(convRef)
  if (!snap.exists()) return
  
  const data = snap.data() as Conversation
  const pinnedBy = data.pinnedBy || []
  
  // Toggle: si déjà épinglé, désépingler, sinon épingler
  const isPinned = pinnedBy.includes(userId)
  const newPinnedBy = isPinned 
    ? pinnedBy.filter(id => id !== userId)
    : [...pinnedBy, userId]
  
  await updateDoc(convRef, { pinnedBy: newPinnedBy })
}

export function isConversationPinned(conversation: Conversation, userId: string): boolean {
  return conversation.pinnedBy?.includes(userId) || false
}
