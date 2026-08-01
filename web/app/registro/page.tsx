"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore"
import { app } from "@/lib/firebaseConfig"
import {
  ACCOUNT_TYPES,
  DOMINICAN_PROVINCES,
  DOMINICAN_MUNICIPALITIES,
  GENDERS,
  FORBIDDEN_USERNAMES,
  USERNAME_REGEX,
  validateBirthDate,
} from "@/lib/dominicanLocations"

export default function RegistroPage() {
  const router = useRouter()
  const { register, loading } = useAuth()

  const [accountType, setAccountType] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [form, setForm] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    gender: "",
    birthDate: "",
    province: "",
    city: "",
    streetAddress: "",
    storeName: "",
  })

  const [error, setError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [birthDateError, setBirthDateError] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "province") next.city = ""
      return next
    })
  }

  const validateUsername = useCallback(async (value: string) => {
    if (!value) {
      setUsernameError(null)
      return
    }
    setCheckingUsername(true)
    if (!USERNAME_REGEX.test(value)) {
      setUsernameError('El nombre de usuario debe tener entre 3 y 20 caracteres, solo minúsculas, cifras, ".", "_", "-".')
      setCheckingUsername(false)
      return
    }
    if (FORBIDDEN_USERNAMES.includes(value)) {
      setUsernameError("Este nombre de usuario no está permitido.")
      setCheckingUsername(false)
      return
    }
    try {
      const db = getFirestore(app)
      const q = query(collection(db, "users"), where("username", "==", value))
      const snap = await getDocs(q)
      if (!snap.empty) {
        setUsernameError("Este nombre de usuario ya está en uso.")
        setCheckingUsername(false)
        return
      }
    } catch {
      // error de red — no bloquear el formulario
    }
    setUsernameError(null)
    setCheckingUsername(false)
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (form.username) validateUsername(form.username)
    }, 400)
    return () => clearTimeout(handle)
  }, [form.username, validateUsername])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setPasswordError("")

    if (!accountType) {
      setError("Selecciona un tipo de cuenta.")
      return
    }
    if (!acceptTerms) {
      setError("Debes aceptar los Términos y Condiciones.")
      return
    }
    if (form.password !== form.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.")
      return
    }
    const bdError = validateBirthDate(form.birthDate)
    if (bdError) {
      setBirthDateError(bdError)
      return
    }
    if (usernameError) return

    setIsSubmitting(true)
    try {
      await register(form.name, form.email, form.password, {
        lastname: form.lastname,
        username: form.username,
        gender: form.gender,
        birthDate: form.birthDate,
        province: form.province,
        city: form.city,
        accountType,
        storeName: form.storeName,
        ...(accountType === "fisica" ? { streetAddress: form.streetAddress } : {}),
      })
      setSuccess(true)
      setTimeout(() => router.push("/"), 1500)
    } catch {
      setError("Error al crear la cuenta")
    } finally {
      setIsSubmitting(false)
    }
  }

  const municipalities = form.province ? DOMINICAN_MUNICIPALITIES[form.province] || [] : []

  if (success) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <h2 className="text-xl font-semibold mb-2">¡Cuenta creada exitosamente!</h2>
            <p className="text-sm text-gray-600">Tu cuenta ha sido creada correctamente. Ya puedes comenzar a usar RopaNova.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-emerald-600">RopaNova</h1>
          <p className="text-gray-600 text-sm mt-1">Tu boutique virtual dominicana</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-1">Crea tu cuenta</h2>
            <p className="text-sm text-gray-600 mb-6">Selecciona el tipo de cuenta y completa tus datos.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="mb-2 block">Tipo de cuenta</Label>
                <RadioGroup value={accountType} onValueChange={setAccountType} className="space-y-2">
                  {ACCOUNT_TYPES.map((type) => (
                    <label
                      key={type.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${
                        accountType === type.id ? "border-emerald-600 bg-emerald-50" : "border-gray-200"
                      }`}
                    >
                      <RadioGroupItem value={type.id} className="mt-1" />
                      <div>
                        <div className="font-medium text-sm">
                          {type.icon} {type.title}
                        </div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {(accountType === "virtual" || accountType === "fisica") && (
                <div>
                  <Label htmlFor="storeName">Nombre de la tienda</Label>
                  <Input
                    id="storeName"
                    value={form.storeName}
                    onChange={(e) => handleChange("storeName", e.target.value)}
                    placeholder="Nombre de tu tienda"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="lastname">Apellido</Label>
                  <Input id="lastname" value={form.lastname} onChange={(e) => handleChange("lastname", e.target.value)} required />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoCapitalize="none"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    required
                  />
                </div>
              </div>
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

              <div>
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input
                  id="username"
                  autoCapitalize="none"
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value.replace(/[^a-z0-9._-]/g, "").toLowerCase())}
                  required
                />
                {checkingUsername && <p className="text-xs text-gray-500 mt-1">Verificando disponibilidad…</p>}
                {usernameError && <p className="text-sm text-red-600 mt-1">{usernameError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block">Género</Label>
                  <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => {
                      handleChange("birthDate", e.target.value)
                      setBirthDateError(validateBirthDate(e.target.value))
                    }}
                    required
                  />
                </div>
              </div>
              {birthDateError && <p className="text-sm text-red-600">{birthDateError}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block">Provincia</Label>
                  <Select value={form.province} onValueChange={(v) => handleChange("province", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMINICAN_PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 block">Ciudad/Municipio</Label>
                  <Select value={form.city} onValueChange={(v) => handleChange("city", v)} disabled={!form.province}>
                    <SelectTrigger>
                      <SelectValue placeholder={form.province ? "Selecciona municipio" : "Primero elige provincia"} />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {accountType === "fisica" && (
                <div>
                  <Label htmlFor="streetAddress">Calle y número</Label>
                  <Input
                    id="streetAddress"
                    placeholder="Ej: Calle 27 de Febrero #123, Zona Colonial"
                    value={form.streetAddress}
                    onChange={(e) => handleChange("streetAddress", e.target.value)}
                  />
                </div>
              )}

              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v === true)} className="mt-0.5" />
                <span>
                  Acepto los{" "}
                  <Link href="/terminos" className="text-emerald-600 hover:underline">
                    Términos y Condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacidad" className="text-emerald-600 hover:underline">
                    Política de Privacidad
                  </Link>
                  .
                </span>
              </label>

              {error && <p className="text-sm text-red-600 text-center">{error}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting || loading || checkingUsername}>
                {isSubmitting || loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="text-center mt-6 text-sm">
              <span className="text-gray-600">¿Ya tienes una cuenta? </span>
              <Link href="/login" className="text-emerald-600 font-medium hover:underline">
                Inicia sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
