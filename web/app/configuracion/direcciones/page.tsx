"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Home, Building2, MapPin, User, Phone, Star, Pencil, Trash2, CheckCircle2, Truck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { RequireAuth } from "@/components/require-auth"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { getAddresses, deleteAddress, setDefaultAddress, formatLastUsedLabel, type SavedAddress } from "@/lib/services/addressService"

function AddressIcon({ type }: { type: SavedAddress["type"] }) {
  switch (type) {
    case "home":
      return <Home className="h-5 w-5 text-brand-ui" />
    case "work":
      return <Building2 className="h-5 w-5 text-violet-600" />
    default:
      return <MapPin className="h-5 w-5 text-gray-500" />
  }
}

function addressTypeLabel(type: SavedAddress["type"]) {
  switch (type) {
    case "home":
      return "Casa"
    case "work":
      return "Trabajo"
    default:
      return "Otro"
  }
}

export default function DireccionesPageGate() {
  return (
    <RequireAuth>
      <DireccionesPage />
    </RequireAuth>
  )
}

function DireccionesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null)

  const loadAddresses = useCallback(async () => {
    if (!user?.id) {
      setAddresses([])
      setLoading(false)
      return
    }
    try {
      const list = await getAddresses(user.id)
      setAddresses(list)
    } catch {
      toast({ title: "No se pudieron cargar las direcciones.", variant: "destructive" })
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    setLoading(true)
    loadAddresses()
  }, [loadAddresses])

  const handleSetDefault = async (id: string) => {
    if (!user?.id) return
    try {
      await setDefaultAddress(user.id, id)
      await loadAddresses()
    } catch {
      toast({ title: "No se pudo establecer como dirección principal.", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!user?.id || !deleteTarget) return
    try {
      await deleteAddress(user.id, deleteTarget.id)
      await loadAddresses()
    } catch {
      toast({ title: "No se pudo eliminar la dirección.", variant: "destructive" })
    }
    setDeleteTarget(null)
  }

  const defaultAddress = addresses.find((a) => a.isDefault)
  const otherAddresses = addresses.filter((a) => !a.isDefault)

  const renderAddressCard = (address: SavedAddress, isDefault: boolean = false) => (
    <div key={address.id} className={`bg-white rounded-xl p-4 mb-3 border ${isDefault ? "border-2 border-brand-ui" : "border-gray-200"}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isDefault ? "bg-brand-light" : "bg-gray-100"}`}>
          <AddressIcon type={address.type} />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <p className="font-bold text-gray-900">{address.name}</p>
          {isDefault && <span className="text-[11px] bg-brand-light text-brand-dark font-bold px-1.5 py-0.5 rounded">Principal</span>}
          {address.isVerified && (
            <span className="text-[11px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Verificada
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User className="h-3.5 w-3.5 shrink-0" /> {address.recipient}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Phone className="h-3.5 w-3.5 shrink-0" /> {address.phone}
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <p>{address.street}</p>
            {address.references && <p className="text-xs text-gray-400 italic">{address.references}</p>}
            <p>
              {address.sector}, {address.city}
            </p>
            <p>
              {address.province}
              {address.postalCode ? ` · ${address.postalCode}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{formatLastUsedLabel(address.lastUsedAt)}</span>
        <span className="text-xs text-gray-500 border border-gray-300 rounded px-1.5 py-0.5">{addressTypeLabel(address.type)}</span>
      </div>

      <div className="flex items-center gap-4 pt-2 mt-2 border-t border-gray-100">
        {!isDefault && (
          <button onClick={() => handleSetDefault(address.id)} className="flex items-center gap-1.5 text-sm text-brand-ui py-1">
            <Star className="h-4 w-4" /> Hacer principal
          </button>
        )}
        <button
          onClick={() => router.push(`/configuracion/direcciones/agregar?addressId=${address.id}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 py-1"
        >
          <Pencil className="h-4 w-4" /> Editar
        </button>
        <button onClick={() => setDeleteTarget(address)} className="flex items-center gap-1.5 text-sm text-red-500 py-1">
          <Trash2 className="h-4 w-4" /> Eliminar
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Direcciones de Envío</h1>
        </div>
        <Link href="/configuracion/direcciones/agregar">
          <Button variant="ghost" size="icon">
            <Plus className="h-5 w-5 text-brand-ui" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-ui" />
        </div>
      ) : (
        <div className="p-4 max-w-2xl mx-auto">
          {defaultAddress && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <Star className="h-4 w-4 text-yellow-500" />
                <p className="font-bold text-gray-900">Dirección Principal</p>
              </div>
              {renderAddressCard(defaultAddress, true)}
            </div>
          )}

          {otherAddresses.length > 0 && (
            <div className="mb-6">
              <p className="font-bold text-gray-900 mb-3">Otras Direcciones</p>
              {otherAddresses.map((a) => renderAddressCard(a))}
            </div>
          )}

          {addresses.length === 0 && (
            <div className="bg-white rounded-xl p-8 flex flex-col items-center text-center mb-6">
              <MapPin className="h-12 w-12 text-gray-300" />
              <p className="font-bold text-gray-900 mt-4 mb-2">No tienes direcciones guardadas</p>
              <p className="text-sm text-gray-500 mb-6">Agrega una dirección para recibir tus compras de forma rápida y segura.</p>
              <Link href="/configuracion/direcciones/agregar">
                <Button className="bg-brand-ui hover:bg-brand-dark">
                  <Plus className="h-4 w-4 mr-2" /> Agregar Primera Dirección
                </Button>
              </Link>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-5 w-5 text-yellow-800" />
              <p className="font-bold text-yellow-800">Consejos de Envío</p>
            </div>
            <div className="space-y-2 text-sm text-yellow-800">
              <p>
                • <span className="font-bold">Verifica tu dirección:</span> Asegúrate de que todos los datos sean correctos para evitar retrasos.
              </p>
              <p>
                • <span className="font-bold">Incluye referencias:</span> Agrega puntos de referencia para facilitar la entrega.
              </p>
              <p>
                • <span className="font-bold">Número de contacto:</span> Mantén tu teléfono disponible durante el horario de entrega.
              </p>
              <p>
                • <span className="font-bold">Horarios de entrega:</span> Lunes a viernes 8:00 AM - 6:00 PM, sábados 8:00 AM - 2:00 PM.
              </p>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dirección?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará «{deleteTarget?.name}» de tu cuenta. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
