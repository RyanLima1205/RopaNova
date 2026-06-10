import { logger } from '../utils/logger'
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { ProductCard } from '../components/ProductCard';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app, auth } from '../firebaseConfig';
import { cleanProductImages } from '../utils/imageUtils';

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      }
      const userId = auth.currentUser?.uid;
      
      if (!userId || userId === 'guest') {
        setFavorites([]);
        return;
      }

      const db = getFirestore(app);
      
      // Récupérer les IDs des favoris
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', userId)
      );
      
      const favoritesSnapshot = await getDocs(favoritesQuery);
      const favoriteProductIds = favoritesSnapshot.docs.map(doc => doc.data().productId);

      if (favoriteProductIds.length === 0) {
        setFavorites([]);
        return;
      }

      // Récupérer les produits favoris
      const productsQuery = query(
        collection(db, 'products'),
        where('__name__', 'in', favoriteProductIds.slice(0, 10)) // Firestore limite à 10 IDs
      );

      const productsSnapshot = await getDocs(productsQuery);
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setFavorites(products);
    } catch (error) {
      logger.error('Erreur chargement favoris:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const renderProduct = ({ item }: { item: any }) => (
    <ProductCard
      product={{
        id: item.id,
        title: item.titulo || item.title || '',
        price: item.precio || item.price || '0',
        condition: item.condicion || item.condition || 'Usado',
        images: cleanProductImages(item),
        createdAt: item.createdAt,
        category: item.categoria || item.category || '',
        subcategory: item.subcategoria || item.subcategory || '',
        brand: item.marca || item.brand || '',
        color: item.color || [],
        talla: item.talla || [],
        status: item.status,
        seller: item.seller || item.vendedor,
      }}
      isFavorited
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Favoritos</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Cargando favoritos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Favoritos</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={favorites}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={favorites.length > 0 ? styles.row : undefined}
        contentContainerStyle={[
          styles.listContainer,
          favorites.length === 0 && styles.listContainerEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No tienes favoritos</Text>
            <Text style={styles.emptyText}>
              Los productos que marques como favoritos aparecerán aquí
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={styles.exploreButtonText}>Explorar Productos</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFavorites(true)}
            colors={['#059669']}
            tintColor="#059669"
            title="Actualizando..."
            titleColor="#059669"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  exploreButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  listContainer: {
    padding: 8,
  },
  listContainerEmpty: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
}); 