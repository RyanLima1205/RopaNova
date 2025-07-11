"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  Star,
  Mail,
  MessageCircle,
  Send,
  MoreVertical,
  ImageIcon,
  Mic,
  MicOff,
  Play,
  Pause,
  Smile,
  Check,
  CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

// Enhanced message interface
interface Message {
  id: number
  sender: "buyer" | "seller"
  text?: string
  timestamp: string
  status: "sending" | "sent" | "delivered" | "read"
  type: "text" | "image" | "voice"
  imageUrl?: string
  voiceDuration?: number
  reactions?: { emoji: string; count: number; users: string[] }[]
}

// Mock conversations data with enhanced messages
const conversationsData = [
  {
    id: 1,
    type: "product_inquiry",
    participant: {
      name: "Ana Rodríguez",
      avatar: "/placeholder.svg?height=40&width=40&text=AR",
      isOnline: true,
    },
    product: {
      title: "Vestido Elegante de Noche Zara",
      image: "/placeholder.svg?height=60&width=60&text=Vestido",
      price: 2500,
    },
    lastMessage: {
      text: "¿Está disponible este vestido?",
      timestamp: "14:30",
      sender: "buyer",
    },
    unreadCount: 2,
    isActive: false,
  },
  {
    id: 2,
    type: "review_followup",
    participant: {
      name: "Carmen López",
      avatar: "/placeholder.svg?height=40&width=40&text=CL",
      isOnline: false,
    },
    review: {
      rating: 4,
      comment: "Muy buena experiencia. El artículo estaba en perfectas condiciones...",
      productTitle: "Bolso de Cuero Genuino Coach",
    },
    lastMessage: {
      text: "Gracias por contactarme. El bolso llegó bien al final.",
      timestamp: "12:15",
      sender: "buyer",
    },
    unreadCount: 0,
    isActive: false,
  },
  {
    id: 3,
    type: "review_followup",
    participant: {
      name: "Sofía Pérez",
      avatar: "/placeholder.svg?height=40&width=40&text=SP",
      isOnline: true,
    },
    review: {
      rating: 3,
      comment: "El producto estaba bien, pero no exactamente como esperaba...",
      productTitle: "Jeans Skinny Levi's",
    },
    lastMessage: {
      text: "Hola Sofía, vi tu reseña y me gustaría resolver cualquier inconveniente.",
      timestamp: "10:45",
      sender: "seller",
    },
    unreadCount: 1,
    isActive: false,
  },
]

// Enhanced messages data with status and reactions
const messagesData: { [key: number]: Message[] } = {
  1: [
    {
      id: 1,
      sender: "buyer",
      text: "Hola, ¿está disponible este vestido?",
      timestamp: "14:30",
      status: "read",
      type: "text",
    },
    {
      id: 2,
      sender: "seller",
      text: "¡Hola Ana! Sí, está disponible. ¿Te interesa?",
      timestamp: "14:32",
      status: "read",
      type: "text",
      reactions: [{ emoji: "👍", count: 1, users: ["Ana Rodríguez"] }],
    },
    {
      id: 3,
      sender: "buyer",
      text: "Sí, me encanta. ¿Podrías enviarme más fotos?",
      timestamp: "14:35",
      status: "read",
      type: "text",
    },
    {
      id: 4,
      sender: "seller",
      type: "image",
      imageUrl: "/placeholder.svg?height=200&width=200&text=Vestido+Detalle",
      timestamp: "14:37",
      status: "delivered",
    },
    {
      id: 5,
      sender: "seller",
      type: "voice",
      voiceDuration: 15,
      timestamp: "14:38",
      status: "sent",
    },
  ],
  2: [
    {
      id: 1,
      sender: "seller",
      text: "Hola Carmen, vi tu reseña sobre el bolso Coach. Lamento la demora en el envío, tuvimos algunos problemas con el servicio de mensajería. Me alegra que al final todo haya salido bien.",
      timestamp: "11:30",
      status: "read",
      type: "text",
    },
    {
      id: 2,
      sender: "buyer",
      text: "Hola María, gracias por contactarme. Sí, al final el bolso llegó bien y estoy contenta con la compra. Solo fue la demora lo que me preocupó un poco.",
      timestamp: "12:15",
      status: "read",
      type: "text",
      reactions: [{ emoji: "❤️", count: 1, users: ["María González"] }],
    },
  ],
  3: [
    {
      id: 1,
      sender: "seller",
      text: "Hola Sofía, vi tu reseña sobre los jeans Levi's y me gustaría hablar contigo para resolver cualquier inconveniente que hayas tenido. Tu satisfacción es muy importante para mí.",
      timestamp: "10:45",
      status: "delivered",
      type: "text",
    },
  ],
}

