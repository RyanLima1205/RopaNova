import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Modal,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import { EnhancedSwipeGallery } from '../components/EnhancedSwipeGallery'

import { SellerProfileCard } from '../components/SellerProfileCard'
import { getProduct } from '../services/productService'
import { Product } from '../types'
import { formatPrice } from '../utils/formatters'
import { getFirestore, doc, getDoc, serverTimestamp, writeBatch, increment, runTransaction } from 'firebase/firestore'
import { app, auth } from '../firebaseConfig'
import { createConversationIfNeeded } from '../services/chatService'

import { logger } from '../utils/logger'
// Constantes pour les couleurs
const colorOptions = [
  { name: 'Negro', value: 'negro', color: '#000000' },
  { name: 'Blanco', value: 'blanco', color: '#FFFFFF' },
  { name: 'Gris', value: 'gris', color: '#808080' },
  { name: 'Azul', value: 'azul', color: '#0066CC' },
  { name: 'Azul Marino', value: 'azul-marino', color: '#001f3f' },
  { name: 'Rojo', value: 'rojo', color: '#FF4136' },
  { name: 'Rosa', value: 'rosa', color: '#FF69B4' },
  { name: 'Verde', value: 'verde', color: '#2ECC40' },
  { name: 'Amarillo', value: 'amarillo', color: '#FFDC00' },
  { name: 'Naranja', value: 'naranja', color: '#FF851B' },
  { name: 'Morado', value: 'morado', color: '#B10DC9' },
  { name: 'Marrón', value: 'marron', color: '#8B4513' },
]

// Fonction pour obtenir la couleur d'évaluation
const getConditionColor = (value: number) => {
  if (value >= 9) return '#059669'
  if (value >= 7) return '#fbbf24'
  return '#ef4444'
}

// Fonction pour obtenir le label d'évaluation
const getConditionLabel = (value: number) => {
  if (value >= 9) return 'Excelente'
  if (value >= 7) return 'Bueno'
  if (value >= 5) return 'Regular'
  return 'Malo'
}

