"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShieldCheck, Loader2, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { RequireAuth } from "@/components/require-auth"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc, setDoc } from "firebase/firestore"

const initialPrivacySettings = {
  PrivacidadDelPerfil: {
    mostrarCorreoElectronico: false,
    mostrarTelefono: false,
    mostrarUbicacion: true,
    mostrarUltimaConexion: true,
    mostrarEstadoEnLinea: true,
    visibilidadPerfil: "publico",
  },
  PrivacidadDeMensajes: {
    permitirMensajes: true,
    permitirMensajesDe: "todos",
    confirmacionesDeLectura: true,
    indicadoresDeEscritura: true,
    solicitudesDeMensajes: true,
  },
  PrivacidadDeActividad: {
    mostrarCompras: false,
    mostrarVentas: true,
    mostrarFavoritos: false,
    mostrarSeguidos: true,
    mostrarResenas: true,
    estadoDeActividad: true,
  },
  PrivacidadDeBusqueda: {
    buscarPorTelefono: false,
    buscarPorNombre: true,
    sugerenciasDeUsuarios: true,
    indexarPerfil: true,
  },
  PrivacidadDeDatos: {
    recopilacionDeDatos: true,
    analisisDeUso: false,
    personalizacion: true,
    compartirConTerceros: false,
  },
}

type PrivacySettings = typeof initialPrivacySettings
type PrivacyCategory = keyof PrivacySettings

const profileVisibilityOptions = [
  { value: "publico", label: "Público" },
  { value: "seguidores", label: "Seguidores" },
  { value: "privado", label: "Privado" },
]

const allowMessagesFromOptions = [
  { value: "todos", label: "Todos" },
  { value: "verificados", label: "Verificados" },
  { value: "seguidos", label: "Quienes Sigo" },
]

function deepMerge(target: any, source: any) {
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      target[key] = deepMerge(target[key] || {}, source[key])
    } else {
      target[key] = source[key]
    }
  }
  return target
}

function SwitchRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-bold text-gray-900">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function SegmentedRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            value === opt.value ? "bg-brand-ui text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function PrivacidadPageGate() {
  return (
    <RequireAuth>
      <PrivacidadPage />
    </RequireAuth>
  )
}

