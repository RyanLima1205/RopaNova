"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  X,
  Save,
  Pencil,
  UserCircle,
  BadgeCheck,
  CalendarDays,
  Key,
  Star,
  Eye,
  Trash2,
  LogOut,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RequireAuth } from "@/components/require-auth"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc, setDoc, query, where, collection, getDocs } from "firebase/firestore"

const defaultUserData = {
  name: "",
  username: "",
  email: "",
  phone: "",
  bio: "",
  province: "",
  city: "",
  streetAddress: "",
  birthDate: "",
  gender: "",
  verified: false,
  createdAt: null as any,
  privacy: {
    showEmail: false,
    showPhone: false,
    showLastSeen: true,
    allowMessages: true,
  },
  lastname: "",
  storeName: "",
  accountType: "",
  usernameLastChanged: null as string | { toDate: () => Date } | null,
  usernameHistory: [] as string[],
}

const dominicanProvinces = [
  "Distrito Nacional", "Santiago", "La Altagracia", "Puerto Plata", "La Romana",
  "San Pedro de Macorís", "Duarte", "La Vega", "Espaillat", "Monseñor Nouel",
  "Hermanas Mirabal", "Samaná", "María Trinidad Sánchez", "Valverde", "Monte Cristi",
  "Dajabón", "Santiago Rodríguez", "Elías Piña", "San Juan", "Azua", "Peravia",
  "San José de Ocoa", "Independencia", "Baoruco", "Barahona", "Pedernales",
  "Monte Plata", "Hato Mayor", "El Seibo", "San Cristóbal",
]

const forbiddenUsernames = ["admin", "support", "root", "administrator", "moderator"]
const usernameRegex = /^[a-z0-9._-]{3,20}$/

const countryCodes = [
  { code: "+1", label: "🇩🇴 RD" },
  { code: "+52", label: "🇲🇽 MX" },
  { code: "+33", label: "🇫🇷 FR" },
  { code: "+34", label: "🇪🇸 ES" },
]

function formatCreatedAtES(createdAt: any): string {
  if (!createdAt) return ""
  let dateObj: Date
  if (typeof createdAt === "string" || typeof createdAt === "number") {
    dateObj = new Date(createdAt)
  } else if (createdAt.toDate) {
    dateObj = createdAt.toDate()
  } else {
    return ""
  }
  const moisES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  return `${moisES[dateObj.getMonth()]} ${dateObj.getFullYear()}`
}

export default function CuentaPageGate() {
  return (
    <RequireAuth>
      <CuentaPage />
    </RequireAuth>
  )
}

