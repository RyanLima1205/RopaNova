import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { ProductCard } from '../components/ProductCard'
import { Logo } from '../components/Logo'
import { IconButton } from '../components/IconButton'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { brandColors, radii, spacing, typography } from '../theme'
import { Product, Category, Subcategory } from '../types'
import { RootStackParamList } from '../../App'
import { StackNavigationProp } from '@react-navigation/stack'
import { categories, getSubcategories } from '../data/categories'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { getProducts, formatProductsLoadError } from '../services/productService'
import { app } from '../firebaseConfig'
import { cleanProductImages } from '../utils/imageUtils'
import { useFavoriteProductIds } from '../hooks/useFavoriteProductIds'

import { logger } from '../utils/logger'
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>

// Nouvelles options de filtres rapides
const quickFilters = [
  { id: 'this-week', label: 'Esta Semana', icon: '📅', active: false },
  { id: 'under-1000', label: 'Menos de RD$1,000', icon: '💰', active: false },
  { id: 'designer', label: 'Marcas Diseñador', icon: '✨', active: false },
  { id: 'plus-size', label: 'Talla Grande', icon: '👗', active: false },
  { id: 'new', label: 'Nuevo', icon: '🆕', active: false },
  { id: 'second-hand', label: 'Segunda Mano', icon: '♻️', active: false },
  { id: 'professional', label: 'Ropa Profesional', icon: '💼', active: false },
  { id: 'beach', label: 'Ropa de Playa', icon: '🏖️', active: false },
  { id: 'verified', label: 'Vendedores Verificados', icon: '✅', active: false },
]

