"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Upload,
  Camera,
  Check,
  X,
  AlertTriangle,
  Info,
  Shield,
  User,
  FileText,
  Eye,
  Clock,
  CheckCircle,
  RefreshCw,
  Star,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Mock verification data
const verificationData = {
  status: "pending", // none, pending, approved, rejected
  submittedAt: "2024-01-15T10:30:00Z",
  reviewedAt: null,
  documents: {
    cedulaFront: null,
    cedulaBack: null,
    selfie: null,
  },
  personalInfo: {
    fullName: "",
    cedulaNumber: "",
    birthDate: "",
    nationality: "dominicana",
  },
  rejectionReason: "",
  verificationLevel: "none", // none, basic, verified, premium
}

const verificationSteps = [
  {
    id: 1,
    title: "Información Personal",
    description: "Ingresa tus datos básicos",
    icon: User,
    completed: false,
  },
  {
    id: 2,
    title: "Cédula de Identidad",
    description: "Sube fotos de tu cédula",
    icon: FileText,
    completed: false,
  },
  {
    id: 3,
    title: "Verificación Facial",
    description: "Toma una selfie para confirmar",
    icon: Camera,
    completed: false,
  },
  {
    id: 4,
    title: "Revisión",
    description: "Esperando aprobación",
    icon: Clock,
    completed: false,
  },
]

const verificationBenefits = [
  {
    icon: Shield,
    title: "Mayor Confianza",
    description: "Los compradores confían más en vendedores verificados",
  },
  {
    icon: Star,
    title: "Mejor Posicionamiento",
    description: "Tus productos aparecen primero en búsquedas",
  },
  {
    icon: Award,
    title: "Insignia Verificado",
    description: "Muestra tu badge de verificación en el perfil",
  },
  {
    icon: RefreshCw,
    title: "Ventas Más Rápidas",
    description: "Los usuarios verificados venden 3x más rápido",
  },
]

