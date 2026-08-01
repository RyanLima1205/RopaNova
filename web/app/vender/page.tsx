"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Camera, X, ChevronDown, ChevronUp, Check, HelpCircle, ShieldCheck, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { toast } from "@/hooks/use-toast"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/contexts/AuthContext"
import { db, storage } from "@/lib/firebaseConfig"
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { categories, getSubcategories } from "@/lib/categories"

// Mismo listado que mobile-app SellScreen.tsx
const popularBrands = [
  "Zara", "Nike", "Adidas", "Mango", "H&M", "Pull&Bear", "Bershka", "Stradivarius",
  "Levi's", "Puma", "Reebok", "Under Armour", "Tommy Hilfiger", "Guess", "Lacoste",
  "Gucci", "Louis Vuitton", "Prada", "Chanel", "Hermès", "Sin marca", "Otra",
]

const conditionOptions = [
  { value: "nuevo", label: "Nuevo" },
  { value: "segunda-mano", label: "Segunda Mano" },
]

const authenticityOptions = [
  { value: "100% original", label: "100% Original" },
  { value: "replica", label: "Réplica" },
  { value: "no-especificado", label: "No Especificado" },
]

const colorOptions = [
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
]

const allCities = [
  "Santo Domingo", "Santiago", "La Romana", "Puerto Plata",
  "Punta Cana", "Barahona", "San Pedro de Macorís", "La Vega",
]

// Mapa de tallas por subcategoría — mismo que mobile-app (ya alineado con los nombres de
// lib/categories.ts para Niño/Libro, ver hallazgo de la sesión anterior).
const sizeOptions: Record<string, string[]> = {
  "T-shirts": ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Camisas: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Blusas: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Vestidos: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Faldas: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Shorts: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Licras: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  "Trajes de Baño": ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  "Ropa Interior": ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Deportivas: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Deportiva: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Uniformes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Poloches: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Abrigos: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Franelas: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"],
  Pantalones: ["26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "38", "40", "42", "44", "Única", "Otra talla"],
  Zapatos: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "Única", "Otra talla"],
  "Zapatos Infantiles": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "Única", "Otra talla"],
  "Ropa de Bebé (0-24 meses)": ["0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M", "Única", "Otra talla"],
  "Ropa de Niña (2-12 años)": ["2T", "3T", "4T", "5T", "6", "7", "8", "10", "12", "14", "16", "Única", "Otra talla"],
  "Ropa de Niño (2-12 años)": ["2T", "3T", "4T", "5T", "6", "7", "8", "10", "12", "14", "16", "Única", "Otra talla"],
  Accesorios: ["Única"],
  "Accesorios Infantiles": ["Única"],
  Gorras: ["Única"],
  Lencerias: ["Única"],
  "Juguetes y Juegos": ["Única"],
  Disfraces: ["Única"],
  "Artículos Deportivos Infantiles": ["Única"],
  Universitarios: ["Único"],
  "Novelas Románticas": ["Único"],
  Negocios: ["Único"],
  "Autoayuda y Motivación": ["Único"],
  Cocina: ["Único"],
  "Salud y Bienestar": ["Único"],
  Religiosos: ["Único"],
  "Historia Dominicana": ["Único"],
  Idiomas: ["Único"],
  Infantiles: ["Único"],
}

function getSortedSizes(subcategory: string): string[] {
  const options = sizeOptions[subcategory] || ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Única", "Otra talla"]
  const filtered = options.filter((opt) => opt !== "Única" && opt !== "Único" && opt !== "Otra talla")
  const uniqueOptions = options.filter((opt) => opt === "Única" || opt === "Único")
  return [...filtered, ...uniqueOptions, "Otra talla"]
}

function getConditionColor(value: number) {
  if (value >= 9) return "#16A34A"
  if (value >= 7) return "#F59E0B"
  return "#DC2626"
}

function getConditionLabel(value: number) {
  if (value >= 9) return "Excelente"
  if (value >= 7) return "Bueno"
  if (value >= 5) return "Regular"
  return "Malo"
}

interface StockItem {
  talla: string
  cantidad: number
}

interface CityPrice {
  ciudad: string
  precio: string
}

interface SellFormData {
  titulo: string
  descripcion: string
  categoria: string
  subcategoria: string
  marca: string
  condicionGeneral: string
  precio: string
  color: string[]
  material: string
  estadoGeneral: number
  estadoTelaMaterial: number
  notasSobreElEstado: string
  measurements: { chest: string; waist: string; length: string; shoulders: string; hips: string; inseam: string }
  defectosEspecificos: string
  autenticidad: string
  stock: StockItem[]
  tipoDeEntregaPermitida: { envioAPuntoDeRecogida: boolean; recogidaEnPersona: boolean; envioADomicilio: boolean }
  ciudadRecogidaEnPersona: string
  ciudadesParaEnvioADomicilio: CityPrice[]
  instruccionesParaEntrega: string
}

