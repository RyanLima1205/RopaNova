import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Review } from '../types';
import { ReviewCard } from '../components/ReviewCard';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import {
  computeSellerReviewStats,
  getReviewsBySellerId,
  sellerReviewToCardReview,
  type SellerReviewStats,
} from '../services/reviewService';

const AVATAR_PLACEHOLDER = 'https://via.placeholder.com/80x80/4ade80/ffffff?text=V';

const handleWithoutAt = (username?: string) => (username || '').trim().replace(/^@+/, '');
const atHandle = (username?: string) => {
  const h = handleWithoutAt(username);
  return h ? `@${h}` : '';
};

/** Même logique que SellerProfileCard : tienda → storeName + @ ; privado → @username */
function buildSellerHeaderFromUserDoc(data: Record<string, unknown>) {
  const accountType = String(data.accountType || '');
  const username = String(data.username || '');
  const storeName = String(data.storeName || '').trim();
  const fullName = `${String(data.name || '')} ${String(data.lastname || '')}`.trim();
  const uh = atHandle(username);

  let displayName = 'Vendedor';
  let handleLine = '';

  if (accountType === 'privado') {
    displayName = uh || fullName || 'Vendedor';
  } else if (accountType === 'virtual' || accountType === 'fisica') {
    if (storeName) {
      displayName = storeName;
      handleLine = uh;
    } else {
      displayName = fullName || uh || 'Vendedor';
      handleLine = fullName && uh ? uh : '';
    }
  } else {
    displayName = storeName || fullName || uh || 'Vendedor';
    handleLine = storeName ? uh : fullName && uh ? uh : '';
  }

  const avatarRaw = data.avatar != null ? String(data.avatar).trim() : '';
  const avatar = avatarRaw || AVATAR_PLACEHOLDER;
  const verified = Boolean(data.verified);

  return { displayName, handleLine, avatar, verified };
}

async function fetchSellerHeaderById(
  sellerId: string | undefined,
): Promise<ReturnType<typeof buildSellerHeaderFromUserDoc>> {
  if (!sellerId) {
    return {
      displayName: 'Vendedor',
      handleLine: '',
      avatar: AVATAR_PLACEHOLDER,
      verified: false,
    };
  }
  try {
    const db = getFirestore(app);
    const snap = await getDoc(doc(db, 'users', sellerId));
    if (!snap.exists()) {
      return {
        displayName: 'Vendedor',
        handleLine: '',
        avatar: AVATAR_PLACEHOLDER,
        verified: false,
      };
    }
    return buildSellerHeaderFromUserDoc(snap.data() as Record<string, unknown>);
  } catch {
    return {
      displayName: 'Vendedor',
      handleLine: '',
      avatar: AVATAR_PLACEHOLDER,
      verified: false,
    };
  }
}

type SellerReviewsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SellerReviews'>;
type SellerReviewsScreenRouteProp = RouteProp<RootStackParamList, 'SellerReviews'>;

const EMPTY_STATS: SellerReviewStats = {
  averageRating: 0,
  reviewCount: 0,
  ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  categoryAverages: {},
  categoryCounts: {},
};

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({
  rating,
  size = 'sm',
}) => {
  const sizeMap = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={sizeMap[size]}
          color={star <= rating ? '#FBBF24' : '#D1D5DB'}
        />
      ))}
    </View>
  );
};