// Quick reply suggestions based on conversation context
const quickReplySuggestions = {
  product_inquiry: [
    "Sí, está disponible 👍",
    "Te envío más fotos",
    "¿Qué talla necesitas?",
    "El precio es fijo",
    "¿Cuándo lo necesitas?",
  ],
  review_followup: [
    "Gracias por tu feedback",
    "¿Cómo puedo ayudarte?",
    "Lamento el inconveniente",
    "Me alegra que estés contenta",
    "¿Hay algo más que pueda hacer?",
  ],
}

export default function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState(conversationsData)
  const [messages, setMessages] = useState(messagesData)
  const [typingUsers, setTypingUsers] = useState<{ [key: number]: boolean }>({})
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [showReactions, setShowReactions] = useState<number | null>(null)
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const filteredConversations = conversations.filter((conv) =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const productInquiries = filteredConversations.filter((conv) => conv.type === "product_inquiry")
  const reviewFollowups = filteredConversations.filter((conv) => conv.type === "review_followup")

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activeConversation])

  // Load quick replies when conversation changes
  useEffect(() => {
    if (activeConversation) {
      const conversation = conversations.find((c) => c.id === activeConversation)
      if (conversation) {
        setQuickReplies(quickReplySuggestions[conversation.type as keyof typeof quickReplySuggestions] || [])
      }
    }
  }, [activeConversation, conversations])

  // Simulate typing indicator
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (newMessage.length > 0 && activeConversation) {
      // Simulate other user typing back after 2 seconds
      timeout = setTimeout(() => {
        setTypingUsers((prev) => ({ ...prev, [activeConversation]: true }))
        setTimeout(() => {
          setTypingUsers((prev) => ({ ...prev, [activeConversation]: false }))
        }, 3000)
      }, 2000)
    }
    return () => clearTimeout(timeout)
  }, [newMessage, activeConversation])

  const sendMessage = (messageText?: string, type: "text" | "image" | "voice" = "text") => {
    const textToSend = messageText || newMessage
    if (!textToSend.trim() && type === "text") return
    if (!activeConversation) return

    const newMsg: Message = {
      id: (messages[activeConversation]?.length || 0) + 1,
      sender: "seller",
      text: type === "text" ? textToSend : undefined,
      timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      status: "sending",
      type,
      imageUrl: type === "image" && selectedImage ? URL.createObjectURL(selectedImage) : undefined,
      voiceDuration: type === "voice" ? recordingTime : undefined,
    }

    setMessages((prev) => ({
      ...prev,
      [activeConversation]: [...(prev[activeConversation] || []), newMsg],
    }))

    // Simulate message status updates
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [activeConversation]: prev[activeConversation].map((msg) =>
          msg.id === newMsg.id ? { ...msg, status: "sent" } : msg,
        ),
      }))
    }, 500)

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [activeConversation]: prev[activeConversation].map((msg) =>
          msg.id === newMsg.id ? { ...msg, status: "delivered" } : msg,
        ),
      }))
    }, 1000)

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [activeConversation]: prev[activeConversation].map((msg) =>
          msg.id === newMsg.id ? { ...msg, status: "read" } : msg,
        ),
      }))
    }, 2000)

    // Update last message in conversation
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation
          ? {
              ...conv,
              lastMessage: {
                text: type === "text" ? textToSend : type === "image" ? "📷 Imagen" : "🎵 Mensaje de voz",
                timestamp: newMsg.timestamp,
                sender: "seller",
              },
            }
          : conv,
      ),
    )

    setNewMessage("")
    setSelectedImage(null)
    setShowImagePreview(false)
  }

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
    if (recordingTime > 0) {
      sendMessage("", "voice")
    }
    setRecordingTime(0)
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setShowImagePreview(true)
    }
  }

  const sendImage = () => {
    if (selectedImage) {
      sendMessage("", "image")
    }
  }

  const addReaction = (messageId: number, emoji: string) => {
    if (!activeConversation) return

    setMessages((prev) => ({
      ...prev,
      [activeConversation]: prev[activeConversation].map((msg) => {
        if (msg.id === messageId) {
          const existingReactions = msg.reactions || []
          const existingReaction = existingReactions.find((r) => r.emoji === emoji)

          if (existingReaction) {
            // Toggle reaction
            if (existingReaction.users.includes("María González")) {
              return {
                ...msg,
                reactions: existingReactions
                  .map((r) =>
                    r.emoji === emoji
                      ? { ...r, count: r.count - 1, users: r.users.filter((u) => u !== "María González") }
                      : r,
                  )
                  .filter((r) => r.count > 0),
              }
            } else {
              return {
                ...msg,
                reactions: existingReactions.map((r) =>
                  r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, "María González"] } : r,
                ),
              }
            }
          } else {
            return {
              ...msg,
              reactions: [...existingReactions, { emoji, count: 1, users: ["María González"] }],
            }
          }
        }
        return msg
      }),
    }))

    setShowReactions(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sending":
        return <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
    }
  }

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-3 w-3 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
      ))}
    </div>
  )

  const ConversationItem = ({ conversation }: { conversation: any }) => (
    <div
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
        activeConversation === conversation.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
      onClick={() => setActiveConversation(conversation.id)}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={conversation.participant.avatar || "/placeholder.svg"}
              alt={conversation.participant.name}
            />
            <AvatarFallback>
              {conversation.participant.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {conversation.participant.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-sm text-gray-900 truncate">{conversation.participant.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{conversation.lastMessage.timestamp}</span>
              {conversation.unreadCount > 0 && (
                <Badge className="bg-blue-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Conversation Type Indicator */}
          <div className="flex items-center gap-2 mb-2">
            {conversation.type === "product_inquiry" ? (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                <MessageCircle className="h-3 w-3 mr-1" />
                Consulta de producto
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                <Mail className="h-3 w-3 mr-1" />
                Seguimiento de reseña
              </Badge>
            )}
          </div>

          {/* Product or Review Context */}
          {conversation.type === "product_inquiry" && conversation.product && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
              <Image
                src={conversation.product.image || "/placeholder.svg"}
                alt={conversation.product.title}
                width={40}
                height={40}
                className="w-10 h-10 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">{conversation.product.title}</p>
                <p className="text-xs font-medium text-emerald-600">RD${conversation.product.price.toLocaleString()}</p>
              </div>
            </div>
          )}

          {conversation.type === "review_followup" && conversation.review && (
            <div className="mb-2 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={conversation.review.rating} />
                <span className="text-xs text-gray-600">Reseña</span>
              </div>
              <p className="text-xs text-gray-700 line-clamp-2">{conversation.review.comment}</p>
              <p className="text-xs text-gray-500 mt-1">Producto: {conversation.review.productTitle}</p>
            </div>
          )}

          <p className="text-sm text-gray-600 truncate">{conversation.lastMessage.text}</p>
        </div>
      </div>
    </div>
  )

  const MessageBubble = ({ message }: { message: Message }) => (
    <div className={`flex ${message.sender === "seller" ? "justify-end" : "justify-start"} group`}>
      <div className="relative max-w-xs lg:max-w-md">
        <div
          className={`px-4 py-2 rounded-lg ${
            message.sender === "seller" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
          }`}
        >
          {message.type === "text" && <p className="text-sm">{message.text}</p>}

          {message.type === "image" && (
            <div className="relative">
              <Image
                src={message.imageUrl || "/placeholder.svg"}
                alt="Imagen compartida"
                width={200}
                height={200}
                className="rounded-lg max-w-full h-auto"
              />
            </div>
          )}

          {message.type === "voice" && (
            <div className="flex items-center gap-2 min-w-[120px]">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${message.sender === "seller" ? "text-white hover:bg-blue-600" : "text-gray-600 hover:bg-gray-200"}`}
                onClick={() => setIsPlaying(isPlaying === message.id ? null : message.id)}
              >
                {isPlaying === message.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="flex-1">
                <Progress value={isPlaying === message.id ? 60 : 0} className="h-1" />
              </div>
              <span className="text-xs">{formatTime(message.voiceDuration || 0)}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-1">
            <p className={`text-xs ${message.sender === "seller" ? "text-blue-100" : "text-gray-500"}`}>
              {message.timestamp}
            </p>
            {message.sender === "seller" && <div className="ml-2">{getStatusIcon(message.status)}</div>}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1">
            {message.reactions.map((reaction, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-full px-2 py-1 text-xs flex items-center gap-1 shadow-sm"
              >
                <span>{reaction.emoji}</span>
                <span className="text-gray-600">{reaction.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Reaction Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -bottom-2 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 shadow-sm"
          onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
        >
          <Smile className="h-3 w-3" />
        </Button>

        {/* Reaction Picker */}
        {showReactions === message.id && (
          <div className="absolute bottom-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-10">
            {["👍", "❤️", "😊", "😮", "😢", "😡"].map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-100"
                onClick={() => addReaction(message.id, emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-gray-900">Mensajes</h1>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Conversations List */}
        <div
          className={`${activeConversation ? "hidden md:block" : "block"} w-full md:w-1/3 bg-white border-r border-gray-200`}
        >
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-0 rounded-full"
              />
            </div>
          </div>

          {/* Conversation Tabs */}
          <Tabs defaultValue="todas" className="w-full">
            <TabsList className="grid grid-cols-3 m-4 mb-0">
              <TabsTrigger value="todas">Todas ({filteredConversations.length})</TabsTrigger>
              <TabsTrigger value="productos">Productos ({productInquiries.length})</TabsTrigger>
              <TabsTrigger value="reseñas">Reseñas ({reviewFollowups.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="todas" className="mt-0">
              <div className="overflow-y-auto h-[calc(100vh-200px)]">
                {filteredConversations.map((conversation) => (
                  <ConversationItem key={conversation.id} conversation={conversation} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="productos" className="mt-0">
              <div className="overflow-y-auto h-[calc(100vh-200px)]">
                {productInquiries.map((conversation) => (
                  <ConversationItem key={conversation.id} conversation={conversation} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reseñas" className="mt-0">
              <div className="overflow-y-auto h-[calc(100vh-200px)]">
                {reviewFollowups.map((conversation) => (
                  <ConversationItem key={conversation.id} conversation={conversation} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className={`${activeConversation ? "block" : "hidden md:block"} flex-1 flex flex-col bg-white`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:hidden"
                    onClick={() => setActiveConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        conversations.find((c) => c.id === activeConversation)?.participant.avatar ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt="Participant"
                    />
                    <AvatarFallback>
                      {conversations
                        .find((c) => c.id === activeConversation)
                        ?.participant.name.split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {conversations.find((c) => c.id === activeConversation)?.participant.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {typingUsers[activeConversation]
                        ? "Escribiendo..."
                        : conversations.find((c) => c.id === activeConversation)?.participant.isOnline
                          ? "En línea"
                          : "Desconectado"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(messages[activeConversation] || []).map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {typingUsers[activeConversation] && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {quickReplies.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {quickReplies.map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap text-xs bg-transparent"
                        onClick={() => sendMessage(reply)}
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t border-gray-100">
                {isRecording && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-red-700">Grabando... {formatTime(recordingTime)}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={stopRecording} className="text-red-600 hover:bg-red-100">
                      <MicOff className="h-4 w-4 mr-1" />
                      Detener
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <div className="flex gap-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 ${isRecording ? "bg-red-100 text-red-600" : ""}`}
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Escribe tu mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 h-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Selecciona una conversación</p>
                <p className="text-sm">Elige una conversación para comenzar a chatear</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Imagen</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative">
                <Image
                  src={URL.createObjectURL(selectedImage) || "/placeholder.svg"}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setShowImagePreview(false)
                    setSelectedImage(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={sendImage}>
                  Enviar Imagen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
