import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput, RefreshControl, Alert, Animated } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../../App'
import { subscribeToConversations, fetchConversationsOnce, fetchMoreConversations, Conversation, markAsRead, pinConversation, isConversationPinned } from '../services/chatService'
import { useAuth } from '../contexts/AuthContext'
import { getFirestore, doc, getDoc, collection, query, where, getDocs, deleteDoc, QueryDocumentSnapshot } from 'firebase/firestore'
import { app } from '../firebaseConfig'
import { getUserDocumentAvatarUrl, isValidImageUrl } from '../utils/imageUtils'

import { logger } from '../utils/logger'
/**
 * Nom affiché dans la liste des conversations :
 * - Tienda física / virtual → storeName (puis repli nom complet / username)
 * - Cuenta privada (et autres) → username sans « @ »
 */
function conversationListDisplayNameFromUserData(data: Record<string, unknown>): string {
  const accountType = String(data.accountType || '')
  const usernameRaw = String(data.username || '').trim().replace(/^@+/, '')
  const storeName = String(data.storeName || '').trim()
  const fullName = `${String(data.name || '')} ${String(data.lastname || '')}`.trim()

  if (accountType === 'fisica' || accountType === 'virtual') {
    if (storeName) return storeName
    return fullName || usernameRaw || 'Tienda'
  }

  if (usernameRaw) return usernameRaw
  return fullName || storeName || 'Usuario'
}

interface ConversationWithParticipants extends Conversation {
  participantsData?: {
    id: string
    name: string
    avatar?: string
  }[]
  otherParticipant?: {
    id: string
    name: string
    avatar?: string
  }
}

