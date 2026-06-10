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
  variant?: 'standard' | 'compact' | 'detailed';
  showPrice?: boolean;
  showCondition?: boolean;
  showBrand?: boolean;
  showRating?: boolean;
  showLocation?: boolean;
  showDate?: boolean;
  /** Cœur rouge (rempli) si l’utilisateur connecté a ce produit en favoris */
  isFavorited?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onLongPress,
  style,
  variant = 'standard',
  showPrice = true,
  showCondition = true,
  showBrand = true,
  showRating = false,
  showLocation = false,
  showDate = false,
  isFavorited = false,
}) => {
  // Fonction pour formater la date
  const formatPostedDate = (createdAt: any) => {
    if (!createdAt) return '';
    let date: Date;
    if (typeof createdAt === 'object' && createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else {
      date = new Date(createdAt);
    }
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    
    if (diffDays <= 7) {
      const days = diffDays - 1;
      return days === 1 ? 'Hace 1 día' : `Hace ${days} días`;
    }
    
    if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`;
    }
    
    const months = Math.floor(diffDays / 30);
    return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.productCard, 
        variant === 'compact' ? styles.productCardCompact : null,
        style
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.productImageContainer,
        variant === 'compact' ? styles.productImageContainerCompact : null
      ]}>
        <SafeImage 
          uri={cleanProductImages(product)[0] || ''}
          style={styles.productImage}
          fallbackText="Sin Imagen"
          />
        
        <View style={styles.likesBadge}>
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={14}
            color={isFavorited ? '#ef4444' : '#ffffff'}
          />
        </View>
        
        {/* Overlay pour produits vendus */}
        {product.status === 'sold' && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>Vendido</Text>
          </View>
        )}
        
        {/* Overlay pour produits inactifs */}
        {product.status === 'inactive' && (
          <View style={styles.inactiveOverlay}>
            <Text style={styles.inactiveText}>Inactivo</Text>
          </View>
        )}
      </View>
      
      <View style={[
        styles.productInfo,
        variant === 'compact' ? styles.productInfoCompact : null
      ]}>
        <View style={styles.productMainContent}>
          {/* Titre du produit */}
          <Text style={[
            styles.productTitle,
            variant === 'compact' ? styles.productTitleCompact : null
          ]} numberOfLines={1}>
            {product.title || 'Sin título'}
        </Text>
        
        {/* Prix */}
        {showPrice && (
          <Text style={styles.productPrice}>
            RD${(Number(product.price) || 0).toLocaleString()}
          </Text>
        )}
        
        {/* Condition */}
        {showCondition && (
          <Text style={styles.productCondition}>
            {product.condition || 'Sin condición'}
          </Text>
        )}
        
        {/* Tailles */}
        {(() => {
          // Vérifier si talla existe et a des données
          if (product.talla && Array.isArray(product.talla) && product.talla.length > 0) {
            return (
              <View style={styles.sizesContainer}>
                {product.talla.map((size, index) => (
                  <View key={index} style={styles.sizeBadge}>
                    <Text style={styles.sizeText}>{size}</Text>
                  </View>
                ))}
              </View>
            );
          }
          
          // Si pas de tailles, afficher un badge par défaut
          return (
            <View style={styles.sizesContainer}>
              <View style={styles.sizeBadge}>
                <Text style={styles.sizeText}>Única</Text>
              </View>
            </View>
          );
        })()}
        
        {/* Ligne du bas avec marque à gauche et date à droite */}
        <View style={styles.bottomRow}>
          {/* Marque */}
          {showBrand && product.brand && product.brand !== 'Sin marca' ? (
            <Text style={styles.productBrand}>{product.brand}</Text>
          ) : (
            <View style={{ flex: 1 }}></View>
          )}
          
          {/* Date de publication (conditionnelle) */}
          {showDate && (
            <Text style={styles.productDate}>
              {formatPostedDate(product.createdAt)}
            </Text>
          )}
        </View>
        
        {/* Date de publication pour le cas showDate activé (fallback) */}
        {showDate && !showBrand && (
          <Text style={styles.productDate}>
            {formatPostedDate(product.createdAt)}
          </Text>
        )}
        
        </View>
        
        <View style={styles.sellerSection}>
          {/* Informations du vendeur */}
          {showRating && product.seller && (
            <View style={styles.sellerContainer}>
              <SafeImage 
                uri={getUserAvatar(product.seller)}
                style={styles.sellerAvatar}
                fallbackText="U"
              />
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameContainer}>
                  <Text style={styles.sellerName}>
                    {product.seller.accountType === 'fisica' || product.seller.accountType === 'virtual' 
                      ? (product.seller.storeName || 'Tienda') 
                      : product.seller.name || 'Vendedor'
                    }
                  </Text>
                  {product.seller.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={10} color="white" />
                    </View>
                  )}
                </View>
              </View>
          </View>
          )}
          
          {/* Localisation (sous les informations du vendeur) */}
          {showLocation && (
            <Text style={styles.productLocation}>
              📍 Santiago, RD
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  productCard: {
    width: '49.8%', // Augmenté de 49.5% à 49.8% pour utiliser plus d'espace
    height: 480,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productCardCompact: {
    width: '49.8%', // Même largeur que standard pour 2 cartes par ligne
    height: 350, // Plus court que standard (480px) mais garde layout vertical
    flexDirection: 'column', // Garde le layout vertical comme standard
  },
  productImageContainer: {
    width: '100%',
    height: '68%', // Réduit de 70% à 68% pour plus d'espace infos
    position: 'relative',
  },
  productImageContainerCompact: {
    width: '100%', // Pleine largeur comme standard
    height: '75%', // Plus d'espace pour l'image en compact
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 8, // Augmenté de 6 à 8
    borderTopRightRadius: 8, // Augmenté de 6 à 8
  },
  likesBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderTopLeftRadius: 8, // Augmenté de 6 à 8
    borderTopRightRadius: 8, // Augmenté de 6 à 8
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderTopLeftRadius: 8, // Augmenté de 6 à 8
    borderTopRightRadius: 8, // Augmenté de 6 à 8
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  productInfo: {
    height: '32%',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    justifyContent: 'space-between', // Distribuer l'espace entre contenu et vendeur
    flexDirection: 'column',
  },
  productInfoCompact: {
    width: '100%', // Pleine largeur comme standard
    height: '25%', // Moins d'espace pour les infos (plus compact)
    borderTopWidth: 1, // Garde la bordure supérieure
    borderTopColor: '#f3f4f6',
    padding: 6, // Padding réduit pour version compact
  },
  productMainContent: {
    flex: 1, // Prend l'espace disponible
  },
  sellerSection: {
    // Section fixe en bas pour le vendeur et localisation
  },
  productTitle: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 16,
    marginBottom: 1, // Réduit de 2 à 1
    lineHeight: 18,
    marginTop: 0,
  },
  productTitleCompact: {
    fontSize: 14, // Plus petit pour compact
    lineHeight: 16,
  },
  productPrice: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 1, // Réduit de 2 à 1
  },
  productCondition: {
    color: '#6b7280',
    fontSize: 10,
    marginBottom: 1, // Réduit de 2 à 1
  },
  productBrand: {
    color: '#9ca3af',
    fontSize: 9, // Réduit de 10 à 9
    flex: 1, // Pour prendre l'espace disponible à gauche
  },
  productDate: {
    color: '#9ca3af',
    fontSize: 9, // Réduit de 10 à 9 pour correspondre à la marque
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 1, // Réduit de 2 à 1
  },
  productLocation: {
    color: '#6b7280',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'left', // Aligner la localisation à gauche
    paddingBottom: 2, // Petit espace en bas pour éviter la coupure
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 1,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    minHeight: 32, // Hauteur minimale fixe pour l'alignement
  },
  sellerAvatar: {
    width: 28, // Augmenté de 24 à 28
    height: 28, // Augmenté de 24 à 28
    borderRadius: 14, // Augmenté de 12 à 14
    marginRight: 8, // Augmenté de 6 à 8
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 11, // Augmenté de 10 à 11
    fontWeight: '500',
    color: '#374151',
    marginRight: 4,
  },
  verifiedBadge: {
    width: 16, // Augmenté de 14 à 16
    height: 16, // Augmenté de 14 à 16
    borderRadius: 8, // Augmenté de 7 à 8
    backgroundColor: '#1d9bf0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 1, // Réduit de 2 à 1
  },
  sizeBadge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10, // Réduit de 12 à 10
    paddingHorizontal: 6, // Réduit de 8 à 6
    paddingVertical: 3, // Réduit de 4 à 3
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sizeText: {
    fontSize: 9, // Réduit de 10 à 9
    fontWeight: '500',
    color: '#374151',
  },
}); 