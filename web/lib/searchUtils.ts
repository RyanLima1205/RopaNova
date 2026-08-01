import { Product } from "./types"

export type SortOption = {
  id: string
  label: string
  key: keyof Product
  direction: "asc" | "desc"
}

export type AdvancedFilters = {
  sizes: string[]
  colors: string[]
  brands: string[]
  locations: string[]
  priceRange: { min: number; max: number }
  conditions: string[]
  mainCategory?: string
  subCategory?: string
  distance?: {
    enabled: boolean
    maxDistance: number
    userLocation?: { latitude: number; longitude: number }
  }
}

export type SearchHistoryItem = {
  id: string
  query: string
  timestamp: number
  resultCount: number
}

export const SORT_OPTIONS: SortOption[] = [
  { id: "relevance", label: "Relevancia", key: "title", direction: "asc" },
  { id: "price-asc", label: "Precio: Menor a Mayor", key: "price", direction: "asc" },
  { id: "price-desc", label: "Precio: Mayor a Menor", key: "price", direction: "desc" },
  { id: "date-desc", label: "Más Recientes", key: "createdAt", direction: "desc" },
  { id: "date-asc", label: "Más Antiguos", key: "createdAt", direction: "asc" },
  { id: "popularity", label: "Más Populares", key: "views", direction: "desc" },
]

/** Normaliza plurales/singulares básicos en español (sin acentos). */
const normalizeWord = (word: string): string => {
  if (!word || typeof word !== "string") return ""

  const normalized = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  const pluralRules = [
    { from: /s$/, to: "" },
    { from: /es$/, to: "" },
    { from: /ces$/, to: "z" },
    { from: /ones$/, to: "ón" },
    { from: /anes$/, to: "án" },
  ]

  let result = normalized.toLowerCase()
  for (const rule of pluralRules) {
    if (rule.from.test(result)) {
      result = result.replace(rule.from, rule.to)
      break
    }
  }
  return result
}

const levenshteinDistance = (str1: string, str2: string): number => {
  if (!str1 || !str2) return Infinity
  if (typeof str1 !== "string" || typeof str2 !== "string") return Infinity

  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator)
    }
  }

  return matrix[str2.length][str1.length]
}

/** Búsqueda inteligente: exacta → por término → plural/singular → difusa (tolerante a errores). */
export const intelligentSearch = (products: Product[], query: string): Product[] => {
  if (!query.trim()) return products

  const searchTerms = query.toLowerCase().split(" ").filter((term) => term.length > 0)
  const normalizedSearchTerms = searchTerms.map(normalizeWord)

  return products.filter((product) => {
    const searchableText = [
      product.title || "",
      product.brand || "",
      product.description || "",
      product.category || "",
      product.subcategory || "",
    ]
      .join(" ")
      .toLowerCase()

    if (searchableText.includes(query.toLowerCase())) return true

    const matchesAllTerms = searchTerms.every((term) => searchableText.includes(term))
    if (matchesAllTerms) return true

    const normalizedSearchableText = searchableText.split(" ").map(normalizeWord).join(" ")
    const matchesNormalized = normalizedSearchTerms.every((term) => normalizedSearchableText.includes(term))
    if (matchesNormalized) return true

    const fuzzyMatch = searchTerms.some((term) => {
      if (!term || term.length < 2) return false
      return searchableText.split(" ").some((word) => {
        if (!word) return false
        const normalizedWord = normalizeWord(word)
        const normalizedTerm = normalizeWord(term)
        return (
          word.includes(term) ||
          normalizedWord.includes(normalizedTerm) ||
          levenshteinDistance(word, term) <= 2 ||
          levenshteinDistance(normalizedWord, normalizedTerm) <= 1
        )
      })
    })

    return fuzzyMatch
  })
}

export const sortProducts = (products: Product[], sortOption: SortOption): Product[] => {
  return [...products].sort((a, b) => {
    const aValue = a[sortOption.key]
    const bValue = b[sortOption.key]

    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return 1
    if (bValue === undefined) return -1

    let comparison = 0
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime()
    }

    return sortOption.direction === "asc" ? comparison : -comparison
  })
}

export const applyAdvancedFilters = (products: Product[], filters: AdvancedFilters): Product[] => {
  return products.filter((product) => {
    if (filters.sizes.length > 0) {
      const productSizes = product.sizes || []
      if (!filters.sizes.some((size) => productSizes.includes(size))) return false
    }

    if (filters.colors.length > 0) {
      const productColors = product.colors || []
      if (!filters.colors.some((color) => productColors.includes(color))) return false
    }

    if (filters.brands.length > 0) {
      if (!product.brand || !filters.brands.includes(product.brand)) return false
    }

    if (filters.locations.length > 0) {
      if (!product.location || !filters.locations.includes(product.location)) return false
    }

    if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) return false

    if (filters.conditions.length > 0) {
      if (!product.condition || !filters.conditions.includes(product.condition)) return false
    }

    if (filters.mainCategory) {
      if (!product.category || product.category !== filters.mainCategory) return false
    }

    if (filters.subCategory) {
      if (!product.subcategory || product.subcategory !== filters.subCategory) return false
    }

    // TODO(geolocation): mobile filters by distance here via expo-location (getCurrentLocation +
    // isProductWithinDistance from locationUtils.ts). No web equivalent yet (navigator.geolocation
    // permission flow not built) — distance filtering is a no-op on web for now.

    return true
  })
}

const PREDEFINED_BRANDS = [
  "Zara", "Nike", "Adidas", "Mango", "H&M", "Pull&Bear", "Bershka", "Stradivarius",
  "Levi's", "Puma", "Reebok", "Under Armour", "Tommy Hilfiger", "Guess", "Lacoste",
  "Gucci", "Louis Vuitton", "Prada", "Chanel", "Hermès", "Forever 21", "Gap",
  "Uniqlo", "Calvin Klein", "Ralph Lauren", "Versace", "Fendi", "Balenciaga",
  "Givenchy", "Burberry", "Dolce & Gabbana", "Michael Kors", "Coach", "Kate Spade",
  "Sin marca",
]

export const extractFilterOptions = (products: Product[]) => {
  const sizes = new Set<string>()
  const colors = new Set<string>()
  const brands = new Set<string>()
  const locations = new Set<string>()
  const conditions = new Set<string>()

  PREDEFINED_BRANDS.forEach((brand) => brands.add(brand))

  products.forEach((product) => {
    if (product.sizes) product.sizes.forEach((size) => sizes.add(size))
    if (product.colors || product.color) {
      const productColors = product.colors || product.color || []
      productColors.forEach((color) => colors.add(color))
    }
    if (product.brand && product.brand !== "Otra") brands.add(product.brand)
    if (product.location) locations.add(product.location)
    if (product.condition) conditions.add(product.condition)
  })

  return {
    sizes: Array.from(sizes).sort(),
    colors: Array.from(colors).sort(),
    brands: Array.from(brands).sort((a, b) => {
      if (a === "Sin marca") return 1
      if (b === "Sin marca") return -1
      return a.localeCompare(b)
    }),
    locations: Array.from(locations).sort(),
    conditions: Array.from(conditions).sort(),
  }
}

export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
