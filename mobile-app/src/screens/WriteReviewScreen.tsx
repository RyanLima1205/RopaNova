import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { fetchOrderForBuyer, type BuyerOrder } from '../services/orderService';
import { createReview, getReviewByOrderId } from '../services/reviewService';
import {
  sellerPublicProfileFromUserData,
  EMPTY_SELLER_PUBLIC_PROFILE,
  type SellerPublicProfile,
} from '../utils/sellerDisplayName';

type Nav = StackNavigationProp<RootStackParamList, 'WriteReview'>;
type Route = RouteProp<RootStackParamList, 'WriteReview'>;
type ScreenPhase = 'loading' | 'error' | 'form' | 'success';

const MAX_COMMENT = 500;
const RATING_LABELS: Record<number, string> = {
  1: 'Muy mala',
  2: 'Mala',
  3: 'Regular',
  4: 'Buena',
  5: 'Excelente',
};

function StarPicker({
  value,
  onChange,
  size = 44,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: number;
}) {
  return (
    <View style={[styles.starRow, styles.starRowCentered]}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star)}
          accessibilityRole="button"
          accessibilityLabel={`${star} estrella${star > 1 ? 's' : ''}`}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={size}
            color={star <= value ? '#fbbf24' : '#d1d5db'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.card}>
        <View style={styles.skeletonHero}>
          <View style={styles.skeletonImage} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.skeletonLine, { width: '70%' }]} />
            <View style={[styles.skeletonLine, { width: '45%' }]} />
            <View style={[styles.skeletonLine, { width: '55%' }]} />
          </View>
        </View>
      </View>
      <View style={styles.card}>
        <View style={[styles.skeletonLine, { width: '50%', alignSelf: 'center', marginBottom: 16 }]} />
        <View style={styles.skeletonStars} />
      </View>
      <View style={styles.card}>
        <View style={[styles.skeletonLine, { width: '40%', marginBottom: 12 }]} />
        <View style={styles.skeletonComment} />
      </View>
    </View>
  );
}

function SuccessCheckmark() {
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(circleScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [circleScale, checkScale, contentOpacity]);

  return (
    <View style={styles.successIconWrap}>
      <Animated.View style={[styles.successCircle, { transform: [{ scale: circleScale }] }]}>
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <Ionicons name="checkmark" size={52} color="#fff" />
        </Animated.View>
      </Animated.View>
      <Animated.View style={{ opacity: contentOpacity, alignItems: 'center' }}>
        <Text style={styles.successTitle}>¡Gracias!</Text>
        <Text style={styles.successSubtitle}>Tu opinión ayuda a la comunidad</Text>
      </Animated.View>
    </View>
  );
}

