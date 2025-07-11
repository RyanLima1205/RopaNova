"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Camera, Edit, Save, X, MapPin, Shield, Star, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock user data
const initialUserData = {
  name: "María González",
  username: "maria_vintage",
  email: "maria.gonzalez@email.com",
  phone: "+1 (809) 555-0123",
  bio: "Amante de la moda vintage y sostenible. Vendiendo piezas únicas desde 2022. ✨",
  location: "Santo Domingo, República Dominicana",
  province: "Distrito Nacional",
  city: "Santo Domingo",
  avatar: "/placeholder.svg?height=100&width=100&text=MG",
  coverImage: "/placeholder.svg?height=200&width=400&text=Cover",
  birthDate: "1995-03-15",
  gender: "female",
  verified: true,
  memberSince: "Marzo 2022",
  privacy: {
    showEmail: false,
    showPhone: false,
    showLastSeen: true,
    allowMessages: true,
  },
}

const dominicanProvinces = [
  "Distrito Nacional",
  "Santiago",
  "La Altagracia",
  "Puerto Plata",
  "La Romana",
  "San Pedro de Macorís",
  "Duarte",
  "La Vega",
  "Espaillat",
  "Monseñor Nouel",
  "Hermanas Mirabal",
  "Samaná",
  "María Trinidad Sánchez",
  "Valverde",
  "Monte Cristi",
  "Dajabón",
  "Santiago Rodríguez",
  "Elías Piña",
  "San Juan",
  "Azua",
  "Peravia",
  "San José de Ocoa",
  "Independencia",
  "Baoruco",
  "Barahona",
  "Pedernales",
  "Monte Plata",
  "Hato Mayor",
  "El Seibo",
  "San Cristóbal",
]

export default function CuentaPage() {
  const [userData, setUserData] = useState(initialUserData)
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setUserData(initialUserData)
    setIsEditing(false)
  }

  const updateUserData = (field: string, value: any) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updatePrivacyData = (field: string, value: boolean) => {
    setUserData((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: value,
      },
    }))
  }

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
            <h1 className="font-semibold text-gray-900">Información Personal</h1>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Guardando..." : "Guardar"}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="bg-transparent">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Profile Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fotos de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cover Image */}
            <div className="relative h-32 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-lg overflow-hidden">
              <Image src={userData.coverImage || "/placeholder.svg"} alt="Cover" fill className="object-cover" />
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
                  <AvatarFallback className="text-xl">
                    {userData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-0 right-0 h-6 w-6 bg-white border border-gray-200 rounded-full"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{userData.name}</h3>
                  {userData.verified && <Shield className="h-4 w-4 text-emerald-500" />}
                </div>
                <p className="text-gray-600 text-sm">@{userData.username}</p>
                <Badge className="bg-emerald-100 text-emerald-700 text-xs mt-1">
                  Miembro desde {userData.memberSince}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={userData.name}
                  onChange={(e) => updateUserData("name", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  value={userData.username}
                  onChange={(e) => updateUserData("username", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="Sin espacios ni caracteres especiales"
                />
              </div>

              <div>
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={userData.bio}
                  onChange={(e) => updateUserData("bio", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                  rows={3}
                  placeholder="Cuéntanos sobre ti..."
                />
              </div>

              <div>
                <Label htmlFor="gender">Género</Label>
                <Select
                  value={userData.gender}
                  onValueChange={(value) => updateUserData("gender", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecciona tu género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefiero no decir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={userData.birthDate}
                  onChange={(e) => updateUserData("birthDate", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => updateUserData("email", e.target.value)}
                  disabled={!isEditing}
                  className="flex-1"
                />
                {userData.verified && <Badge className="bg-emerald-100 text-emerald-700 self-center">Verificado</Badge>}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={userData.phone}
                onChange={(e) => updateUserData("phone", e.target.value)}
                disabled={!isEditing}
                className="mt-1"
                placeholder="+1 (809) 555-0123"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Select
                value={userData.province}
                onValueChange={(value) => updateUserData("province", value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona tu provincia" />
                </SelectTrigger>
                <SelectContent>
                  {dominicanProvinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">Ciudad/Municipio</Label>
              <Input
                id="city"
                value={userData.city}
                onChange={(e) => updateUserData("city", e.target.value)}
                disabled={!isEditing}
                className="mt-1"
                placeholder="Ej: Santo Domingo Este"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Configuración de Privacidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mostrar correo electrónico</p>
                <p className="text-sm text-gray-500">Otros usuarios pueden ver tu email</p>
              </div>
              <Switch
                checked={userData.privacy.showEmail}
                onCheckedChange={(checked) => updatePrivacyData("showEmail", checked)}
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mostrar teléfono</p>
                <p className="text-sm text-gray-500">Otros usuarios pueden ver tu teléfono</p>
              </div>
              <Switch
                checked={userData.privacy.showPhone}
                onCheckedChange={(checked) => updatePrivacyData("showPhone", checked)}
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mostrar última conexión</p>
                <p className="text-sm text-gray-500">Mostrar cuándo estuviste activo por última vez</p>
              </div>
              <Switch
                checked={userData.privacy.showLastSeen}
                onCheckedChange={(checked) => updatePrivacyData("showLastSeen", checked)}
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Permitir mensajes</p>
                <p className="text-sm text-gray-500">Otros usuarios pueden enviarte mensajes</p>
              </div>
              <Switch
                checked={userData.privacy.allowMessages}
                onCheckedChange={(checked) => updatePrivacyData("allowMessages", checked)}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seguridad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/configuracion/cambiar-password">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Shield className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </Button>
            </Link>

            <Link href="/configuracion/verificacion">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Star className="h-4 w-4 mr-2" />
                Verificar Identidad
              </Button>
            </Link>

            <Link href="/configuracion/sesiones">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Eye className="h-4 w-4 mr-2" />
                Sesiones Activas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
