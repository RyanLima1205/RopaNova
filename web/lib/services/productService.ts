import { Product } from "../types"
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocsFromServer,
  serverTimestamp,
  writeBatch,
  increment,
  runTransaction,
} from "firebase/firestore"
import { app } from "../firebaseConfig"
import { logger } from "../logger"
import { getReviewsBySellerId, computeSellerReviewStats } from "./reviewService"

/** Mismos umbrales que mobile-app ProductDetailScreen.tsx (getConditionLabel). */
function conditionLabel(value: number): string {
  if (value >= 9) return "Excelente"
  if (value >= 7) return "Bueno"
  if (value >= 5) return "Regular"
  return "Malo"
}

/** Verifica si el usuario ya marcó este producto como favorito (doc id determinístico `${userId}_${productId}`). */
export async function checkIfFavorited(productId: string, userId: string): Promise<boolean> {
  if (!userId || userId === "guest") return false
  try {
    const db = getFirestore(app)
    const favSnap = await getDoc(doc(db, "favorites", `${userId}_${productId}`))
    return favSnap.exists()
  } catch {
    return false
  }
}

export async function addToFavorites(productId: string, userId: string, product: Product): Promise<void> {
  const db = getFirestore(app)
  const favoriteData = {
    userId,
    productId,
    productTitle: product.title,
    productPrice: product.price,
    productImage: product.images?.[0] || product.image,
    productBrand: product.brand,
    createdAt: serverTimestamp(),
    addedAt: serverTimestamp(),
  }
  const batch = writeBatch(db)
  batch.set(doc(db, "favorites", `${userId}_${productId}`), favoriteData)
  batch.update(doc(db, "products", productId), { favoriteCount: increment(1) })
  await batch.commit()
}

/**
 * Transacción: solo decrementa favoriteCount si prev > 0 (evita violar la regla
 * favoriteCount >= 0 de firestore.rules cuando los datos ya estaban desincronizados).
 */
export async function removeFromFavorites(productId: string, userId: string): Promise<void> {
  const db = getFirestore(app)
  const favRef = doc(db, "favorites", `${userId}_${productId}`)
  const productRef = doc(db, "products", productId)
  await runTransaction(db, async (transaction) => {
    const favSnap = await transaction.get(favRef)
    const productSnap = await transaction.get(productRef)
    if (!favSnap.exists()) return
    transaction.delete(favRef)
    if (!productSnap.exists()) return
    const prev = productSnap.data()?.favoriteCount
    const prevNum = typeof prev === "number" ? prev : 0
    if (prevNum > 0) {
      transaction.update(productRef, { favoriteCount: increment(-1) })
    }
  })
}

/** Subtítulo mostrado bajo «No se pudieron cargar los productos» (sin detalles técnicos). */
export function formatProductsLoadError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? String((error as { code: string }).code) : ""
  const isOffline =
    code === "unavailable" ||
    code === "failed-precondition" ||
    (error instanceof Error && /offline|network|unavailable/i.test(error.message))

  if (isOffline) {
    return "No hay conexión a internet en este momento."
  }
  return "No fue posible conectar con el servidor."
}