function CuentaPage() {
  const router = useRouter()
  const { user, logout, deleteFirebaseAccount } = useAuth()
  const [userData, setUserData] = useState(defaultUserData)
  const [originalUserData, setOriginalUserData] = useState(defaultUserData)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [canEditUsername, setCanEditUsername] = useState(true)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [countryCode, setCountryCode] = useState("+1")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      if (!user?.id) {
        setUserData(defaultUserData)
        setOriginalUserData(defaultUserData)
        setLoading(false)
        return
      }
      try {
        const docRef = doc(db, "users", user.id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const merged = { ...defaultUserData, ...docSnap.data() }
          setUserData(merged)
          setOriginalUserData(merged)
        } else {
          setUserData(defaultUserData)
          setOriginalUserData(defaultUserData)
        }
      } catch {
        setUserData(defaultUserData)
        setOriginalUserData(defaultUserData)
      }
      setLoading(false)
    }
    fetchUserData()
  }, [user?.id])

  useEffect(() => {
    if (!userData.usernameLastChanged) {
      setCanEditUsername(true)
      return
    }
    const last =
      typeof userData.usernameLastChanged === "string"
        ? new Date(userData.usernameLastChanged)
        : userData.usernameLastChanged.toDate
        ? userData.usernameLastChanged.toDate()
        : new Date()
    const days = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)
    setCanEditUsername(days >= 30)
  }, [userData.usernameLastChanged])

  const validateUsername = async (value: string) => {
    setCheckingUsername(true)
    if (!usernameRegex.test(value)) {
      setUsernameError('El nombre de usuario debe tener entre 3 y 20 caracteres, y puede tener letras, cifras, ".", "_", "-".')
      setCheckingUsername(false)
      return false
    }
    if (forbiddenUsernames.includes(value.toLowerCase())) {
      setUsernameError("Este nombre de usuario no está permitido.")
      setCheckingUsername(false)
      return false
    }
    if (value && value !== originalUserData.username) {
      try {
        const q = query(collection(db, "users"), where("username", "==", value))
        const snap = await getDocs(q)
        const taken = snap.docs.some((d) => d.id !== user?.id)
        if (taken) {
          setUsernameError("Por favor, introduce un nombre de usuario válido.")
          setCheckingUsername(false)
          return false
        }
      } catch {
        // red de forma opcional; no bloquea la validación local
      }
    }
    setUsernameError(null)
    setCheckingUsername(false)
    return true
  }

  const updateUserData = (field: string, value: any) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
  }

  const updatePrivacyData = (field: string, value: boolean) => {
    setUserData((prev) => ({ ...prev, privacy: { ...prev.privacy, [field]: value } }))
  }

  const handleSave = async () => {
    if (!user?.id) return
    setIsSaving(true)
    const valid = await validateUsername(userData.username)
    if (!valid) {
      setIsSaving(false)
      return
    }
    try {
      const q = query(collection(db, "users"), where("username", "==", userData.username))
      const snap = await getDocs(q)
      const taken = snap.docs.some((d) => d.id !== user.id)
      if (taken) {
        setUsernameError("Este nombre de usuario ya está en uso.")
        setIsSaving(false)
        return
      }
      let newUserData: any = { ...userData }
      if (userData.username !== originalUserData.username) {
        newUserData.usernameHistory = Array.isArray(userData.usernameHistory)
          ? [...userData.usernameHistory, originalUserData.username].filter(Boolean)
          : [originalUserData.username].filter(Boolean)
        newUserData.usernameLastChanged = new Date().toISOString()
      }
      if (userData.phone) {
        newUserData.phone = countryCode + userData.phone.replace(/\D/g, "")
      }
      await setDoc(doc(db, "users", user.id), newUserData, { merge: true })
      setOriginalUserData({ ...newUserData })
      setUserData({ ...newUserData })
      setIsEditing(false)
      toast({ title: "¡Perfil actualizado exitosamente!" })
    } catch {
      toast({ title: "Error al guardar el perfil", variant: "destructive" })
    }
    setIsSaving(false)
  }

  const handleCancel = () => {
    setUserData(originalUserData)
    setIsEditing(false)
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
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Información Personal</h1>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving} className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100">
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-brand-ui hover:bg-brand-dark">
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-brand-ui border-brand-light bg-brand-extraLight hover:bg-brand-light">
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
        )}
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Avatar + info */}
        <div className="flex flex-col items-center py-2">
          <div className="h-20 w-20 rounded-full bg-brand-extraLight flex items-center justify-center">
            <UserCircle className="h-16 w-16 text-brand-ui" />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <h2 className="text-lg font-bold text-gray-900">
              {(userData.accountType === "fisica" || userData.accountType === "virtual") && userData.storeName
                ? userData.storeName
                : `${userData.name} ${userData.lastname}`.trim()}
            </h2>
            {userData.verified && (
              <span className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                <BadgeCheck className="h-3 w-3 text-white" />
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">@{userData.username}</p>
          <div className="flex items-center gap-1 bg-brand-extraLight text-brand-dark text-xs rounded-full px-2.5 py-1 mt-2">
            <CalendarDays className="h-3.5 w-3.5" />
            {userData.createdAt ? `Miembro desde ${formatCreatedAtES(userData.createdAt)}` : "Miembro desde"}
          </div>
        </div>

        {/* Información Básica */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="font-bold text-brand-dark text-sm">Información Básica</p>
          {(userData.accountType === "fisica" || userData.accountType === "virtual") && (
            <Input value={userData.storeName} onChange={(e) => updateUserData("storeName", e.target.value)} disabled={!isEditing} placeholder="Nombre de la Tienda" />
          )}
          <Input value={userData.name} onChange={(e) => updateUserData("name", e.target.value)} disabled={!isEditing} placeholder="Nombre Completo" />
          <Input value={userData.lastname || ""} onChange={(e) => updateUserData("lastname", e.target.value)} disabled={!isEditing} placeholder="Apellido" />
          <div>
            <Input
              value={userData.username}
              onChange={async (e) => {
                const lower = e.target.value.replace(/[^a-z0-9._-]/g, "").toLowerCase()
                updateUserData("username", lower)
                await validateUsername(lower)
              }}
              disabled={!isEditing || !canEditUsername}
              placeholder="Nombre de Usuario"
            />
            {isEditing && canEditUsername && (
              <p className="text-xs text-gray-500 mt-1">Si cambias tu nombre de usuario, no podrás volver a cambiarlo durante 30 días.</p>
            )}
            {checkingUsername && <Loader2 className="h-4 w-4 animate-spin text-brand-ui mt-1" />}
            {isEditing && !canEditUsername && (
              <p className="text-xs text-red-600 mt-1">Solo puedes cambiar tu nombre de usuario una vez cada 30 días.</p>
            )}
            {isEditing && usernameError && <p className="text-xs text-red-600 mt-1">{usernameError}</p>}
          </div>
          <Textarea value={userData.bio} onChange={(e) => updateUserData("bio", e.target.value)} disabled={!isEditing} placeholder="Biografía" rows={3} />
          <Select value={userData.gender || undefined} onValueChange={(v) => updateUserData("gender", v)} disabled={!isEditing}>
            <SelectTrigger>
              <SelectValue placeholder="Género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Femenino">Femenino</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={userData.birthDate}
            onChange={(e) => updateUserData("birthDate", e.target.value)}
            disabled={!isEditing}
            max={new Date().toISOString().slice(0, 10)}
            placeholder="Fecha de Nacimiento"
          />
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="font-bold text-brand-dark text-sm">Información de Contacto</p>
          <Input value={userData.email} disabled placeholder="Correo Electrónico" className="bg-gray-100 text-gray-500" />
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={setCountryCode} disabled={!isEditing}>
              <SelectTrigger className="w-28 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label} {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={userData.phone} onChange={(e) => updateUserData("phone", e.target.value)} disabled={!isEditing} placeholder="Teléfono" type="tel" />
          </div>
        </div>

        {/* Ubicación */}
        {/* NOTA: mobile (AccountSettingsScreen) incluye un selector de ubicación en mapa (react-native-maps +
            expo-location, con geocodificación inversa) para accountType 'fisica'. No hay equivalente directo en
            web sin agregar un SDK de mapas — se omite por ahora y se dejan los campos de texto planos, que en
            mobile ya existen como fallback/edición manual. TODO: mapa interactivo si se agrega un SDK de mapas web. */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="font-bold text-brand-dark text-sm">Ubicación</p>
          <Select value={userData.province || undefined} onValueChange={(v) => updateUserData("province", v)} disabled={!isEditing}>
            <SelectTrigger>
              <SelectValue placeholder="Provincia" />
            </SelectTrigger>
            <SelectContent>
              {dominicanProvinces.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={userData.city} onChange={(e) => updateUserData("city", e.target.value)} disabled={!isEditing} placeholder="Ciudad/Municipio" />
          {userData.accountType === "fisica" && (
            <Input
              value={userData.streetAddress}
              onChange={(e) => updateUserData("streetAddress", e.target.value)}
              disabled={!isEditing}
              placeholder="Indica el nombre de la calle y número"
            />
          )}
        </div>

        {/* Privacidad */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <p className="font-bold text-brand-dark text-sm">Configuración de Privacidad</p>
          {[
            { key: "showEmail", label: "Mostrar correo electrónico", desc: "Otros usuarios pueden ver tu email" },
            { key: "showPhone", label: "Mostrar teléfono", desc: "Otros usuarios pueden ver tu teléfono" },
            { key: "showLastSeen", label: "Mostrar última conexión", desc: "Mostrar cuándo estuviste activo por última vez" },
            { key: "allowMessages", label: "Permitir mensajes", desc: "Otros usuarios pueden enviarte mensajes" },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-900">{row.label}</p>
                <p className="text-xs text-gray-500">{row.desc}</p>
              </div>
              <Switch
                checked={(userData.privacy as any)[row.key]}
                onCheckedChange={(v) => updatePrivacyData(row.key, v)}
                disabled={!isEditing}
              />
            </div>
          ))}
        </div>

        {/* Seguridad */}
        {/* NOTA: en mobile, "Cambiar Contraseña", "Verificar Identidad" y "Sesiones Activas" navegan los TRES al
            mismo PrivacySettingsScreen — no son funciones separadas, es un bug/placeholder en el código fuente.
            Se porta fielmente (mismo destino para los tres) en vez de inventar pantallas que no existen. */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <p className="font-bold text-brand-dark text-sm mb-1">Seguridad</p>
          <Button variant="ghost" className="w-full justify-start bg-brand-extraLight text-brand-dark hover:bg-brand-light" onClick={() => router.push("/configuracion/privacidad")}>
            <Key className="h-4 w-4 mr-2" /> Cambiar Contraseña
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-brand-extraLight text-brand-dark hover:bg-brand-light" onClick={() => router.push("/configuracion/privacidad")}>
            <Star className="h-4 w-4 mr-2" /> Verificar Identidad
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-brand-extraLight text-brand-dark hover:bg-brand-light" onClick={() => router.push("/configuracion/privacidad")}>
            <Eye className="h-4 w-4 mr-2" /> Sesiones Activas
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-700 border-red-200 bg-red-50 hover:bg-red-100"
            onClick={() => {
              if (!user?.id) {
                toast({ title: "Inicia sesión con correo y contraseña para eliminar la cuenta." })
                return
              }
              setDeletePassword("")
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Eliminar cuenta
          </Button>
          <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 bg-red-50 hover:bg-red-100" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
          </Button>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !deletingAccount && setDeleteDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cuenta</DialogTitle>
            <DialogDescription>
              Se eliminará el acceso con tu correo (Firebase Authentication). Los datos ya guardados (anuncios,
              mensajes, etc.) pueden seguir existiendo; contacta soporte si quieres un borrado completo de datos.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Contraseña actual"
            disabled={deletingAccount}
          />
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              className="w-full bg-red-700 hover:bg-red-800"
              disabled={deletingAccount}
              onClick={async () => {
                if (!deletePassword.trim()) {
                  toast({ title: "Ingresa tu contraseña actual." })
                  return
                }
                setDeletingAccount(true)
                try {
                  await deleteFirebaseAccount(deletePassword)
                  setDeleteDialogOpen(false)
                  toast({ title: "Cuenta eliminada", description: "Tu acceso ha sido eliminado." })
                } catch {
                  toast({
                    title: "Error",
                    description: "No se pudo eliminar. Verifica la contraseña o cierra sesión y vuelve a entrar antes de intentar otra vez.",
                    variant: "destructive",
                  })
                }
                setDeletingAccount(false)
              }}
            >
              {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Eliminar definitivamente
            </Button>
            <Button variant="ghost" className="w-full" disabled={deletingAccount} onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