function PrivacidadPage() {
  const router = useRouter()
  const { user, changePassword } = useAuth()
  const [settings, setSettings] = useState<PrivacySettings>(initialPrivacySettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [changingPwd, setChangingPwd] = useState(false)

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      setIsLoading(true)
      if (!user?.id) {
        setIsLoading(false)
        return
      }
      try {
        const docRef = doc(db, "users", user.id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists() && docSnap.data().privacySettings) {
          setSettings(deepMerge({ ...initialPrivacySettings }, docSnap.data().privacySettings))
        } else {
          setSettings(initialPrivacySettings)
        }
      } catch {
        setSettings(initialPrivacySettings)
      }
      setIsLoading(false)
    }
    fetchPrivacySettings()
  }, [user?.id])

  const updateSetting = (category: PrivacyCategory, key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [category]: { ...prev[category], [key]: value } }))
  }

  // Mobile guarda automáticamente al salir de la pantalla (listener 'beforeRemove' de react-navigation).
  // Web no tiene un evento equivalente de "salida de página", así que se agrega este botón visible de
  // guardado explícito en su lugar — es el equivalente sensato, no una réplica literal de un mecanismo
  // que no puede existir en el navegador.
  const handleSave = useCallback(async () => {
    if (!user?.id) return
    setIsSaving(true)
    try {
      await setDoc(doc(db, "users", user.id), { privacySettings: settings }, { merge: true })
      toast({ title: "Configuración de Privacidad Guardada con Éxito." })
    } catch {
      toast({ title: "Error al Guardar la Configuración de Privacidad.", variant: "destructive" })
    }
    setIsSaving(false)
  }, [settings, user])

  const handleChangePassword = async () => {
    if (!user?.id) return
    if (!newPwd || newPwd.length < 6) {
      toast({ title: "La nueva contraseña debe tener al menos 6 caracteres." })
      return
    }
    if (newPwd !== confirmPwd) {
      toast({ title: "La confirmación no coincide." })
      return
    }
    setChangingPwd(true)
    try {
      await changePassword(currentPwd, newPwd)
      setCurrentPwd("")
      setNewPwd("")
      setConfirmPwd("")
      toast({ title: "Éxito", description: "Tu contraseña ha sido actualizada." })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña. Verifica la contraseña actual o vuelve a iniciar sesión e inténtalo de nuevo.",
        variant: "destructive",
      })
    }
    setChangingPwd(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-gray-900">Privacidad y Seguridad</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="flex items-start gap-2 bg-brand-extraLight border border-brand-light rounded-lg p-3">
          <ShieldCheck className="h-4 w-4 text-brand-ui shrink-0 mt-0.5" />
          <p className="text-xs text-brand-dark leading-relaxed">
            Tu privacidad es importante. Controla qué información compartes y con quién. Los cambios se guardan al
            presionar &quot;Guardar cambios&quot;.
          </p>
        </div>

        {user?.id && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="font-bold text-brand-dark text-sm">Cambiar contraseña</p>
            <div>
              <p className="text-xs text-gray-500 mb-1">Contraseña actual</p>
              <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Nueva contraseña</p>
              <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Confirmar nueva contraseña</p>
              <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Repite la nueva contraseña" />
            </div>
            <Button className="w-full bg-brand-ui hover:bg-brand-dark" disabled={changingPwd} onClick={handleChangePassword}>
              {changingPwd ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Actualizar contraseña
            </Button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
          <p className="font-bold text-brand-dark text-sm mb-2">Privacidad del Perfil</p>
          <p className="text-xs text-gray-500 mb-1">Visibilidad del Perfil</p>
          <SegmentedRow
            options={profileVisibilityOptions}
            value={settings.PrivacidadDelPerfil.visibilidadPerfil}
            onChange={(v) => updateSetting("PrivacidadDelPerfil", "visibilidadPerfil", v)}
          />
          <SwitchRow label="Mostrar Correo Electrónico" checked={settings.PrivacidadDelPerfil.mostrarCorreoElectronico} onCheckedChange={(v) => updateSetting("PrivacidadDelPerfil", "mostrarCorreoElectronico", v)} />
          <SwitchRow label="Mostrar Teléfono" checked={settings.PrivacidadDelPerfil.mostrarTelefono} onCheckedChange={(v) => updateSetting("PrivacidadDelPerfil", "mostrarTelefono", v)} />
          <SwitchRow label="Mostrar Ubicación" checked={settings.PrivacidadDelPerfil.mostrarUbicacion} onCheckedChange={(v) => updateSetting("PrivacidadDelPerfil", "mostrarUbicacion", v)} />
          <SwitchRow label="Mostrar Última Conexión" checked={settings.PrivacidadDelPerfil.mostrarUltimaConexion} onCheckedChange={(v) => updateSetting("PrivacidadDelPerfil", "mostrarUltimaConexion", v)} />
          <SwitchRow label="Estado en Línea" checked={settings.PrivacidadDelPerfil.mostrarEstadoEnLinea} onCheckedChange={(v) => updateSetting("PrivacidadDelPerfil", "mostrarEstadoEnLinea", v)} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
          <p className="font-bold text-brand-dark text-sm mb-2">Privacidad de Mensajes</p>
          <SwitchRow label="Permitir Mensajes" checked={settings.PrivacidadDeMensajes.permitirMensajes} onCheckedChange={(v) => updateSetting("PrivacidadDeMensajes", "permitirMensajes", v)} />
          {settings.PrivacidadDeMensajes.permitirMensajes && (
            <>
              <p className="text-xs text-gray-500 mb-1 mt-2">Permitir Mensajes de</p>
              <SegmentedRow
                options={allowMessagesFromOptions}
                value={settings.PrivacidadDeMensajes.permitirMensajesDe}
                onChange={(v) => updateSetting("PrivacidadDeMensajes", "permitirMensajesDe", v)}
              />
              <SwitchRow label="Confirmaciones de lectura" checked={settings.PrivacidadDeMensajes.confirmacionesDeLectura} onCheckedChange={(v) => updateSetting("PrivacidadDeMensajes", "confirmacionesDeLectura", v)} />
              <SwitchRow label="Indicadores de Escritura" checked={settings.PrivacidadDeMensajes.indicadoresDeEscritura} onCheckedChange={(v) => updateSetting("PrivacidadDeMensajes", "indicadoresDeEscritura", v)} />
              <SwitchRow label="Solicitudes de Mensaje" checked={settings.PrivacidadDeMensajes.solicitudesDeMensajes} onCheckedChange={(v) => updateSetting("PrivacidadDeMensajes", "solicitudesDeMensajes", v)} />
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
          <p className="font-bold text-brand-dark text-sm mb-2">Privacidad de Actividad</p>
          <SwitchRow label="Mostrar Compras" checked={settings.PrivacidadDeActividad.mostrarCompras} onCheckedChange={(v) => updateSetting("PrivacidadDeActividad", "mostrarCompras", v)} />
          <SwitchRow label="Mostrar Ventas" checked={settings.PrivacidadDeActividad.mostrarVentas} onCheckedChange={(v) => updateSetting("PrivacidadDeActividad", "mostrarVentas", v)} />
          <SwitchRow label="Mostrar Favoritos" checked={settings.PrivacidadDeActividad.mostrarFavoritos} onCheckedChange={(v) => updateSetting("PrivacidadDeActividad", "mostrarFavoritos", v)} />
          <SwitchRow label="Mostrar Seguidos" checked={settings.PrivacidadDeActividad.mostrarSeguidos} onCheckedChange={(v) => updateSetting("PrivacidadDeActividad", "mostrarSeguidos", v)} />
          <SwitchRow label="Mostrar Reseñas" checked={settings.PrivacidadDeActividad.mostrarResenas} onCheckedChange={(v) => updateSetting("PrivacidadDeActividad", "mostrarResenas", v)} />
          <SwitchRow label="Estado de Actividad" checked={settings.PrivacidadDeActividad.estadoDeActividad} onCheckedChange={(v) => updateSetting("PrivacidadDeActividad", "estadoDeActividad", v)} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
          <p className="font-bold text-brand-dark text-sm mb-2">Privacidad de Búsqueda</p>
          <SwitchRow label="Búsqueda por Teléfono" checked={settings.PrivacidadDeBusqueda.buscarPorTelefono} onCheckedChange={(v) => updateSetting("PrivacidadDeBusqueda", "buscarPorTelefono", v)} />
          <SwitchRow label="Búsqueda por Nombre" checked={settings.PrivacidadDeBusqueda.buscarPorNombre} onCheckedChange={(v) => updateSetting("PrivacidadDeBusqueda", "buscarPorNombre", v)} />
          <SwitchRow label="Sugerencias de Usuarios" checked={settings.PrivacidadDeBusqueda.sugerenciasDeUsuarios} onCheckedChange={(v) => updateSetting("PrivacidadDeBusqueda", "sugerenciasDeUsuarios", v)} />
          <SwitchRow label="Indexar Perfil" checked={settings.PrivacidadDeBusqueda.indexarPerfil} onCheckedChange={(v) => updateSetting("PrivacidadDeBusqueda", "indexarPerfil", v)} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
          <p className="font-bold text-brand-dark text-sm mb-2">Privacidad de Datos</p>
          <SwitchRow label="Recopilación de Datos" checked={settings.PrivacidadDeDatos.recopilacionDeDatos} onCheckedChange={(v) => updateSetting("PrivacidadDeDatos", "recopilacionDeDatos", v)} />
          <SwitchRow label="Análisis de Uso" checked={settings.PrivacidadDeDatos.analisisDeUso} onCheckedChange={(v) => updateSetting("PrivacidadDeDatos", "analisisDeUso", v)} />
          <SwitchRow label="Personalización" checked={settings.PrivacidadDeDatos.personalizacion} onCheckedChange={(v) => updateSetting("PrivacidadDeDatos", "personalizacion", v)} />
          <SwitchRow label="Compartir con Terceros" checked={settings.PrivacidadDeDatos.compartirConTerceros} onCheckedChange={(v) => updateSetting("PrivacidadDeDatos", "compartirConTerceros", v)} />
        </div>

        <Button className="w-full bg-brand-ui hover:bg-brand-dark py-6" disabled={isSaving} onClick={handleSave}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar cambios
        </Button>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <p className="font-bold text-brand-dark text-sm mb-1 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" /> Consejos de Privacidad
          </p>
          <div className="bg-brand-extraLight rounded-lg p-3">
            <p className="text-xs font-bold text-gray-900 mb-1">💡 Perfil Público vs Privado</p>
            <p className="text-xs text-gray-600">Un perfil público te ayuda a vender más, pero considera qué información personal compartes.</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs font-bold text-gray-900 mb-1">🔒 Verificación Recomendada</p>
            <p className="text-xs text-gray-600">Los usuarios verificados generan más confianza y tienen mejor tasa de ventas.</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-xs font-bold text-gray-900 mb-1">⚠️ Información Sensible</p>
            <p className="text-xs text-gray-600">Nunca compartas información bancaria o documentos de identidad por mensajes privados.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