export const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Messages'>>()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([])
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithParticipants[]>([])
  const [errorText, setErrorText] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'recent'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreData, setHasMoreData] = useState(false)
  const lastConvDocRef = useRef<QueryDocumentSnapshot | null>(null)

  // Fonction pour récupérer les données des participants
  const fetchParticipantsData = useCallback(async (conversation: Conversation): Promise<ConversationWithParticipants> => {
    try {
      const db = getFirestore(app)
      const participantsData = await Promise.all(
        conversation.participants.map(async (participantId) => {
          const userDoc = await getDoc(doc(db, 'users', participantId))
          if (userDoc.exists()) {
            const userData = userDoc.data() as Record<string, unknown>
            return {
              id: participantId,
              name: conversationListDisplayNameFromUserData(userData),
              avatar: getUserDocumentAvatarUrl(userData),
            }
          }
          return {
            id: participantId,
            name: 'Usuario',
            avatar: ''
          }
        })
      )

      // Trouver l'autre participant (pas l'utilisateur actuel)
      const otherParticipant = participantsData.find(p => p.id !== user?.id)

      return {
        ...conversation,
        participantsData,
        otherParticipant
      }
    } catch (error) {
      logger.error('Erreur récupération participants:', error)
      return {
        ...conversation,
        participantsData: [],
        otherParticipant: { id: '', name: 'Usuario', avatar: '' }
      }
    }
  }, [user?.id])

  // Fonction pour formater l'heure
  const formatTime = useCallback((timestamp: any) => {
    if (!timestamp) return ''
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('es-DO', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      } else if (diffInHours < 168) { // 7 jours
        const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
        return dayNames[date.getDay()]
      } else {
        return date.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit' })
      }
    } catch (error) {
      return ''
    }
  }, [])

  // Fonction de filtrage et recherche
  const filterConversations = useCallback((convs: ConversationWithParticipants[], query: string, filter: string) => {
    let filtered = [...convs]

    // Filtre par type
    if (filter === 'unread') {
      filtered = filtered.filter(conv => (conv.unreadCountByUser?.[user?.id || ''] || 0) > 0)
    } else if (filter === 'recent') {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      filtered = filtered.filter(conv => {
        if (!conv.lastAt) return false
        const lastAt = conv.lastAt.toDate ? conv.lastAt.toDate() : new Date(conv.lastAt)
        return lastAt > oneWeekAgo
      })
    }

    // Recherche
    if (query.trim()) {
      const searchLower = query.toLowerCase()
      filtered = filtered.filter(conv => {
        const otherName = conv.otherParticipant?.name || ''
        const lastMessage = conv.lastMessage?.text || ''
        return otherName.toLowerCase().includes(searchLower) || 
               lastMessage.toLowerCase().includes(searchLower)
      })
    }

    // Tri: Épinglées en premier, puis par date
    filtered.sort((a, b) => {
      const aIsPinned = isConversationPinned(a, user?.id || '')
      const bIsPinned = isConversationPinned(b, user?.id || '')
      
      // Si l'une est épinglée et pas l'autre, la épinglée vient en premier
      if (aIsPinned && !bIsPinned) return -1
      if (!aIsPinned && bIsPinned) return 1
      
      // Sinon, trier par date
      const aTime = a.lastAt?.toDate?.() || new Date(0)
      const bTime = b.lastAt?.toDate?.() || new Date(0)
      return bTime.getTime() - aTime.getTime()
    })

    return filtered
  }, [user?.id])

  // Calculer les compteurs pour les filtres (toujours appelé)
  const unreadCount = useMemo(() => 
    conversations.filter(conv => (conv.unreadCountByUser?.[user?.id || ''] || 0) > 0).length,
    [conversations, user?.id]
  )

  const recentCount = useMemo(() => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return conversations.filter(conv => {
      if (!conv.lastAt) return false
      const lastAt = conv.lastAt.toDate ? conv.lastAt.toDate() : new Date(conv.lastAt)
      return lastAt > oneWeekAgo
    }).length
  }, [conversations])

  // Mise à jour des conversations filtrées
  useEffect(() => {
    const filtered = filterConversations(conversations, searchQuery, filterType)
    setFilteredConversations(filtered)
  }, [conversations, searchQuery, filterType, filterConversations])

  useEffect(() => {
    logger.log('💬 MessagesScreen - Chat UID:', user?.id)
    logger.log('💬 MessagesScreen - User complet:', user)
    logger.log('💬 MessagesScreen - isAuthenticated:', !!user?.id)
    setErrorText(null)
    setLoading(true)
    if (!user?.id) {
      logger.log('💬 MessagesScreen - Pas d\'utilisateur, arrêt')
      setLoading(false)
      return
    }
    const unsub = subscribeToConversations(
      user.id,
      async (list, lastDoc, hasMore) => {
        logger.log('💬 MessagesScreen - conversations reçues:', list.length)
        try { logger.log('💬 IDs:', list.map(c => c.id)) } catch {}

        const conversationsWithData = await Promise.all(
          list.map(conv => fetchParticipantsData(conv))
        )

        setConversations(conversationsWithData)
        lastConvDocRef.current = lastDoc
        setHasMoreData(hasMore)
        setLoading(false)
      },
      (err) => {
        logger.log('💬 MessagesScreen - abonnement error:', err)
        setErrorText('Accès refusé aux conversations (permissions). Vérifie les règles Firestore et le champ participants.')
        setLoading(false)
      }
    )
    return () => { try { unsub && unsub() } catch (e) { logger.log('💬 MessagesScreen - erreur unsubscribe:', e) } }
  }, [user?.id, fetchParticipantsData])

  const onRefresh = useCallback(async () => {
    if (!user?.id) return
    setRefreshing(true)
    try {
      const { conversations: list, lastDoc, hasMore } = await fetchConversationsOnce(user.id)
      const conversationsWithData = await Promise.all(list.map((conv) => fetchParticipantsData(conv)))
      setConversations(conversationsWithData)
      lastConvDocRef.current = lastDoc
      setHasMoreData(hasMore)
    } catch (e) {
      logger.error('MessagesScreen refresh:', e)
    } finally {
      setRefreshing(false)
    }
  }, [user?.id, fetchParticipantsData])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData || !lastConvDocRef.current || !user?.id) return
    setLoadingMore(true)
    try {
      const { conversations: more, lastDoc, hasMore } = await fetchMoreConversations(user.id, lastConvDocRef.current)
      if (more.length > 0) {
        const moreWithData = await Promise.all(more.map(conv => fetchParticipantsData(conv)))
        setConversations(prev => {
          const existingIds = new Set(prev.map(c => c.id))
          const newOnes = moreWithData.filter(c => !existingIds.has(c.id))
          return [...prev, ...newOnes]
        })
        lastConvDocRef.current = lastDoc
      }
      setHasMoreData(hasMore)
    } catch (e) {
      logger.error('MessagesScreen loadMore:', e)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMoreData, user?.id, fetchParticipantsData])

  // Fonction de suppression de conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    Alert.alert(
      'Eliminar conversación',
      '¿Estás seguro de que quieres eliminar esta conversación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore(app)
              const conversationRef = doc(db, 'conversations', conversationId)
              
              // Supprimer la conversation (les messages seront supprimés automatiquement)
              await deleteDoc(conversationRef)
              
              // Mettre à jour la liste locale
              setConversations(prev => prev.filter(conv => conv.id !== conversationId))
              
              logger.log('Conversation supprimée:', conversationId)
            } catch (error) {
              logger.error('Erreur suppression conversation:', error)
              Alert.alert('Error', 'No se pudo eliminar la conversación')
            }
          }
        }
      ]
    )
  }, [])

  // Fonction de marquage comme lu
  const markAsReadConversation = useCallback(async (conversationId: string) => {
    if (!user?.id) return
    try {
      await markAsRead(conversationId, user.id)
    } catch (error) {
      logger.error('Erreur marquage comme lu:', error)
    }
  }, [user?.id])

  const openChat = useCallback(async (conversationId: string) => {
    logger.log('💬 MessagesScreen - openChat ->', conversationId)
    // Marquer comme lu avant d'ouvrir
    await markAsReadConversation(conversationId)
    navigation.navigate('Chat', { conversationId })
  }, [navigation, markAsReadConversation])

  // Composant de filtre
  const FilterButton = ({ type, label, count }: { type: string, label: string, count?: number }) => (
    <TouchableOpacity
      style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
      onPress={() => setFilterType(type as any)}
    >
      <Text style={[styles.filterButtonText, filterType === type && styles.filterButtonTextActive]}>
        {label} {count !== undefined && `(${count})`}
      </Text>
    </TouchableOpacity>
  )

  // Composant de conversation avec swipe pour actions
  const SwipeableConversation = ({ item }: { item: ConversationWithParticipants }) => {
    const translateX = new Animated.Value(0)
    const [isSwiped, setIsSwiped] = useState(false)
    const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
    const peerAvatarUri = (item.otherParticipant?.avatar || '').trim()
    const showPeerPhoto =
      Boolean(peerAvatarUri) && !avatarLoadFailed && isValidImageUrl(peerAvatarUri)

    useEffect(() => {
      setAvatarLoadFailed(false)
    }, [peerAvatarUri])
    
    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    )
    
    const onHandlerStateChange = (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX } = event.nativeEvent
        if (translationX < -80) {
          // Swipe vers la gauche - afficher les actions
          Animated.spring(translateX, {
            toValue: -160,
            useNativeDriver: true,
          }).start()
          setIsSwiped(true)
        } else if (translationX > 80) {
          // Swipe vers la droite - cacher les actions
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
          setIsSwiped(false)
        } else {
          // Retour à la position normale
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
          setIsSwiped(false)
        }
      }
    }

    const handlePin = async () => {
      if (!user?.id) return
      
      try {
        await pinConversation(item.id, user.id)
        logger.log('Conversation épinglée/désépinglée:', item.id)
      } catch (error) {
        logger.error('Erreur lors de l\'épinglage:', error)
        Alert.alert('Error', 'No se pudo fijar la conversación')
      }
      
      // Retourner à la position normale
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start()
      setIsSwiped(false)
    }

    const handleDelete = () => {
      // Retourner à la position normale puis supprimer
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start(() => {
        deleteConversation(item.id)
      })
      setIsSwiped(false)
    }

    const handleCloseActions = () => {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start()
      setIsSwiped(false)
    }

    return (
      <View style={styles.swipeContainer}>
        {/* Actions de fond */}
        <View style={styles.swipeActions}>
          <TouchableOpacity style={styles.pinAction} onPress={handlePin}>
            <Ionicons name={isConversationPinned(item, user?.id || '') ? "pin-outline" : "pin"} size={20} color="#fff" />
            <Text style={styles.actionText}>
              {isConversationPinned(item, user?.id || '') ? 'Desfijar' : 'Fijar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.actionText}>Eliminar</Text>
          </TouchableOpacity>
        </View>

        {/* Conversation principale */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View style={[styles.swipeContent, { transform: [{ translateX }] }]}>
            <TouchableOpacity 
              style={styles.row} 
              onPress={() => {
                if (isSwiped) {
                  handleCloseActions()
                } else {
                  openChat(item.id)
                }
              }}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  {showPeerPhoto ? (
                    <Image
                      source={{ uri: peerAvatarUri }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  ) : (
                    <Ionicons name="person" size={26} color="#fff" />
                  )}
                </View>
                {(item.unreadCountByUser?.[user?.id || ''] || 0) > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unreadCountByUser?.[user?.id || ''] || 0}</Text>
                  </View>
                )}
              </View>
              <View style={styles.content}>
                <View style={styles.itemHeader}>
                  <Text style={styles.title}>
                    {item.otherParticipant?.name || 'Conversación'}
                  </Text>
                  <View style={styles.dateContainer}>
                    <Text style={styles.date}>
                      {formatTime(item.lastAt)}
                    </Text>
                    {isConversationPinned(item, user?.id || '') && (
                      <Text style={styles.pinIcon}>📌</Text>
                    )}
                  </View>
                </View>
                <View style={styles.messageRow}>
                  <Text numberOfLines={1} style={styles.subtitle}>
                    {item.lastMessage?.type === 'image' ? '📷 Imagen' : (item.lastMessage?.text || 'Nueva conversación')}
                  </Text>
                  {(item.unreadCountByUser?.[user?.id || ''] || 0) > 0 && (
                    <View style={styles.unreadIndicator}>
                      <Text style={styles.unreadText}>●</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </View>
    )
  }

  if (!user?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}> 
          <Text style={styles.muted}>Por favor, inicia sesión para ver tus mensajes.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#059669"/>
        </View>
      </SafeAreaView>
    )
  }

  if (errorText) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={48} color="#d1d5db" />
          <Text style={[styles.muted, { marginTop: 12 }]}>No se pudieron cargar tus conversaciones.</Text>
          <TouchableOpacity onPress={onRefresh} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#059669', borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const renderItem = ({ item }: { item: ConversationWithParticipants }) => (
    <SwipeableConversation item={item} />
  )

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color="#059669" />
          <Text style={styles.loadingMoreText}>Cargando...</Text>
        </View>
      )
    }
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
      </View>
      
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <FilterButton type="all" label="Todas" count={conversations.length} />
        <FilterButton type="unread" label="No leídas" count={unreadCount} />
        <FilterButton type="recent" label="Recientes" count={recentCount} />
      </View>

      {/* Liste des conversations */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContainer,
          filteredConversations.length === 0 ? { flexGrow: 1 } : null,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#059669']}
            tintColor="#059669"
            title="Actualizando..."
            titleColor="#059669"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <View style={styles.center}> 
            <Ionicons name="chatbubble-outline" size={64} color="#d1d5db" />
            <Text style={styles.muted}>
              {searchQuery ? 'No se encontraron conversaciones' : 'No hay conversaciones por el momento'}
            </Text>
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  clearSearchButton: {
    padding: 4,
  },
  clearSearchText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#25d366',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#25d366',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { 
    fontSize: 17, 
    fontWeight: '400', 
    color: '#111827',
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  pinIcon: {
    fontSize: 12,
    marginTop: 2,
  },
  subtitle: { 
    color: '#667781',
    fontSize: 14,
    marginTop: 2,
  },
  date: { 
    color: '#667781', 
    fontSize: 12,
    marginTop: 2,
  },
  muted: { 
    color: '#6b7280', 
    textAlign: 'center',
    fontSize: 16,
    marginTop: 8,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    width: 160,
  },
  pinAction: {
    flex: 1,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  deleteAction: {
    flex: 1,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  swipeContent: {
    backgroundColor: '#fff',
    marginVertical: 0,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  unreadIndicator: {
    marginLeft: 8,
  },
  unreadText: {
    color: '#25d366',
    fontSize: 16,
    fontWeight: 'bold',
  },
}) 