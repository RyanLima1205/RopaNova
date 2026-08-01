"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, MoreVertical, WifiOff, MessageCircle, Send, X, Loader2, ShoppingBag, User, BellOff, Flag, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { doc, getDoc, type QueryDocumentSnapshot } from "firebase/firestore"
import {
  subscribeToMessages,
  fetchOlderMessages,
  sendMessage,
  type ChatMessage,
} from "@/lib/services/chatService"
import { formatPrice } from "@/lib/formatters"
import { getUserDocumentAvatarUrl } from "@/lib/imageUtils"

/** Título del header: tienda → storeName; privado → @username; si no, nombre completo. */
function chatPeerTitle(data: Record<string, unknown>): string {
  const accountType = String(data.accountType || "")
  const username = String(data.username || "")
  const storeName = String(data.storeName || "").trim()
  const fullName = `${String(data.name || "")} ${String(data.lastname || "")}`.trim()
  const h = username.trim().replace(/^@+/, "")
  const at = h ? `@${h}` : ""

  if (accountType === "privado") return at || fullName || "Usuario"
  if (accountType === "virtual" || accountType === "fisica") {
    if (storeName) return storeName
    return fullName || at || "Usuario"
  }
  return storeName || fullName || at || "Usuario"
}

export default function ChatPageGate() {
  return (
    <RequireAuth>
      <ChatPage />
    </RequireAuth>
  )
}

