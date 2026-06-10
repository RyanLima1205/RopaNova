import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { RootStackParamList } from '../../App'
import { subscribeToMessages, sendMessage, ChatMessage } from '../services/chatService'
import { useAuth } from '../contexts/AuthContext'
import { formatPrice } from '../utils/formatters'
import { getUserDocumentAvatarUrl } from '../utils/imageUtils'
import { app } from '../firebaseConfig'

import { logger } from '../utils/logger'
/** Titre header : tienda → storeName ; privado → @username ; sinon nom complet */
function chatPeerTitleFromUserData(data: Record<string, unknown>): string {
  const accountType = String(data.accountType || '')
  const username = String(data.username || '')
  const storeName = String(data.storeName || '').trim()
  const fullName = `${String(data.name || '')} ${String(data.lastname || '')}`.trim()
  const h = username.trim().replace(/^@+/, '')
  const at = h ? `@${h}` : ''

  if (accountType === 'privado') return at || fullName || 'Usuario'
  if (accountType === 'virtual' || accountType === 'fisica') {
    if (storeName) return storeName
    return fullName || at || 'Usuario'
  }
  return storeName || fullName || at || 'Usuario'
}

export const ChatScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>()
  const navigation = useNavigation()
  const { conversationId, productInfo } = route.params
  const { user } = useAuth()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [showProductPreview, setShowProductPreview] = useState(true)
  const [peerTitle, setPeerTitle] = useState(() => productInfo?.sellerName?.trim() || '')
  const [peerAvatarUrl, setPeerAvatarUrl] = useState('')
  const [peerAvatarLoadFailed, setPeerAvatarLoadFailed] = useState(false)
  const [peerUserId, setPeerUserId] = useState<string | null>(() => productInfo?.sellerId || null)
  const [linkedProductId, setLinkedProductId] = useState<string | null>(() => productInfo?.id || null)
  const [menuVisible, setMenuVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loadPeerTitle = async () => {
      const fallback = productInfo?.sellerName?.trim() || 'Chat'
      if (!conversationId?.trim() || !user?.id) {
        setPeerTitle(fallback)
        setPeerAvatarUrl('')
        if (productInfo?.sellerId) setPeerUserId(productInfo.sellerId)
        if (productInfo?.id) setLinkedProductId(productInfo.id)
        return
      }
      try {
        const db = getFirestore(app)
        const convSnap = await getDoc(doc(db, 'conversations', conversationId))
        if (cancelled) return
        if (!convSnap.exists()) {
          setPeerTitle(fallback)
          setPeerAvatarUrl('')
          if (productInfo?.sellerId) setPeerUserId(productInfo.sellerId)
          if (productInfo?.id) setLinkedProductId(productInfo.id)
          return
        }
        const convData = convSnap.data() as {
          participants?: string[]
          productRef?: { id?: string }
        }
        const participants = convData.participants
        if (!participants?.length) {
          setPeerTitle(fallback)
          setPeerAvatarUrl('')
          if (productInfo?.sellerId) setPeerUserId(productInfo.sellerId)
          if (productInfo?.id) setLinkedProductId(productInfo.id)
          return
        }
        const otherId = participants.find((p) => p !== user.id) ?? participants[0]
        setPeerUserId(otherId)
        const pid = productInfo?.id || convData.productRef?.id || null
        setLinkedProductId(pid)

        const userSnap = await getDoc(doc(db, 'users', otherId))
        if (cancelled) return
        if (userSnap.exists()) {
          const peerData = userSnap.data() as Record<string, unknown>
          setPeerTitle(chatPeerTitleFromUserData(peerData))
          setPeerAvatarUrl(getUserDocumentAvatarUrl(peerData))
        } else {
          setPeerTitle(fallback)
          setPeerAvatarUrl('')
        }
      } catch {
        if (!cancelled) {
          setPeerTitle(fallback)
          setPeerAvatarUrl('')
          if (productInfo?.sellerId) setPeerUserId(productInfo.sellerId)
          if (productInfo?.id) setLinkedProductId(productInfo.id)
        }
      }
    }
    loadPeerTitle()
    return () => {
      cancelled = true
    }
  }, [conversationId, user?.id, productInfo?.sellerName, productInfo?.sellerId, productInfo?.id])

  useEffect(() => {
    setPeerAvatarLoadFailed(false)
  }, [peerAvatarUrl])

  useEffect(() => {
    logger.log('💬 ChatScreen - UID:', user?.id, 'conversationId:', conversationId)
    
    // Si pas de conversationId, on ne peut pas charger les messages
    if (!conversationId || conversationId.trim() === '') {
      logger.log('💬 ChatScreen - Pas de conversationId, initialisation avec messages vides')
      setMessages([])
      return
    }
    
    const unsub = subscribeToMessages(conversationId, (list) => {
      logger.log('💬 ChatScreen - messages reçus:', list.length)
      logger.log('💬 ChatScreen - messages détail:', list)
      setMessages(list)
    }, (error) => {
      logger.error('💬 ChatScreen - erreur subscription:', error)
    })
    return () => { try { unsub && unsub() } catch(e) { logger.log('💬 ChatScreen - erreur unsubscribe:', e) } }
  }, [conversationId, user?.id])

  const onSend = useCallback(async () => {
    if (!text.trim() || !user?.id) return
    
    // Si pas de conversationId, on ne peut pas envoyer de message
    if (!conversationId || conversationId.trim() === '') {
      logger.log('💬 ChatScreen - Pas de conversationId, impossible d\'envoyer le message')
      return
    }
    
    try {
      logger.log('💬 ChatScreen - onSend:', text)
      await sendMessage(conversationId, user.id, { text: text.trim() })
      setText('')
    } catch (e) {
      logger.log('💬 ChatScreen - erreur sendMessage:', e)
    }
  }, [text, user?.id, conversationId])

  const canShowProduct = Boolean(linkedProductId)
  const canShowProfile = Boolean(peerUserId)

  const handleVerProducto = () => {
    setMenuVisible(false)
    if (!linkedProductId) return
    ;(navigation as any).navigate('ProductDetail', { productId: linkedProductId })
  }

  const handleVerPerfil = () => {
    setMenuVisible(false)
    if (!peerUserId) {
      Alert.alert('Perfil', 'No se pudo identificar al usuario.')
      return
    }
    ;(navigation as any).navigate('UserProfile', { viewUserId: peerUserId })
  }

  const handleSilenciar = () => {
    setMenuVisible(false)
    Alert.alert(
      'Silenciar',
      'Próximamente podrás silenciar las notificaciones de esta conversación.',
    )
  }

  const handleSenalar = () => {
    setMenuVisible(false)
    Alert.alert(
      'Señalar',
      'Gracias por ayudarnos a mantener RopaNova seguro. La denuncia detallada estará disponible próximamente.',
    )
  }

  const handleBloquear = () => {
    setMenuVisible(false)
    if (!peerUserId) {
      Alert.alert('Bloquear', 'No se pudo identificar al usuario.')
      return
    }
    Alert.alert(
      'Bloquear usuario',
      '¿Seguro que deseas bloquear a este usuario? No podrá enviarte mensajes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Información',
              'La función de bloqueo estará disponible próximamente.',
            )
          },
        },
      ],
    )
  }

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.senderId === user?.id
    return (
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
          {item.type === 'image' ? '📷 Imagen' : (item.text || '')}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerMiddle}>
          <View style={styles.headerAvatarWrap}>
            {peerAvatarUrl && !peerAvatarLoadFailed ? (
              <Image
                source={{ uri: peerAvatarUrl }}
                style={styles.headerAvatar}
                resizeMode="cover"
                onError={() => setPeerAvatarLoadFailed(true)}
              />
            ) : (
              <Ionicons name="person" size={20} color="#fff" />
            )}
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {peerTitle || 'Chat'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerMenuBtn}
          onPress={() => setMenuVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Más opciones"
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuOverlay}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)} />
          <View style={styles.menuSheetWrap} pointerEvents="box-none">
            <View style={styles.menuSheet}>
            {canShowProduct && (
              <TouchableOpacity style={styles.menuRow} onPress={handleVerProducto}>
                <Ionicons name="bag-outline" size={22} color="#374151" />
                <Text style={styles.menuRowText}>Ver producto</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.menuRow, !canShowProfile && styles.menuRowDisabled]}
              onPress={handleVerPerfil}
              disabled={!canShowProfile}
            >
              <Ionicons name="person-outline" size={22} color={canShowProfile ? '#374151' : '#9ca3af'} />
              <Text style={[styles.menuRowText, !canShowProfile && styles.menuRowTextDisabled]}>
                Ver perfil
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={handleSilenciar}>
              <Ionicons name="notifications-off-outline" size={22} color="#374151" />
              <Text style={styles.menuRowText}>Silenciar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={handleSenalar}>
              <Ionicons name="flag-outline" size={22} color="#b45309" />
              <Text style={[styles.menuRowText, styles.menuRowWarning]}>Señalar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={handleBloquear}>
              <Ionicons name="ban-outline" size={22} color="#dc2626" />
              <Text style={[styles.menuRowText, styles.menuRowDanger]}>Bloquear usuario</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuCancelText}>Cerrar</Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          inverted
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesContainer}
        />
                 {/* Product Preview */}
                 {productInfo && showProductPreview && (
                   <View style={styles.productPreview}>
                     <View style={styles.productPreviewHeader}>
                       <Text style={styles.productPreviewHeaderTitle}>Acerca de este producto</Text>
                       <TouchableOpacity 
                         style={styles.closeButton}
                         onPress={() => setShowProductPreview(false)}
                       >
                         <Text style={styles.closeButtonText}>×</Text>
                       </TouchableOpacity>
                     </View>
                     <View style={styles.productPreviewContent}>
                       <Image 
                         source={{ uri: productInfo.image }} 
                         style={styles.productPreviewImage}
                       />
                       <View style={styles.productPreviewInfo}>
                         <Text style={styles.productPreviewTitle} numberOfLines={2}>
                           {productInfo.title}
                         </Text>
                         <Text style={styles.productPreviewPrice}>
                           {formatPrice(productInfo.price)}
                         </Text>
                         {productInfo.selectedSize && (
                           <Text style={styles.productPreviewSize}>
                             Talla: {productInfo.selectedSize}
                           </Text>
                         )}
                       </View>
                     </View>
                   </View>
                 )}

                 <View style={styles.inputBar}>
                   <TextInput
                     style={styles.input}
                     placeholder="Escribe un mensaje"
                     value={text}
                     onChangeText={setText}
                     onSubmitEditing={onSend}
                     returnKeyType="send"
                   />
                   <TouchableOpacity style={styles.send} onPress={onSend}>
                     <Ionicons name="arrow-up" size={20} color="white" />
                   </TouchableOpacity>
                 </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerBack: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMiddle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  headerAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25d366',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'left',
    minWidth: 0,
  },
  headerMenuBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuSheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingTop: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  menuRowDisabled: {
    opacity: 0.45,
  },
  menuRowText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  menuRowTextDisabled: {
    color: '#9ca3af',
  },
  menuRowWarning: {
    color: '#b45309',
  },
  menuRowDanger: {
    color: '#dc2626',
  },
  menuCancel: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  menuCancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  bubble: { 
    maxWidth: '80%', 
    marginVertical: 4, 
    padding: 12, 
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mine: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#059669',
    borderBottomRightRadius: 4,
  },
  theirs: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { 
    color: '#111827',
    fontSize: 16,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#fff',
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  input: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  send: { 
    backgroundColor: '#059669', 
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  productPreview: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  productPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPreviewHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
    lineHeight: 16,
  },
  productPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  productPreviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productPreviewPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  productPreviewSize: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
}) 