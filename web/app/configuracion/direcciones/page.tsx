"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  MapPin,
  Home,
  Building2,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  Check,
  Phone,
  User,
  Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

// Mock addresses data
const mockAddresses = [
  {
    id: "1",
    type: "home",
    name: "Casa Principal",
    recipient: "María González",
    phone: "+1 (809) 555-0123",
    address: "Calle Mercedes #45, Apt 3B",
    sector: "Gazcue",
    city: "Santo Domingo",
    province: "Distrito Nacional",
    postalCode: "10205",
    isDefault: true,
    isVerified: true,
    lastUsed: "Hace 2 días",
  },
  {
    id: "2",
    type: "work",
    name: "Oficina",
    recipient: "María González",
    phone: "+1 (809) 555-0456",
    address: "Av. Winston Churchill #1099, Torre Empresarial, Piso 8",
    sector: "Piantini",
    city: "Santo Domingo",
    province: "Distrito Nacional",
    postalCode: "10148",
    isDefault: false,
    isVerified: true,
    lastUsed: "Hace 1 semana",
  },
  {
    id: "3",
    type: "other",
    name: "Casa de Mamá",
    recipient: "Carmen Rodríguez",
    phone: "+1 (809) 555-0789",
    address: "Calle Duarte #123",
    sector: "Centro Histórico",
    city: "Santiago",
    province: "Santiago",
    postalCode: "51000",
    isDefault: false,
    isVerified: false,
    lastUsed: "Hace 3 semanas",
  },
]

export default function DireccionesPage() {
  const [addresses, setAddresses] = useState(mockAddresses)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return Home
      case "work":
        return Building2
      default:
        return MapPin
    }
  }

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case "home":
        return "Casa"
      case "work":
        return "Trabajo"
      default:
        return "Otro"
    }
  }

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      })),
    )
  }

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== id))
    setDeleteId(null)
  }

  const defaultAddress = addresses.find((addr) => addr.isDefault)
  const otherAddresses = addresses.filter((addr) => !addr.isDefault)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/configuracion">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-gray-900">Direcciones de Envío</h1>
          </div>
          <Link href="/configuracion/direcciones/agregar">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Shipping Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Navigation className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Envíos en República Dominicana</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Realizamos envíos a todas las provincias del país. Los tiempos de entrega varían entre 1-3 días
                  laborables para el Gran Santo Domingo y 2-5 días para el interior del país.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    Envío gratis desde RD$2,000
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    Seguimiento incluido
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Address */}
        {defaultAddress && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <h2 className="font-semibold text-gray-900">Dirección Principal</h2>
            </div>
            <Card className="border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    {(() => {
                      const IconComponent = getAddressIcon(defaultAddress.type)
                      return <IconComponent className="h-5 w-5 text-emerald-600" />
                    })()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{defaultAddress.name}</h3>
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">Principal</Badge>
                        {defaultAddress.isVerified && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Verificada
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/configuracion/direcciones/editar/${defaultAddress.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(defaultAddress.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{defaultAddress.recipient}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{defaultAddress.phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 mt-0.5" />
                        <div>
                          <p>{defaultAddress.address}</p>
                          <p>
                            {defaultAddress.sector}, {defaultAddress.city}
                          </p>
                          <p>
                            {defaultAddress.province} {defaultAddress.postalCode}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Usado {defaultAddress.lastUsed}</span>
                      <Badge variant="outline" className="text-xs">
                        {getAddressTypeLabel(defaultAddress.type)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other Addresses */}
        {otherAddresses.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Otras Direcciones</h2>
            <div className="space-y-3">
              {otherAddresses.map((address) => {
                const IconComponent = getAddressIcon(address.type)
                return (
                  <Card key={address.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{address.name}</h3>
                              {address.isVerified && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Verificada
                                </Badge>
                              )}
                              {!address.isVerified && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">
                                  Sin verificar
                                </Badge>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSetDefault(address.id)}>
                                  <Star className="h-4 w-4 mr-2" />
                                  Hacer principal
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/configuracion/direcciones/editar/${address.id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(address.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>{address.recipient}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{address.phone}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3 w-3 mt-0.5" />
                              <div>
                                <p>{address.address}</p>
                                <p>
                                  {address.sector}, {address.city}
                                </p>
                                <p>
                                  {address.province} {address.postalCode}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Usado {address.lastUsed}</span>
                            <Badge variant="outline" className="text-xs">
                              {getAddressTypeLabel(address.type)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {addresses.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No tienes direcciones guardadas</h3>
              <p className="text-gray-600 mb-4">
                Agrega una dirección para recibir tus compras de forma rápida y segura.
              </p>
              <Link href="/configuracion/direcciones/agregar">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Dirección
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Shipping Tips */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg text-amber-900 flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Consejos de Envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-amber-800">
              <p className="mb-2">
                • <strong>Verifica tu dirección:</strong> Asegúrate de que todos los datos sean correctos para evitar
                retrasos.
              </p>
              <p className="mb-2">
                • <strong>Incluye referencias:</strong> Agrega puntos de referencia para facilitar la entrega.
              </p>
              <p className="mb-2">
                • <strong>Número de contacto:</strong> Mantén tu teléfono disponible durante el horario de entrega.
              </p>
              <p>
                • <strong>Horarios de entrega:</strong> Lunes a viernes 8:00 AM - 6:00 PM, sábados 8:00 AM - 2:00 PM.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dirección?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La dirección será eliminada permanentemente de tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
