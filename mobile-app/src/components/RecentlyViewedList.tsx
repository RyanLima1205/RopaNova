import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRecentlyViewed, RecentlyViewedItem } from '../hooks/useRecentlyViewed';
import { RootStackParamList } from '../../App';
import { StackNavigationProp } from '@react-navigation/stack';

export const RecentlyViewedList: React.FC = () => {
  const { recentlyViewed, getTimeAgo } = useRecentlyViewed();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'ProductDetail'>>();

  if (!recentlyViewed.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vistos Recientemente</Text>
      <FlatList
        data={recentlyViewed}
        horizontal
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id.toString() })}
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.price}>RD${item.price.toLocaleString('es-DO')}</Text>
            <Text style={styles.timeAgo}>{getTimeAgo(item.viewedAt)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16, marginTop: 8 },
  title: { fontWeight: 'bold', fontSize: 16, color: '#111827', marginLeft: 8, marginBottom: 4 },
  card: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 6,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  image: { width: 80, height: 80, borderRadius: 8, marginBottom: 6, backgroundColor: '#f3f4f6' },
  productTitle: { fontSize: 13, color: '#374151', fontWeight: '500', marginBottom: 2 },
  price: { color: '#059669', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  timeAgo: { color: '#6b7280', fontSize: 11 },
}); 