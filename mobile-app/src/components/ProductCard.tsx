import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeImage } from './SafeImage';
import { cleanProductImages, getUserAvatar } from '../utils/imageUtils';
import { formatPrice } from '../utils/formatters';
import { brandColors, fontFamilies, radii, semanticColors, spacing, typography } from '../theme';
import { auth } from '../firebaseConfig';
import { useFavorites } from '../contexts/FavoritesContext';

// Interface pour les données du produit
interface UserListing {
  id: string;
  title: string;
  price: string;
  condition: string;
  images: string[];
  createdAt: any;
  category: string;
  subcategory: string;
  brand: string;
  color: string[];
  talla?: string[];
  status?: 'active' | 'sold' | 'inactive';
  seller?: {
    id: string;
    name: string;
    storeName?: string;
    accountType: string;
    avatar?: string;
    verified?: boolean;
  };
}

// Props du composant ProductCard
interface ProductCardProps {
  product: UserListing;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
  /** Conservé pour compatibilité d'appel ; toutes les cartes partagent désormais la même mise en page uniforme. */
  variant?: 'standard' | 'compact' | 'detailed';
  showPrice?: boolean;
  /** Conservé pour compatibilité de props ; la condition n'apparaît plus sur cette carte compacte (voir fiche détaillée). */
  showCondition?: boolean;
  /** Conservé pour compatibilité de props ; la marque n'apparaît plus sur cette carte compacte (voir fiche détaillée). */
  showBrand?: boolean;
  showRating?: boolean;
  showLocation?: boolean;
  /** Conservé pour compatibilité de props ; la date n'apparaît plus sur cette carte compacte (voir fiche détaillée). */
  showDate?: boolean;
}

const MAX_VISIBLE_SIZES = 4;

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onPress,
  onLongPress,
  style,
  showPrice = true,
  showRating = false,
  showLocation = false,
}) => {
  const sizes = product.talla && product.talla.length > 0 ? product.talla : ['Única'];
  const visibleSizes = sizes.slice(0, MAX_VISIBLE_SIZES);
  const hiddenSizesCount = sizes.length - visibleSizes.length;
  const sizesLabel = sizes.length === 1
    ? `Talla ${sizes[0]}`
    : visibleSizes.join(' · ') + (hiddenSizesCount > 0 ? ` · +${hiddenSizesCount}` : '');

  const isSold = product.status === 'sold';
  const isInactive = product.status === 'inactive';

  const seller = product.seller;
  const sellerName = seller
    ? (seller.accountType === 'fisica' || seller.accountType === 'virtual'
        ? (seller.storeName || 'Tienda')
        : seller.name || 'Vendedor')
    : '';

  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(product.id);

  const handleToggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Inicio de sesión requerido', 'Inicia sesión para agregar a favoritos');
      return;
    }
    try {
      await toggleFavorite(product.id, {
        title: product.title,
        price: Number(product.price) || 0,
        images: product.images,
        brand: product.brand,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar tus favoritos');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageSection}>
        <SafeImage
          uri={cleanProductImages(product)[0] || ''}
          style={styles.image}
          resizeMode="cover"
          fallbackText="Sin Imagen"
        />

        <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.7} onPress={handleToggleFavorite}>
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={16}
            color={favorited ? semanticColors.error : brandColors.textSecondary}
          />
        </TouchableOpacity>

        {(isSold || isInactive) && (
          <View style={styles.statusOverlay} pointerEvents="none">
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{isSold ? 'VENDIDO' : 'INACTIVO'}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.contentSection}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {product.title || 'Sin título'}
        </Text>

        <Text style={styles.price} numberOfLines={1}>
          {showPrice ? formatPrice(Number(product.price) || 0) : ''}
        </Text>

        <Text style={styles.metaLine} numberOfLines={1}>
          {sizesLabel}
        </Text>

        {showRating && seller && (
          <View style={styles.sellerFooter}>
            <SafeImage
              uri={getUserAvatar(seller)}
              style={styles.sellerAvatar}
              fallbackText="U"
            />
            <View style={styles.sellerText}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName} numberOfLines={1}>
                  {sellerName}
                </Text>
                {seller.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={8} color={brandColors.white} />
                  </View>
                )}
              </View>
              {showLocation && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={11} color={brandColors.textSecondary} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    Santiago, RD
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  card: {
    width: '48%',
    marginBottom: spacing.sm,
    backgroundColor: brandColors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  imageSection: {
    width: '100%',
    aspectRatio: 0.64,
    position: 'relative',
    backgroundColor: '#F6F7F9',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F6F7F9',
  },
  favoriteButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: brandColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#101828',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 12,
  },
  statusBadge: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderRadius: radii.small,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: brandColors.white,
    fontFamily: typography.cardTitle.fontFamily,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {
    fontFamily: typography.cardTitle.fontFamily,
    color: brandColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    height: 18,
    marginBottom: 1,
  },
  price: {
    fontFamily: fontFamilies.montserratBold,
    color: brandColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    height: 24,
    marginBottom: 3,
  },
  metaLine: {
    fontFamily: fontFamilies.montserratMedium,
    color: brandColors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    height: 18,
    marginBottom: 12,
  },
  sellerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  sellerText: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
  },
  sellerName: {
    flexShrink: 1,
    fontFamily: typography.bodyMedium.fontFamily,
    color: brandColors.textPrimary,
    fontSize: 13,
    marginRight: 4,
  },
  verifiedBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: brandColors.primaryUI,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    marginTop: 2,
    gap: 3,
  },
  locationText: {
    fontFamily: typography.caption.fontFamily,
    color: brandColors.textSecondary,
    fontSize: 11,
  },
});
