"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Shield, Check, X, AlertTriangle, Lock, Key, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface PasswordRequirement {
  id: string
  text: string
  met: boolean
}

interface SecurityCheck {
  id: string
  title: string
  description: string
  status: "pending" | "success" | "error"
  required: boolean
}

export default function CambiarPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"password" | "verification" | "success">("password")
  const [verificationMethod, setVerificationMethod] = useState<"email" | "sms" | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")

  // Password strength calculation
  const calculatePasswordStrength = (password: string): number => {
    let score = 0
    if (password.length >= 8) score += 20
    if (password.length >= 12) score += 10
    if (/[a-z]/.test(password)) score += 15
    if (/[A-Z]/.test(password)) score += 15
    if (/[0-9]/.test(password)) score += 15
    if (/[^A-Za-z0-9]/.test(password)) score += 15
    if (password.length >= 16) score += 10
    return Math.min(score, 100)
  }

  const passwordStrength = calculatePasswordStrength(newPassword)

  const getStrengthColor = (strength: number): string => {
    if (strength < 30) return "bg-red-500"
    if (strength < 60) return "bg-yellow-500"
    if (strength < 80) return "bg-blue-500"
    return "bg-emerald-500"
  }

  const getStrengthText = (strength: number): string => {
    if (strength < 30) return "Muy débil"
    if (strength < 60) return "Débil"
    if (strength < 80) return "Buena"
    return "Muy fuerte"
  }

  // Password requirements
  const passwordRequirements: PasswordRequirement[] = [
    {
      id: "length",
      text: "Al menos 8 caracteres",
      met: newPassword.length >= 8,
    },
    {
      id: "lowercase",
      text: "Al menos una letra minúscula",
      met: /[a-z]/.test(newPassword),
    },
    {
      id: "uppercase",
      text: "Al menos una letra mayúscula",
      met: /[A-Z]/.test(newPassword),
    },
    {
      id: "number",
      text: "Al menos un número",
      met: /[0-9]/.test(newPassword),
    },
    {
      id: "special",
      text: "Al menos un carácter especial (!@#$%^&*)",
      met: /[^A-Za-z0-9]/.test(newPassword),
    },
    {
      id: "different",
      text: "Diferente a la contraseña actual",
      met: newPassword !== currentPassword && newPassword.length > 0,
    },
  ]

  // Security checks
  const securityChecks: SecurityCheck[] = [
    {
      id: "current-password",
      title: "Contraseña Actual",
      description: "Verificar tu contraseña actual",
      status: currentPassword.length > 0 ? "success" : "pending",
      required: true,
    },
    {
      id: "password-strength",
      title: "Fortaleza de Contraseña",
      description: "Nueva contraseña debe ser fuerte",
      status: passwordStrength >= 60 ? "success" : passwordStrength > 0 ? "error" : "pending",
      required: true,
    },
    {
      id: "password-match",
      title: "Confirmación de Contraseña",
      description: "Las contraseñas deben coincidir",
      status: confirmPassword.length > 0 ? (newPassword === confirmPassword ? "success" : "error") : "pending",
      required: true,
    },
    {
      id: "two-factor",
      title: "Verificación Adicional",
      description: "Confirmar cambio por email o SMS",
      status: "pending",
      required: true,
    },
  ]

  const allRequirementsMet = passwordRequirements.every((req) => req.met)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
  const canProceed = allRequirementsMet && passwordsMatch && currentPassword.length > 0

  const handlePasswordChange = async () => {
    if (!canProceed) return

    setIsLoading(true)
    setError("")

    try {
      // Simulate API call to validate current password
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate validation - in real app, this would be an API call
          if (currentPassword === "wrongpassword") {
            reject(new Error("Contraseña actual incorrecta"))
          } else {
            resolve(true)
          }
        }, 1000)
      })

      setStep("verification")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al validar contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async () => {
    if (!verificationMethod || !verificationCode) return

    setIsLoading(true)
    setError("")

    try {
      // Simulate verification API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (verificationCode === "123456") {
            resolve(true)
          } else {
            reject(new Error("Código de verificación incorrecto"))
          }
        }, 1000)
      })

      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en la verificación")
    } finally {
      setIsLoading(false)
    }
  }

  const sendVerificationCode = async (method: "email" | "sms") => {
    setVerificationMethod(method)
    setIsLoading(true)

    try {
      // Simulate sending verification code
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // In real app, this would send the code
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/configuracion">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="font-semibold text-gray-900">Contraseña Cambiada</h1>
            </div>
          </div>
        </header>

        <div className="p-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">¡Contraseña Actualizada!</h2>
              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido cambiada exitosamente. Tu cuenta está ahora más segura.
              </p>
              <div className="space-y-3">
                <Link href="/configuracion/privacidad">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                    Ir a Configuración de Seguridad
                  </Button>
                </Link>
                <Link href="/perfil">
                  <Button variant="outline" className="w-full bg-transparent">
                    Volver al Perfil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === "verification") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setStep("password")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-semibold text-gray-900">Verificación de Seguridad</h1>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                Verificación Adicional Requerida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Para completar el cambio de contraseña, necesitamos verificar tu identidad. Elige un método de
                verificación:
              </p>

              {!verificationMethod ? (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4 bg-transparent"
                    onClick={() => sendVerificationCode("email")}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Key className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Verificación por Email</p>
                        <p className="text-sm text-gray-500">Enviar código a maria.gonzalez@email.com</p>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4 bg-transparent"
                    onClick={() => sendVerificationCode("sms")}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Verificación por SMS</p>
                        <p className="text-sm text-gray-500">Enviar código a +1 (809) 555-0123</p>
                      </div>
                    </div>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Hemos enviado un código de verificación de 6 dígitos a tu{" "}
                      {verificationMethod === "email" ? "correo electrónico" : "teléfono"}.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="verification-code">Código de Verificación</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="Ingresa el código de 6 dígitos"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="mt-1 text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <X className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setVerificationMethod(null)
                        setVerificationCode("")
                        setError("")
                      }}
                    >
                      Cambiar Método
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                      onClick={handleVerification}
                      disabled={verificationCode.length !== 6 || isLoading}
                    >
                      {isLoading ? "Verificando..." : "Verificar"}
                    </Button>
                  </div>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendVerificationCode(verificationMethod)}
                      disabled={isLoading}
                    >
                      ¿No recibiste el código? Reenviar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/configuracion/privacidad">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-gray-900">Cambiar Contraseña</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Por tu seguridad, necesitarás verificar tu identidad antes de cambiar tu contraseña.
          </AlertDescription>
        </Alert>

        {/* Security Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verificaciones de Seguridad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {securityChecks.map((check) => (
              <div key={check.id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center">
                  {check.status === "success" ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : check.status === "error" ? (
                    <X className="h-4 w-4 text-red-600" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{check.title}</p>
                  <p className="text-xs text-gray-500">{check.description}</p>
                </div>
                {check.required && (
                  <Badge variant="secondary" className="text-xs">
                    Requerido
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contraseña Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* New Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nueva Contraseña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Ingresa tu nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Password Strength */}
            {newPassword.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fortaleza de la contraseña</span>
                  <span className="text-sm text-gray-600">{getStrengthText(passwordStrength)}</span>
                </div>
                <Progress value={passwordStrength} className="h-2">
                  <div
                    className={`h-full rounded-full transition-all ${getStrengthColor(passwordStrength)}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </Progress>
              </div>
            )}

            {/* Password Requirements */}
            {newPassword.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Requisitos de contraseña:</p>
                <div className="space-y-1">
                  {passwordRequirements.map((req) => (
                    <div key={req.id} className="flex items-center gap-2">
                      {req.met ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                      <span className={`text-xs ${req.met ? "text-emerald-600" : "text-gray-500"}`}>{req.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirm Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Confirmar Nueva Contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirma tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {confirmPassword.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                {passwordsMatch ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-xs text-emerald-600">Las contraseñas coinciden</span>
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 text-red-600" />
                    <span className="text-xs text-red-600">Las contraseñas no coinciden</span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Consejos de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Usa una combinación de letras, números y símbolos</p>
              <p>• Evita información personal como nombres o fechas</p>
              <p>• No reutilices contraseñas de otras cuentas</p>
              <p>• Considera usar un administrador de contraseñas</p>
              <p>• Cambia tu contraseña regularmente</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button
          className="w-full bg-emerald-500 hover:bg-emerald-600"
          onClick={handlePasswordChange}
          disabled={!canProceed || isLoading}
        >
          {isLoading ? "Validando..." : "Continuar con Verificación"}
        </Button>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