export default function VerificacionPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [verification, setVerification] = useState(verificationData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [personalInfo, setPersonalInfo] = useState(verification.personalInfo)
  const [documents, setDocuments] = useState(verification.documents)

  const cedulaFrontRef = useRef<HTMLInputElement>(null)
  const cedulaBackRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return

    // Simulate file upload with progress
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const fileUrl = URL.createObjectURL(file)
    setDocuments((prev) => ({
      ...prev,
      [type]: fileUrl,
    }))

    setUploadProgress(0)
  }

  const handlePersonalInfoChange = (field: string, value: string) => {
    setPersonalInfo((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateCedulaNumber = (cedula: string) => {
    // Dominican cedula validation (simplified)
    const cleanCedula = cedula.replace(/\D/g, "")
    return cleanCedula.length === 11 && /^[0-9]{11}$/.test(cleanCedula)
  }

  const formatCedulaNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 10)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 10)}-${numbers.slice(10, 11)}`
  }

  const handleSubmitVerification = async () => {
    setIsSubmitting(true)
    // Simulate API submission
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setVerification((prev) => ({
      ...prev,
      status: "pending",
      submittedAt: new Date().toISOString(),
    }))
    setIsSubmitting(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-emerald-600 bg-emerald-100"
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "rejected":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Verificado"
      case "pending":
        return "En Revisión"
      case "rejected":
        return "Rechazado"
      default:
        return "No Verificado"
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Ingresa tu información exactamente como aparece en tu cédula de identidad dominicana.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    value={personalInfo.fullName}
                    onChange={(e) => handlePersonalInfoChange("fullName", e.target.value)}
                    placeholder="Ej: María Elena González Pérez"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nombres y apellidos como aparecen en la cédula</p>
                </div>

                <div>
                  <Label htmlFor="cedulaNumber">Número de Cédula</Label>
                  <Input
                    id="cedulaNumber"
                    value={personalInfo.cedulaNumber}
                    onChange={(e) => handlePersonalInfoChange("cedulaNumber", formatCedulaNumber(e.target.value))}
                    placeholder="000-0000000-0"
                    maxLength={13}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">11 dígitos de tu cédula dominicana</p>
                  {personalInfo.cedulaNumber && !validateCedulaNumber(personalInfo.cedulaNumber) && (
                    <p className="text-xs text-red-500 mt-1">Formato de cédula inválido</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={personalInfo.birthDate}
                    onChange={(e) => handlePersonalInfoChange("birthDate", e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Debe coincidir con la fecha en tu cédula</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={
                    !personalInfo.fullName ||
                    !personalInfo.cedulaNumber ||
                    !personalInfo.birthDate ||
                    !validateCedulaNumber(personalInfo.cedulaNumber)
                  }
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Continuar
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cédula de Identidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Sube fotos claras de ambos lados de tu cédula. Asegúrate de que toda la información sea legible.
                </AlertDescription>
              </Alert>

              {/* Front of Cedula */}
              <div>
                <Label className="text-base font-medium">Frente de la Cédula</Label>
                <div className="mt-2">
                  {documents.cedulaFront ? (
                    <div className="relative">
                      <Image
                        src={documents.cedulaFront || "/placeholder.svg"}
                        alt="Frente de cédula"
                        width={300}
                        height={200}
                        className="rounded-lg border-2 border-emerald-200"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => setDocuments((prev) => ({ ...prev, cedulaFront: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors"
                      onClick={() => cedulaFrontRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Subir frente de cédula</p>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG hasta 5MB</p>
                    </div>
                  )}
                  <input
                    ref={cedulaFrontRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, "cedulaFront")
                    }}
                  />
                </div>
              </div>

              {/* Back of Cedula */}
              <div>
                <Label className="text-base font-medium">Reverso de la Cédula</Label>
                <div className="mt-2">
                  {documents.cedulaBack ? (
                    <div className="relative">
                      <Image
                        src={documents.cedulaBack || "/placeholder.svg"}
                        alt="Reverso de cédula"
                        width={300}
                        height={200}
                        className="rounded-lg border-2 border-emerald-200"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => setDocuments((prev) => ({ ...prev, cedulaBack: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors"
                      onClick={() => cedulaBackRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Subir reverso de cédula</p>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG hasta 5MB</p>
                    </div>
                  )}
                  <input
                    ref={cedulaBackRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, "cedulaBack")
                    }}
                  />
                </div>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subiendo imagen...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Tips */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">💡 Consejos para mejores fotos:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Usa buena iluminación natural</li>
                  <li>• Evita reflejos y sombras</li>
                  <li>• Asegúrate de que el texto sea legible</li>
                  <li>• No cubras ninguna parte de la cédula</li>
                  <li>• Toma la foto desde arriba, no en ángulo</li>
                </ul>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={!documents.cedulaFront || !documents.cedulaBack}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Continuar
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Verificación Facial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Toma una selfie clara para verificar que eres la persona de la cédula. Mira directamente a la cámara.
                </AlertDescription>
              </Alert>

              <div>
                <Label className="text-base font-medium">Selfie de Verificación</Label>
                <div className="mt-2">
                  {documents.selfie ? (
                    <div className="relative max-w-xs mx-auto">
                      <Image
                        src={documents.selfie || "/placeholder.svg"}
                        alt="Selfie de verificación"
                        width={250}
                        height={300}
                        className="rounded-lg border-2 border-emerald-200"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => setDocuments((prev) => ({ ...prev, selfie: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors max-w-xs mx-auto"
                      onClick={() => selfieRef.current?.click()}
                    >
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Tomar Selfie</p>
                      <p className="text-sm text-gray-500 mt-1">Foto clara de tu rostro</p>
                    </div>
                  )}
                  <input
                    ref={selfieRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, "selfie")
                    }}
                  />
                </div>
              </div>

              {/* Selfie Tips */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">📸 Consejos para la selfie:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Mira directamente a la cámara</li>
                  <li>• Usa buena iluminación frontal</li>
                  <li>• No uses lentes oscuros o sombreros</li>
                  <li>• Mantén una expresión neutral</li>
                  <li>• Asegúrate de que tu rostro esté completamente visible</li>
                </ul>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  disabled={!documents.selfie}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Continuar
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Revisión Final
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Revisa toda tu información antes de enviar. Una vez enviada, no podrás modificarla hasta que se
                  complete la revisión.
                </AlertDescription>
              </Alert>

              {/* Personal Info Summary */}
              <div>
                <h4 className="font-medium mb-3">Información Personal</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-medium">{personalInfo.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cédula:</span>
                    <span className="font-medium">{personalInfo.cedulaNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha de Nacimiento:</span>
                    <span className="font-medium">{personalInfo.birthDate}</span>
                  </div>
                </div>
              </div>

              {/* Documents Summary */}
              <div>
                <h4 className="font-medium mb-3">Documentos Subidos</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <FileText className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium">Frente Cédula</p>
                    <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto mt-1" />
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <FileText className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium">Reverso Cédula</p>
                    <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto mt-1" />
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Camera className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium">Selfie</p>
                    <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto mt-1" />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Términos de Verificación</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• La información proporcionada debe ser veraz y actual</li>
                  <li>• Los documentos deben ser originales y legibles</li>
                  <li>• El proceso de revisión toma entre 24-48 horas</li>
                  <li>• Documentos falsos resultarán en suspensión permanente</li>
                </ul>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  onClick={handleSubmitVerification}
                  disabled={isSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enviar Verificación
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  if (verification.status === "pending") {
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
              <h1 className="font-semibold text-gray-900">Verificación de Identidad</h1>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Verificación en Proceso</h2>
              <p className="text-gray-600 mb-4">
                Hemos recibido tus documentos y están siendo revisados por nuestro equipo de seguridad.
              </p>
              <Badge className="bg-yellow-100 text-yellow-700 mb-4">En Revisión</Badge>
              <p className="text-sm text-gray-500">
                Tiempo estimado: 24-48 horas
                <br />
                Te notificaremos por email cuando esté listo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>¿Qué sigue?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Revisión Automática</p>
                  <p className="text-sm text-gray-600">Nuestro sistema verifica la calidad de las imágenes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Verificación Manual</p>
                  <p className="text-sm text-gray-600">Un especialista revisa tus documentos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Notificación</p>
                  <p className="text-sm text-gray-600">Te informamos el resultado por email y push</p>
                </div>
              </div>
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
            <Link href="/configuracion">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-gray-900">Verificación de Identidad</h1>
          </div>
          <Badge className={getStatusColor(verification.status)}>{getStatusText(verification.status)}</Badge>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              ¿Por qué verificar tu identidad?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verificationBenefits.map((benefit, index) => {
                const IconComponent = benefit.icon
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium">{benefit.title}</p>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Proceso de Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verificationSteps.map((step, index) => {
                const IconComponent = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id

                return (
                  <div key={step.id} className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <IconComponent className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isActive ? "text-emerald-600" : ""}`}>{step.title}</p>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    {isActive && <Badge className="bg-emerald-100 text-emerald-700">Actual</Badge>}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {renderStepContent()}

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Requisitos Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Cédula Dominicana Válida</p>
                  <p className="text-sm text-gray-600">Debe estar vigente y en buen estado</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Mayor de 18 años</p>
                  <p className="text-sm text-gray-600">Solo usuarios adultos pueden verificarse</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Fotos de Calidad</p>
                  <p className="text-sm text-gray-600">Imágenes claras, bien iluminadas y legibles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Información Veraz</p>
                  <p className="text-sm text-gray-600">Todos los datos deben coincidir exactamente</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
