"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe, Ruler, Calendar, Weight, Info, MapPin, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UnidadesMedidasPage() {
  const [settings, setSettings] = useState({
    currency: "DOP",
    currencyDisplay: "symbol", // symbol, code, name
    sizeSystem: "US", // US, EU, UK, Local
    weightUnit: "kg", // kg, lb
    temperatureUnit: "C", // C, F
    dateFormat: "DD/MM/YYYY", // DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    timeFormat: "24h", // 12h, 24h
    numberFormat: "comma", // comma, period
    showCurrencyDecimals: true,
    autoDetectLocation: true,
  })

  const [hasChanges, setHasChanges] = useState(false)

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    // Simulate API call
    console.log("Saving settings:", settings)
    setHasChanges(false)
  }

  const resetToDefaults = () => {
    setSettings({
      currency: "DOP",
      currencyDisplay: "symbol",
      sizeSystem: "US",
      weightUnit: "kg",
      temperatureUnit: "C",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      numberFormat: "comma",
      showCurrencyDecimals: true,
      autoDetectLocation: true,
    })
    setHasChanges(true)
  }

  const formatCurrencyExample = (amount: number) => {
    const formatter = new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: settings.currency,
      minimumFractionDigits: settings.showCurrencyDecimals ? 2 : 0,
      maximumFractionDigits: settings.showCurrencyDecimals ? 2 : 0,
    })

    if (settings.currencyDisplay === "code") {
      return `${amount.toLocaleString("es-DO")} ${settings.currency}`
    } else if (settings.currencyDisplay === "name") {
      return `${amount.toLocaleString("es-DO")} ${settings.currency === "DOP" ? "pesos dominicanos" : "dólares"}`
    }

    return formatter.format(amount)
  }

  const formatDateExample = () => {
    const date = new Date()
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()

    switch (settings.dateFormat) {
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`
      default:
        return `${day}/${month}/${year}`
    }
  }

  const formatTimeExample = () => {
    const now = new Date()
    if (settings.timeFormat === "12h") {
      return now.toLocaleTimeString("es-DO", {
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
      })
    }
    return now.toLocaleTimeString("es-DO", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSizeConversion = (usSize: string) => {
    const conversions: { [key: string]: { EU: string; UK: string; Local: string } } = {
      XS: { EU: "32-34", UK: "4-6", Local: "XS" },
      S: { EU: "36-38", UK: "8-10", Local: "S" },
      M: { EU: "40-42", UK: "12-14", Local: "M" },
      L: { EU: "44-46", UK: "16-18", Local: "L" },
      XL: { EU: "48-50", UK: "20-22", Local: "XL" },
    }
    return conversions[usSize] || { EU: "-", UK: "-", Local: "-" }
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
            <h1 className="font-semibold text-gray-900">Unidades y Medidas</h1>
          </div>
          {hasChanges && (
            <Button onClick={saveSettings} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              Guardar
            </Button>
          )}
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              Configuración Regional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Detección Automática de Ubicación</p>
                  <p className="text-sm text-gray-500">Ajustar configuración según tu ubicación</p>
                </div>
              </div>
              <Switch
                checked={settings.autoDetectLocation}
                onCheckedChange={(checked) => handleSettingChange("autoDetectLocation", checked)}
              />
            </div>

            {settings.autoDetectLocation && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ubicación detectada:</strong> República Dominicana 🇩🇴
                  <br />
                  Las configuraciones se han optimizado para tu región.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Size Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler className="h-5 w-5 text-emerald-600" />
              Tallas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Selecciona tu sistema de tallas preferido. Esto afectará cómo se muestran las tallas en la aplicación.
            </p>

            <div className="overflow-x-auto">
              <div className="w-full">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Talla US
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Talla EU
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Talla UK
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Talla Local
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.keys(getSizeConversion("XS")).map((key) => {
                      return (
                        <tr key={key}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">XS</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("XS")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("XS")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("XS")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                        </tr>
                      )
                    })}
                    {Object.keys(getSizeConversion("S")).map((key) => {
                      return (
                        <tr key={key}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">S</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("S")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("S")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("S")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                        </tr>
                      )
                    })}
                    {Object.keys(getSizeConversion("M")).map((key) => {
                      return (
                        <tr key={key}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">M</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("M")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("M")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("M")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                        </tr>
                      )
                    })}
                    {Object.keys(getSizeConversion("L")).map((key) => {
                      return (
                        <tr key={key}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">L</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("L")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("L")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("L")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                        </tr>
                      )
                    })}
                    {Object.keys(getSizeConversion("XL")).map((key) => {
                      return (
                        <tr key={key}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">XL</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("XL")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("XL")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSizeConversion("XL")[key as keyof { EU: string; UK: string; Local: string }]}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight and Temperature */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Weight className="h-5 w-5 text-emerald-600" />
              Peso y Temperatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidad de Peso</label>
                <Select value={settings.weightUnit} onValueChange={(value) => handleSettingChange("weightUnit", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">
                      <div className="flex items-center gap-2">
                        <span>Kilogramos (kg)</span>
                        <Badge variant="secondary" className="ml-auto">
                          Recomendado
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="lb">Libras (lb)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unidad de Temperatura</label>
                <Select
                  value={settings.temperatureUnit}
                  onValueChange={(value) => handleSettingChange("temperatureUnit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C">
                      <div className="flex items-center gap-2">
                        <span>Celsius (°C)</span>
                        <Badge variant="secondary" className="ml-auto">
                          Recomendado
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="F">Fahrenheit (°F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Ejemplos:</p>
              <div className="flex gap-4 text-sm">
                <span>Peso: 2.5 {settings.weightUnit}</span>
                <span>•</span>
                <span>Temperatura: 28°{settings.temperatureUnit}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date and Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Fecha y Hora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato de Fecha</label>
                <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange("dateFormat", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">
                      <div className="flex items-center gap-2">
                        <span>DD/MM/YYYY</span>
                        <Badge variant="secondary" className="ml-auto">
                          Recomendado
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Formato de Hora</label>
                <Select value={settings.timeFormat} onValueChange={(value) => handleSettingChange("timeFormat", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">
                      <div className="flex items-center gap-2">
                        <span>24 horas (14:30)</span>
                        <Badge variant="secondary" className="ml-auto">
                          Recomendado
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="12h">12 horas (2:30 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Vista previa:</p>
              <div className="flex gap-4 text-sm">
                <span>Fecha: {formatDateExample()}</span>
                <span>•</span>
                <span>Hora: {formatTimeExample()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Number Format */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="h-5 w-5 text-emerald-600" />
              Formato de Números
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Separador de Miles</label>
              <Select
                value={settings.numberFormat}
                onValueChange={(value) => handleSettingChange("numberFormat", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comma">
                    <div className="flex items-center gap-2">
                      <span>Coma (1,500.00)</span>
                      <Badge variant="secondary" className="ml-auto">
                        Recomendado
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="period">Punto (1.500,00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Ejemplos:</p>
              <div className="text-sm space-y-1">
                <div>Precio: {settings.numberFormat === "comma" ? "1,500.00" : "1.500,00"}</div>
                <div>Cantidad: {settings.numberFormat === "comma" ? "10,000" : "10.000"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={resetToDefaults} variant="outline" className="flex-1 bg-transparent">
            Restaurar Predeterminados
          </Button>
          <Button onClick={saveSettings} className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={!hasChanges}>
            {hasChanges ? "Guardar Cambios" : "Guardado"}
          </Button>
        </div>

        {/* Information */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Nota:</strong> Estos cambios afectarán cómo se muestran los precios, fechas y medidas en toda la
            aplicación. Las configuraciones se sincronizan entre todos tus dispositivos.
          </AlertDescription>
        </Alert>
      </div>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}
