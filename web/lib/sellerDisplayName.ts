const AVATAR_PLACEHOLDER = "https://via.placeholder.com/80x80/4ade80/ffffff?text=V"

export const handleWithoutAt = (username?: string): string => (username || "").trim().replace(/^@+/, "")

export const atHandle = (username?: string): string => {
  const h = handleWithoutAt(username)
  return h ? `@${h}` : ""
}

export interface SellerPublicProfile {
  /** Para "¿Cómo fue tu experiencia con …?" */
  experienceLabel: string
  /** Nombre principal en la burbuja del vendedor */
  chipName: string
  /** @username bajo el nombre de tienda (virtual/física) */
  handleLine: string
  avatar: string
}

/**
 * Tienda virtual/física → storeName ; privado → @username.
 * Alineado con SellerReviewsScreen / ChatScreen del mobile.
 */
export function sellerPublicProfileFromUserData(data: Record<string, unknown>): SellerPublicProfile {
  const accountType = String(data.accountType || "")
  const username = String(data.username || "")
  const storeName = String(data.storeName || "").trim()
  const fullName = `${String(data.name || "")} ${String(data.lastname || "")}`.trim()
  const uh = atHandle(username)

  let experienceLabel = "este vendedor"
  let chipName = "Vendedor"
  let handleLine = ""

  if (accountType === "privado") {
    experienceLabel = uh || fullName || "este vendedor"
    chipName = uh || fullName || "Vendedor"
  } else if (accountType === "virtual" || accountType === "fisica") {
    if (storeName) {
      experienceLabel = storeName
      chipName = storeName
      handleLine = uh
    } else {
      experienceLabel = fullName || uh || "este vendedor"
      chipName = fullName || uh || "Vendedor"
      handleLine = fullName && uh ? uh : ""
    }
  } else {
    experienceLabel = storeName || fullName || uh || "este vendedor"
    chipName = storeName || fullName || uh || "Vendedor"
    handleLine = storeName ? uh : fullName && uh ? uh : ""
  }

  const avatarRaw = data.avatar != null ? String(data.avatar).trim() : ""
  return {
    experienceLabel,
    chipName,
    handleLine,
    avatar: avatarRaw || AVATAR_PLACEHOLDER,
  }
}

export const EMPTY_SELLER_PUBLIC_PROFILE: SellerPublicProfile = {
  experienceLabel: "este vendedor",
  chipName: "Vendedor",
  handleLine: "",
  avatar: AVATAR_PLACEHOLDER,
}
