"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, MessageCircle, ShoppingBag, Banknote } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { RequireAuth } from "@/components/require-auth"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"

type PrefKey = "messages" | "orderStatus" | "newSales"

const PREF_ITEMS: { key: PrefKey; title: string; desc: string; icon: typeof MessageCircle; color: string; bg: string }[] = [
  { key: "messages", title: "Mensajes nuevos", desc: "Cuando recibes un mensaje de otro usuario", icon: MessageCircle, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "orderStatus", title: "Actualizaciones de pedidos", desc: "Cambios de estado en tus compras y ventas", icon: ShoppingBag, color: "text-violet-600", bg: "bg-violet-50" },
  { key: "newSales", title: "Nuevas ventas", desc: "Cuando alguien compra uno de tus artículos", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
]

const defaultPrefs: Record<PrefKey, boolean> = { messages: true, orderStatus: true, newSales: true }

export default function NotificacionesPageGate() {
  return (
    <RequireAuth>
      <NotificacionesPage />
    </RequireAuth>
  )
}

function NotificacionesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>(defaultPrefs)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrefs = async () => {
      setLoading(true)
      if (!user?.id) {
        setLoading(false)
        return
      }
      try {
        const docSnap = await getDoc(doc(db, "users", user.id))
        const notificationPrefs = docSnap.exists() ? docSnap.data().notificationPrefs : null
        setPrefs({ ...defaultPrefs, ...notificationPrefs })
      } catch {
        setPrefs(defaultPrefs)
      }
      setLoading(false)
    }
    fetchPrefs()
  }, [user?.id])

  // NOTA: mobile (NotificationSettingsScreen) también revisa el permiso de notificaciones del SISTEMA vía
  // expo-notifications y deshabilita los 3 toggles si está apagado, con un banner para ir a Ajustes del
  // dispositivo. Web no tiene un equivalente conectado (no hay service worker / Notification API implementado
  // en esta app), así que se omite el banner y los toggles quedan siempre interactivos — es la parte real y
  // portable de esta pantalla, respaldada por Firestore.
  const toggle = async (key: PrefKey, value: boolean) => {
    if (!user?.id) return
    const previous = prefs[key]
    setPrefs((prev) => ({ ...prev, [key]: value }))
    try {
      await updateDoc(doc(db, "users", user.id), { [`notificationPrefs.${key}`]: value })
    } catch {
      setPrefs((prev) => ({ ...prev, [key]: previous }))
      toast({ title: "No se pudo actualizar la preferencia", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-semibold text-gray-900">Notificaciones</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 divide-y">
          {PREF_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.key} className="flex items-center gap-3 p-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <Switch checked={prefs[item.key]} onCheckedChange={(v) => toggle(item.key, v)} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
