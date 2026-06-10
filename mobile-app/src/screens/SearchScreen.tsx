import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Modal,
} from 'react-native'
import Slider from '@react-native-community/slider'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { ProductCard } from '../components/ProductCard'
import { getProducts, formatProductsLoadError } from '../services/productService'
import { Product, Category, Subcategory } from '../types'

// Type pour les produits Firestore (compatible avec ProductCard)
interface FirestoreProduct {
  id: string;
  titulo: string;
  precio: string;
  condicionGeneral: string;
  images: string[];
  createdAt: any;
  categoria: string;
  subcategoria: string;
  marca: string;
  color: string[];
  talla: string[];
  status: string;
  userId: string;
  isLiked?: boolean;
  seller?: {
    id: string;
    name: string;
    storeName?: string;
    accountType: string;
    avatar?: string;
    verified?: boolean;
  };
}
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { app } from '../firebaseConfig'
import { cleanProductImages } from '../utils/imageUtils'
import { RootStackParamList } from '../../App'
import { StackNavigationProp } from '@react-navigation/stack'
import { categories } from '../data/categories'
import { RecentlyViewedList } from '../components/RecentlyViewedList'
import { SearchSuggestions } from '../components/SearchSuggestions'
import { AdvancedFilters } from '../components/AdvancedFilters'
import {
  intelligentSearch,
  sortProducts,
  applyAdvancedFilters,
  extractFilterOptions,
  debounce,
  generateSearchSuggestions,
  SORT_OPTIONS,
  SortOption,
  AdvancedFilters as AdvancedFiltersType,
} from '../utils/searchUtils'
import { searchCacheService } from '../services/searchCacheService'
import { useFavoriteProductIds } from '../hooks/useFavoriteProductIds'

import { logger } from '../utils/logger'
type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>

const priceRanges = [
  { id: '1', label: 'Todo', min: 0, max: 999999 },
  { id: '2', label: 'RD$ 0 - 1,000', min: 0, max: 1000 },
  { id: '3', label: 'RD$ 1,000 - 5,000', min: 1000, max: 5000 },
  { id: '4', label: 'RD$ 5,000+', min: 5000, max: 999999 },
]

const conditions = [
  { id: '1', name: 'Todo' },
  { id: '2', name: 'Nuevo' },
  { id: '3', name: 'Como nuevo' },
  { id: '4', name: 'Muy bueno' },
  { id: '5', name: 'Bueno' },
]