const EMPTY_FORM: SellFormData = {
  titulo: "",
  descripcion: "",
  categoria: "",
  subcategoria: "",
  marca: "",
  condicionGeneral: "",
  precio: "",
  color: [],
  material: "",
  estadoGeneral: 8,
  estadoTelaMaterial: 8,
  notasSobreElEstado: "",
  measurements: { chest: "", waist: "", length: "", shoulders: "", hips: "", inseam: "" },
  defectosEspecificos: "",
  autenticidad: "no-especificado",
  stock: [{ talla: "", cantidad: 1 }],
  tipoDeEntregaPermitida: { envioAPuntoDeRecogida: false, recogidaEnPersona: false, envioADomicilio: false },
  ciudadRecogidaEnPersona: "",
  ciudadesParaEnvioADomicilio: [],
  instruccionesParaEntrega: "",
}

const normalizeStockCantidadesForSave = (stock: StockItem[]) =>
  stock.map((row) => ({ ...row, cantidad: Math.max(1, Math.floor(Number(row.cantidad)) || 0) }))

interface LocalImage {
  url: string
  file?: File
}

const DRAFT_KEY = "sellFormDraft"
const sellCategories = categories.filter((c) => c.id !== "1")

export default function VenderPageGate() {
  return (
    <RequireAuth>
      <VenderPage />
    </RequireAuth>
  )
}

function VenderPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const [formData, setFormData] = useState<SellFormData>(EMPTY_FORM)
  const [images, setImages] = useState<LocalImage[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  const [showCategorySheet, setShowCategorySheet] = useState(false)
  const [showSubcategorySheet, setShowSubcategorySheet] = useState(false)
  const [showBrandSheet, setShowBrandSheet] = useState(false)
  const [showSizeSheet, setShowSizeSheet] = useState(false)
  const [sizeSheetIndex, setSizeSheetIndex] = useState<number | null>(null)
  const [showCityInPersonSheet, setShowCityInPersonSheet] = useState(false)

  const [brandQuery, setBrandQuery] = useState("")
  const [showBrandInput, setShowBrandInput] = useState(false)
  const [otherBrand, setOtherBrand] = useState("")

  const filteredBrands = brandQuery.length > 0 ? popularBrands.filter((b) => b.toLowerCase().includes(brandQuery.toLowerCase())) : []
  const sortedBrands = [
    ...popularBrands.filter((b) => b !== "Sin marca" && b !== "Otra").sort((a, b) => a.localeCompare(b)),
    "Sin marca",
    "Otra",
  ]

  // Cargar producto existente si venimos de /vender?edit=<id> (equivalente web de editMode+productId de mobile)
  useEffect(() => {
    if (!editId) return
    setIsEditing(true)
    setProductId(editId)
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, "products", editId))
        if (snap.exists()) {
          const d = snap.data()
          setFormData({
            titulo: d.titulo || "",
            descripcion: d.descripcion || "",
            categoria: d.categoria || "",
            subcategoria: d.subcategoria || "",
            marca: d.marca || "",
            condicionGeneral: d.condicionGeneral || "",
            precio: d.precio || "",
            color: d.color || [],
            material: d.material || "",
            estadoGeneral: d.estadoGeneral || 8,
            estadoTelaMaterial: d.estadoTelaMaterial || 8,
            notasSobreElEstado: d.notasSobreElEstado || "",
            measurements: d.measurements || { chest: "", waist: "", length: "", shoulders: "", hips: "", inseam: "" },
            defectosEspecificos: d.defectosEspecificos || "",
            autenticidad: d.autenticidad || "no-especificado",
            stock: d.stock && d.stock.length > 0 ? d.stock.map((s: any) => ({ talla: s.talla || "", cantidad: s.cantidad || 1 })) : [{ talla: "", cantidad: 1 }],
            tipoDeEntregaPermitida: d.tipoDeEntregaPermitida || { envioAPuntoDeRecogida: false, recogidaEnPersona: false, envioADomicilio: false },
            ciudadRecogidaEnPersona: d.ciudadRecogidaEnPersona || "",
            ciudadesParaEnvioADomicilio: d.ciudadesParaEnvioADomicilio || [],
            instruccionesParaEntrega: d.instruccionesParaEntrega || "",
          })
          setImages((d.images || []).map((url: string) => ({ url })))
        }
      } catch {
        toast({ title: "No se pudo cargar el producto a editar", variant: "destructive" })
      }
      setDraftRestored(true)
    })()
  }, [editId])

  // Guardado automático del borrador (localStorage) — solo campos de texto, no las fotos
  // (los File del navegador no se pueden serializar como los file:// de mobile).
  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
  }, [formData])

  // Restaurar borrador al montar — solo para anuncios nuevos, no al editar uno existente
  // (evita que un borrador viejo sobrescriba los datos que se acaban de cargar para editar).
  useEffect(() => {
    if (draftRestored || editId) return
    if (typeof window === "undefined") {
      setDraftRestored(true)
      return
    }
    try {
      const draft = window.localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setFormData({
          titulo: parsed.titulo || "",
          descripcion: parsed.descripcion || "",
          categoria: parsed.categoria || "",
          subcategoria: parsed.subcategoria || "",
          marca: parsed.marca || "",
          condicionGeneral: parsed.condicionGeneral || "",
          precio: parsed.precio || "",
          color: parsed.color || [],
          material: parsed.material || "",
          estadoGeneral: parsed.estadoGeneral || 8,
          estadoTelaMaterial: parsed.estadoTelaMaterial || 8,
          notasSobreElEstado: parsed.notasSobreElEstado || "",
          measurements: parsed.measurements || { chest: "", waist: "", length: "", shoulders: "", hips: "", inseam: "" },
          defectosEspecificos: parsed.defectosEspecificos || "",
          autenticidad: parsed.autenticidad || "no-especificado",
          stock: parsed.stock || [{ talla: "", cantidad: 1 }],
          tipoDeEntregaPermitida: parsed.tipoDeEntregaPermitida || { envioAPuntoDeRecogida: false, recogidaEnPersona: false, envioADomicilio: false },
          ciudadRecogidaEnPersona: parsed.ciudadRecogidaEnPersona || "",
          ciudadesParaEnvioADomicilio: parsed.ciudadesParaEnvioADomicilio || [],
          instruccionesParaEntrega: parsed.instruccionesParaEntrega || "",
        })
      }
    } catch {
      // borrador corrupto — se ignora
    }
    setDraftRestored(true)
  }, [draftRestored, editId])

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({ ...prev, [parent]: { ...(prev[parent as keyof SellFormData] as any), [child]: value } }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleImageFilesSelected = (files: FileList | null) => {
    if (!files) return
    const remaining = 10 - images.length
    const picked = Array.from(files).slice(0, remaining)
    const newImages: LocalImage[] = picked.map((file) => ({ url: URL.createObjectURL(file), file }))
    setImages((prev) => [...prev, ...newImages].slice(0, 10))
  }

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index))

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const toggleColor = (colorValue: string) => {
    const isSelected = formData.color.includes(colorValue)
    handleInputChange("color", isSelected ? formData.color.filter((c) => c !== colorValue) : [...formData.color, colorValue])
  }

  const addStockItem = () => setFormData((prev) => ({ ...prev, stock: [...prev.stock, { talla: "", cantidad: 1 }] }))
  const removeStockItem = (index: number) => setFormData((prev) => ({ ...prev, stock: prev.stock.filter((_, i) => i !== index) }))
  const updateStockItem = (index: number, field: "talla" | "cantidad", value: string | number) => {
    setFormData((prev) => {
      const newStock = [...prev.stock]
      if (field === "talla") newStock[index] = { ...newStock[index], talla: value as string }
      else newStock[index] = { ...newStock[index], cantidad: value as number }
      return { ...prev, stock: newStock }
    })
  }
  const parseCantidadInput = (text: string): number => {
    const digits = text.replace(/\D/g, "")
    if (digits === "") return 0
    const n = parseInt(digits, 10)
    return Number.isNaN(n) ? 0 : n
  }
  const finalizeStockCantidad = (index: number) => {
    setFormData((prev) => {
      const newStock = [...prev.stock]
      const q = newStock[index]?.cantidad
      if (newStock[index] && (!q || q < 1)) newStock[index] = { ...newStock[index], cantidad: 1 }
      return { ...prev, stock: newStock }
    })
  }

  const handleDeliveryMethodChange = (method: keyof SellFormData["tipoDeEntregaPermitida"]) => {
    setFormData((prev) => ({
      ...prev,
      tipoDeEntregaPermitida: { ...prev.tipoDeEntregaPermitida, [method]: !prev.tipoDeEntregaPermitida[method] },
    }))
  }

  const toggleDeliveryCity = (ciudad: string) => {
    setFormData((prev) => {
      const exists = prev.ciudadesParaEnvioADomicilio.find((c) => c.ciudad === ciudad)
      return {
        ...prev,
        ciudadesParaEnvioADomicilio: exists
          ? prev.ciudadesParaEnvioADomicilio.filter((c) => c.ciudad !== ciudad)
          : [...prev.ciudadesParaEnvioADomicilio, { ciudad, precio: "" }],
      }
    })
  }
  const setDeliveryCityPrice = (ciudad: string, precio: string) => {
    setFormData((prev) => ({
      ...prev,
      ciudadesParaEnvioADomicilio: prev.ciudadesParaEnvioADomicilio.map((c) => (c.ciudad === ciudad ? { ...c, precio } : c)),
    }))
  }

  // Mismo gate ligero que mobile usa para habilitar el botón (la validación completa de
  // categoría/subcategoría/condición/color solo se aplica al EDITAR, no al crear — así se
  // comporta SellScreen.tsx hoy; se porta tal cual).
  const isFormValid = () => {
    const hasDelivery = Object.values(formData.tipoDeEntregaPermitida).some(Boolean)
    return Boolean(formData.titulo && formData.precio && images.length > 0 && hasDelivery)
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setImages([])
    setTriedSubmit(false)
    if (typeof window !== "undefined") window.localStorage.removeItem(DRAFT_KEY)
  }

  const uploadImageToStorage = useCallback(
    async (image: LocalImage, name: string): Promise<string> => {
      if (!image.file) return image.url // ya es una URL pública/existente — no se re-sube
      const uid = user?.id
      if (!uid) throw new Error("Usuario no conectado")
      const storageRef = ref(storage, `products/${uid}/${name}`)
      await uploadBytes(storageRef, image.file)
      return getDownloadURL(storageRef)
    },
    [user?.id],
  )

  const publishNewProduct = async () => {
    if (!user?.id) {
      toast({ title: "Debes iniciar sesión para publicar un anuncio.", variant: "destructive" })
      return
    }
    setIsPublishing(true)
    try {
      const uploadedImageUrls: string[] = []
      for (let i = 0; i < images.length; i++) {
        try {
          uploadedImageUrls.push(await uploadImageToStorage(images[i], `product_${Date.now()}_${i}.jpg`))
        } catch {
          // esa imagen falla — se omite, igual que en mobile
        }
      }

      const produit: Record<string, unknown> = {}
      produit.images = uploadedImageUrls
      produit.titulo = formData.titulo
      produit.descripcion = formData.descripcion
      produit.categoria = formData.categoria
      produit.subcategoria = formData.subcategoria
      produit.condicionGeneral = formData.condicionGeneral
      produit.autenticidad = formData.autenticidad
      produit.estadoGeneral = formData.estadoGeneral
      produit.estadoTelaMaterial = formData.estadoTelaMaterial
      produit.notasSobreElEstado = formData.notasSobreElEstado
      produit.defectosEspecificos = formData.defectosEspecificos
      produit.marca = formData.marca
      produit.material = formData.material
      produit.color = formData.color
      produit.stock = normalizeStockCantidadesForSave(formData.stock)
      produit.measurements = formData.measurements
      produit.precio = formData.precio
      produit.tipoDeEntregaPermitida = formData.tipoDeEntregaPermitida
      produit.ciudadRecogidaEnPersona = formData.ciudadRecogidaEnPersona
      produit.ciudadesParaEnvioADomicilio = formData.ciudadesParaEnvioADomicilio
      produit.instruccionesParaEntrega = formData.instruccionesParaEntrega
      produit.userId = user.id
      produit.createdAt = new Date()

      await addDoc(collection(db, "products"), produit)
      toast({ title: "¡Tu anuncio ha sido publicado exitosamente!" })
      resetForm()
      router.push("/perfil")
    } catch (e: any) {
      toast({ title: "Error al publicar", description: e?.message, variant: "destructive" })
    } finally {
      setIsPublishing(false)
    }
  }

  const updateExistingProduct = async () => {
    if (!productId) return
    setIsPublishing(true)
    try {
      const uploadedImageUrls: string[] = []
      for (let i = 0; i < images.length; i++) {
        try {
          uploadedImageUrls.push(await uploadImageToStorage(images[i], `product_${Date.now()}_${i}.jpg`))
        } catch {
          // esa imagen falla — se omite
        }
      }

      await updateDoc(doc(db, "products", productId), {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria,
        marca: formData.marca,
        condicionGeneral: formData.condicionGeneral,
        precio: formData.precio,
        color: formData.color,
        material: formData.material,
        estadoGeneral: formData.estadoGeneral,
        estadoTelaMaterial: formData.estadoTelaMaterial,
        notasSobreElEstado: formData.notasSobreElEstado,
        measurements: formData.measurements,
        defectosEspecificos: formData.defectosEspecificos,
        autenticidad: formData.autenticidad,
        stock: normalizeStockCantidadesForSave(formData.stock),
        tipoDeEntregaPermitida: formData.tipoDeEntregaPermitida,
        ciudadRecogidaEnPersona: formData.ciudadRecogidaEnPersona,
        ciudadesParaEnvioADomicilio: formData.ciudadesParaEnvioADomicilio,
        instruccionesParaEntrega: formData.instruccionesParaEntrega,
        images: uploadedImageUrls,
        updatedAt: new Date(),
      })
      toast({ title: "Los cambios han sido guardados exitosamente." })
      router.push("/perfil")
    } catch {
      toast({ title: "No se pudieron guardar los cambios. Inténtalo de nuevo.", variant: "destructive" })
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePublish = async () => {
    setTriedSubmit(true)
    if (!isFormValid()) return

    if (isEditing) {
      const hasDelivery = Object.values(formData.tipoDeEntregaPermitida).some(Boolean)
      if (
        !formData.titulo ||
        !formData.precio ||
        images.length === 0 ||
        !formData.categoria ||
        !formData.subcategoria ||
        !formData.condicionGeneral ||
        formData.color.length === 0
      ) {
        toast({ title: "Por favor completa todos los campos obligatorios", variant: "destructive" })
        return
      }
      if (!hasDelivery) {
        toast({ title: "Debes seleccionar al menos un tipo de entrega.", variant: "destructive" })
        return
      }
      await updateExistingProduct()
    } else {
      await publishNewProduct()
    }
  }

  const currentSubcategories = formData.categoria
    ? getSubcategories(sellCategories.find((c) => c.name === formData.categoria)?.id || "")
    : []

  const showMeasurements = formData.categoria === "Mujer" || formData.categoria === "Hombre"
  const showTopMeasurements = ["Vestidos", "Camisas", "T-shirts", "Blusas", "Poloches", "Abrigos", "Franelas"].includes(formData.subcategoria)
  const showBottomMeasurements = ["Pantalones", "Shorts", "Faldas"].includes(formData.subcategoria)
  const showDressMeasurements = formData.subcategoria === "Vestidos"

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">{isEditing ? "Editar Artículo" : "Vender Artículo"}</h1>
        </div>
        <Button
          onClick={handlePublish}
          disabled={isPublishing || (triedSubmit && !isFormValid())}
          className="bg-brand-ui hover:bg-brand-dark"
        >
          {isPublishing ? (isEditing ? "Guardando..." : "Publicando...") : isEditing ? "Guardar" : "Publicar"}
        </Button>
      </div>

      <div className="max-w-lg mx-auto">
        {/* 1. Fotos */}
        <Section title="Fotos del Producto" subtitle="Agrega hasta 10 fotos. La primera será la foto principal.">
          {images[0] && (
            <div className="flex justify-center mb-4">
              <img src={images[0].url} alt="Principal" className="w-40 h-40 object-cover rounded-lg" />
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {images.slice(1).map((image, idx) => {
              const realIndex = idx + 1
              return (
                <div key={image.url} className="relative aspect-square">
                  <img src={image.url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => removeImage(realIndex)}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                  <div className="flex justify-center gap-1 mt-1">
                    <button onClick={() => moveImage(realIndex, -1)} disabled={realIndex === 1} className="disabled:opacity-30">
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => moveImage(realIndex, 1)}
                      disabled={realIndex === images.length - 1}
                      className="disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )
            })}
            {images.length < 10 && (
              <label
                className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-gray-50 cursor-pointer ${
                  triedSubmit && images.length === 0 ? "border-red-500" : "border-gray-300"
                }`}
              >
                <Camera className="h-7 w-7 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Agregar Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageFilesSelected(e.target.files)}
                />
              </label>
            )}
          </div>
        </Section>

        {/* 2. Información Básica */}
        <Section title="Información Básica">
          <Field label="Título del Producto" required error={triedSubmit && !formData.titulo}>
            <Input
              placeholder="Ej: Vestido elegante de noche Zara talla M"
              value={formData.titulo}
              onChange={(e) => handleInputChange("titulo", e.target.value)}
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              placeholder="Describe tu producto: estado, características especiales, motivo de venta..."
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              rows={4}
            />
          </Field>
          <Field label="Categoría" required error={triedSubmit && !formData.categoria}>
            <PickerButton
              value={formData.categoria}
              placeholder="Seleccionar categoría"
              onClick={() => setShowCategorySheet(true)}
            />
          </Field>
          <Field label="Subcategoría" required error={triedSubmit && !formData.subcategoria}>
            <PickerButton
              value={formData.subcategoria}
              placeholder={formData.categoria ? "Seleccionar subcategoría" : "Primero selecciona una categoría"}
              disabled={!formData.categoria}
              onClick={() => setShowSubcategorySheet(true)}
            />
          </Field>
        </Section>

        {/* 3. Evaluación del Estado */}
        <Section title="Evaluación del Estado" subtitle="Evalúa honestamente el estado de tu producto">
          <Field label="Condición General" required error={triedSubmit && !formData.condicionGeneral}>
            <ChipGroup
              options={conditionOptions}
              value={formData.condicionGeneral}
              onSelect={(v) => handleInputChange("condicionGeneral", v)}
            />
          </Field>
          <Field label="Autenticidad">
            <ChipGroup
              options={authenticityOptions}
              value={formData.autenticidad}
              onSelect={(v) => handleInputChange("autenticidad", v)}
            />
          </Field>

          <div className="border-t border-gray-200 my-4" />
          <p className="text-sm font-semibold text-gray-900 mb-3">Evaluación Detallada</p>

          <ConditionSlider
            label="Estado General"
            value={formData.estadoGeneral}
            onChange={(v) => handleInputChange("estadoGeneral", v)}
          />
          <ConditionSlider
            label="Tela/Material"
            value={formData.estadoTelaMaterial}
            onChange={(v) => handleInputChange("estadoTelaMaterial", v)}
          />

          <Field label="Notas sobre el Estado">
            <Textarea
              placeholder="Describe cualquier defecto, desgaste o característica especial..."
              value={formData.notasSobreElEstado}
              onChange={(e) => handleInputChange("notasSobreElEstado", e.target.value)}
              rows={3}
            />
          </Field>
          <Field label="Defectos Específicos (si los hay)">
            <Textarea
              placeholder="Manchas, agujeros, decoloración, etc..."
              value={formData.defectosEspecificos}
              onChange={(e) => handleInputChange("defectosEspecificos", e.target.value)}
              rows={2}
            />
          </Field>
        </Section>

        {/* 4. Detalles del Producto */}
        <Section title="Detalles del Producto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca" required error={triedSubmit && !formData.marca}>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ej: Nike, Sin marca..."
                  value={brandQuery || (formData.marca !== "Otra" ? formData.marca : "")}
                  onChange={(e) => {
                    setBrandQuery(e.target.value)
                    handleInputChange("marca", e.target.value)
                  }}
                  onFocus={() => setBrandQuery("")}
                  disabled={showBrandInput}
                />
                <button onClick={() => setShowBrandSheet(true)}>
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              {!showBrandInput && brandQuery.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-md bg-white shadow-sm max-h-40 overflow-y-auto">
                  {filteredBrands.map((brand) => (
                    <button
                      key={brand}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => {
                        if (brand === "Otra") {
                          setShowBrandInput(true)
                          setOtherBrand("")
                          handleInputChange("marca", "Otra")
                        } else {
                          setShowBrandInput(false)
                          handleInputChange("marca", brand)
                        }
                        setBrandQuery("")
                      }}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}
              {showBrandInput && formData.marca === "Otra" && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="Introduce la marca"
                    value={otherBrand}
                    onChange={(e) => setOtherBrand(e.target.value)}
                    onBlur={() => handleInputChange("marca", otherBrand)}
                  />
                  <button
                    onClick={() => {
                      setShowBrandInput(false)
                      setOtherBrand("")
                      handleInputChange("marca", "")
                    }}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              )}
            </Field>
            <Field label="Material">
              <Input
                placeholder="Ej: 100% Algodón..."
                value={formData.material}
                onChange={(e) => handleInputChange("material", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Colores" required error={triedSubmit && formData.color.length === 0}>
            <div className="flex items-center gap-1 mb-2">
              <InfoTooltip text="Selecciona uno o varios colores que correspondan al producto." />
            </div>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => toggleColor(c.value)}
                  className="h-9 w-9 rounded-full border-2 flex items-center justify-center"
                  style={{ backgroundColor: c.color, borderColor: formData.color.includes(c.value) ? "#1F7EF5" : "#e5e7eb" }}
                  title={c.name}
                >
                  {formData.color.includes(c.value) && (
                    <Check className={`h-4 w-4 ${c.value === "blanco" ? "text-gray-900" : "text-white"}`} />
                  )}
                </button>
              ))}
            </div>
            {formData.color.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.color.map((val) => {
                  const info = colorOptions.find((c) => c.value === val)
                  return (
                    <span key={val} className="text-xs bg-gray-100 rounded-full px-2 py-1 flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full border" style={{ backgroundColor: info?.color }} />
                      {info?.name}
                    </span>
                  )
                })}
              </div>
            )}
          </Field>

          <Field label="Stock y Tallas">
            <div className="flex items-center justify-between mb-2">
              <InfoTooltip text={'Selecciona la talla del producto. Si vendes varias tallas, añade una línea por talla. "Otra talla" permite ingresar una talla personalizada.'} />
              <Button variant="ghost" size="sm" onClick={addStockItem} className="text-brand-ui">
                + Agregar Talla
              </Button>
            </div>
            {formData.stock.map((item, index) => {
              const currentSizeOptions = getSortedSizes(formData.subcategoria)
              const isOtherSize = Boolean(item.talla) && !currentSizeOptions.includes(item.talla)
              return (
                <div key={index} className="flex items-end gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Talla</p>
                    <PickerButton
                      value={item.talla}
                      placeholder="Seleccionar talla"
                      onClick={() => {
                        setSizeSheetIndex(index)
                        setShowSizeSheet(true)
                      }}
                    />
                    {(item.talla === "Otra talla" || isOtherSize) && (
                      <Input
                        className="mt-1"
                        placeholder="Agregar talla"
                        value={isOtherSize ? item.talla : ""}
                        onChange={(e) => updateStockItem(index, "talla", e.target.value)}
                      />
                    )}
                  </div>
                  <div className="w-20">
                    <p className="text-xs text-gray-500 mb-1">Cantidad</p>
                    <Input
                      placeholder="Cant."
                      value={item.cantidad < 1 ? "" : String(item.cantidad)}
                      onChange={(e) => updateStockItem(index, "cantidad", parseCantidadInput(e.target.value))}
                      onBlur={() => finalizeStockCantidad(index)}
                      inputMode="numeric"
                    />
                  </div>
                  {formData.stock.length > 1 && (
                    <button onClick={() => removeStockItem(index)} className="mb-2.5">
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                </div>
              )
            })}
            <p className="text-xs text-gray-500 mt-1">
              Total en stock: {formData.stock.reduce((sum, i) => sum + (i.cantidad >= 1 ? i.cantidad : 0), 0)} unidades
            </p>
          </Field>
        </Section>

        {/* 5. Medidas */}
        {showMeasurements && (showTopMeasurements || showBottomMeasurements || showDressMeasurements) && (
          <Section title="Medidas (Opcional)" subtitle="Ayuda a los compradores a conocer el ajuste exacto">
            {(showTopMeasurements || showDressMeasurements) && (
              <div className="grid grid-cols-2 gap-3">
                <MeasurementField label="Pecho/Busto (cm)" value={formData.measurements.chest} onChange={(v) => handleInputChange("measurements.chest", v)} placeholder="90" />
                <MeasurementField label="Cintura (cm)" value={formData.measurements.waist} onChange={(v) => handleInputChange("measurements.waist", v)} placeholder="70" />
              </div>
            )}
            {showTopMeasurements && !showDressMeasurements && (
              <div className="grid grid-cols-2 gap-3">
                <MeasurementField label="Largo (cm)" value={formData.measurements.length} onChange={(v) => handleInputChange("measurements.length", v)} placeholder="60" />
                <MeasurementField label="Hombros (cm)" value={formData.measurements.shoulders} onChange={(v) => handleInputChange("measurements.shoulders", v)} placeholder="40" />
              </div>
            )}
            {showBottomMeasurements && (
              <div className="grid grid-cols-2 gap-3">
                <MeasurementField label="Cadera (cm)" value={formData.measurements.hips} onChange={(v) => handleInputChange("measurements.hips", v)} placeholder="95" />
                <MeasurementField label="Entrepierna (cm)" value={formData.measurements.inseam} onChange={(v) => handleInputChange("measurements.inseam", v)} placeholder="75" />
              </div>
            )}
            {showBottomMeasurements && (
              <div className="grid grid-cols-2 gap-3">
                <MeasurementField label="Largo Total (cm)" value={formData.measurements.length} onChange={(v) => handleInputChange("measurements.length", v)} placeholder="100" />
              </div>
            )}
            {showDressMeasurements && (
              <div className="grid grid-cols-2 gap-3">
                <MeasurementField label="Cadera (cm)" value={formData.measurements.hips} onChange={(v) => handleInputChange("measurements.hips", v)} placeholder="95" />
                <MeasurementField label="Largo Total (cm)" value={formData.measurements.length} onChange={(v) => handleInputChange("measurements.length", v)} placeholder="100" />
                <MeasurementField label="Hombros (cm)" value={formData.measurements.shoulders} onChange={(v) => handleInputChange("measurements.shoulders", v)} placeholder="40" />
                <MeasurementField label="Entrepierna (cm)" value={formData.measurements.inseam} onChange={(v) => handleInputChange("measurements.inseam", v)} placeholder="75" />
              </div>
            )}
          </Section>
        )}

        {/* 6. Precio */}
        <Section title="Precio">
          <Field label="Precio de Venta (RD$)" required error={triedSubmit && !formData.precio}>
            <Input
              placeholder="0"
              value={formData.precio}
              onChange={(e) => handleInputChange("precio", e.target.value)}
              inputMode="numeric"
            />
          </Field>
        </Section>

        {/* 7. Ubicación y Envío */}
        <Section title="Ubicación y Envío">
          {triedSubmit && !Object.values(formData.tipoDeEntregaPermitida).some(Boolean) && (
            <p className="text-sm text-red-600 mb-2">Debes seleccionar al menos un tipo de entrega.</p>
          )}
          <div className="flex items-center gap-1 mb-2">
            <p className="text-sm font-medium text-gray-700">
              Tipo de Entrega permitida <span className="text-gray-900 font-semibold">*</span>
            </p>
            <InfoTooltip text="Elige al menos un tipo de entrega. Puedes ofrecer recogida en persona, envío a domicilio o a punto de recogida." />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.tipoDeEntregaPermitida.envioAPuntoDeRecogida}
                onCheckedChange={() => handleDeliveryMethodChange("envioAPuntoDeRecogida")}
              />
              <span className="text-sm text-gray-800">Envío a Punto de Recogida</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.tipoDeEntregaPermitida.recogidaEnPersona}
                onCheckedChange={() => handleDeliveryMethodChange("recogidaEnPersona")}
              />
              <span className="text-sm text-gray-800">Recogida en Persona</span>
            </label>

            {formData.tipoDeEntregaPermitida.recogidaEnPersona && (
              <div className="ml-8">
                <p className="text-xs text-gray-500 mb-1">Ciudad para Recogida en Persona</p>
                <PickerButton
                  value={formData.ciudadRecogidaEnPersona}
                  placeholder="Seleccionar ciudad"
                  onClick={() => setShowCityInPersonSheet(true)}
                />
                <div className="mt-3 bg-emerald-50 rounded-lg p-3 flex gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-800 leading-relaxed">
                    <p className="font-semibold mb-1">Consejos para una Entrega Segura y Agradable</p>
                    <p>
                      • Prefiere siempre lugares públicos y bien iluminados.
                      <br />• Si es posible, acude acompañado o avisa a alguien de confianza.
                      <br />• Confía en tu intuición: si algo no te parece seguro, reprograma.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.tipoDeEntregaPermitida.envioADomicilio}
                onCheckedChange={() => handleDeliveryMethodChange("envioADomicilio")}
              />
              <span className="text-sm text-gray-800">Envío a Domicilio</span>
            </label>
          </div>

          {formData.tipoDeEntregaPermitida.envioADomicilio && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Ciudades para Envío a Domicilio</p>
              {allCities.map((ciudad) => {
                const selected = formData.ciudadesParaEnvioADomicilio.find((c) => c.ciudad === ciudad)
                return (
                  <div key={ciudad} className="flex items-center gap-2 mb-2">
                    <Checkbox checked={Boolean(selected)} onCheckedChange={() => toggleDeliveryCity(ciudad)} />
                    <span className="text-sm text-gray-800 min-w-[120px]">{ciudad}</span>
                    {selected && (
                      <Input
                        className="w-32"
                        placeholder="Precio (RD$)"
                        value={selected.precio}
                        onChange={(e) => setDeliveryCityPrice(ciudad, e.target.value)}
                        inputMode="numeric"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <Field label="Instrucciones para la entrega (opcional)">
            <Textarea
              placeholder="Ej: Solo entrego los fines de semana..."
              value={formData.instruccionesParaEntrega}
              onChange={(e) => handleInputChange("instruccionesParaEntrega", e.target.value)}
              rows={3}
            />
          </Field>
        </Section>

        {/* 8. Vista Previa */}
        {formData.titulo && formData.precio && (
          <Section title="Vista Previa">
            <div className="flex gap-3 border border-gray-200 rounded-lg p-3">
              {images[0] && <img src={images[0].url} alt="" className="w-20 h-20 object-cover rounded-md" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{formData.titulo}</p>
                <p className="text-brand-ui font-bold">RD${Number(formData.precio || 0).toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {formData.condicionGeneral && (
                    <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                      {conditionOptions.find((o) => o.value === formData.condicionGeneral)?.label}
                    </span>
                  )}
                  {formData.estadoGeneral && (
                    <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" /> {formData.estadoGeneral}/10
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Sheets */}
      <Sheet open={showCategorySheet} onOpenChange={setShowCategorySheet}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Seleccionar Categoría</SheetTitle>
          </SheetHeader>
          <div className="mt-2">
            {sellCategories.map((cat) => (
              <button
                key={cat.id}
                className="w-full flex items-center justify-between py-3 border-b last:border-b-0"
                onClick={() => {
                  handleInputChange("categoria", cat.name)
                  handleInputChange("subcategoria", "")
                  setShowCategorySheet(false)
                }}
              >
                <span>{cat.name}</span>
                {formData.categoria === cat.name && <Check className="h-4 w-4 text-brand-ui" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showSubcategorySheet} onOpenChange={setShowSubcategorySheet}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Seleccionar Subcategoría</SheetTitle>
          </SheetHeader>
          <div className="mt-2">
            {currentSubcategories.map((sub) => (
              <button
                key={sub.id}
                className="w-full flex items-center justify-between py-3 border-b last:border-b-0"
                onClick={() => {
                  handleInputChange("subcategoria", sub.name)
                  setShowSubcategorySheet(false)
                }}
              >
                <span>{sub.name}</span>
                {formData.subcategoria === sub.name && <Check className="h-4 w-4 text-brand-ui" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showBrandSheet} onOpenChange={setShowBrandSheet}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Todas las marcas</SheetTitle>
          </SheetHeader>
          <div className="mt-2">
            {sortedBrands.map((brand) => (
              <button
                key={brand}
                className="w-full flex items-center justify-between py-3 border-b last:border-b-0"
                onClick={() => {
                  if (brand === "Otra") {
                    setShowBrandInput(true)
                    setOtherBrand("")
                    handleInputChange("marca", "Otra")
                  } else {
                    setShowBrandInput(false)
                    handleInputChange("marca", brand)
                  }
                  setShowBrandSheet(false)
                  setBrandQuery("")
                }}
              >
                <span>{brand}</span>
                {formData.marca === brand && <Check className="h-4 w-4 text-brand-ui" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showSizeSheet} onOpenChange={setShowSizeSheet}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Seleccionar la talla</SheetTitle>
          </SheetHeader>
          <div className="mt-2">
            {sizeSheetIndex !== null &&
              formData.stock[sizeSheetIndex] &&
              getSortedSizes(formData.subcategoria).map((size) => (
                <button
                  key={size}
                  className="w-full flex items-center justify-between py-3 border-b last:border-b-0"
                  onClick={() => {
                    updateStockItem(sizeSheetIndex, "talla", size)
                    setShowSizeSheet(false)
                  }}
                >
                  <span>{size}</span>
                  {formData.stock[sizeSheetIndex].talla === size && <Check className="h-4 w-4 text-brand-ui" />}
                </button>
              ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showCityInPersonSheet} onOpenChange={setShowCityInPersonSheet}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Seleccionar ciudad</SheetTitle>
          </SheetHeader>
          <div className="mt-2">
            {allCities.map((city) => (
              <button
                key={city}
                className="w-full flex items-center justify-between py-3 border-b last:border-b-0"
                onClick={() => {
                  handleInputChange("ciudadRecogidaEnPersona", city)
                  setShowCityInPersonSheet(false)
                }}
              >
                <span>{city}</span>
                {formData.ciudadRecogidaEnPersona === city && <Check className="h-4 w-4 text-brand-ui" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white mt-2 p-4">
      <h2 className="font-semibold text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <p className="text-sm font-medium text-gray-700 mb-2">
        {label} {required && "*"}
      </p>
      <div className={error ? "[&_input]:border-red-500 [&_button]:border-red-500" : ""}>{children}</div>
    </div>
  )
}

function PickerButton({
  value,
  placeholder,
  disabled,
  onClick,
}: {
  value: string
  placeholder: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
    >
      <span className={value ? "text-gray-900" : "text-gray-400"}>{value || placeholder}</span>
      <ChevronDown className="h-4 w-4 text-gray-500" />
    </button>
  )
}

function ChipGroup({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[]
  value: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`px-3 py-1.5 rounded-full text-sm border ${
            value === opt.value ? "bg-brand-ui border-brand-ui text-white" : "bg-white border-gray-300 text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ConditionSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs font-medium" style={{ color: getConditionColor(value) }}>
          {value}/10 - {getConditionLabel(value)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full mb-2">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${(value / 10) * 100}%`, backgroundColor: getConditionColor(value) }}
        />
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 h-7 rounded text-xs ${value === n ? "bg-brand-ui text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function MeasurementField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <Field label={label}>
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" />
    </Field>
  )
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block">
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-gray-400">
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <span className="absolute z-20 left-0 top-6 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-700">
          {text}
        </span>
      )}
    </span>
  )
}
