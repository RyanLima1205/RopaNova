import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeImage } from './SafeImage';
import { cleanProductImages, getUserAvatar } from '../utils/imageUtils';
import { formatPrice } from '../utils/formatters';
import { brandColors, radii, semanticColors, shadows, spacing, typography } from '../theme';

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
  showCondition?: boolean;
  /** Conservé pour compatibilité de props ; la marque n'apparaît plus sur cette carte compacte (voir fiche détaillée). */
  showBrand?: boolean;
  showRating?: boolean;
  showLocation?: boolean;
  /** Conservé pour compatibilité de props ; la date n'apparaît plus sur cette carte compacte (voir fiche détaillée). */
  showDate?: boolean;
  /** Cœur rouge (rempli) si l’utilisateur connecté a ce produit en favoris */
  isFavorited?: boolean;
}

const MAX_VISIBLE_SIZES = 4;

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onPress,
  onLongPress,
  style,
  showPrice = true,
  showCondition = true,
  showRating = false,
  showLocation = false,
  isFavorited = false,
}) => {
  const sizes = product.talla && product.talla.length > 0 ? product.talla : ['Única'];
  const visibleSizes = sizes.slice(0, MAX_VISIBLE_SIZES);
  const hiddenSizesCount = sizes.length - visibleSizes.length;

  const isSold = product.status === 'sold';
  const isInactive = product.status === 'inactive';

  const seller = product.seller;
  const sellerName = seller
    ? (seller.accountType === 'fisica' || seller.accountType === 'virtual'
        ? (seller.storeName || 'Tienda')
        : seller.name || 'Vendedor')
    : '';

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

        <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.7}>
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorited ? semanticColors.error : brandColors.textSecondary}
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

        {showPrice && (
          <Text style={styles.price}>
            {formatPrice(Number(product.price) || 0)}
          </Text>
        )}

        <View style={styles.metadataSection}>
          <Text style={styles.condition} numberOfLines={1}>
            {showCondition ? (product.condition || 'Sin condición') : ' '}
          </Text>
          <View style={styles.sizeBadges}>
            {visibleSizes.map((size, index) => (
              <View key={index} style={styles.sizeBadge}>
                <Text style={styles.sizeText}>{size}</Text>
              </View>
            ))}
            {hiddenSizesCount > 0 && (
              <View style={styles.sizeBadge}>
                <Text style={styles.sizeText}>+{hiddenSizesCount}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sellerFooter}>
          {showRating && seller && (
            <>
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
                      <Ionicons name="checkmark" size={9} color={brandColors.white} />
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
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  card: {
    width: '49.5%',
    marginBottom: spacing.sm,
    backgroundColor: brandColors.surface,
    borderRadius: radii.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: brandColors.border,
    ...shadows.card,
  },
  imageSection: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: brandColors.surfaceSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 10,
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
    padding: spacing.md,
  },
  title: {
    fontFamily: typography.cardTitle.fontFamily,
    color: brandColors.textPrimary,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  price: {
    fontFamily: typography.cardTitle.fontFamily,
    color: brandColors.primaryUI,
    fontSize: 17,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  metadataSection: {
    minHeight: 44,
    marginBottom: spacing.sm,
  },
  condition: {
    fontFamily: typography.caption.fontFamily,
    color: brandColors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 4,
  },
  sizeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sizeBadge: {
    backgroundColor: brandColors.surfaceSecondary,
    borderRadius: radii.small,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  sizeText: {
    fontFamily: typography.bodyMedium.fontFamily,
    color: brandColors.textSecondary,
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: brandColors.border,
    marginBottom: spacing.sm,
  },
  sellerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },
  sellerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  sellerText: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    flexShrink: 1,
    fontFamily: typography.bodyMedium.fontFamily,
    color: brandColors.textPrimary,
    fontSize: 13,
    marginRight: 4,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: brandColors.primaryUI,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 3,
  },
  locationText: {
    fontFamily: typography.caption.fontFamily,
    color: brandColors.textSecondary,
    fontSize: 11,
  },
});
