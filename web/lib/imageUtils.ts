export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false

  const trimmed = url.trim()

  if (trimmed === "" || trimmed === "undefined" || trimmed === "null") return false
  if (trimmed.startsWith("file://")) return false
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return true
  if (trimmed.includes("firebasestorage.googleapis.com")) return true

  return false
}

export const filterValidImages = (images: string[]): string[] => {
  if (!Array.isArray(images)) return []
  return images.filter((img) => isValidImageUrl(img))
}

export const getFirstValidImage = (images: string[]): string | null => {
  const validImages = filterValidImages(images)
  return validImages.length > 0 ? validImages[0] : null
}

export const getPlaceholderImage = (width = 400, height = 400, text = "Sin Imagen"): string => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `)}`
}

export const isPlaceholderImage = (url: string): boolean => {
  return url.includes("via.placeholder.com") || url.includes("placeholder") || url.startsWith("data:image/svg+xml")
}

export const cleanProductImages = (product: any): string[] => {
  if (!product) return []

  const imageFields = ["images", "imagenes", "imageUrls", "photos"]
  let allImages: string[] = []

  for (const field of imageFields) {
    if (product[field] && Array.isArray(product[field])) {
      allImages = [...allImages, ...product[field]]
    }
  }

  const validImages = filterValidImages(allImages)

  if (validImages.length === 0) {
    return [getPlaceholderImage(400, 400, product.title || product.titulo || "Sin Imagen")]
  }

  return validImages
}

/** URL de avatar desde un documento Firestore `users` (cadena vacía si no hay URL utilizable). */
export const getUserDocumentAvatarUrl = (data: Record<string, unknown> | null | undefined): string => {
  if (!data) return ""
  const candidates = [data.avatar, data.profileImage, data.photoURL]
  for (const c of candidates) {
    const s = String(c ?? "").trim()
    if (isValidImageUrl(s)) return s
  }
  return ""
}

export const getUserAvatar = (user: any): string => {
  if (!user) {
    return getPlaceholderImage(100, 100, "Usuario")
  }

  const avatar = user.avatar || user.profileImage || user.photoURL

  if (isValidImageUrl(avatar)) {
    return avatar
  }

  return getPlaceholderImage(100, 100, user.name || user.displayName || "Usuario")
}

export const getUserCover = (user: any): string => {
  if (!user) return getPlaceholderImage(400, 200, "Portada")

  const cover = user.coverImage || user.coverPhoto || user.banner

  if (isValidImageUrl(cover)) {
    return cover
  }

  return getPlaceholderImage(400, 200, "Portada")
}
