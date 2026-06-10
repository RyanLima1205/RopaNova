import React from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Seller } from '../types'

// Fonction pour formater la date
const formatDate = (date: Date | string) => {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    })
  }
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long'
  })
}

interface SellerProfileCardProps {
  seller: Seller
  onPress: () => void
}

/** Handle sans @ en tête (données Firestore souvent sans @) */
const handleWithoutAt = (username: string | undefined): string =>
  (username || '').trim().replace(/^@+/, '')

/** Affichage type réseau social */
const atHandle = (username: string | undefined): string => {
  const h = handleWithoutAt(username)
  return h ? `@${h}` : ''
}

const displaySellerTitle = (seller: Seller): string => {
  if (seller.accountType === 'privado') {
    return atHandle(seller.username) || 'Vendedor'
  }
  const hasStore =
    (seller.accountType === 'virtual' || seller.accountType === 'fisica') &&
    seller.storeName &&
    seller.storeName.trim().length > 0
  if (hasStore) return seller.storeName!.trim()
  const parts = [seller.name, seller.lastname].filter(Boolean)
  return parts.join(' ').trim() || atHandle(seller.username) || 'Vendedor'
}

export const SellerProfileCard: React.FC<SellerProfileCardProps> = ({
  seller,
  onPress,
}) => {
  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? '#fbbf24' : '#d1d5db'}
        />
      )
    }
    return stars
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Image source={{ uri: seller.avatar }} style={styles.avatar} />
        <View style={styles.sellerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {displaySellerTitle(seller)}
            </Text>
            {seller.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
            )}
          </View>
          {seller.accountType !== 'privado' && (
            <Text style={styles.username}>{atHandle(seller.username)}</Text>
          )}
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>{renderStars(seller.rating)}</View>
            <Text style={styles.ratingText}>
              {seller.rating} ({seller.reviewCount} reseñas)
            </Text>
          </View>
          
          {/* Informations de localisation et membre depuis */}
          <View style={styles.locationInfo}>
            {(seller.city || seller.province) && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#6b7280" />
                <Text style={styles.locationText}>
                  {[seller.province, seller.city].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
            {seller.distance && (
              <View style={styles.distanceRow}>
                <Ionicons name="navigate-outline" size={14} color="#3b82f6" />
                <Text style={styles.distanceText}>{seller.distance} km</Text>
              </View>
            )}
            {seller.memberSince && (
              <View style={styles.memberSinceRow}>
                <Ionicons name="calendar-outline" size={14} color="#059669" />
                <Text style={styles.memberSinceText}>
                  Miembro desde {seller.memberSince}
                </Text>
              </View>
            )}
            {seller.accountType && (
              <View style={styles.accountTypeRow}>
                <Ionicons name="business-outline" size={14} color="#8b5cf6" />
                <Text style={styles.accountTypeText}>
                  {seller.accountType === 'virtual' ? 'Tienda Virtual' : 
                   seller.accountType === 'fisica' ? 'Tienda Física' : 
                   seller.accountType === 'privado' ? 'Cuenta Privada' : 
                   seller.accountType}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{seller.totalSales}</Text>
          <Text style={styles.statLabel}>Ventas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{seller.responseRate}%</Text>
          <Text style={styles.statLabel}>Respuesta</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{seller.averageResponseTime}</Text>
          <Text style={styles.statLabel}>Tiempo</Text>
        </View>
      </View>

      {seller.badges.length > 0 && (
        <View style={styles.badgesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {seller.badges.map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={styles.bio}>{seller.bio}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  username: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  badgesContainer: {
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  locationInfo: {
    marginTop: 8,
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  memberSinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
      memberSinceText: {
      fontSize: 12,
      color: '#059669',
      fontWeight: '500',
    },
    accountTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    accountTypeText: {
      fontSize: 12,
      color: '#8b5cf6',
      fontWeight: '500',
    },
}) 