export const WriteReviewScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const { user } = useAuth();

  const [phase, setPhase] = useState<ScreenPhase>('loading');
  const [order, setOrder] = useState<BuyerOrder | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerPublicProfile>(EMPTY_SELLER_PUBLIC_PROFILE);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const commentLen = comment.length;
  const formValid = rating >= 1;

  const load = useCallback(async () => {
    if (!user?.id || user.id === 'guest') {
      setLoadError('Inicia sesión para dejar una reseña.');
      setPhase('error');
      return;
    }
    setPhase('loading');
    setLoadError(null);
    try {
      const [existing, fetched] = await Promise.all([
        getReviewByOrderId(orderId),
        fetchOrderForBuyer(orderId, user.id),
      ]);
      if (existing) {
        setLoadError('Ya dejaste una reseña para este pedido.');
        setPhase('error');
        return;
      }
      if (!fetched) {
        setLoadError('No se encontró el pedido.');
        setPhase('error');
        return;
      }
      if (fetched.status !== 'delivered') {
        setLoadError('Solo puedes publicar la reseña cuando el pedido esté marcado como entregado.');
        setPhase('error');
        return;
      }
      setOrder(fetched);
      if (fetched.sellerId) {
        try {
          const db = getFirestore(app);
          const sellerSnap = await getDoc(doc(db, 'users', fetched.sellerId));
          if (sellerSnap.exists()) {
            setSellerProfile(
              sellerPublicProfileFromUserData(sellerSnap.data() as Record<string, unknown>),
            );
          } else {
            setSellerProfile({
              experienceLabel: fetched.sellerName || 'este vendedor',
              chipName: fetched.sellerName || 'Vendedor',
              handleLine: '',
              avatar: fetched.sellerAvatar || EMPTY_SELLER_PUBLIC_PROFILE.avatar,
            });
          }
        } catch {
          setSellerProfile({
            experienceLabel: fetched.sellerName || 'este vendedor',
            chipName: fetched.sellerName || 'Vendedor',
            handleLine: '',
            avatar: fetched.sellerAvatar || EMPTY_SELLER_PUBLIC_PROFILE.avatar,
          });
        }
      }
      setPhase('form');
    } catch {
      setLoadError('No se pudo cargar el pedido.');
      setPhase('error');
    }
  }, [orderId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!user?.id || user.id === 'guest' || !formValid) return;
    const trimmed = comment.trim();
    if (trimmed.length > MAX_COMMENT) {
      setSubmitError(`El comentario no puede superar ${MAX_COMMENT} caracteres.`);
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createReview(user.id, user.name, user.avatar ?? '', {
        orderId,
        rating,
        comment: trimmed,
      });
      setPhase('success');
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'REVIEW_ALREADY_EXISTS') {
        setLoadError('Ya dejaste una reseña para este pedido.');
        setPhase('error');
        return;
      }
      if (code === 'ORDER_NOT_DELIVERED') {
        setSubmitError('El pedido debe estar entregado para publicar la reseña.');
        return;
      }
      setSubmitError('No se pudo publicar la reseña. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToOrders = () => {
    navigation.navigate('OrdersScreen');
  };

  const goToSellerReviews = () => {
    if (!order?.sellerId) {
      goToOrders();
      return;
    }
    navigation.navigate('SellerReviews', { sellerId: order.sellerId });
  };

  const renderHeader = (title: string, showBack = true) => (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBtn} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerBtn} />
    </View>
  );

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderHeader('Dejar reseña')}
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderHeader('Dejar reseña')}
        <View style={styles.errorWrap}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={40} color="#b45309" />
          </View>
          <Text style={styles.errorTitle}>No disponible</Text>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={goToOrders}>
            <Text style={styles.primaryBtnText}>Volver a mis pedidos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderHeader('Reseña publicada', false)}
        <View style={styles.successWrap}>
          <SuccessCheckmark />
          <View style={styles.successActions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={goToOrders}>
              <Text style={styles.primaryBtnText}>Volver a mis pedidos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={goToSellerReviews}>
              <Text style={styles.secondaryBtnText}>Ver reseñas del vendedor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader('Dejar reseña')}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.heroQuestion}>
              ¿Cómo fue tu experiencia con {sellerProfile.experienceLabel}?
            </Text>
            <View style={styles.heroRow}>
              {order?.productImage ? (
                <Image source={{ uri: order.productImage }} style={styles.heroImage} />
              ) : (
                <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
                  <Ionicons name="shirt-outline" size={32} color="#9ca3af" />
                </View>
              )}
              <View style={styles.heroInfo}>
                <Text style={styles.heroProductTitle} numberOfLines={2}>
                  {order?.productTitle}
                </Text>
                <Text style={styles.heroOrderCode}>Pedido {order?.orderCode}</Text>
                {order?.lineSummary && order.lineSummary !== '—' ? (
                  <Text style={styles.heroDetail} numberOfLines={1}>
                    {order.lineSummary}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.sellerChip}>
              <Image source={{ uri: sellerProfile.avatar }} style={styles.sellerAvatar} />
              <View style={styles.sellerChipText}>
                <Text style={styles.sellerName} numberOfLines={1}>
                  {sellerProfile.chipName}
                </Text>
                {sellerProfile.handleLine ? (
                  <Text style={styles.sellerHandle} numberOfLines={1}>
                    {sellerProfile.handleLine}
                  </Text>
                ) : null}
              </View>
              {order?.shippingLabel ? (
                <Text style={styles.shippingDot}>·</Text>
              ) : null}
              {order?.shippingLabel ? (
                <Text style={styles.shippingLabel} numberOfLines={1}>
                  {order.shippingLabel}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calificación general</Text>
            <StarPicker value={rating} onChange={setRating} />
            <Text style={[styles.ratingLabel, rating === 0 && styles.ratingLabelMuted]}>
              {rating > 0 ? RATING_LABELS[rating] : 'Toca una estrella para calificar'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tu comentario</Text>
            <Text style={styles.cardHint}>Opcional</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              placeholder="Escribe tu experiencia aquí…"
              placeholderTextColor="#9ca3af"
              value={comment}
              onChangeText={setComment}
              maxLength={MAX_COMMENT}
              textAlignVertical="top"
            />
            <Text style={styles.charHint}>
              {commentLen}/{MAX_COMMENT}
            </Text>
          </View>

          {submitError ? (
            <View style={styles.submitErrorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, (submitting || !formValid) && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !formValid}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Publicar reseña</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  heroQuestion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 26,
    marginBottom: 16,
  },
  heroRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  heroImage: {
    width: 96,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  heroImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  heroInfo: { flex: 1, justifyContent: 'center' },
  heroProductTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  heroOrderCode: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  heroDetail: { fontSize: 13, color: '#9ca3af' },
  sellerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  sellerAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb' },
  sellerChipText: { flexShrink: 1, maxWidth: 140 },
  sellerName: { fontSize: 14, fontWeight: '600', color: '#374151' },
  sellerHandle: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  shippingDot: { color: '#d1d5db', fontSize: 14 },
  shippingLabel: { fontSize: 13, color: '#6b7280', flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardHint: { fontSize: 13, color: '#9ca3af', marginBottom: 12 },
  starRow: { flexDirection: 'row', gap: 8 },
  starRowCentered: { justifyContent: 'center', paddingVertical: 8 },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  ratingLabelMuted: { color: '#9ca3af', fontWeight: '500' },
  commentInput: {
    minHeight: 120,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  charHint: { fontSize: 12, color: '#9ca3af', marginTop: 8, textAlign: 'right' },
  submitErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  submitErrorText: { flex: 1, fontSize: 14, color: '#b91c1c' },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  primaryBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#059669',
    minHeight: 52,
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#059669', fontSize: 16, fontWeight: '600' },
  skeletonWrap: { padding: 16, gap: 16 },
  skeletonHero: { flexDirection: 'row', gap: 14 },
  skeletonImage: {
    width: 96,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  skeletonLine: { height: 14, borderRadius: 7, backgroundColor: '#e5e7eb' },
  skeletonStars: {
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    width: '80%',
    alignSelf: 'center',
  },
  skeletonComment: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  errorText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIconWrap: { alignItems: 'center', marginBottom: 40 },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  successActions: { gap: 12 },
});
