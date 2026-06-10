import { logger } from '../utils/logger'
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentlyViewedItem {
  id: number;
  title: string;
  price: number;
  image: string;
  condition: string;
  location: string;
  brand?: string;
  size?: string;
  viewedAt: number;
}

const STORAGE_KEY = 'ropanova_recently_viewed';
const MAX_ITEMS = 20;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setRecentlyViewed(JSON.parse(stored));
        }
      } catch (error) {
        logger.error('Error loading recently viewed items:', error);
      }
    })();
  }, []);

  // Save to AsyncStorage whenever recentlyViewed changes
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
      } catch (error) {
        logger.error('Error saving recently viewed items:', error);
      }
    })();
  }, [recentlyViewed]);

  const addToRecentlyViewed = useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((existing) => existing.id !== item.id);
      const updated = [{ ...item, viewedAt: Date.now() }, ...filtered];
      return updated.slice(0, MAX_ITEMS);
    });
  }, []);

  const removeFromRecentlyViewed = useCallback((itemId: number) => {
    setRecentlyViewed((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const getTimeAgo = (viewedAt: number) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - viewedAt) / (1000 * 60));
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    return new Date(viewedAt).toLocaleDateString('es-DO');
  };

  return {
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    getTimeAgo,
  };
} 