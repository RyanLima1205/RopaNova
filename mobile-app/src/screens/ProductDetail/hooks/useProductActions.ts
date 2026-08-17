import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../../../App'
import { useFavorites } from '../../../contexts/FavoritesContext'
import { auth } from '../../../firebaseConfig'
import { createConversationIfNeeded } from '../../../services/chatService'
import { formatPrice } from '../../../utils/formatters'
import { ProductDetail } from '../../../types/product'
import { logger } from '../../../utils/logger'

type ProductDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>

/** Favori, partage, chat vendeur, achat, profil vendeur — toute la logique de données de l'écran. */
export function useProductActions(product: ProductDetail | null) {
  const navigation = useNavigation<ProductDetailNavigationProp>()
  const { isFavorited, toggleFavorite } = useFavorites()
  const [selectedSize, setSelectedSize] = useState('')

  // Sélection automatique quand une seule taille est disponible.
  useEffect(() => {
    if (product && product.variants.length === 1) {
      setSelectedSize(product.variants[0].size)
    } else {
      setSelectedSize('')
    }
  }, [product])

  const favorited = product ? isFavorited(product.info.id) : false
  const isOwnProduct = !!product && auth.currentUser?.uid === product.seller.id

  const requireAuth = (message: string): boolean => {
    if (auth.currentUser) return true
    Alert.alert('Inicio de sesión requerido', message)
    return false
  }

  const handleToggleFavorite = useCallback(async () => {
    if (!product) return
    if (!requireAuth('Inicia sesión para agregar a favoritos')) return
    try {
      await toggleFavorite(product.info.id, {
        title: product.info.title,
        price: product.pricing.price,
        images: product.gallery,
        brand: product.info.brand,
      })
    } catch {
      Alert.alert('Error', 'No se pudo actualizar tus favoritos')
    }
  }, [product, toggleFavorite])

  const handleShare = useCallback(() => {
    if (!product) return
    const message =
      `¡Mira este producto en RopaNova!\n\n${product.info.title}\n` +
      `Precio: ${formatPrice(product.pricing.price)}\n\n${product.info.description}`
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`)
  }, [product])

  const handleContactSeller = useCallback(async () => {
    if (!product) return
    if (!requireAuth('Inicia sesión para contactar al vendedor')) return
    try {
      const conversationId = await createConversationIfNeeded(auth.currentUser!.uid, product.seller.id, {
        id: product.info.id,
        title: product.info.title,
      })
      navigation.navigate('Chat', {
        conversationId,
        productInfo: {
          id: product.info.id,
          title: product.info.title,
          price: product.pricing.price,
          image: product.gallery[0] || '',
          sellerId: product.seller.id,
          sellerName: product.seller.storeName,
          selectedSize: selectedSize || undefined,
        },
      })
    } catch (err) {
      logger.error('Error al abrir el chat:', err)
      Alert.alert('Error', 'No se pudo abrir el chat')
    }
  }, [product, navigation, selectedSize])

  const handleBuyNow = useCallback(() => {
    if (!product) return
    if (product.variants.length > 1 && !selectedSize) {
      Alert.alert('Selección requerida', 'Por favor selecciona una talla antes de comprar')
      return
    }
    const sizeToBuy = selectedSize || product.variants[0]?.size || ''
    if (!sizeToBuy) {
      Alert.alert('Error', 'No hay tallas disponibles para este producto')
      return
    }
    navigation.navigate('Buy', { productId: product.info.id, selectedSize: sizeToBuy, selectedQuantity: 1 })
  }, [product, navigation, selectedSize])

  const handleViewSellerProfile = useCallback(() => {
    if (!product) return
    navigation.navigate('UserProfile', { viewUserId: product.seller.id })
  }, [product, navigation])

  return {
    selectedSize,
    setSelectedSize,
    favorited,
    isOwnProduct,
    handleToggleFavorite,
    handleShare,
    handleContactSeller,
    handleBuyNow,
    handleViewSellerProfile,
  }
}