// Interface pour les produits Firestore
interface FirestoreProduct {
  id: string
  titulo: string
  precio: string
  condicionGeneral: string
  images: string[]
  createdAt: any
  categoria: string
  subcategoria: string
  marca: string
  color: string[]
  talla?: string[]
  status?: string
  userId: string
  seller?: {
    id: string
    name: string
    storeName?: string
    accountType: string
    avatar?: string
    verified?: boolean
  }
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const { favoriteProductIds } = useFavoriteProductIds()
  const [products, setProducts] = useState<FirestoreProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<FirestoreProduct[]>([])
  const [selectedCategory, setSelectedCategory] = useState('1')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const scrollOffsetRef = useRef(0)
  const scrollToTopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [products, selectedCategory, selectedSubcategory, activeQuickFilters, searchQuery])

  const loadProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      logger.log('🔍 Chargement des produits via getProducts()...')
      
      // Utiliser la fonction getProducts du service qui est plus robuste
      const products = await getProducts()
      
      logger.log('📊 Nombre de produits récupérés:', products.length)
      
      // Convertir les produits du service vers le format FirestoreProduct avec infos complètes
      const firestoreProducts: FirestoreProduct[] = await Promise.all(products.map(async (product) => {
        // Récupérer les informations complètes du vendeur depuis Firebase
        let sellerInfo = undefined
        if (product.seller?.id) {
          try {
            const db = getFirestore(app)
            const userDoc = await getDoc(doc(db, 'users', product.seller.id))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              logger.log('🔍 HomeScreen - Données vendeur récupérées:', {
                id: product.seller.id,
                name: userData.name,
                avatar: userData.avatar,
                storeName: userData.storeName,
                geoPoint: userData.geoPoint
              });
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
          precio: product.price.toString(),
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

      logger.log('✅ Produits convertis:', firestoreProducts.length)
      setProducts(firestoreProducts)
      setLoadError(null)
    } catch (error: unknown) {
      logger.error('❌ Erreur lors du chargement des produits:', error)
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

  const applyFilters = () => {
    logger.log('🔧 Application des filtres...')
    logger.log('📦 Produits de base:', products.length)
    logger.log('🎯 Filtres actifs:', {
      selectedCategory,
      selectedSubcategory,
      activeQuickFilters,
      searchQuery: searchQuery.trim()
    })
    
    let filtered = [...products]

    // Filtre par recherche
    if (searchQuery.trim()) {
      const beforeSearch = filtered.length
      filtered = filtered.filter(product =>
        product.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.marca.toLowerCase().includes(searchQuery.toLowerCase())
      )
      logger.log(`🔍 Filtre recherche: ${beforeSearch} → ${filtered.length}`)
    }

    // Filtre par catégorie
    if (selectedCategory !== '1') {
      const beforeCategory = filtered.length
      const categoryMap: { [key: string]: string } = {
        '2': 'Mujer',
        '3': 'Hombre', 
        '4': 'Niño',
        '5': 'Libro'
      }
      const categoryName = categoryMap[selectedCategory]
      logger.log('🏷️ Catégorie sélectionnée:', categoryName)
      if (categoryName) {
        filtered = filtered.filter(product => product.categoria === categoryName)
        logger.log(`📂 Filtre catégorie: ${beforeCategory} → ${filtered.length}`)
      }
    }

    // Filtre par sous-catégorie
    if (selectedSubcategory) {
      const beforeSubcategory = filtered.length
      const subcategoryName = getSubcategories(selectedCategory).find(sub => sub.id === selectedSubcategory)?.name
      logger.log('🔖 Sous-catégorie sélectionnée:', subcategoryName)
      if (subcategoryName) {
        filtered = filtered.filter(product => product.subcategoria === subcategoryName)
        logger.log(`📁 Filtre sous-catégorie: ${beforeSubcategory} → ${filtered.length}`)
      }
    }

    // Filtres rapides
    activeQuickFilters.forEach(filterId => {
      const beforeQuick = filtered.length
      switch (filterId) {
        case 'this-week':
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          filtered = filtered.filter(product => {
            const productDate = product.createdAt?.seconds 
              ? new Date(product.createdAt.seconds * 1000)
              : new Date(product.createdAt)
            return productDate >= oneWeekAgo
          })
          break
        case 'under-1000':
          filtered = filtered.filter(product => {
            const price = parseFloat(product.precio) || 0
            return price < 1000
          })
          break
        case 'new':
          filtered = filtered.filter(product => 
            product.condicionGeneral?.toLowerCase().includes('nuevo')
          )
          break
        case 'second-hand':
          filtered = filtered.filter(product => 
            !product.condicionGeneral?.toLowerCase().includes('nuevo')
          )
          break
        case 'designer':
          const designerBrands = ['Gucci', 'Louis Vuitton', 'Prada', 'Chanel', 'Hermès', 'Zara', 'H&M']
          filtered = filtered.filter(product => 
            designerBrands.some(brand => 
              product.marca?.toLowerCase().includes(brand.toLowerCase())
            )
          )
          break
      }
      if (beforeQuick !== filtered.length) {
        logger.log(`⚡ Filtre ${filterId}: ${beforeQuick} → ${filtered.length}`)
      }
    })

    logger.log('✅ Produits filtrés final:', filtered.length)
    setFilteredProducts(filtered)
  }

  const handleProductPress = (product: FirestoreProduct) => {
    logger.log('🔍 HomeScreen - Navigation vers ProductDetail avec ID:', product.id);
    logger.log('🔍 HomeScreen - Type de product.id:', typeof product.id);
    logger.log('🔍 HomeScreen - Product complet:', product);
    
    // Vérification de sécurité pour l'ID
    if (!product.id || typeof product.id !== 'string' || product.id.trim() === '') {
      logger.error('❌ HomeScreen - ID de produit invalide, navigation annulée:', product.id);
      return;
    }
    
    navigation.navigate('ProductDetail', { productId: product.id })
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigation vers la page de recherche avec la requête
      navigation.navigate('SearchScreen' as any, { searchQuery: searchQuery.trim() })
    }
  }

  const handleSellPress = () => {
    navigation.navigate('SellScreen' as any)
  }

  const onRefresh = useCallback(async () => {
    logger.log('🔄 Rafraîchissement des produits...')
    await loadProducts(true)
  }, [])

  // Appui sur l'onglet "Inicio" : remonte en haut si on n'y est pas déjà, sinon rafraîchit.
  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('tabPress', () => {
      if (!navigation.isFocused()) return
      if (scrollOffsetRef.current > 8) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true })

        if (scrollToTopTimeoutRef.current) clearTimeout(scrollToTopTimeoutRef.current)
        // Filet de sécurité : garantit qu'on atterrit bien à y=0 même si l'animation
        // a été interrompue par un reflow (images produits qui finissent de charger).
        scrollToTopTimeoutRef.current = setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: false })
        }, 450)
      } else {
        onRefresh()
      }
    })
    return () => {
      unsubscribe()
      if (scrollToTopTimeoutRef.current) clearTimeout(scrollToTopTimeoutRef.current)
    }
  }, [navigation, onRefresh])

  const handleCategoryPress = (category: Category) => {
    setSelectedCategory(category.id)
    setSelectedSubcategory(null) // Réinitialiser la sous-catégorie
  }

  const handleSubcategoryPress = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId === selectedSubcategory ? null : subcategoryId)
  }

  const toggleQuickFilter = (filterId: string) => {
    setActiveQuickFilters(prev =>
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    )
  }

  // Fonction pour obtenir les filtres rapides selon le contexte
  const getVisibleQuickFilters = () => {
    // Si catégorie Libro sélectionnée, afficher seulement filtres pertinents pour livres
    if (selectedCategory === '5') { // ID de la catégorie Libro
      return quickFilters.filter(filter => 
        filter.id === 'this-week' || 
        filter.id === 'under-1000' || 
        filter.id === 'new' ||
        filter.id === 'second-hand' ||
        filter.id === 'verified'
      )
    }
    
    if (selectedSubcategory) {
      // Masquer les filtres non pertinents quand une sous-catégorie est sélectionnée
      return quickFilters.filter(filter => 
        filter.id !== 'professional' && filter.id !== 'beach'
      )
    }
    return quickFilters
  }

  const renderProduct = ({ item }: { item: FirestoreProduct }) => {
    // logger.log("🖼️ Images pour produit", item.titulo, ":", item.images);
    // Convertir FirestoreProduct vers le format attendu par ProductCard
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Logo variant="horizontal" size="sm" />
          <View style={styles.headerActions}>
            <IconButton
              name="heart-outline"
              variant="ghost"
              color={brandColors.textSecondary}
              onPress={() => navigation.navigate('FavoritesScreen')}
            />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={brandColors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artículos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[brandColors.primaryUI]} // Android
            tintColor={brandColors.primaryUI} // iOS
            title="Actualizando productos..." // iOS
            titleColor={brandColors.primaryUI} // iOS
          />
        }
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[brandColors.primaryUI, brandColors.primaryDark, brandColors.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.55, 1]}
          style={styles.heroSection}
        >
          <Text style={styles.heroTitle}>¡Bienvenido a RopaNova! 🇩🇴</Text>
          <Text style={styles.heroSubtitle}>
            Compra y vende ropa de segunda mano en República Dominicana
          </Text>
        </LinearGradient>

        {/* Category Tabs */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => {
              const active = selectedCategory === category.id
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryButton}
                  onPress={() => handleCategoryPress(category)}
                >
                  <View style={[styles.categoryIconCircle, active && styles.categoryIconCircleActive]}>
                    <Ionicons
                      name={(category.icon as keyof typeof Ionicons.glyphMap) || 'grid-outline'}
                      size={22}
                      color={active ? brandColors.white : brandColors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Subcategory Tabs - Affichées uniquement si une catégorie spécifique est sélectionnée */}
        {selectedCategory !== '1' && (
          <View style={styles.subcategoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getSubcategories(selectedCategory).map((subcategory) => (
                <TouchableOpacity
                  key={subcategory.id}
                  style={[
                    styles.subcategoryButton,
                    selectedSubcategory === subcategory.id && styles.subcategoryButtonActive,
                  ]}
                  onPress={() => handleSubcategoryPress(subcategory.id)}
                >
                  <Text
                    style={[
                      styles.subcategoryText,
                      selectedSubcategory === subcategory.id && styles.subcategoryTextActive,
                    ]}
                  >
                    {subcategory.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Filters Section */}
        <View style={styles.quickFiltersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {getVisibleQuickFilters().map((filter) => {
              const active = activeQuickFilters.includes(filter.id)
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.quickFilterChip, active && styles.quickFilterChipActive]}
                  onPress={() => toggleQuickFilter(filter.id)}
                >
                  <Text style={styles.quickFilterIcon}>{filter.icon}</Text>
                  <Text style={[styles.quickFilterChipText, active && styles.quickFilterChipTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Featured Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === '1' 
              ? 'Artículos Destacados' 
              : `${filteredProducts.length} productos encontrados`
            }
          </Text>
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
          ) : (
          <FlatList
              data={filteredProducts}
            renderItem={renderProduct}
              keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
              ListEmptyComponent={() => (
                <EmptyState
                  icon="search-outline"
                  title="No se encontraron productos"
                  subtitle="Intenta ajustar los filtros"
                />
              )}
          />
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            <Card onPress={handleSellPress} style={styles.actionCard}>
              <Ionicons name="add-circle-outline" size={32} color={brandColors.primaryUI} />
              <Text style={styles.actionTitle}>Vender</Text>
              <Text style={styles.actionSubtitle}>Publica tu artículo</Text>
            </Card>

            <Card onPress={handleSearch} style={styles.actionCard}>
              <Ionicons name="search-outline" size={32} color={brandColors.primaryUI} />
              <Text style={styles.actionTitle}>Buscar</Text>
              <Text style={styles.actionSubtitle}>Encuentra lo que buscas</Text>
            </Card>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    top: 15,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: brandColors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: brandColors.border,
    borderRadius: radii.medium + 2,
    height: 48,
    paddingHorizontal: 40,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: brandColors.textPrimary,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    borderRadius: radii.large,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.xxl,
  },
  heroTitle: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: typography.sectionTitle.fontSize,
    color: brandColors.white,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: brandColors.primaryExtraLight,
  },
  categoriesContainer: {
    backgroundColor: brandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  categoryButton: {
    alignItems: 'center',
    width: 68,
    marginRight: spacing.xs,
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: brandColors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryIconCircleActive: {
    backgroundColor: brandColors.primaryUI,
  },
  categoryText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: brandColors.primaryUI,
    fontFamily: typography.bodyMedium.fontFamily,
  },
  subcategoriesContainer: {
    backgroundColor: brandColors.background,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  subcategoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: brandColors.surface,
  },
  subcategoryButtonActive: {
    backgroundColor: brandColors.primaryUI,
    borderColor: brandColors.primaryUI,
  },
  subcategoryText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: brandColors.textSecondary,
  },
  subcategoryTextActive: {
    color: brandColors.white,
  },
  quickFiltersSection: {
    backgroundColor: brandColors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  quickFilterChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: brandColors.surface,
    minWidth: 92,
  },
  quickFilterChipActive: {
    backgroundColor: brandColors.primaryExtraLight,
    borderColor: brandColors.primaryUI,
  },
  quickFilterIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  quickFilterChipText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  quickFilterChipTextActive: {
    color: brandColors.primaryUI,
    fontFamily: typography.bodyMedium.fontFamily,
  },
  section: {
    padding: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: typography.sectionTitle.fontSize,
    color: brandColors.textPrimary,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 2, // Petit padding pour éviter que les cartes touchent les bords
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
  },
  actionTitle: {
    fontFamily: typography.cardTitle.fontFamily,
    fontSize: typography.cardTitle.fontSize,
    color: brandColors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  loadStateBox: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadStateText: {
    marginTop: spacing.md,
    color: brandColors.textSecondary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
})