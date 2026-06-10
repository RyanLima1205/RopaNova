import { logger } from '../utils/logger'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import { SearchHistoryItem, SavedSearch, AdvancedFilters, SortOption } from '../utils/searchUtils';

// Clés de stockage
const CACHE_KEYS = {
  SEARCH_HISTORY: 'search_history',
  SAVED_SEARCHES: 'saved_searches',
  SEARCH_CACHE: 'search_cache',
  FILTER_OPTIONS: 'filter_options',
};

// Interface pour le cache de recherche
interface SearchCacheItem<T = Product> {
  query: string;
  filters: AdvancedFilters;
  sortOption: SortOption;
  results: T[];
  timestamp: number;
  expiresAt: number;
}

// Service de cache pour les recherches
export class SearchCacheService {
  private static instance: SearchCacheService;
  private cache: Map<string, SearchCacheItem<any>> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): SearchCacheService {
    if (!SearchCacheService.instance) {
      SearchCacheService.instance = new SearchCacheService();
    }
    return SearchCacheService.instance;
  }

  // Générer une clé de cache basée sur les paramètres de recherche
  private generateCacheKey(query: string, filters: AdvancedFilters, sortOption: SortOption): string {
    const filterString = JSON.stringify(filters);
    const sortString = JSON.stringify(sortOption);
    return `${query}_${filterString}_${sortString}`;
  }

  // Vérifier si un résultat est en cache et valide
  public getCachedResults<T = Product>(
    query: string,
    filters: AdvancedFilters,
    sortOption: SortOption
  ): T[] | null {
    const cacheKey = this.generateCacheKey(query, filters, sortOption);
    const cachedItem = this.cache.get(cacheKey);

    if (!cachedItem) return null;

    // Vérifier si le cache a expiré
    if (Date.now() > cachedItem.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    logger.log('🎯 Résultats trouvés dans le cache:', cachedItem.results.length);
    return cachedItem.results;
  }

  // Mettre en cache les résultats de recherche
  public setCachedResults<T = Product>(
    query: string,
    filters: AdvancedFilters,
    sortOption: SortOption,
    results: T[]
  ): void {
    const cacheKey = this.generateCacheKey(query, filters, sortOption);
    const now = Date.now();

    this.cache.set(cacheKey, {
      query,
      filters,
      sortOption,
      results,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    });

    logger.log('💾 Résultats mis en cache:', results.length);
  }

  // Nettoyer le cache expiré
  public cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Vider tout le cache
  public clearCache(): void {
    this.cache.clear();
    logger.log('🗑️ Cache vidé');
  }

  // Gestion de l'historique de recherche
  public async addToSearchHistory(query: string, resultCount: number): Promise<void> {
    try {
      const history = await this.getSearchHistory();
      const newItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: Date.now(),
        resultCount,
      };

      // Éviter les doublons
      const filteredHistory = history.filter(item => item.query !== newItem.query);
      const updatedHistory = [newItem, ...filteredHistory].slice(0, 20); // Garder seulement 20 éléments

      await AsyncStorage.setItem(CACHE_KEYS.SEARCH_HISTORY, JSON.stringify(updatedHistory));
      logger.log('📝 Ajouté à l\'historique:', query);
    } catch (error) {
      logger.error('Erreur lors de l\'ajout à l\'historique:', error);
    }
  }

  public async getSearchHistory(): Promise<SearchHistoryItem[]> {
    try {
      const historyString = await AsyncStorage.getItem(CACHE_KEYS.SEARCH_HISTORY);
      return historyString ? JSON.parse(historyString) : [];
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  public async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.SEARCH_HISTORY);
      logger.log('🗑️ Historique de recherche vidé');
    } catch (error) {
      logger.error('Erreur lors du vidage de l\'historique:', error);
    }
  }

  // Gestion des recherches sauvegardées
  public async saveSearch(
    name: string,
    query: string,
    filters: AdvancedFilters,
    sortOption: SortOption
  ): Promise<void> {
    try {
      const savedSearches = await this.getSavedSearches();
      const newSearch: SavedSearch = {
        id: Date.now().toString(),
        name,
        query,
        filters,
        sortOption,
        createdAt: Date.now(),
      };

      const updatedSearches = [newSearch, ...savedSearches];
      await AsyncStorage.setItem(CACHE_KEYS.SAVED_SEARCHES, JSON.stringify(updatedSearches));
      logger.log('💾 Recherche sauvegardée:', name);
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde:', error);
    }
  }

  public async getSavedSearches(): Promise<SavedSearch[]> {
    try {
      const searchesString = await AsyncStorage.getItem(CACHE_KEYS.SAVED_SEARCHES);
      return searchesString ? JSON.parse(searchesString) : [];
    } catch (error) {
      logger.error('Erreur lors de la récupération des recherches sauvegardées:', error);
      return [];
    }
  }

  public async deleteSavedSearch(searchId: string): Promise<void> {
    try {
      const savedSearches = await this.getSavedSearches();
      const updatedSearches = savedSearches.filter(search => search.id !== searchId);
      await AsyncStorage.setItem(CACHE_KEYS.SAVED_SEARCHES, JSON.stringify(updatedSearches));
      logger.log('🗑️ Recherche supprimée:', searchId);
    } catch (error) {
      logger.error('Erreur lors de la suppression:', error);
    }
  }

  // Mise en cache des options de filtres
  public async cacheFilterOptions(options: any): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.FILTER_OPTIONS, JSON.stringify(options));
      logger.log('💾 Options de filtres mises en cache');
    } catch (error) {
      logger.error('Erreur lors de la mise en cache des options:', error);
    }
  }

  public async getCachedFilterOptions(): Promise<any | null> {
    try {
      const optionsString = await AsyncStorage.getItem(CACHE_KEYS.FILTER_OPTIONS);
      return optionsString ? JSON.parse(optionsString) : null;
    } catch (error) {
      logger.error('Erreur lors de la récupération des options:', error);
      return null;
    }
  }

  // Obtenir les statistiques du cache
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Instance singleton
export const searchCacheService = SearchCacheService.getInstance();
