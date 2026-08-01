"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const router = useRouter()
  const { login, sendPasswordReset, loading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetMessage, setResetMessage] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    try {
      await login(email, password)
      router.push("/")
    } catch {
      setError("Correo o contraseña incorrectos")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    setResetMessage("")
    const trimmed = email.trim()
    if (!trimmed) {
      setError("Ingresa tu correo electrónico para recuperar la contraseña.")
      return
    }
    try {
      await sendPasswordReset(trimmed)
      setResetMessage("Revisa tu correo (y la carpeta de spam) para restablecer la contraseña.")
    } catch {
      setError("No se pudo enviar el correo. Verifica la dirección o inténtalo más tarde.")
    }
  }

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-emerald-600">RopaNova</h1>
          <p className="text-gray-600 text-sm mt-1">Tu boutique virtual dominicana</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-center mb-1">¡Bienvenido de vuelta!</h2>
            <p className="text-sm text-gray-600 text-center mb-6">Inicia sesión en tu cuenta de RopaNova</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-9"
                    autoCapitalize="none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Tu contraseña"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              {resetMessage && <p className="text-sm text-emerald-600 text-center">{resetMessage}</p>}
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
                {isSubmitting || loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
            <div className="text-center mt-6 text-sm">
              <span className="text-gray-600">¿No tienes una cuenta? </span>
              <Link href="/registro" className="text-emerald-600 font-medium hover:underline">
                Regístrate aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