export async function getProducts(): Promise<Product[]> {
  try {
    const db = getFirestore(app)
    const productsRef = collection(db, "products")
    /** getDocsFromServer: sin caché silenciosa fuera de línea. */
    const snapshot = await getDocsFromServer(productsRef)

    const products: Product[] = []

    for (const docSnap of snapshot.docs) {
      const productData = docSnap.data()

      if (!productData) {
        logger.warn("⚠️ Datos de producto vacíos para:", docSnap.id)
        continue
      }

      const product: Product = {
        id: docSnap.id,
        title: productData.titulo || productData.title || "Sin título",
        price: productData.precio || productData.price || 0,
        originalPrice: productData.precioOriginal || productData.originalPrice,
        image: productData.images?.[0] || productData.image || "",
        images: productData.images || [productData.image || ""],
        condition: productData.condicionGeneral || productData.condicion || productData.condition || "Usado",
        location: productData.ubicacion || productData.location || "",
        likes: typeof productData.favoriteCount === "number" ? productData.favoriteCount : productData.likes || 0,
        brand: productData.marca || productData.brand || "",
        category: productData.categoria || productData.category || "",
        subcategory: productData.subcategoria || productData.subcategory || "",
        description: productData.descripcion || productData.description || "",
        createdAt: productData.createdAt?.toDate() || new Date(),
        views: productData.views || 0,
        isLiked: false,

        stock: productData.stock || [],
        sizes: productData.stock?.map((s: any) => s.talla).filter(Boolean) || [],

        color: productData.color || [],
        colors: productData.color || [],

        material: productData.material || "",
        estadoGeneral: productData.estadoGeneral || 0,
        estadoTelaMaterial: productData.estadoTelaMaterial || 0,
        notasSobreElEstado: productData.notasSobreElEstado || "",
        defectosEspecificos: productData.defectosEspecificos || "",
        autenticidad: productData.autenticidad || "",
        measurements: productData.measurements || {
          chest: "",
          waist: "",
          length: "",
          shoulders: "",
          hips: "",
          inseam: "",
        },
        tipoDeEntregaPermitida: productData.tipoDeEntregaPermitida || {
          envioAPuntoDeRecogida: false,
          recogidaEnPersona: false,
          envioADomicilio: false,
        },
        ciudadRecogidaEnPersona: productData.ciudadRecogidaEnPersona || "",
        ciudadesParaEnvioADomicilio: productData.ciudadesParaEnvioADomicilio || [],
        instruccionesParaEntrega: productData.instruccionesParaEntrega || "",
        shippingAvailable: productData.shippingAvailable || false,
        shippingPrice: productData.shippingPrice || "",
        province: productData.province || "",
        city: productData.city || "",
        accountType: productData.accountType || "",

        seller: {
          id: productData.userId || "",
          name: productData.vendedor?.name || "Vendedor",
          lastname: productData.vendedor?.lastname || "",
          storeName: productData.vendedor?.storeName || "",
          username: productData.vendedor?.username || "@vendedor",
          avatar: productData.vendedor?.avatar || "",
          rating: productData.vendedor?.rating || 4.5,
          reviewCount: productData.vendedor?.reviewCount || 0,
          totalSales: productData.vendedor?.totalSales || 0,
          responseRate: productData.vendedor?.responseRate || 90,
          averageResponseTime: productData.vendedor?.averageResponseTime || "2 horas",
          memberSince: productData.vendedor?.memberSince || "2024",
          location: productData.vendedor?.location || productData.ubicacion || "",
          verified: productData.vendedor?.verified || false,
          badges: productData.vendedor?.badges || [],
          bio: productData.vendedor?.bio || "",
          stats: productData.vendedor?.stats || {
            thisMonth: { sales: 0, newListings: 0, responseTime: "2 horas" },
          },
          province: productData.vendedor?.province || "",
          city: productData.vendedor?.city || "",
          distance: productData.vendedor?.distance || undefined,
          accountType: productData.vendedor?.accountType || "",
        },
      }

      products.push(product)
    }

    return products
  } catch (error) {
    logger.error("❌ Error al obtener los productos:", error)
    throw error
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    if (!id || typeof id !== "string" || id.trim() === "") {
      logger.error("❌ ID de producto inválido:", id)
      return null
    }

    const db = getFirestore(app)
    const productDoc = await getDoc(doc(db, "products", id))

    if (!productDoc.exists()) {
      return null
    }

    const productData = productDoc.data()

    let userProvince = ""
    let userCity = ""
    let userAccountType = ""
    let sellerData: Record<string, any> | null = null

    if (productData.userId) {
      try {
        const userDoc = await getDoc(doc(db, "users", productData.userId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          userProvince = userData.province || ""
          userCity = userData.city || ""
          userAccountType = userData.accountType || ""
          sellerData = userData
        }
      } catch (error) {
        logger.log("Error al obtener los datos del usuario:", error)
      }
    }

    // Rating/reviewCount reales via reviewService — el resto de las stats del vendedor
    // (totalSales, responseRate, averageResponseTime) no tienen fuente de datos real
    // todavía en ninguna de las dos apps, así que se dejan como estaban.
    let sellerRatingStats = { averageRating: 0, reviewCount: 0 }
    if (productData.userId) {
      try {
        const sellerReviews = await getReviewsBySellerId(productData.userId)
        const stats = computeSellerReviewStats(sellerReviews)
        sellerRatingStats = { averageRating: stats.averageRating, reviewCount: stats.reviewCount }
      } catch {
        // deja rating/reviewCount en 0 si falla
      }
    }

    const product: Product = {
      id: productDoc.id,
      title: productData.titulo || productData.title || "",
      price: Number(productData.precio) || Number(productData.price) || 0,
      condition: productData.condicionGeneral || productData.condition || "",
      location: productData.location || "",
      brand: productData.marca || productData.brand || "",
      image: productData.images?.[0] || productData.image || "",
      images: productData.images || [],
      description: productData.descripcion || productData.description || "",
      category: productData.categoria || productData.category || "",
      subcategory: productData.subcategoria || productData.subcategory || "",
      likes: typeof productData.favoriteCount === "number" ? productData.favoriteCount : productData.likes || 0,
      views: 0,
      isLiked: false,
      postedDate: (() => {
        try {
          if (productData.createdAt?.toDate) {
            const date = new Date(productData.createdAt.toDate())
            if (date && !isNaN(date.getTime())) return date.getFullYear().toString()
          }
          return ""
        } catch {
          return ""
        }
      })(),

      stock: productData.stock || [],
      sizes: productData.stock?.map((s: any) => s.talla).filter(Boolean) || [],

      color: productData.color || [],
      colors: productData.color || [],

      material: productData.material || "",
      estadoGeneral: productData.estadoGeneral || 0,
      estadoTelaMaterial: productData.estadoTelaMaterial || 0,
      notasSobreElEstado: productData.notasSobreElEstado || "",
      defectosEspecificos: productData.defectosEspecificos || "",
      autenticidad: productData.autenticidad || "",
      measurements: productData.measurements || {
        chest: "",
        waist: "",
        length: "",
        shoulders: "",
        hips: "",
        inseam: "",
      },
      tipoDeEntregaPermitida: productData.tipoDeEntregaPermitida || {
        envioAPuntoDeRecogida: false,
        recogidaEnPersona: false,
        envioADomicilio: false,
      },
      ciudadRecogidaEnPersona: productData.ciudadRecogidaEnPersona || "",
      ciudadesParaEnvioADomicilio: productData.ciudadesParaEnvioADomicilio || [],
      instruccionesParaEntrega: productData.instruccionesParaEntrega || "",
      shippingAvailable: productData.shippingAvailable || false,
      shippingPrice: productData.shippingPrice || "",
      createdAt: (() => {
        try {
          if (productData.createdAt?.toDate) return productData.createdAt.toDate()
          return new Date()
        } catch {
          return new Date()
        }
      })(),
      province: userProvince,
      city: userCity,
      accountType: userAccountType,

      seller: sellerData
        ? {
            id: productData.userId || "",
            name: sellerData.name || "Vendedor",
            lastname: sellerData.lastname || "",
            storeName: sellerData.storeName || "",
            username: sellerData.username || "@vendedor",
            avatar: sellerData.avatar || "",
            rating: sellerRatingStats.averageRating,
            reviewCount: sellerRatingStats.reviewCount,
            totalSales: sellerData.totalSales || 0,
            responseRate: sellerData.responseRate || 90,
            averageResponseTime: sellerData.averageResponseTime || "2 horas",
            memberSince: (() => {
              if (sellerData?.createdAt) {
                try {
                  if (sellerData.createdAt?.toDate) {
                    const date = new Date(sellerData.createdAt.toDate())
                    if (date && !isNaN(date.getTime())) return date.getFullYear().toString()
                  }
                  if (sellerData.createdAt instanceof Date) return sellerData.createdAt.getFullYear().toString()
                  if (typeof sellerData.createdAt === "string") {
                    const date = new Date(sellerData.createdAt)
                    if (date && !isNaN(date.getTime())) return date.getFullYear().toString()
                  }
                  if (typeof sellerData.createdAt === "number") {
                    const date = new Date(sellerData.createdAt)
                    if (date && !isNaN(date.getTime())) return date.getFullYear().toString()
                  }
                } catch {
                  // conservar valor por defecto
                }
              }
              return "2024"
            })(),
            location: productData.location || "",
            verified: sellerData.verified || false,
            badges: sellerData.badges || [],
            bio: sellerData.bio || "",
            stats: sellerData.stats || { thisMonth: { sales: 0, newListings: 0, responseTime: "" } },
            province: sellerData.province || "",
            city: sellerData.city || "",
            distance: sellerData.distance || undefined,
            accountType: sellerData.accountType || "",
            geoPoint: sellerData.geoPoint
              ? { latitude: sellerData.geoPoint.latitude, longitude: sellerData.geoPoint.longitude }
              : undefined,
          }
        : {
            id: productData.userId || "",
            name: "Vendedor",
            lastname: "",
            storeName: "",
            username: "@vendedor",
            avatar: "",
            rating: sellerRatingStats.averageRating,
            reviewCount: sellerRatingStats.reviewCount,
            totalSales: 0,
            responseRate: 90,
            averageResponseTime: "2 horas",
            memberSince: "2024",
            location: productData.location || "",
            verified: false,
            badges: [],
            bio: "",
            stats: { thisMonth: { sales: 0, newListings: 0, responseTime: "" } },
            province: "",
            city: "",
            distance: undefined,
            accountType: "",
          },
      conditionDetails: {
        overall: productData.condicionGeneral || productData.condition || "Usado",
        // estadoGeneral es 0-10 en Firestore; ConditionDetailsCard espera 0-5 (estrellas).
        rating: typeof productData.estadoGeneral === "number" ? productData.estadoGeneral / 2 : 0,
        details: (() => {
          const rows: { aspect: string; condition: string; description: string }[] = []
          if (typeof productData.estadoTelaMaterial === "number" && productData.estadoTelaMaterial > 0) {
            rows.push({
              aspect: "Tela / Material",
              condition: conditionLabel(productData.estadoTelaMaterial),
              description: productData.notasSobreElEstado || "Evaluación de la tela y el material del producto.",
            })
          }
          if (productData.autenticidad) {
            rows.push({
              aspect: "Autenticidad",
              condition: String(productData.autenticidad),
              description: "Declarado por el vendedor al momento de publicar.",
            })
          }
          rows.push({
            aspect: "Defectos específicos",
            condition: productData.defectosEspecificos ? "Reportados" : "Ninguno reportado",
            description: productData.defectosEspecificos || "El vendedor no reportó defectos adicionales.",
          })
          return rows
        })(),
        photos: productData.images || [],
      },
    }

    return product
  } catch (error) {
    logger.error("❌ Error al obtener el producto:", error)
    return null
  }
}