const ProgressBar: React.FC<{ value: number; maxValue: number }> = ({ value, maxValue }) => {
  const percentage = (value / maxValue) * 100;
  
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${percentage}%` }]} />
    </View>
  );
};

export const SellerReviewsScreen: React.FC = () => {
  const navigation = useNavigation<SellerReviewsScreenNavigationProp>();
  const route = useRoute<SellerReviewsScreenRouteProp>();
  const { sellerId } = route.params;

  const [reviewFilter, setReviewFilter] = useState('todos');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<SellerReviewStats>(EMPTY_STATS);
  const [sellerHeader, setSellerHeader] = useState<ReturnType<typeof buildSellerHeaderFromUserDoc> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const loadReviews = useCallback(async () => {
    const rows = await getReviewsBySellerId(sellerId);
    const computed = computeSellerReviewStats(rows);
    const avatar = sellerHeader?.avatar;
    setStats(computed);
    setReviews(rows.map((r) => sellerReviewToCardReview(r, avatar)));
  }, [sellerId, sellerHeader?.avatar]);

  useEffect(() => {
    let cancelled = false;
    fetchSellerHeaderById(sellerId).then((header) => {
      if (!cancelled) setSellerHeader(header);
    });
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  useEffect(() => {
    let cancelled = false;
    setLoadingReviews(true);
    getReviewsBySellerId(sellerId)
      .then((rows) => {
        if (cancelled) return;
        setStats(computeSellerReviewStats(rows));
        setReviews(rows.map((r) => sellerReviewToCardReview(r)));
      })
      .catch(() => {
        if (!cancelled) {
          setStats(EMPTY_STATS);
          setReviews([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const header = await fetchSellerHeaderById(sellerId);
      setSellerHeader(header);
      await loadReviews();
    } finally {
      setRefreshing(false);
    }
  }, [sellerId, loadReviews]);

  const headerDisplayName = sellerHeader?.displayName ?? 'Vendedor';
  const headerHandleLine = sellerHeader?.handleLine ?? '';
  const headerAvatar = sellerHeader?.avatar ?? AVATAR_PLACEHOLDER;
  const headerVerified = sellerHeader?.verified ?? false;

  const filteredReviews = reviews.filter((review) => {
    if (reviewFilter === 'todos') return true;
    if (reviewFilter === '5') return review.rating === 5;
    if (reviewFilter === '4') return review.rating === 4;
    if (reviewFilter === '3') return review.rating === 3;
    if (reviewFilter === '2') return review.rating === 2;
    if (reviewFilter === '1') return review.rating === 1;
    if (reviewFilter === 'fotos') return review.photos && review.photos.length > 0;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reseñas del Vendedor</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
            colors={['#059669']}
          />
        }
      >
        {/* Seller Summary */}
        <View style={styles.sellerSection}>
          <View style={styles.sellerInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: headerAvatar }}
                style={styles.avatar}
              />
              {headerVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={styles.sellerDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.sellerName}>{headerDisplayName}</Text>
                {headerVerified && (
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                )}
              </View>
              {headerHandleLine ? (
                <Text style={styles.sellerHandleLine}>{headerHandleLine}</Text>
              ) : null}
              <View style={styles.ratingRow}>
                <StarRating rating={Math.round(stats.averageRating)} size="md" />
                <Text style={styles.ratingText}>
                  {stats.reviewCount > 0 ? `${stats.averageRating.toFixed(1)}/5` : '—'}
                </Text>
                <Text style={styles.reviewCount}>({stats.reviewCount} reseñas)</Text>
              </View>
            </View>
          </View>

          {/* Rating Breakdown */}
          <View style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Distribución de Calificaciones</Text>
            <View style={styles.breakdownList}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingBreakdown[rating] ?? 0;
                const percentage =
                  stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0;
                return (
                  <View key={rating} style={styles.breakdownItem}>
                    <Text style={styles.ratingNumber}>{rating}</Text>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <ProgressBar value={count} maxValue={Math.max(stats.reviewCount, 1)} />
                    <Text style={styles.breakdownCount}>{count}</Text>
                    <Text style={styles.breakdownPercentage}>{percentage.toFixed(0)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>Todas las Reseñas ({reviews.length})</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                Alert.alert(
                  'Filtrar reseñas',
                  'Selecciona un filtro:',
                  [
                    { text: 'Todas', onPress: () => setReviewFilter('todos') },
                    { text: '5 estrellas', onPress: () => setReviewFilter('5') },
                    { text: '4 estrellas', onPress: () => setReviewFilter('4') },
                    { text: '3 estrellas', onPress: () => setReviewFilter('3') },
                    { text: '2 estrellas', onPress: () => setReviewFilter('2') },
                    { text: '1 estrella', onPress: () => setReviewFilter('1') },
                    { text: 'Con fotos', onPress: () => setReviewFilter('fotos') },
                    { text: 'Cancelar', style: 'cancel' },
                  ]
                );
              }}
            >
              <Ionicons name="filter" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Reviews List */}
          <View style={styles.reviewsList}>
            {loadingReviews ? (
              <Text style={styles.emptyText}>Cargando reseñas…</Text>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <ReviewCard key={review.id} review={review} showProduct={true} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>
                  {reviews.length === 0
                    ? 'Este vendedor aún no tiene reseñas.'
                    : 'No hay reseñas que coincidan con los filtros seleccionados.'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  sellerSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sellerHandleLine: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  salesText: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  breakdownList: {
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingNumber: {
    width: 16,
    fontSize: 14,
    color: '#374151',
  },
  breakdownCount: {
    width: 24,
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownPercentage: {
    width: 32,
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FBBF24',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  filterButton: {
    padding: 4,
  },
  reviewsList: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
}); 