// Convertit un FirestoreProduct vers le format Product attendu par les utilitaires de recherche
const firestoreProductToProduct = (fp: FirestoreProduct): Product => ({
  id: fp.id,
  title: fp.titulo,
  price: parseFloat(fp.precio) || 0,
  image: fp.images[0] || '',
  location: '',
  likes: 0,
  condition: fp.condicionGeneral,
  images: fp.images,
  createdAt: fp.createdAt,
  category: fp.categoria,
  subcategory: fp.subcategoria,
  brand: fp.marca,
  color: fp.color,
  sizes: fp.talla,
  seller: fp.seller as Product['seller'],
})

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>()
  const { favoriteProductIds } = useFavoriteProductIds()

  // États de base
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<FirestoreProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<FirestoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  // const [refreshing, setRefreshing] = useState(false) // DÉSACTIVÉ
  // const [refreshRotation] = useState(new Animated.Value(0)) // DÉSACTIVÉ
  
  // États pour la recherche intelligente
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // États pour les filtres
  const [selectedCategory, setSelectedCategory] = useState('1')
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(25000)
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // États pour le tri et la pagination
  const [selectedSortOption, setSelectedSortOption] = useState<SortOption>(SORT_OPTIONS[0])
  const [showSortModal, setShowSortModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreData, setHasMoreData] = useState(false) // Commence à false
  const [loadingMore, setLoadingMore] = useState(false)
  const [isEndOfList, setIsEndOfList] = useState(false) // Nouvel état pour la fin
  
  // États pour le rafraîchissement
  const [refreshing, setRefreshing] = useState(false)
  const [refreshRotation] = useState(new Animated.Value(0))
  
  // États pour les filtres avancés
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersType>({
    sizes: [],
    colors: [],
    brands: [],
    locations: [],
    priceRange: { min: 0, max: 50000 },
    conditions: [],
    mainCategory: undefined,
    subCategory: undefined,
    distance: {
      enabled: false,
      maxDistance: 10,
    },
  })
  const [availableFilterOptions, setAvailableFilterOptions] = useState<ReturnType<typeof extractFilterOptions>>({
    sizes: [],
    colors: [],
    brands: [],
    locations: [],
    conditions: [],
  })
  
  // États pour les vues - DÉSACTIVÉ (mode grille fixe)
  // const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // États pour les recherches sauvegardées - DÉSACTIVÉS
  // const [savedSearches, setSavedSearches] = useState<any[]>([])
  // const [showSavedSearches, setShowSavedSearches] = useState(false)


  // Initialisation
  useEffect(() => {
    initializeSearch()
  }, [])

  // Recherche manuelle uniquement (pas de temps réel)
  // useEffect supprimé pour désactiver la recherche automatique

  // Filtrage des produits (toujours actif)
  useEffect(() => {
    filterProducts()
  }, [products, searchQuery, selectedCategory, selectedSubcategory, minPrice, maxPrice, selectedConditions, advancedFilters, selectedSortOption])

  // Chargement des données initiales
  const initializeSearch = async () => {
    await loadProducts()
    await loadSearchHistory()
    // await loadSavedSearches() // DÉSACTIVÉ
    await loadCachedFilterOptions()
  }

  // Chargement des produits avec cache
  const loadProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      // Vérifier le cache d'abord (désactivé temporairement pour éviter les conflits de format)
      // const cacheKey = `all_products_${JSON.stringify(advancedFilters)}_${JSON.stringify(selectedSortOption)}`
      // const cachedResults = searchCacheService.getCachedResults('', advancedFilters, selectedSortOption)
      
      // if (cachedResults && !isRefresh) {
      //   logger.log('🎯 Produits chargés depuis le cache')
      //   setProducts(cachedResults)
      //   extractAndSetFilterOptions(cachedResults)
      //   return
      // }

      const data = await getProducts()
      logger.log('🔍 SearchScreen - Produits récupérés du service:', data.length)
      
      // Convertir les produits vers le format FirestoreProduct
      const firestoreProducts: FirestoreProduct[] = await Promise.all(data.map(async (product) => {
        // Récupérer les informations complètes du vendeur depuis Firebase
        let sellerInfo = undefined
        if (product.seller?.id) {
          try {
            const db = getFirestore(app)
            const userDoc = await getDoc(doc(db, 'users', product.seller.id))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              sellerInfo = {
                id: product.seller.id,
                name: userData.name || product.seller.name || 'Vendeur',
                storeName: userData.storeName || userData.name || product.seller.name || 'Vendeur',
                accountType: userData.accountType || product.seller.accountType || 'private',
                avatar: userData.avatar || product.seller.avatar || '',
                verified: userData.verified || product.seller.verified || false,
                geoPoint: userData.geoPoint ? {
                  latitude: userData.geoPoint.latitude,
                  longitude: userData.geoPoint.longitude
                } : undefined,
              }
            }
          } catch (error) {
            logger.log('❌ Erreur récupération vendeur:', error)
            // Utiliser les infos de base si erreur
            sellerInfo = {
              id: product.seller.id,
              name: product.seller.name || 'Vendeur',
              storeName: product.seller.name || 'Vendeur',
              accountType: product.seller.accountType || 'private',
              avatar: product.seller.avatar || '',
              verified: product.seller.verified || false,
            }
          }
        }

        // Récupérer les tailles depuis le stock Firebase
        let extractedSizes: string[] = []
        if (product.id) {
          try {
            const db = getFirestore(app)
            const productDoc = await getDoc(doc(db, 'products', product.id))
            if (productDoc.exists()) {
              const productData = productDoc.data()
              if (productData.stock && Array.isArray(productData.stock)) {
                extractedSizes = productData.stock
                  .map((item: any) => item.talla)
                  .filter((size: string) => size && size.trim() !== '')
              }
            }
          } catch (error) {
            logger.log('❌ Erreur récupération tailles:', error)
          }
        }

        return {
          id: product.id,
          titulo: product.title,
          precio: String(product.price),
          condicionGeneral: product.condition,
          images: product.images || [],
          createdAt: product.createdAt,
          categoria: product.category || '',
          subcategoria: product.subcategory || '',
          marca: product.brand || '',
          color: product.color || [],
          talla: extractedSizes.length > 0 ? extractedSizes : (product.sizes && product.sizes.length > 0 ? product.sizes : ['Única']),
          status: 'active',
          userId: product.seller?.id || '',
          seller: sellerInfo,
        }
      }))
      
      logger.log('🔍 SearchScreen - Produits convertis:', firestoreProducts.length)
      setProducts(firestoreProducts)
      setLoadError(null)
      extractAndSetFilterOptions(firestoreProducts)
      
      // Mettre en cache
      searchCacheService.setCachedResults('', advancedFilters, selectedSortOption, firestoreProducts)
      
    } catch (error: unknown) {
      logger.error('Error loading products:', error)
      setProducts([])
      setSearchQuery('')
      setLoadError(formatProductsLoadError(error))
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  // Extraction des options de filtres
  const extractAndSetFilterOptions = (products: FirestoreProduct[]) => {
    // Convertir FirestoreProduct vers Product pour extractFilterOptions
    const convertedProducts: Product[] = products.map(firestoreProductToProduct)

    const options = extractFilterOptions(convertedProducts)
    setAvailableFilterOptions(options)
    searchCacheService.cacheFilterOptions(options)
  }

  // Recherche manuelle uniquement
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      // Si pas de requête, afficher tous les produits
      filterProducts()
      return
    }

    setIsSearching(true)
    
    try {
      // Vérifier le cache
      const cachedResults = searchCacheService.getCachedResults<FirestoreProduct>(searchQuery, advancedFilters, selectedSortOption)
      
      if (cachedResults) {
        logger.log('🎯 Résultats trouvés dans le cache')
        setFilteredProducts(cachedResults)
        setIsSearching(false)
        return
      }

      // Recherche intelligente alignée sur filterProducts
      // 1) Convertir FirestoreProduct -> Product
      const convertedForSearch: Product[] = products.map(firestoreProductToProduct)

      // 2) Recherche intelligente
      const searchResults = intelligentSearch(convertedForSearch, searchQuery)

      // 3) Appliquer filtres avancés puis tri
      const filteredResults = applyAdvancedFilters(searchResults, advancedFilters)
      const sortedResults = sortProducts(filteredResults, selectedSortOption)

      // 4) Reconvertir via les IDs pour garder FirestoreProduct
      const keptIds = sortedResults.map(p => p.id)
      const finalResults = products.filter(fp => keptIds.includes(fp.id))

      setFilteredProducts(finalResults)

      // Mettre en cache
      searchCacheService.setCachedResults(searchQuery, advancedFilters, selectedSortOption, finalResults)

      // Ajouter à l'historique
      await searchCacheService.addToSearchHistory(searchQuery, finalResults.length)
      await loadSearchHistory()
      
    } catch (error) {
      logger.error('Erreur lors de la recherche:', error)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, products, advancedFilters, selectedSortOption])

  // Chargement de l'historique de recherche
  const loadSearchHistory = async () => {
    const history = await searchCacheService.getSearchHistory()
    setSearchHistory(history)
  }

  // Chargement des recherches sauvegardées - DÉSACTIVÉ
  // const loadSavedSearches = async () => {
  //   const searches = await searchCacheService.getSavedSearches()
  //   setSavedSearches(searches)
  // }

  // Chargement des options de filtres en cache
  const loadCachedFilterOptions = async () => {
    const cachedOptions = await searchCacheService.getCachedFilterOptions()
    if (cachedOptions) {
      setAvailableFilterOptions(cachedOptions)
    }
  }

  // Filtrage intelligent des produits
  const filterProducts = useCallback(() => {
    let filtered = [...products]
    logger.log('🔍 SearchScreen - filterProducts - Produits de base:', filtered.length)

    // Recherche intelligente si une requête est présente
    if (searchQuery.trim()) {
      // Convertir FirestoreProduct vers Product pour intelligentSearch
      const convertedProducts: Product[] = filtered.map(firestoreProductToProduct)
      
      const intelligentFiltered = intelligentSearch(convertedProducts, searchQuery)
      
      // Convertir les résultats vers FirestoreProduct
      const intelligentIds = intelligentFiltered.map(p => p.id)
      filtered = filtered.filter(fp => intelligentIds.includes(fp.id))
      logger.log('🔍 SearchScreen - Après recherche intelligente:', filtered.length)
    }

    // Filtres de base
    if (selectedCategory !== '1') {
      const categoryName = categories.find(c => c.id === selectedCategory)?.name
      if (categoryName && categoryName !== 'Todo') {
        filtered = filtered.filter(product => product.categoria === categoryName)
        
        if (selectedSubcategory) {
          filtered = filtered.filter(product => product.subcategoria === selectedSubcategory.name)
        }
      }
    }

    // Filtre par prix
    filtered = filtered.filter(product => {
      const price = parseFloat(product.precio.replace(/[^\d.]/g, '')) || 0
      return price >= minPrice && price <= maxPrice
    })

    // Filtre par condition
    if (selectedConditions.length > 0) {
      filtered = filtered.filter(product => 
        selectedConditions.includes(product.condicionGeneral)
      )
    }

    // Appliquer les filtres avancés (convertir pour compatibilité)
    const convertedForFilters: Product[] = filtered.map(firestoreProductToProduct)
    
    const advancedFiltered = applyAdvancedFilters(convertedForFilters, advancedFilters)
    const sortedProducts = sortProducts(advancedFiltered, selectedSortOption)
    
    // Convertir les résultats vers FirestoreProduct
    const sortedIds = sortedProducts.map(p => p.id)
    filtered = filtered.filter(fp => sortedIds.includes(fp.id))

    logger.log('🔍 SearchScreen - Produits filtrés finaux:', filtered.length)
    setFilteredProducts(filtered)
    
    // Gérer la pagination - si moins de 20 produits, c'est la fin
    const ITEMS_PER_PAGE = 20
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    
    // Si on a moins de 20 produits, c'est la fin
    if (filtered.length <= ITEMS_PER_PAGE) {
      setIsEndOfList(true)
      setHasMoreData(false)
    } else {
      setIsEndOfList(false)
      setHasMoreData(true)
    }
  }, [products, searchQuery, selectedCategory, selectedSubcategory, minPrice, maxPrice, selectedConditions, advancedFilters, selectedSortOption])

  // Suggestions désactivées - recherche manuelle uniquement
  // const updateSearchSuggestions = useCallback(() => { ... }, [searchQuery, products])
  // useEffect(() => { updateSearchSuggestions() }, [updateSearchSuggestions])

  // Gestion des interactions
  const handleProductPress = (product: FirestoreProduct) => {
    logger.log('🔍 SearchScreen - Navigation vers ProductDetail avec ID:', product.id);
    logger.log('🔍 SearchScreen - Type de product.id:', typeof product.id);
    
    // Vérification de sécurité pour l'ID
    if (!product.id || typeof product.id !== 'string' || product.id.trim() === '') {
      logger.error('❌ SearchScreen - ID de produit invalide, navigation annulée:', product.id);
      return;
    }
    
    navigation.navigate('ProductDetail', { productId: product.id })
  }

  const handleLike = (productId: string) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId
          ? { ...product, isLiked: !product.isLiked }
          : product
      )
    )
  }

  // Gestion des suggestions
  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
  }

  const handleHistoryPress = (query: string) => {
    setSearchQuery(query)
    setShowSuggestions(false)
  }

  const handleClearHistory = async () => {
    await searchCacheService.clearSearchHistory()
    await loadSearchHistory()
  }

  // Gestion des filtres
  const clearFilters = () => {
    setAdvancedFilters({
      sizes: [],
      colors: [],
      brands: [],
      locations: [],
      priceRange: { min: 0, max: 50000 },
      conditions: [],
      mainCategory: undefined,
      subCategory: undefined,
      distance: {
        enabled: false,
        maxDistance: 10,
      },
    })
  }

  const handleAdvancedFiltersApply = (filters: AdvancedFiltersType) => {
    setAdvancedFilters(filters)
    setShowAdvancedFilters(false)
  }

  // Gestion du tri
  const handleSortOptionSelect = (sortOption: SortOption) => {
    setSelectedSortOption(sortOption)
    setShowSortModal(false)
  }

  // Gestion des recherches sauvegardées - DÉSACTIVÉ
  // const handleSaveSearch = async () => { ... }
  // const handleLoadSavedSearch = (savedSearch: any) => { ... }

  // Gestion de la pagination infinie
  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreData || isEndOfList) return

    setLoadingMore(true)
    
    // Simuler le chargement de plus de données
    setTimeout(() => {
      setCurrentPage(prev => prev + 1)
      setLoadingMore(false)
      
      // Marquer comme fin de liste après le premier "chargement"
      setIsEndOfList(true)
      setHasMoreData(false)
    }, 1000)
  }

  // Gestion du changement de mode d'affichage - DÉSACTIVÉ
  // const toggleViewMode = () => { ... }

  // Fonction de rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true)
    
    // Animation de rotation
    Animated.sequence([
      Animated.timing(refreshRotation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(refreshRotation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
    
    try {
      // Recharger les produits
      await loadProducts(true)
      
      // Réinitialiser la pagination
      setCurrentPage(1)
      setIsEndOfList(false)
      setHasMoreData(false)
      
      // Recharger l'historique
      await loadSearchHistory()
      
    } catch (error) {
      logger.error('Erreur lors du rafraîchissement:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Fonction pour effacer le champ de recherche
  const clearSearch = () => {
    setSearchQuery('')
    setShowSuggestions(false)
    setIsSearching(false)
  }

  const handleCategoryPress = (category: Category) => {
    setSelectedCategory(category.id)
    setSelectedSubcategory(null)
  }

  const handleSubcategorySelect = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory)
  }

  // Rendu des produits en mode grille fixe
  const renderProduct = ({ item }: { item: FirestoreProduct }) => {
    logger.log('🔍 SearchScreen - renderProduct - item:', {
      id: item.id,
      titulo: item.titulo,
      precio: item.precio,
      seller: item.seller
    });
    
    // Convertir FirestoreProduct vers le format attendu par ProductCard (comme dans HomeScreen)
    const productForCard = {
      id: item.id,
      title: item.titulo,
      price: item.precio,
      condition: item.condicionGeneral,
      images: cleanProductImages(item),
      createdAt: item.createdAt,
      category: item.categoria,
      subcategory: item.subcategoria,
      brand: item.marca,
      color: item.color,
      talla: item.talla,
      status: item.status as 'active' | 'sold' | 'inactive' | undefined,
      seller: item.seller,
    }

    return (
      <ProductCard
        product={productForCard}
        onPress={() => handleProductPress(item)}
        showPrice={true}
        showCondition={true}
        showBrand={true}
        showRating={true}
        showLocation={true}
        showDate={false}
        isFavorited={favoriteProductIds.includes(item.id)}
      />
    )
  }

  // Rendu du footer pour la pagination infinie
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color="#059669" />
          <Text style={styles.loadingMoreText}>Cargando más productos...</Text>
        </View>
      )
    }
    
    if (isEndOfList && filteredProducts.length > 0) {
      return (
        <View style={styles.endOfListContainer}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#059669" />
          <Text style={styles.endOfListText}>No hay más productos</Text>
          <Text style={styles.endOfListSubtext}>Has visto todos los resultados disponibles</Text>
        </View>
      )
    }
    
    return null
  }

  // Rendu du modal de tri
  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sortModal}>
          <View style={styles.sortModalHeader}>
            <Text style={styles.sortModalTitle}>Ordenar por</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortOption,
                selectedSortOption.id === option.id && styles.sortOptionSelected
              ]}
              onPress={() => handleSortOptionSelect(option)}
            >
              <Text style={[
                styles.sortOptionText,
                selectedSortOption.id === option.id && styles.sortOptionTextSelected
              ]}>
                {option.label}
              </Text>
              {selectedSortOption.id === option.id && (
                <Ionicons name="checkmark" size={20} color="#059669" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artículos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            onFocus={() => setShowSuggestions(false)} // Désactiver les suggestions
            onBlur={() => setShowSuggestions(false)}
          />
          {searchQuery.trim() ? (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearSearch}
            >
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <Ionicons name="search" size={16} color="#059669" />
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {/* Bouton d'actualisation désactivé */}
          {/* <TouchableOpacity ... > */}
          
          {/* Bouton de sauvegarde désactivé */}
          {/* <TouchableOpacity ... > */}
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAdvancedFilters(true)}
          >
            <Ionicons name="options-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          {/* Bouton de basculement grille/liste supprimé */}
          {/* <TouchableOpacity ... > */}
        </View>
      </View>

      {/* Suggestions désactivées - recherche manuelle uniquement */}
      {/* <SearchSuggestions ... /> */}

      {/* Recently Viewed */}
      <RecentlyViewedList />

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterChip,
                    selectedCategory === category.id && styles.filterChipActive,
                  ]}
                  onPress={() => handleCategoryPress(category)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === category.id && styles.filterChipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Subcategories Row */}
            {selectedCategory !== '1' && (() => {
              const selectedCategoryData = categories.find(c => c.id === selectedCategory)
              return selectedCategoryData?.subcategories && selectedCategoryData.subcategories.length > 0 ? (
                <View style={styles.subcategoriesSection}>
                  <Text style={styles.subcategoriesTitle}>Subcategorías</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedCategoryData.subcategories.map((subcategory) => (
                      <TouchableOpacity
                        key={subcategory.id}
                        style={[
                          styles.subcategoryChip,
                          selectedSubcategory?.id === subcategory.id && styles.subcategoryChipActive,
                        ]}
                        onPress={() => handleSubcategorySelect(subcategory)}
                      >
                        <Text
                          style={[
                            styles.subcategoryChipText,
                            selectedSubcategory?.id === subcategory.id && styles.subcategoryChipTextActive,
                          ]}
                        >
                          {subcategory.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null
            })()}
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Precio</Text>
            <View style={styles.priceContainer}>
              <View style={styles.priceRange}>
                <Text style={styles.priceLabel}>RD$ {minPrice.toLocaleString()}</Text>
                <Text style={styles.priceLabel}>RD$ {maxPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                  <View 
                    style={[
                      styles.sliderFill, 
                      { 
                        left: `${(minPrice / 25000) * 100}%`,
                        width: `${((maxPrice - minPrice) / 25000) * 100}%`
                      }
                    ]} 
                  />
                  <TouchableOpacity
                    style={[
                      styles.sliderThumb,
                      { left: `${(minPrice / 25000) * 100}%` }
                    ]}
                    onPressIn={() => {}}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sliderThumb,
                      { left: `${(maxPrice / 25000) * 100}%` }
                    ]}
                    onPressIn={() => {}}
                  />
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={25000}
                  value={minPrice}
                  onValueChange={(value) => {
                    if (value <= maxPrice) {
                      setMinPrice(value)
                    }
                  }}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor="transparent"
                />
                <Slider
                  style={[styles.slider, styles.sliderOverlay]}
                  minimumValue={0}
                  maximumValue={25000}
                  value={maxPrice}
                  onValueChange={(value) => {
                    if (value >= minPrice) {
                      setMaxPrice(value)
                    }
                  }}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor="transparent"
                />
              </View>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Condición</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {conditions.map((condition) => (
                <TouchableOpacity
                  key={condition.id}
                  style={[
                    styles.filterChip,
                    selectedConditions.includes(condition.name) && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    if (condition.name === 'Todo') {
                      setSelectedConditions([])
                    } else {
                      setSelectedConditions(prev => 
                        prev.includes(condition.name)
                          ? prev.filter(c => c !== condition.name)
                          : [...prev, condition.name]
                      )
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedConditions.includes(condition.name) && styles.filterChipTextActive,
                    ]}
                  >
                    {condition.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsCount}>
              {filteredProducts.length} resultados
            </Text>
            {/* Bouton de sauvegarde désactivé */}
            {/* {searchQuery.trim() && ( ... )} */}
          </View>
          
          <View style={styles.resultsActions}>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setShowSortModal(true)}
            >
              <Ionicons name="swap-vertical" size={16} color="#6b7280" />
              <Text style={styles.sortText}>{selectedSortOption.label}</Text>
            </TouchableOpacity>
            
            {/* Bouton Limpiar supprimé */}
            {/* <TouchableOpacity ... > */}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadStateBox}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadStateText}>Cargando productos...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.loadStateBox}>
            <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
            <Text style={styles.loadErrorTitle}>No se pudieron cargar los productos</Text>
            <Text style={styles.loadErrorMessage}>{loadError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadProducts()}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2} // Mode grille fixe
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#059669']} // Android
                tintColor="#059669" // iOS
                title="Actualizando resultados..." // iOS
                titleColor="#059669" // iOS
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            // key={viewMode} // Plus nécessaire - mode grille fixe
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No se encontraron resultados</Text>
            <Text style={styles.emptyStateSubtitle}>
              Intenta ajustar tus filtros o buscar algo diferente
            </Text>
          </View>
        )}
      </View>

      {/* Modals */}
      {renderSortModal()}
      
      {/* Filtres avancés */}
      <AdvancedFilters
        visible={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={handleAdvancedFiltersApply}
        currentFilters={advancedFilters}
        availableOptions={availableFilterOptions}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 16,
    paddingRight: 50, // Espace pour le bouton de recherche
  },
  searchButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    bottom: 8,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    bottom: 8,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    color: '#6b7280',
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  productsList: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadStateBox: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadStateText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  loadErrorTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  loadErrorMessage: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryIcon: {
    marginLeft: 4,
  },
  subcategoriesSection: {
    marginTop: 12,
  },
  subcategoriesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  subcategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  subcategoryChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  subcategoryChipText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  subcategoryChipTextActive: {
    color: 'white',
  },
  subcategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  subcategoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  priceContainer: {
    marginTop: 8,
  },
  priceRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  sliderContainer: {
    position: 'relative',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sliderTrack: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    backgroundColor: '#059669',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Nouveaux styles pour les améliorations
  searchLoading: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
  },
  saveSearchText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6b7280',
  },
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  endOfListText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginTop: 8,
  },
  endOfListSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sortOptionSelected: {
    backgroundColor: '#f0fdf4',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  sortOptionTextSelected: {
    color: '#059669',
    fontWeight: '500',
  },
}) 