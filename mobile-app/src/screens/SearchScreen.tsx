import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { ProductCard } from '../components/ProductCard'
import { IconButton } from '../components/IconButton'
import { EmptyState } from '../components/EmptyState'
import { brandColors, radii, shadows, spacing, typography } from '../theme'
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

const PAGE_SIZE = 20

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>()

  const flatListRef = useRef<FlatList>(null)
  const scrollOffsetRef = useRef(0)
  const hasFocusedOnceRef = useRef(false)

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
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  
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
    setDisplayCount(PAGE_SIZE)
    scrollOffsetRef.current = 0
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

  // Préserver le scroll lors du retour depuis ProductDetail
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnceRef.current && scrollOffsetRef.current > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: scrollOffsetRef.current, animated: false })
        }, 50)
      }
      hasFocusedOnceRef.current = true
    }, [])
  )

  // Gestion de la pagination réelle (client-side)
  const handleLoadMore = useCallback(() => {
    if (loadingMore || displayCount >= filteredProducts.length) return
    setLoadingMore(true)
    setDisplayCount(prev => prev + PAGE_SIZE)
    setLoadingMore(false)
  }, [loadingMore, displayCount, filteredProducts.length])

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
      
      setDisplayCount(PAGE_SIZE)
      scrollOffsetRef.current = 0
      
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
      />
    )
  }

  // Rendu du footer pour la pagination
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={brandColors.primaryUI} />
          <Text style={styles.loadingMoreText}>Cargando más productos...</Text>
        </View>
      )
    }
    if (displayCount >= filteredProducts.length && filteredProducts.length > 0) {
      return (
        <View style={styles.endOfListContainer}>
          <Ionicons name="checkmark-circle-outline" size={24} color={brandColors.textMuted} />
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
              <Ionicons name="close" size={24} color={brandColors.textPrimary} />
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
                <Ionicons name="checkmark" size={20} color={brandColors.primaryUI} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={brandColors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artículos..."
            placeholderTextColor={brandColors.textMuted}
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
              <Ionicons name="close" size={16} color={brandColors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={brandColors.primaryUI} />
              ) : (
                <Ionicons name="search" size={16} color={brandColors.primaryUI} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerActions}>
          <IconButton
            name="options-outline"
            variant="surface"
            color={brandColors.textSecondary}
            onPress={() => setShowAdvancedFilters(true)}
          />
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
            <ActivityIndicator size="large" color={brandColors.primaryUI} />
            <Text style={styles.loadStateText}>Cargando productos...</Text>
          </View>
        ) : loadError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="No se pudieron cargar los productos"
            subtitle={loadError}
            actionLabel="Reintentar"
            onAction={() => loadProducts()}
          />
        ) : filteredProducts.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={filteredProducts.slice(0, displayCount)}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[brandColors.primaryUI]}
                tintColor={brandColors.primaryUI}
                title="Actualizando resultados..."
                titleColor={brandColors.primaryUI}
              />
            }
            onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y }}
            scrollEventThrottle={16}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        ) : (
          <EmptyState
            icon="search-outline"
            title="No se encontraron resultados"
            subtitle="Intenta ajustar tus filtros o buscar algo diferente"
          />
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
    backgroundColor: brandColors.background,
  },
  header: {
    backgroundColor: brandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    top: 17,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: brandColors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: brandColors.border,
    borderRadius: radii.medium + 2,
    height: 52,
    paddingHorizontal: 40,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: brandColors.textPrimary,
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
    backgroundColor: brandColors.surface,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    bottom: 8,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: brandColors.surfaceSecondary,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  filtersContainer: {
    backgroundColor: brandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
    padding: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: brandColors.textPrimary,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: brandColors.surface,
  },
  filterChipActive: {
    backgroundColor: brandColors.primaryUI,
    borderColor: brandColors.primaryUI,
  },
  filterChipText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: brandColors.textSecondary,
  },
  filterChipTextActive: {
    color: brandColors.white,
    fontFamily: typography.bodyMedium.fontFamily,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  clearFiltersText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: brandColors.primaryUI,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: brandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  resultsCount: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  productsList: {
    paddingBottom: 20,
  },
  loadStateBox: {
    flex: 1,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadStateText: {
    marginTop: spacing.md,
    color: brandColors.textSecondary,
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
  },
  categoryIcon: {
    marginLeft: 4,
  },
  subcategoriesSection: {
    marginTop: spacing.md,
  },
  subcategoriesTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 12,
    color: brandColors.textSecondary,
    marginBottom: spacing.sm,
  },
  subcategoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: brandColors.surface,
  },
  subcategoryChipActive: {
    backgroundColor: brandColors.primaryUI,
    borderColor: brandColors.primaryUI,
  },
  subcategoryChipText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: brandColors.textSecondary,
  },
  subcategoryChipTextActive: {
    color: brandColors.white,
  },
  priceContainer: {
    marginTop: spacing.sm,
  },
  priceRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  priceLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: brandColors.textPrimary,
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
    backgroundColor: brandColors.border,
    borderRadius: 2,
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: brandColors.primaryUI,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    backgroundColor: brandColors.primaryUI,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: brandColors.white,
    ...shadows.card,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingMoreText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  endOfListText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 16,
    color: brandColors.textSecondary,
    marginTop: spacing.sm,
  },
  endOfListSubtext: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    color: brandColors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModal: {
    backgroundColor: brandColors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingBottom: 34, // Safe area
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  sortModalTitle: {
    fontFamily: typography.cardTitle.fontFamily,
    fontSize: 18,
    color: brandColors.textPrimary,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.surfaceSecondary,
  },
  sortOptionSelected: {
    backgroundColor: brandColors.primaryExtraLight,
  },
  sortOptionText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    color: brandColors.textPrimary,
  },
  sortOptionTextSelected: {
    color: brandColors.primaryUI,
    fontFamily: typography.bodyMedium.fontFamily,
  },
})
