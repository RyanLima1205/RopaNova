import React, { useState, useEffect } from 'react'
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
import { useNavigation } from '@react-navigation/native'
import { ProductCard } from '../components/ProductCard'
import { Product, Category, Subcategory } from '../types'
import { RootStackParamList } from '../../App'
import { StackNavigationProp } from '@react-navigation/stack'
import { categories, getSubcategories } from '../data/categories'
import { getFirestore, collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore'
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

  const testFirestoreConnection = async () => {
    try {
      const db = getFirestore(app)
      const productsRef = collection(db, 'products')
      // Requête simple sans filtres pour voir ce qu'il y a
      const simpleQuery = query(productsRef, limit(5))
      const snapshot = await getDocs(simpleQuery)
      
      logger.log('🧪 Test simple - Documents totaux:', snapshot.size)
      snapshot.forEach((doc) => {
        const data = doc.data()
        logger.log('🧪 Document exemple:', {
          id: doc.id,
          titulo: data.titulo,
          status: data.status,
          categoria: data.categoria,
          hasImages: data.images?.length > 0
        })
      })
    } catch (error: any) {
      logger.error('🧪 Erreur test Firestore:', error)
    }
  }

  useEffect(() => {
    loadProducts()
    // Test simple pour vérifier s'il y a des données
    testFirestoreConnection()
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

  const onRefresh = async () => {
    logger.log('🔄 Rafraîchissement des produits...')
    await loadProducts(true)
  }

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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logo}>RopaNova</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('FavoritesScreen')}
            >
              <Ionicons name="heart-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
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
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#059669']} // Android
            tintColor="#059669" // iOS
            title="Actualizando productos..." // iOS
            titleColor="#059669" // iOS
          />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>¡Bienvenido a RopaNova! 🇩🇴</Text>
          <Text style={styles.heroSubtitle}>
            Compra y vende ropa de segunda mano en República Dominicana
          </Text>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
                onPress={() => handleCategoryPress(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
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
            {getVisibleQuickFilters().map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.quickFilterChip,
                  activeQuickFilters.includes(filter.id) && styles.quickFilterChipActive,
                ]}
                onPress={() => toggleQuickFilter(filter.id)}
              >
                <Text style={styles.quickFilterIcon}>{filter.icon}</Text>
                <Text
                  style={[
                    styles.quickFilterChipText,
                    activeQuickFilters.includes(filter.id) && styles.quickFilterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
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
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadStateText}>Cargando productos...</Text>
            </View>
          ) : loadError ? (
            <View style={styles.loadStateBox}>
              <Ionicons name="cloud-offline-outline" size={40} color="#ef4444" />
              <Text style={styles.loadErrorTitle}>No se pudieron cargar los productos</Text>
              <Text style={styles.loadErrorMessage}>{loadError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadProducts()}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
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
                <View style={styles.loadStateBox}>
                  <Text style={{ color: '#6b7280', fontSize: 16 }}>No se encontraron productos</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>
                    Intenta ajustar los filtros
                  </Text>
                </View>
              )}
          />
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard} onPress={handleSellPress}>
              <Ionicons name="add-circle-outline" size={32} color="#059669" />
              <Text style={styles.actionTitle}>Vender</Text>
              <Text style={styles.actionSubtitle}>Publica tu artículo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={handleSearch}>
              <Ionicons name="search-outline" size={32} color="#059669" />
              <Text style={styles.actionTitle}>Buscar</Text>
              <Text style={styles.actionSubtitle}>Encuentra lo que buscas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
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
  },
  content: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#059669',
    padding: 24,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#d1fae5',
  },
  categoriesContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  categoryButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  subcategoriesContainer: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subcategoryButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  subcategoryButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  subcategoryText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '400',
  },
  subcategoryTextActive: {
    color: 'white',
  },
  quickFiltersSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  quickFiltersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  quickFilterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  quickFilterIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  quickFilterChipText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  quickFilterChipTextActive: {
    color: 'white',
  },
  section: {
    padding: 8, // Réduit de 16 à 8 pour rapprocher les cartes du bord
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 2, // Petit padding pour éviter que les cartes touchent les bords
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadStateBox: {
    padding: 24,
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
}) 