// Fonction pour formater la date
const formatDate = (date: Date | string) => {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Fonctions pour gérer les favoris
const checkIfFavorited = async (productId: string, userId: string): Promise<boolean> => {
  if (!userId || userId === "guest") return false;
  try {
    const db = getFirestore(app);
    const favoriteDoc = await getDoc(doc(db, 'favorites', `${userId}_${productId}`));
    return favoriteDoc.exists();
  } catch (error) {
    // logger.error('Erreur lors de la vérification des favoris:', error);
    return false;
  }
};

const addToFavorites = async (productId: string, userId: string, product: Product) => {
  try {
    const db = getFirestore(app);
    const favoriteData = {
      userId,
      productId,
      productTitle: product.title,
      productPrice: product.price,
      productImage: product.images?.[0] || product.image,
      productBrand: product.brand,
      /** Obligatoire pour firestore.rules (hasAll userId, productId, createdAt) */
      createdAt: serverTimestamp(),
      addedAt: serverTimestamp(),
    };
    
    const batch = writeBatch(db);
    batch.set(doc(db, 'favorites', `${userId}_${productId}`), favoriteData);
    batch.update(doc(db, 'products', productId), { favoriteCount: increment(1) });
    await batch.commit();
    logger.log('Produit ajouté aux favoris');
  } catch (error) {
    logger.error('Erreur lors de l\'ajout aux favoris:', error);
    throw error;
  }
};

const removeFromFavorites = async (productId: string, userId: string) => {
  try {
    const db = getFirestore(app);
    const favRef = doc(db, 'favorites', `${userId}_${productId}`);
    const productRef = doc(db, 'products', productId);

    /**
     * Si favoriteCount est déjà 0 (données désync.), increment(-1) vise -1 et
     * firestore.rules (favoriteCount >= 0) refuse → tout le batch échoue.
     * On ne décrémente que lorsque prev > 0 ; on supprime toujours le doc favori s’il existe.
     */
    await runTransaction(db, async (transaction) => {
      const favSnap = await transaction.get(favRef);
      const productSnap = await transaction.get(productRef);
      if (!favSnap.exists()) return;

      transaction.delete(favRef);
      if (!productSnap.exists()) return;

      const prev = productSnap.data()?.favoriteCount;
      const prevNum = typeof prev === 'number' ? prev : 0;
      if (prevNum > 0) {
        transaction.update(productRef, { favoriteCount: increment(-1) });
      }
    });
    logger.log('Produit retiré des favoris');
  } catch (error) {
    logger.error('Erreur lors de la suppression des favoris:', error);
    throw error;
  }
};

interface RouteParams {
  productId: string
}

export const ProductDetailScreen: React.FC = () => {
  const route = useRoute()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'ProductDetail'>>()
  const { productId } = route.params as RouteParams
  
  logger.log('🔍 ProductDetailScreen - route.params:', route.params);
  logger.log('🔍 ProductDetailScreen - productId:', productId);
  logger.log('🔍 ProductDetailScreen - productId type:', typeof productId);

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string>('')

  useEffect(() => {
    loadProduct()
  }, [productId])

  const loadProduct = async () => {
    try {
      setLoading(true)
      logger.log('Chargement du produit avec ID:', productId)
      
      // Vérification de sécurité pour productId
      if (!productId || typeof productId !== 'string' || productId.trim() === '') {
        logger.error('❌ ProductDetailScreen - productId invalide:', productId);
        setLoading(false);
        return;
      }
      
      const data = await getProduct(productId)
      logger.log('Données du produit récupérées:', data)
      if (data) {
        setProduct(data)
        
        // Sélectionner automatiquement la taille si il n'y en a qu'une
        if (data.stock && data.stock.length === 1) {
          setSelectedSize(data.stock[0]?.talla || '')
        }
        
        // Vérifier si le produit est dans les favoris
        const user = auth.currentUser
        if (user) {
          const favorited = await checkIfFavorited(productId, user.uid)
          setIsFavorited(favorited)
        }
      } else {
        logger.log('Aucune donnée récupérée pour le produit')
      }
    } catch (error) {
      logger.error('Erreur lors du chargement du produit:', error)
      Alert.alert('Erreur', 'Impossible de charger le produit')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async () => {
    const user = auth.currentUser
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour ajouter aux favoris')
      return
    }

    try {
      if (isFavorited) {
        await removeFromFavorites(productId, user.uid)
        setIsFavorited(false)
        setProduct((p) =>
          p
            ? {
                ...p,
                likes: Math.max(0, (typeof p.likes === 'number' ? p.likes : 0) - 1),
              }
            : p
        )
      } else {
        if (product) {
          await addToFavorites(productId, user.uid, product)
          setIsFavorited(true)
          setProduct((p) =>
            p
              ? {
                  ...p,
                  likes: (typeof p.likes === 'number' ? p.likes : 0) + 1,
                }
              : p
          )
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier les favoris')
    }
  }

  const handleShare = () => {
    if (product) {
      const message = `¡Mira este producto en RopaNova!\n\n${product.title}\nPrecio: ${formatPrice(product.price)}\n\n${product.description}`
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      Linking.openURL(whatsappUrl)
    }
  }

  const handleContactSeller = async () => {
    const user = auth.currentUser
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour contacter le vendeur')
      return
    }

    if (!product?.seller?.id) {
      Alert.alert('Erreur', 'Impossible de contacter le vendeur')
      return
    }

    try {
      // Créer ou récupérer une conversation avec le vendeur
      const conversationId = await createConversationIfNeeded(
        user.uid, 
        product.seller.id, 
        { id: product.id, title: product.title }
      )
      
      // Naviguer vers le chat avec les informations du produit
      navigation.navigate('Chat', { 
        conversationId,
        productInfo: {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] || product.image,
          sellerId: product.seller.id,
          sellerName: product.seller.name,
          selectedSize: selectedSize || (product.stock && product.stock.length === 1 ? product.stock[0].talla : undefined)
        }
      })
    } catch (error) {
      logger.error('Erreur lors de la navigation vers le chat:', error)
      Alert.alert('Erreur', 'Impossible d\'ouvrir le chat')
    }
  }

  const handleBuyNow = () => {
    if (product?.stock && product.stock.length > 1) {
      if (!selectedSize) {
        Alert.alert(
          'Selección requerida', 
          'Por favor selecciona una talla antes de Comprar'
        )
        return
      }
    }
    
    const sizeToBuy = selectedSize || (product?.stock && product.stock.length === 1 ? product.stock[0].talla : '')
    if (sizeToBuy) {
      navigation.navigate('Buy', { 
        productId, 
        selectedSize: sizeToBuy,
        selectedQuantity: 1
      })
    } else {
      Alert.alert('Erreur', 'Aucune taille disponible pour ce produit')
    }
  }



  const handleViewSellerProfile = () => {
    const sellerId = product?.seller?.id
    if (sellerId) {
      navigation.navigate('UserProfile', { viewUserId: sellerId })
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="refresh" size={32} color="#059669" />
          <Text style={styles.loadingText}>Cargando producto...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle" size={32} color="#ef4444" />
          <Text style={styles.errorText}>Producto no encontrado</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="flag-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <EnhancedSwipeGallery
          images={(product.images || [product.image]).filter(img => img && img.trim() !== '')}
          title={product.title}
          onShare={handleShare}
          onFavorite={handleToggleFavorite}
          isFavorited={isFavorited}
        />

        <View style={styles.detailsContainer}>
          {/* Price and Title */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <View style={styles.priceInfo}>
                <Text style={styles.price}>{formatPrice(product.price)}</Text>
                {product.originalPrice && (
                  <Text style={styles.originalPrice}>
                    {formatPrice(product.originalPrice)}
                  </Text>
                )}
              </View>
              <View style={styles.priceActions}>
                <TouchableOpacity 
                  style={styles.priceActionButton} 
                  onPress={handleToggleFavorite}
                >
                  <Ionicons
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFavorited ? '#ef4444' : '#6b7280'}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.priceActionButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.title}>{product.title}</Text>
            <View style={styles.badges}>
              {product.brand && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{product.brand}</Text>
                </View>
              )}
              {product.sizes && product.sizes.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{product.sizes.join(', ')}</Text>
                </View>
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{product.condition}</Text>
              </View>
            </View>
            {/* Localidad y Tipo de Cuenta */}
            <View style={styles.locationContainer}>
              {/* Tipo de Cuenta */}
              {product.accountType && (
                <View style={styles.accountTypeContainer}>
                  {product.accountType === 'virtual' ? (
                    <View style={styles.virtualStoreBadge}>
                      <Text style={styles.virtualStoreText}>Tienda Virtual</Text>
                    </View>
                  ) : (
                    <Text style={styles.accountTypeText}>
                      {product.accountType === 'fisica' ? 'Física' : 
                       product.accountType === 'privado' ? 'Privado' : product.accountType}
                    </Text>
                  )}
                </View>
              )}
              {/* Localidad */}
              {(product.province || product.city) && (
                <View style={styles.locationBadge}>
                  <Ionicons name="location-outline" size={14} color="#3b82f6" />
                  <Text style={styles.locationBadgeText}>
                    {[product.province, product.city].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del Producto</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Categoría:</Text>
                <Text style={styles.detailValue}>{product.category}</Text>
              </View>
              {product.subcategory && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Subcategoría:</Text>
                  <Text style={styles.detailValue}>{product.subcategory}</Text>
                </View>
              )}
              {product.brand && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Marca:</Text>
                  <Text style={styles.detailValue}>{product.brand}</Text>
                </View>
              )}
              {product.material && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Material:</Text>
                  <Text style={styles.detailValue}>{product.material}</Text>
                </View>
              )}
              {product.sizes && product.sizes.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Talla:</Text>
                  <Text style={styles.detailValue}>{product.sizes.join(', ')}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Condición:</Text>
                <Text style={styles.detailValue}>{product.condition}</Text>
              </View>
              {product.autenticidad && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Autenticidad:</Text>
                  <Text style={styles.detailValue}>{product.autenticidad}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Publicado:</Text>
                <Text style={styles.detailValue}>
                  {product.createdAt ? formatDate(product.createdAt) : product.postedDate}
                </Text>
              </View>
            </View>
          </View>

          {/* Talla Seleccionada */}
          {product.stock && product.stock.length > 0 && (
            <View style={styles.section}>
                              <Text style={styles.sectionTitle}>
                  {product.stock?.length === 1 ? 'Talla Disponible' : 'Selecciona tu Talla'}
                </Text>
              {product.stock?.length > 1 && (
                <Text style={styles.sectionSubtitle}>
                  Toca una talla para seleccionarla
                </Text>
              )}
              <View style={styles.stockContainer}>
                {product.stock.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.stockItem,
                      selectedSize === item.talla && styles.selectedStockItem
                    ]}
                    onPress={() => {
                      if (product.stock && product.stock.length > 1) {
                        setSelectedSize(item.talla)
                      }
                    }}
                    disabled={product.stock && product.stock.length === 1}
                  >
                    <Text style={[
                      styles.stockTalla,
                      selectedSize === item.talla && styles.selectedStockTalla
                    ]}>
                      {item.talla}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Medidas */}
          {product.measurements && (
            (product.measurements.chest || 
             product.measurements.waist || 
             product.measurements.length || 
             product.measurements.shoulders || 
             product.measurements.hips || 
             product.measurements.inseam) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medidas</Text>
                <View style={styles.measurementsContainer}>
                  {product.measurements.chest && (
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>Pecho/Busto:</Text>
                      <Text style={styles.measurementValue}>{product.measurements.chest} cm</Text>
                    </View>
                  )}
                  {product.measurements.waist && (
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>Cintura:</Text>
                      <Text style={styles.measurementValue}>{product.measurements.waist} cm</Text>
                    </View>
                  )}
                  {product.measurements.length && (
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>Largo:</Text>
                      <Text style={styles.measurementValue}>{product.measurements.length} cm</Text>
                    </View>
                  )}
                  {product.measurements.shoulders && (
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>Hombros:</Text>
                      <Text style={styles.measurementValue}>{product.measurements.shoulders} cm</Text>
                    </View>
                  )}
                  {product.measurements.hips && (
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>Cadera:</Text>
                      <Text style={styles.measurementValue}>{product.measurements.hips} cm</Text>
                    </View>
                  )}
                  {product.measurements.inseam && (
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>Entrepierna:</Text>
                      <Text style={styles.measurementValue}>{product.measurements.inseam} cm</Text>
                    </View>
                  )}
                </View>
              </View>
            )
          )}

          {/* Condition Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado del Producto</Text>
            <View style={styles.conditionDetails}>
              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>Estado General:</Text>
                <Text style={styles.conditionValue}>{product.condition}</Text>
              </View>
              {product.estadoGeneral && (
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Evaluación General:</Text>
                  <View style={styles.conditionRating}>
                    <Text style={[styles.conditionValue, { color: getConditionColor(product.estadoGeneral) }]}>
                      {product.estadoGeneral}/10 - {getConditionLabel(product.estadoGeneral)}
                    </Text>
                    <View style={[styles.conditionBar, { backgroundColor: '#e5e7eb' }]}>
                      <View 
                        style={[
                          styles.conditionBarFill, 
                          { 
                            width: `${(product.estadoGeneral / 10) * 100}%`,
                            backgroundColor: getConditionColor(product.estadoGeneral)
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              )}
              {product.estadoTelaMaterial && (
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Estado de la Tela:</Text>
                  <View style={styles.conditionRating}>
                    <Text style={[styles.conditionValue, { color: getConditionColor(product.estadoTelaMaterial) }]}>
                      {product.estadoTelaMaterial}/10 - {getConditionLabel(product.estadoTelaMaterial)}
                    </Text>
                    <View style={[styles.conditionBar, { backgroundColor: '#e5e7eb' }]}>
                      <View 
                        style={[
                          styles.conditionBarFill, 
                          { 
                            width: `${(product.estadoTelaMaterial / 10) * 100}%`,
                            backgroundColor: getConditionColor(product.estadoTelaMaterial)
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Delivery and Shipping */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entrega y Envío</Text>
            <View style={styles.deliveryDetails}>
              
              {/* Métodos de Entrega con Información Relacionada */}
              {product.tipoDeEntregaPermitida && (
                <View style={styles.deliveryMethodsSection}>
                  <Text style={styles.deliverySubtitle}>Métodos de entrega disponibles:</Text>
                  <View style={styles.deliveryMethodsContainer}>
                    
                    {/* Recogida en Persona */}
                    {product.tipoDeEntregaPermitida.recogidaEnPersona && (
                      <View style={styles.deliveryMethodGroup}>
                        <View style={styles.deliveryMethodBadge}>
                          <Ionicons name="person" size={20} color="#059669" />
                          <Text style={styles.deliveryMethodText}>Recogida en persona</Text>
                          <View style={styles.freeBadge}>
                            <Text style={styles.freeBadgeText}>GRATIS</Text>
                          </View>
                        </View>
                        {/* Información de recogida */}
                        {product.ciudadRecogidaEnPersona && (
                          <View style={styles.methodDetails}>
                            <View style={styles.pickupInfo}>
                              <View style={styles.pickupLocation}>
                                <Ionicons name="location" size={16} color="#059669" />
                                <Text style={styles.pickupLocationText}>{product.ciudadRecogidaEnPersona}</Text>
                              </View>
                              <View style={styles.pickupBadge}>
                                <Ionicons name="time" size={14} color="#059669" />
                                <Text style={styles.pickupBadgeText}>Acordar con vendedor</Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                    
                    {/* Envío a Domicilio */}
                    {product.tipoDeEntregaPermitida.envioADomicilio && (
                      <View style={styles.deliveryMethodGroup}>
                        <View style={styles.deliveryMethodBadge}>
                          <Ionicons name="home" size={20} color="#3b82f6" />
                          <Text style={styles.deliveryMethodText}>Envío a domicilio</Text>
                          {product.ciudadesParaEnvioADomicilio && product.ciudadesParaEnvioADomicilio.length > 0 && (
                            <View style={styles.priceBadge}>
                              <Text style={styles.priceBadgeText}>
                                Desde {formatPrice(parseInt(product.ciudadesParaEnvioADomicilio[0].precio))}
                              </Text>
                            </View>
                          )}
                        </View>
                        {/* Costos de envío por ciudad */}
                        {product.ciudadesParaEnvioADomicilio && product.ciudadesParaEnvioADomicilio.length > 0 && (
                          <View style={styles.methodDetails}>
                            <Text style={styles.methodDetailsTitle}>Costos por ciudad:</Text>
                            <View style={styles.deliveryCostsContainer}>
                              {product.ciudadesParaEnvioADomicilio.map((cityData, index) => (
                                <View key={index} style={styles.deliveryCostItem}>
                                  <View style={styles.cityInfo}>
                                    <Ionicons name="location" size={14} color="#6b7280" />
                                    <Text style={styles.cityName}>{cityData.ciudad}</Text>
                                  </View>
                                  <View style={styles.costBadge}>
                                    <Text style={styles.costBadgeText}>{formatPrice(parseInt(cityData.precio))}</Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                            {/* Avertissement de disponibilité */}
                            <View style={styles.availabilityWarning}>
                              <Ionicons name="information-circle" size={14} color="#059669" />
                              <Text style={styles.availabilityWarningText}>
                                Solo disponible en {product.ciudadesParaEnvioADomicilio.map(city => city.ciudad).join(', ')}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                    
                    {/* Envío a Punto de Recogida */}
                    {product.tipoDeEntregaPermitida.envioAPuntoDeRecogida && (
                      <View style={styles.deliveryMethodGroup}>
                        <View style={styles.deliveryMethodBadge}>
                          <Ionicons name="location" size={20} color="#f59e0b" />
                          <Text style={styles.deliveryMethodText}>Envío a punto de recogida</Text>
                          <View style={styles.freeBadge}>
                            <Text style={styles.freeBadgeText}>GRATIS</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              {/* Instructions de livraison */}
              {product.instruccionesParaEntrega && product.instruccionesParaEntrega.trim() !== '' && (
                <View style={styles.instructionsSection}>
                  <Text style={styles.deliverySubtitle}>Instrucciones de entrega:</Text>
                  <View style={styles.instructionsContainer}>
                    <Ionicons name="information-circle" size={16} color="#f59e0b" />
                    <Text style={styles.instructionsText}>{product.instruccionesParaEntrega}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Seller Profile */}
          {product.seller && (
            <View style={styles.section}>
              <SellerProfileCard 
                seller={product.seller}
                onPress={handleViewSellerProfile}
              />
            </View>
          )}

          {/* Safety Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Características de Seguridad</Text>
            <View style={styles.safetyFeatures}>
              <View style={styles.safetyFeature}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <Text style={styles.safetyText}>Transacción segura</Text>
              </View>
              <View style={styles.safetyFeature}>
                <Ionicons name="eye" size={20} color="#059669" />
                <Text style={styles.safetyText}>Verificación de identidad</Text>
              </View>
              <View style={styles.safetyFeature}>
                <Ionicons name="chatbubble" size={20} color="#059669" />
                <Text style={styles.safetyText}>Chat con el vendedor</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactSeller}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text style={styles.contactButtonText}>Mensaje</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={handleBuyNow}
        >
          <Text style={styles.buyButtonText}>Comprar Ahora</Text>
        </TouchableOpacity>
      </View>


    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
  },
  priceSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  priceActionButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 16,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  accountTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  virtualStoreBadge: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.3)',
  },
  virtualStoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9333ea',
  },
  accountTypeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  locationBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  quantityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  detailsList: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  stockContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stockItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedStockItem: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  stockTalla: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedStockTalla: {
    color: 'white',
    fontWeight: '600',
  },
  stockCantidad: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },

  measurementsContainer: {
    gap: 8,
  },
  measurementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  measurementValue: {
    fontSize: 14,
    color: '#111827',
  },
  conditionDetails: {
    gap: 12,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  conditionValue: {
    fontSize: 14,
    color: '#111827',
  },
  conditionRating: {
    flex: 1,
    marginLeft: 16,
  },
  conditionBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  conditionBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  deliveryDetails: {
    gap: 16,
  },
  deliveryMethodsSection: {
    marginBottom: 16,
  },
  deliverySubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  deliveryMethodsContainer: {
    gap: 20,
  },
  deliveryMethodGroup: {
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  methodDetails: {
    marginLeft: 16,
    gap: 8,
  },
  methodDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  deliveryMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deliveryMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  freeBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  priceBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  availabilityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    gap: 8,
  },
  availabilityWarningText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '500',
  },
  deliveryCostsSection: {
    marginBottom: 16,
  },
  deliveryCostsContainer: {
    gap: 8,
  },
  deliveryCostItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  cityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  costBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  costBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  pickupSection: {
    marginBottom: 16,
  },
  pickupInfo: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#059669',
  },
  pickupLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pickupLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  pickupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickupBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  instructionsSection: {
    marginBottom: 16,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  deliveryCities: {
    marginTop: 8,
  },
  deliveryCitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  deliveryCity: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 16,
  },
  pickupCity: {
    marginTop: 8,
  },
  pickupCityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  pickupCityText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 16,
  },
  deliveryInstructions: {
    marginTop: 8,
  },
  deliveryInstructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  deliveryInstructionsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  safetyFeatures: {
    gap: 12,
  },
  safetyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyText: {
    fontSize: 14,
    color: '#374151',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  buyButton: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  sizeSelectionSection: {
    marginBottom: 24,
  },
  sizeSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  sizeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sizeOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedSizeOption: {
    backgroundColor: '#059669',
    borderColor: '#047857',
    shadowOpacity: 0.2,
  },
  sizeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedSizeOptionText: {
    color: 'white',
    fontWeight: '700',
  },
  stockInfo: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '500',
  },
  quantitySection: {
    marginTop: 24,
  },
  quantitySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quantityButton: {
    width: 48,
    height: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    minWidth: 40,
    textAlign: 'center',
  },
  stockLimit: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#059669',
    borderRadius: 12,
    marginLeft: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0.1,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  // Styles pour le Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
}) 