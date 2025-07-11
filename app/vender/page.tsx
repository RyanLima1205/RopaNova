"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Camera, X, Home, Search, MessageCircle, User, Star, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { MobileCamera } from "@/components/mobile-camera"

export default function SellPage() {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    brand: "",
    condition: "",
    price: "",
    color: [],
    material: "",
    location: "",
    shippingAvailable: false,
    shippingPrice: "",
    // Condition details
    conditionOverall: [8],
    conditionFabric: [8],
    conditionColor: [9],
    conditionShape: [7],
    conditionCleanliness: [9],
    conditionNotes: "",
    conditionVerified: false,
    // Additional details
    measurements: {
      chest: "",
      waist: "",
      length: "",
      shoulders: "",
    },
    defects: "",
    authenticity: true,
    stock: [{ size: "", quantity: 1 }],
    careInstructions: "",
  })

  const categories = {
    Mujer: ["Vestidos", "Tops", "Pantalones", "Zapatos", "Bolsos", "Accesorios"],
    Hombre: ["Camisas", "Pantalones", "Zapatos", "Chaquetas", "Deportiva", "Accesorios"],
    Niños: ["Ropa Bebé", "Niña", "Niño", "Zapatos", "Juguetes", "Accesorios"],
    Belleza: ["Maquillaje", "Cuidado Piel", "Perfumes", "Cabello", "Uñas", "Herramientas"],
    Electrónica: ["Teléfonos", "Tablets", "Auriculares", "Cargadores", "Accesorios", "Gaming"],
    Hogar: ["Decoración", "Cocina", "Baño", "Dormitorio", "Jardín", "Limpieza"],
  }

  const conditionOptions = [
    { value: "nuevo", label: "Nuevo con etiquetas", description: "Nunca usado, con etiquetas originales" },
    { value: "nuevo-sin-etiquetas", label: "Nuevo sin etiquetas", description: "Nunca usado, sin etiquetas" },
    { value: "muy-bueno", label: "Muy bueno", description: "Usado pocas veces, excelente estado" },
    { value: "bueno", label: "Bueno", description: "Usado regularmente, buen estado general" },
    { value: "aceptable", label: "Aceptable", description: "Signos de uso visibles pero funcional" },
  ]

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (selectedImages.length + files.length <= 10) {
      setSelectedImages([...selectedImages, ...files])
    }
  }

  const handleCameraCapture = (file: File) => {
    if (selectedImages.length < 10) {
      setSelectedImages([...selectedImages, file])
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

  const handleInputChange = (field: string, value: string | boolean | number[] | any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData({
        ...formData,
        [parent]: {
          ...(formData[parent as keyof typeof formData] as any),
          [child]: value,
        },
      })
    } else {
      setFormData({ ...formData, [field]: value })
    }
  }

  const handleSubmit = () => {
    // In a real app, this would submit to an API
    console.log("Form data:", formData)
    console.log("Images:", selectedImages)
    alert("¡Producto publicado exitosamente!")
  }

  const getConditionColor = (value: number) => {
    if (value >= 9) return "text-green-600"
    if (value >= 7) return "text-yellow-600"
    return "text-red-600"
  }

  const getConditionLabel = (value: number) => {
    if (value >= 9) return "Excelente"
    if (value >= 7) return "Bueno"
    if (value >= 5) return "Regular"
    return "Malo"
  }

  // Check if device has camera support
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-gray-900">Vender Artículo</h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title || !formData.price || selectedImages.length === 0}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            Publicar
          </Button>
        </div>
      </header>

      <div className="p-4 pb-20 space-y-6">
        {/* Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fotos del Producto</CardTitle>
            <p className="text-sm text-gray-600">Agrega hasta 10 fotos. La primera será la foto principal.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative aspect-square">
                  <Image
                    src={URL.createObjectURL(image) || "/placeholder.svg"}
                    alt={`Producto ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {index === 0 && <Badge className="absolute bottom-1 left-1 text-xs bg-emerald-500">Principal</Badge>}
                </div>
              ))}
              {selectedImages.length < 10 && (
                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                  {/* Camera Button - Show on mobile devices */}
                  {isMobileDevice() && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowCamera(true)}
                      className="flex flex-col items-center justify-center h-full w-full text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      <Smartphone className="h-6 w-6 mb-1" />
                      <span className="text-xs text-center">Tomar Foto</span>
                    </Button>
                  )}

                  {/* File Upload Button */}
                  <label
                    className={`${isMobileDevice() ? "mt-2 pt-2 border-t border-gray-200" : ""} flex flex-col items-center justify-center cursor-pointer hover:text-emerald-600 hover:bg-emerald-50 ${isMobileDevice() ? "w-full" : "h-full w-full"} text-gray-500`}
                  >
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-xs text-center">Galería</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Photo Tips for Mobile */}
            {isMobileDevice() && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Consejos para Fotos
                </h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Usa buena iluminación natural</li>
                  <li>• Toma fotos desde diferentes ángulos</li>
                  <li>• Muestra detalles importantes y defectos</li>
                  <li>• Mantén el fondo limpio y simple</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Título del Producto *</label>
              <Input
                placeholder="Ej: Vestido elegante de noche Zara talla M"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <Textarea
                placeholder="Describe tu producto: estado, características especiales, motivo de venta..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Categoría *</label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(categories).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subcategoría</label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => handleInputChange("subcategory", value)}
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category &&
                      categories[formData.category as keyof typeof categories].map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Condition Assessment - Moved here after Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evaluación del Estado</CardTitle>
            <p className="text-sm text-gray-600">Evalúa honestamente el estado de tu producto</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Condición General *</label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar condición" />
                </SelectTrigger>
                <SelectContent>
                  {conditionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Evaluación Detallada</h4>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Estado General</Label>
                    <span className={`text-sm font-medium ${getConditionColor(formData.conditionOverall[0])}`}>
                      {formData.conditionOverall[0]}/10 - {getConditionLabel(formData.conditionOverall[0])}
                    </span>
                  </div>
                  <Slider
                    value={formData.conditionOverall}
                    onValueChange={(value) => handleInputChange("conditionOverall", value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Tela/Material</Label>
                    <span className={`text-sm font-medium ${getConditionColor(formData.conditionFabric[0])}`}>
                      {formData.conditionFabric[0]}/10 - {getConditionLabel(formData.conditionFabric[0])}
                    </span>
                  </div>
                  <Slider
                    value={formData.conditionFabric}
                    onValueChange={(value) => handleInputChange("conditionFabric", value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Color</Label>
                    <span className={`text-sm font-medium ${getConditionColor(formData.conditionColor[0])}`}>
                      {formData.conditionColor[0]}/10 - {getConditionLabel(formData.conditionColor[0])}
                    </span>
                  </div>
                  <Slider
                    value={formData.conditionColor}
                    onValueChange={(value) => handleInputChange("conditionColor", value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Forma/Estructura</Label>
                    <span className={`text-sm font-medium ${getConditionColor(formData.conditionShape[0])}`}>
                      {formData.conditionShape[0]}/10 - {getConditionLabel(formData.conditionShape[0])}
                    </span>
                  </div>
                  <Slider
                    value={formData.conditionShape}
                    onValueChange={(value) => handleInputChange("conditionShape", value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Limpieza</Label>
                    <span className={`text-sm font-medium ${getConditionColor(formData.conditionCleanliness[0])}`}>
                      {formData.conditionCleanliness[0]}/10 - {getConditionLabel(formData.conditionCleanliness[0])}
                    </span>
                  </div>
                  <Slider
                    value={formData.conditionCleanliness}
                    onValueChange={(value) => handleInputChange("conditionCleanliness", value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notas sobre el Estado</label>
              <Textarea
                placeholder="Describe cualquier defecto, desgaste o característica especial..."
                value={formData.conditionNotes}
                onChange={(e) => handleInputChange("conditionNotes", e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Defectos Específicos (si los hay)</label>
              <Textarea
                placeholder="Manchas, agujeros, decoloración, etc..."
                value={formData.defects}
                onChange={(e) => handleInputChange("defects", e.target.value)}
                className="min-h-[60px]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="authenticity"
                checked={formData.authenticity}
                onCheckedChange={(checked) => handleInputChange("authenticity", checked as boolean)}
              />
              <label htmlFor="authenticity" className="text-sm font-medium">
                Confirmo que este producto es auténtico
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalles del Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Marca</label>
                <Input
                  placeholder="Ej: Zara, H&M, Nike..."
                  value={formData.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">Stock y Tallas</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newStock = [...formData.stock, { size: "", quantity: 1 }]
                      handleInputChange("stock", newStock)
                    }}
                    className="text-xs"
                  >
                    + Agregar Talla
                  </Button>
                </div>

                {formData.stock.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="flex-1">
                      <Input
                        placeholder="Ej: M, 38, 42..."
                        value={item.size}
                        onChange={(e) => {
                          const newStock = [...formData.stock]
                          newStock[index].size = e.target.value
                          handleInputChange("stock", newStock)
                        }}
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        value={String(item.quantity)}
                        onChange={(e) => {
                          const newStock = [...formData.stock]
                          newStock[index].quantity = Number.parseInt(e.target.value) || 1
                          handleInputChange("stock", newStock)
                        }}
                      />
                    </div>
                    {formData.stock.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newStock = formData.stock.filter((_, i) => i !== index)
                          handleInputChange("stock", newStock)
                        }}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <div className="text-xs text-gray-500">
                  Total en stock: {formData.stock.reduce((total, item) => total + item.quantity, 0)} unidades
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Colores *</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { name: "Negro", value: "negro", color: "#000000" },
                      { name: "Blanco", value: "blanco", color: "#FFFFFF" },
                      { name: "Gris", value: "gris", color: "#808080" },
                      { name: "Azul", value: "azul", color: "#0066CC" },
                      { name: "Azul Marino", value: "azul-marino", color: "#001f3f" },
                      { name: "Rojo", value: "rojo", color: "#FF4136" },
                      { name: "Rosa", value: "rosa", color: "#FF69B4" },
                      { name: "Verde", value: "verde", color: "#2ECC40" },
                      { name: "Amarillo", value: "amarillo", color: "#FFDC00" },
                      { name: "Naranja", value: "naranja", color: "#FF851B" },
                      { name: "Morado", value: "morado", color: "#B10DC9" },
                      { name: "Marrón", value: "marron", color: "#8B4513" },
                      { name: "Beige", value: "beige", color: "#F5F5DC" },
                      { name: "Crema", value: "crema", color: "#FFFDD0" },
                      { name: "Dorado", value: "dorado", color: "#FFD700" },
                      { name: "Plateado", value: "plateado", color: "#C0C0C0" },
                      { name: "Turquesa", value: "turquesa", color: "#40E0D0" },
                      { name: "Coral", value: "coral", color: "#FF7F50" },
                    ].map((colorOption) => (
                      <button
                        key={colorOption.value}
                        type="button"
                        onClick={() => {
                          const currentColors = formData.color as string[]
                          const isSelected = currentColors.includes(colorOption.value)
                          const newColors = isSelected
                            ? currentColors.filter((c) => c !== colorOption.value)
                            : [...currentColors, colorOption.value]
                          handleInputChange("color", newColors)
                        }}
                        className={`relative w-12 h-12 rounded-lg border-2 transition-all ${
                          (formData.color as string[]).includes(colorOption.value)
                            ? "border-emerald-500 ring-2 ring-emerald-200"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: colorOption.color }}
                        title={colorOption.name}
                      >
                        {colorOption.color === "#FFFFFF" && (
                          <div className="absolute inset-1 border border-gray-200 rounded-md" />
                        )}
                        {(formData.color as string[]).includes(colorOption.value) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                colorOption.color === "#FFFFFF" ||
                                colorOption.color === "#FFDC00" ||
                                colorOption.color === "#FFFDD0"
                                  ? "bg-gray-800"
                                  : "bg-white"
                              }`}
                            />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {(formData.color as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(formData.color as string[]).map((selectedColor) => {
                        const colorInfo = [
                          { name: "Negro", value: "negro", color: "#000000" },
                          { name: "Blanco", value: "blanco", color: "#FFFFFF" },
                          { name: "Gris", value: "gris", color: "#808080" },
                          { name: "Azul", value: "azul", color: "#0066CC" },
                          { name: "Azul Marino", value: "azul-marino", color: "#001f3f" },
                          { name: "Rojo", value: "rojo", color: "#FF4136" },
                          { name: "Rosa", value: "rosa", color: "#FF69B4" },
                          { name: "Verde", value: "verde", color: "#2ECC40" },
                          { name: "Amarillo", value: "amarillo", color: "#FFDC00" },
                          { name: "Naranja", value: "naranja", color: "#FF851B" },
                          { name: "Morado", value: "morado", color: "#B10DC9" },
                          { name: "Marrón", value: "marron", color: "#8B4513" },
                          { name: "Beige", value: "beige", color: "#F5F5DC" },
                          { name: "Crema", value: "crema", color: "#FFFDD0" },
                          { name: "Dorado", value: "dorado", color: "#FFD700" },
                          { name: "Plateado", value: "plateado", color: "#C0C0C0" },
                          { name: "Turquesa", value: "turquesa", color: "#40E0D0" },
                          { name: "Coral", value: "coral", color: "#FF7F50" },
                        ].find((c) => c.value === selectedColor)

                        return (
                          <Badge key={selectedColor} variant="secondary" className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: colorInfo?.color }}
                            />
                            {colorInfo?.name}
                          </Badge>
                        )
                      })}
                    </div>
                  )}

                  <p className="text-xs text-gray-500">Selecciona todos los colores disponibles para tu producto</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Material</label>
                <Input
                  placeholder="Ej: 100% Algodón, Poliéster 95%..."
                  value={formData.material}
                  onChange={(e) => handleInputChange("material", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Instrucciones de Cuidado</label>
              <Input
                placeholder="Ej: Lavar a máquina 30°C, no usar secadora..."
                value={formData.careInstructions}
                onChange={(e) => handleInputChange("careInstructions", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Measurements (for clothing) */}
        {(formData.category === "Mujer" || formData.category === "Hombre") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medidas (Opcional)</CardTitle>
              <p className="text-sm text-gray-600">Ayuda a los compradores a conocer el ajuste exacto</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pecho/Busto (cm)</label>
                  <Input
                    type="number"
                    placeholder="90"
                    value={formData.measurements.chest}
                    onChange={(e) => handleInputChange("measurements.chest", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cintura (cm)</label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={formData.measurements.waist}
                    onChange={(e) => handleInputChange("measurements.waist", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Largo (cm)</label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={formData.measurements.length}
                    onChange={(e) => handleInputChange("measurements.length", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hombros (cm)</label>
                  <Input
                    type="number"
                    placeholder="40"
                    value={formData.measurements.shoulders}
                    onChange={(e) => handleInputChange("measurements.shoulders", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Precio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Precio de Venta (RD$) *</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location and Shipping */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ubicación y Envío</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ubicación *</label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar provincia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="santo-domingo">Santo Domingo</SelectItem>
                  <SelectItem value="santiago">Santiago</SelectItem>
                  <SelectItem value="la-romana">La Romana</SelectItem>
                  <SelectItem value="puerto-plata">Puerto Plata</SelectItem>
                  <SelectItem value="punta-cana">Punta Cana</SelectItem>
                  <SelectItem value="barahona">Barahona</SelectItem>
                  <SelectItem value="san-pedro">San Pedro de Macorís</SelectItem>
                  <SelectItem value="la-vega">La Vega</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="shipping"
                checked={formData.shippingAvailable}
                onCheckedChange={(checked) => handleInputChange("shippingAvailable", checked as boolean)}
              />
              <label htmlFor="shipping" className="text-sm font-medium">
                Ofrezco envío a domicilio
              </label>
            </div>

            {formData.shippingAvailable && (
              <div>
                <label className="block text-sm font-medium mb-2">Precio de Envío (RD$)</label>
                <Input
                  type="number"
                  placeholder="150"
                  value={formData.shippingPrice}
                  onChange={(e) => handleInputChange("shippingPrice", e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.title && formData.price && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-3 bg-white">
                <div className="flex gap-3">
                  {selectedImages.length > 0 && (
                    <Image
                      src={URL.createObjectURL(selectedImages[0]) || "/placeholder.svg"}
                      alt="Preview"
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">{formData.title}</h3>
                    <p className="text-lg font-bold text-emerald-600 mb-1">
                      RD${Number(formData.price).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mb-1">
                      {formData.condition && (
                        <Badge variant="secondary" className="text-xs">
                          {conditionOptions.find((opt) => opt.value === formData.condition)?.label}
                        </Badge>
                      )}
                      {formData.stock.length > 0 && formData.stock.some((item) => item.size) && (
                        <div className="flex flex-wrap gap-1">
                          {formData.stock
                            .filter((item) => item.size)
                            .map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item.size} ({item.quantity})
                              </Badge>
                            ))}
                        </div>
                      )}
                      {formData.conditionOverall[0] && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">{formData.conditionOverall[0]}/10</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{formData.location}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Camera Component */}
      <MobileCamera isOpen={showCamera} onClose={() => setShowCamera(false)} onCapture={handleCameraCapture} />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex">
          <Link
            href="/"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Inicio</span>
          </Link>
          <Link
            href="/buscar"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <Search className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Buscar</span>
          </Link>
          <Link href="/vender" className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-emerald-500">
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Vender</span>
          </Link>
          <Link
            href="/mensajes"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <MessageCircle className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Mensajes</span>
          </Link>
          <Link
            href="/perfil"
            className="flex-1 py-2 px-1 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