function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const conversationId = params.conversationId as string
  const productInfo = searchParams.get("productId")
    ? {
        id: searchParams.get("productId") || "",
        title: searchParams.get("productTitle") || "",
        price: Number(searchParams.get("productPrice")) || 0,
        image: searchParams.get("productImage") || "",
        sellerId: searchParams.get("sellerId") || "",
        sellerName: searchParams.get("sellerName") || "",
        selectedSize: searchParams.get("selectedSize") || undefined,
      }
    : null

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState("")
  const [showProductPreview, setShowProductPreview] = useState(true)
  const [peerTitle, setPeerTitle] = useState(() => productInfo?.sellerName?.trim() || "")
  const [peerAvatarUrl, setPeerAvatarUrl] = useState("")
  const [peerUserId, setPeerUserId] = useState<string | null>(() => productInfo?.sellerId || null)
  const [linkedProductId, setLinkedProductId] = useState<string | null>(() => productInfo?.id || null)
  const [subscriptionError, setSubscriptionError] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasOlderMessages, setHasOlderMessages] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)

  const paginationCursorRef = useRef<QueryDocumentSnapshot | null>(null)
  const olderMessagesRef = useRef<ChatMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const loadPeerTitle = async () => {
      const fallback = productInfo?.sellerName?.trim() || "Chat"
      if (!conversationId?.trim() || !user?.id) {
        setPeerTitle(fallback)
        return
      }
      try {
        const convSnap = await getDoc(doc(db, "conversations", conversationId))
        if (cancelled) return
        if (!convSnap.exists()) {
          setPeerTitle(fallback)
          return
        }
        const convData = convSnap.data() as { participants?: string[]; productRef?: { id?: string } }
        const participants = convData.participants
        if (!participants?.length) {
          setPeerTitle(fallback)
          return
        }
        const otherId = participants.find((p) => p !== user.id) ?? participants[0]
        setPeerUserId(otherId)
        setLinkedProductId(productInfo?.id || convData.productRef?.id || null)

        const userSnap = await getDoc(doc(db, "users", otherId))
        if (cancelled) return
        if (userSnap.exists()) {
          const peerData = userSnap.data() as Record<string, unknown>
          setPeerTitle(chatPeerTitle(peerData))
          setPeerAvatarUrl(getUserDocumentAvatarUrl(peerData))
        } else {
          setPeerTitle(fallback)
        }
      } catch {
        if (!cancelled) setPeerTitle(fallback)
      }
    }
    loadPeerTitle()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id])

  useEffect(() => {
    if (!conversationId || conversationId.trim() === "") {
      setMessages([])
      return
    }
    const unsub = subscribeToMessages(
      conversationId,
      (freshMessages, oldestDoc) => {
        setSubscriptionError(false)
        if (paginationCursorRef.current === null && oldestDoc) {
          paginationCursorRef.current = oldestDoc
          setHasOlderMessages(freshMessages.length >= 30)
        }
        const freshIds = new Set(freshMessages.map((m) => m.id))
        const kept = olderMessagesRef.current.filter((m) => !freshIds.has(m.id))
        setMessages([...freshMessages, ...kept])
      },
      () => setSubscriptionError(true),
    )
    return () => {
      try {
        unsub && unsub()
      } catch {}
    }
  }, [conversationId])

  // Autoscroll al fondo cuando llegan mensajes nuevos (mensajes ordenados desc → el más
  // reciente es messages[0]; los renderizamos invertidos para que quede abajo, como en mobile).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasOlderMessages || !paginationCursorRef.current) return
    setLoadingOlder(true)
    try {
      const { messages: older, lastDoc, hasMore } = await fetchOlderMessages(conversationId, paginationCursorRef.current)
      if (older.length > 0) {
        olderMessagesRef.current = [...olderMessagesRef.current, ...older]
        paginationCursorRef.current = lastDoc
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          return [...prev, ...older.filter((m) => !existingIds.has(m.id))]
        })
      }
      setHasOlderMessages(hasMore)
    } finally {
      setLoadingOlder(false)
    }
  }, [conversationId, loadingOlder, hasOlderMessages])

  const onSend = async () => {
    if (!text.trim() || !user?.id || !conversationId.trim()) return
    const value = text.trim()
    setText("")
    try {
      await sendMessage(conversationId, user.id, { text: value })
    } catch {
      toast({ title: "No se pudo enviar el mensaje", variant: "destructive" })
    }
  }

  const canShowProduct = Boolean(linkedProductId)
  const canShowProfile = Boolean(peerUserId)

  // TODO: enlazar a /vendedor/[id] (perfil público del vendedor) una vez esa página
  // exista (mobile: ProfileScreen.tsx en su variante viewUserId) — aún no construida.
  const handleVerPerfil = () => {
    if (!peerUserId) {
      toast({ title: "No se pudo identificar al usuario." })
      return
    }
    toast({ title: "Próximamente", description: "La página de perfil del vendedor estará disponible pronto." })
  }

  // Mismo comportamiento que mobile hoy: estas 3 opciones son "próximamente", no funciones reales.
  const handleSilenciar = () => toast({ title: "Silenciar", description: "Próximamente podrás silenciar las notificaciones de esta conversación." })
  const handleSenalar = () =>
    toast({ title: "Señalar", description: "Gracias por ayudarnos a mantener RopaNova seguro. La denuncia detallada estará disponible próximamente." })
  const handleBloquear = () => {
    if (!peerUserId) {
      toast({ title: "No se pudo identificar al usuario." })
      return
    }
    setBlockDialogOpen(true)
  }
  const confirmBloquear = () => {
    setBlockDialogOpen(false)
    toast({ title: "Información", description: "La función de bloqueo estará disponible próximamente." })
  }

  // messages llega ordenado desc (más reciente primero) — se invierte para pintarlo cronológico.
  const chronological = [...messages].reverse()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-2 py-2.5 flex items-center gap-2 sticky top-0 z-10">
        <Link href="/mensajes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2.5 flex-1 min-w-0 px-1">
          <div className="h-9 w-9 rounded-full bg-emerald-500 overflow-hidden flex items-center justify-center shrink-0">
            {peerAvatarUrl ? (
              <img src={peerAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-white" />
            )}
          </div>
          <span className="font-semibold text-gray-900 truncate">{peerTitle || "Chat"}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canShowProduct && (
              <DropdownMenuItem asChild>
                <Link href={`/producto/${linkedProductId}`}>
                  <ShoppingBag className="h-4 w-4 mr-2" /> Ver producto
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleVerPerfil} disabled={!canShowProfile}>
              <User className="h-4 w-4 mr-2" /> Ver perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSilenciar}>
              <BellOff className="h-4 w-4 mr-2" /> Silenciar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSenalar} className="text-amber-700 focus:text-amber-700">
              <Flag className="h-4 w-4 mr-2" /> Señalar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleBloquear} className="text-red-600 focus:text-red-600">
              <Ban className="h-4 w-4 mr-2" /> Bloquear usuario
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {subscriptionError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-red-700 shrink-0" />
          <span className="text-sm text-red-700 flex-1">No se pudieron cargar los mensajes.</span>
          <button onClick={() => { setSubscriptionError(false); setMessages([]) }} className="text-xs font-semibold bg-red-700 text-white px-2.5 py-1 rounded">
            Reintentar
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {hasOlderMessages && (
          <div className="flex justify-center pb-2">
            <button onClick={loadOlderMessages} disabled={loadingOlder} className="text-xs text-brand-ui font-medium flex items-center gap-1.5">
              {loadingOlder && <Loader2 className="h-3 w-3 animate-spin" />}
              Cargar mensajes anteriores
            </button>
          </div>
        )}

        {chronological.length === 0 && !subscriptionError ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <MessageCircle className="h-12 w-12 text-gray-200" />
            <p className="text-sm text-gray-400">
              Pregunta sobre la talla, el estado o coordina la entrega — el vendedor te responderá aquí.
            </p>
          </div>
        ) : (
          chronological.map((m) => {
            const mine = m.senderId === user?.id
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-tight ${
                    mine ? "bg-brand-ui text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
                >
                  {m.type === "image" ? "📷 Imagen" : m.text || ""}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Product preview */}
      {productInfo && showProductPreview && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Acerca de este producto</span>
            <button onClick={() => setShowProductPreview(false)} className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <img src={productInfo.image || "/placeholder.svg"} alt="" className="h-[60px] w-[60px] rounded-md object-cover bg-gray-100" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{productInfo.title}</p>
              <p className="text-brand-ui font-bold">{formatPrice(productInfo.price)}</p>
              {productInfo.selectedSize && (
                <span className="inline-block mt-1 text-xs font-semibold text-brand-ui bg-brand-extraLight rounded-full px-2 py-0.5">
                  Talla: {productInfo.selectedSize}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-3 flex items-center gap-3 sticky bottom-0">
        <Input
          placeholder="Escribe un mensaje"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          className="flex-1"
        />
        <Button size="icon" onClick={onSend} className="bg-brand-ui hover:bg-brand-dark rounded-full shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear usuario</AlertDialogTitle>
            <AlertDialogDescription>¿Seguro que deseas bloquear a este usuario? No podrá enviarte mensajes.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBloquear} className="bg-red-600 hover:bg-red-700">
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
