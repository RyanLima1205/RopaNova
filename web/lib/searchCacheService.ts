import { logger } from "./logger"
import { Product } from "./types"
import { SearchHistoryItem, AdvancedFilters, SortOption } from "./searchUtils"

const CACHE_KEYS = {
  SEARCH_HISTORY: "search_history",
  FILTER_OPTIONS: "filter_options",
}

interface SearchCacheItem<T = Product> {
  query: string
  filters: AdvancedFilters
  sortOption: SortOption
  results: T[]
  timestamp: number
  expiresAt: number
}

function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // almacenamiento lleno o no disponible — ignorar
  }
}

/** Mismo diseño que mobile-app (caché en memoria + historial persistente), sustituyendo AsyncStorage por localStorage. */
export class SearchCacheService {
  private static instance: SearchCacheService
  private cache: Map<string, SearchCacheItem<any>> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  public static getInstance(): SearchCacheService {
    if (!SearchCacheService.instance) {
      SearchCacheService.instance = new SearchCacheService()
    }
    return SearchCacheService.instance
  }

  private generateCacheKey(query: string, filters: AdvancedFilters, sortOption: SortOption): string {
    return `${query}_${JSON.stringify(filters)}_${JSON.stringify(sortOption)}`
  }

  public getCachedResults<T = Product>(query: string, filters: AdvancedFilters, sortOption: SortOption): T[] | null {
    const cacheKey = this.generateCacheKey(query, filters, sortOption)
    const cachedItem = this.cache.get(cacheKey)

    if (!cachedItem) return null

    if (Date.now() > cachedItem.expiresAt) {
      this.cache.delete(cacheKey)
      return null
    }

    return cachedItem.results
  }

  public setCachedResults<T = Product>(query: string, filters: AdvancedFilters, sortOption: SortOption, results: T[]): void {
    const cacheKey = this.generateCacheKey(query, filters, sortOption)
    const now = Date.now()

    this.cache.set(cacheKey, {
      query,
      filters,
      sortOption,
      results,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    })
  }

  public cleanExpiredCache(): void {
    const now = Date.now()
    this.cache.forEach((item, key) => {
      if (now > item.expiresAt) this.cache.delete(key)
    })
  }

  public clearCache(): void {
    this.cache.clear()
  }

  public async addToSearchHistory(query: string, resultCount: number): Promise<void> {
    try {
      const history = await this.getSearchHistory()
      const newItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: Date.now(),
        resultCount,
      }

      const filteredHistory = history.filter((item) => item.query !== newItem.query)
      const updatedHistory = [newItem, ...filteredHistory].slice(0, 20)

      writeLocalStorage(CACHE_KEYS.SEARCH_HISTORY, JSON.stringify(updatedHistory))
    } catch (error) {
      logger.error("Error al añadir al historial:", error)
    }
  }

  public async getSearchHistory(): Promise<SearchHistoryItem[]> {
    try {
      const historyString = readLocalStorage(CACHE_KEYS.SEARCH_HISTORY)
      return historyString ? JSON.parse(historyString) : []
    } catch (error) {
      logger.error("Error al obtener el historial:", error)
      return []
    }
  }

  public async clearSearchHistory(): Promise<void> {
    if (typeof window === "undefined") return
    try {
      window.localStorage.removeItem(CACHE_KEYS.SEARCH_HISTORY)
    } catch (error) {
      logger.error("Error al vaciar el historial:", error)
    }
  }

  public async cacheFilterOptions(options: any): Promise<void> {
    try {
      writeLocalStorage(CACHE_KEYS.FILTER_OPTIONS, JSON.stringify(options))
    } catch (error) {
      logger.error("Error al cachear las opciones de filtro:", error)
    }
  }

  public async getCachedFilterOptions(): Promise<any | null> {
    try {
      const optionsString = readLocalStorage(CACHE_KEYS.FILTER_OPTIONS)
      return optionsString ? JSON.parse(optionsString) : null
    } catch (error) {
      logger.error("Error al obtener las opciones cacheadas:", error)
      return null
    }
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return { size: this.cache.size, keys: Array.from(this.cache.keys()) }
  }
}

export const searchCacheService = SearchCacheService.getInstance()
