"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, X, Loader2, WifiOff, MessageCircle, MoreVertical, Pin, PinOff, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc, deleteDoc, type QueryDocumentSnapshot } from "firebase/firestore"
import {
  subscribeToConversations,
  fetchConversationsOnce,
  fetchMoreConversations,
  markAsRead,
  pinConversation,
  isConversationPinned,
  type Conversation,
} from "@/lib/services/chatService"
import { getUserDocumentAvatarUrl, isValidImageUrl } from "@/lib/imageUtils"

/** Nombre mostrado en la lista: tienda → storeName; cuenta privada → @username. */
function conversationListDisplayName(data: Record<string, unknown>): string {
  const accountType = String(data.accountType || "")
  const usernameRaw = String(data.username || "").trim().replace(/^@+/, "")
  const storeName = String(data.storeName || "").trim()
  const fullName = `${String(data.name || "")} ${String(data.lastname || "")}`.trim()

  if (accountType === "fisica" || accountType === "virtual") {
    if (storeName) return storeName
    return fullName || usernameRaw || "Tienda"
  }
  if (usernameRaw) return usernameRaw
  return fullName || storeName || "Usuario"
}

interface ConversationWithParticipants extends Conversation {
  otherParticipant?: { id: string; name: string; avatar?: string }
}

function formatTime(timestamp: any): string {
  if (!timestamp) return ""
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 24) {
      return date.toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit", hour12: true })
    } else if (diffInHours < 168) {
      const dayNames = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
      return dayNames[date.getDay()]
    }
    return date.toLocaleDateString("es-DO", { day: "2-digit", month: "2-digit" })
  } catch {
    return ""
  }
}

type FilterType = "all" | "unread" | "recent"

export default function MensajesPageGate() {
  return (
    <RequireAuth>
      <MensajesPage />
    </RequireAuth>
  )
}

function MensajesPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([])
  const [errorText, setErrorText] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreData, setHasMoreData] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const lastConvDocRef = useRef<QueryDocumentSnapshot | null>(null)

  const fetchParticipantsData = useCallback(
    async (conversation: Conversation): Promise<ConversationWithParticipants> => {
      try {
        const participantsData = await Promise.all(
          conversation.participants.map(async (participantId) => {
            const userDoc = await getDoc(doc(db, "users", participantId))
            if (userDoc.exists()) {
              const userData = userDoc.data() as Record<string, unknown>
              return { id: participantId, name: conversationListDisplayName(userData), avatar: getUserDocumentAvatarUrl(userData) }
            }
            return { id: participantId, name: "Usuario", avatar: "" }
          }),
        )
        const otherParticipant = participantsData.find((p) => p.id !== user?.id)
        return { ...conversation, otherParticipant }
      } catch {
        return { ...conversation, otherParticipant: { id: "", name: "Usuario", avatar: "" } }
      }
    },
    [user?.id],
  )

  useEffect(() => {
    setErrorText(null)
    setLoading(true)
    if (!user?.id) {
      setLoading(false)
      return
    }
    const unsub = subscribeToConversations(
      user.id,
      async (list, lastDoc, hasMore) => {
        const withData = await Promise.all(list.map((c) => fetchParticipantsData(c)))
        setConversations(withData)
        lastConvDocRef.current = lastDoc
        setHasMoreData(hasMore)
        setLoading(false)
      },
      () => {
        setErrorText("No se pudieron cargar tus conversaciones.")
        setLoading(false)
      },
    )
    return () => {
      try {
        unsub && unsub()
      } catch {}
    }
  }, [user?.id, fetchParticipantsData])

  const onRefresh = useCallback(async () => {
    if (!user?.id) return
    setRefreshing(true)
    try {
      const { conversations: list, lastDoc, hasMore } = await fetchConversationsOnce(user.id)
      const withData = await Promise.all(list.map((c) => fetchParticipantsData(c)))
      setConversations(withData)
      lastConvDocRef.current = lastDoc
      setHasMoreData(hasMore)
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
        const moreWithData = await Promise.all(more.map((c) => fetchParticipantsData(c)))
        setConversations((prev) => {
          const existingIds = new Set(prev.map((c) => c.id))
          return [...prev, ...moreWithData.filter((c) => !existingIds.has(c.id))]
        })
        lastConvDocRef.current = lastDoc
      }
      setHasMoreData(hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMoreData, user?.id, fetchParticipantsData])

  const handlePin = async (conversationId: string) => {
    if (!user?.id) return
    try {
      await pinConversation(conversationId, user.id)
    } catch {
      toast({ title: "No se pudo fijar la conversación", variant: "destructive" })
    }
  }

  const confirmDelete = async () => {
    if (!conversationToDelete) return
    try {
      await deleteDoc(doc(db, "conversations", conversationToDelete))
      setConversations((prev) => prev.filter((c) => c.id !== conversationToDelete))
    } catch {
      toast({ title: "No se pudo eliminar la conversación", variant: "destructive" })
    } finally {
      setConversationToDelete(null)
    }
  }

  const openChat = async (conversationId: string) => {
    if (user?.id) markAsRead(conversationId, user.id).catch(() => {})
    router.push(`/mensajes/${conversationId}`)
  }

  const unreadCount = useMemo(
    () => conversations.filter((c) => (c.unreadCountByUser?.[user?.id || ""] || 0) > 0).length,
    [conversations, user?.id],
  )
  const recentCount = useMemo(() => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return conversations.filter((c) => {
      if (!c.lastAt) return false
      const lastAt = c.lastAt.toDate ? c.lastAt.toDate() : new Date(c.lastAt)
      return lastAt > oneWeekAgo
    }).length
  }, [conversations])

  const filteredConversations = useMemo(() => {
    let filtered = [...conversations]
    if (filterType === "unread") {
      filtered = filtered.filter((c) => (c.unreadCountByUser?.[user?.id || ""] || 0) > 0)
    } else if (filterType === "recent") {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      filtered = filtered.filter((c) => {
        if (!c.lastAt) return false
        const lastAt = c.lastAt.toDate ? c.lastAt.toDate() : new Date(c.lastAt)
        return lastAt > oneWeekAgo
      })
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((c) => {
        const otherName = c.otherParticipant?.name || ""
        const lastMessage = c.lastMessage?.text || ""
        return otherName.toLowerCase().includes(q) || lastMessage.toLowerCase().includes(q)
      })
    }
    filtered.sort((a, b) => {
      const aPinned = isConversationPinned(a, user?.id || "")
      const bPinned = isConversationPinned(b, user?.id || "")
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      const aTime = a.lastAt?.toDate?.() || new Date(0)
      const bTime = b.lastAt?.toDate?.() || new Date(0)
      return bTime.getTime() - aTime.getTime()
    })
    return filtered
  }, [conversations, searchQuery, filterType, user?.id])

  return (
    <div className="min-h-screen bg-white pb-4">
      <div className="border-b border-gray-200 px-5 py-4">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Mensajes</h1>
      </div>

      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery.length > 0 && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 border-b border-gray-200">
        {[
          { key: "all" as const, label: "Todas", count: conversations.length },
          { key: "unread" as const, label: "No leídas", count: unreadCount },
          { key: "recent" as const, label: "Recientes", count: recentCount },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              filterType === f.key ? "bg-brand-ui border-brand-ui text-white" : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing} className="ml-auto">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
        </Button>
      </div>

      {!user?.id ? (
        <div className="flex items-center justify-center py-20 px-6 text-center text-gray-500">
          Por favor, inicia sesión para ver tus mensajes.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
        </div>
      ) : errorText ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
          <WifiOff className="h-10 w-10 text-gray-300" />
          <p className="text-gray-500">{errorText}</p>
          <Button onClick={onRefresh} className="bg-brand-ui hover:bg-brand-dark">
            Reintentar
          </Button>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
          <MessageCircle className="h-14 w-14 text-gray-200" />
          <p className="text-gray-500">
            {searchQuery ? "No se encontraron conversaciones" : "No hay conversaciones por el momento"}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-brand-ui text-sm font-medium">
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <>
          <div>
            {filteredConversations.map((item) => {
              const pinned = isConversationPinned(item, user.id)
              const unread = item.unreadCountByUser?.[user.id] || 0
              const avatarUri = (item.otherParticipant?.avatar || "").trim()
              const showAvatar = Boolean(avatarUri) && isValidImageUrl(avatarUri)
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                  <button onClick={() => openChat(item.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center overflow-hidden">
                        {showAvatar ? (
                          <img src={avatarUri} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-white text-lg">👤</span>
                        )}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-emerald-500 rounded-full text-white text-[11px] font-bold flex items-center justify-center px-1">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[15px] text-gray-900 truncate">{item.otherParticipant?.name || "Conversación"}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-gray-400">{formatTime(item.lastAt)}</span>
                          {pinned && <span className="text-[10px]">📌</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-sm text-gray-500 truncate">
                          {item.lastMessage?.type === "image" ? "📷 Imagen" : item.lastMessage?.text || "Nueva conversación"}
                        </span>
                        {unread > 0 && <span className="text-emerald-500 shrink-0">●</span>}
                      </div>
                    </div>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePin(item.id)}>
                        {pinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                        {pinned ? "Desfijar" : "Fijar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setConversationToDelete(item.id)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
          {hasMoreData && (
            <div className="flex justify-center py-4">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cargar más"}
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!conversationToDelete} onOpenChange={(open) => !open && setConversationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar conversación</AlertDialogTitle>
            <AlertDialogDescription>¿Estás seguro de que quieres eliminar esta conversación?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
