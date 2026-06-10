import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SwipeGalleryProps {
  images: string[];
  title: string;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
  onImagePress?: (index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const SwipeGallery: React.FC<SwipeGalleryProps> = ({
  images,
  title,
  onShare,
  onFavorite,
  isFavorited = false,
  onImagePress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-play functionality
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex, images.length]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentIndex(index);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true,
    });
  };

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    goToSlide(newIndex);
  };

  const handleImagePress = () => {
    if (onImagePress) {
      onImagePress(currentIndex);
    }
  };

  const handleFavoritePress = () => {
    // Animation feedback
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onFavorite) {
      onFavorite();
    }
  };

  if (!images || images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="image-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>Sin imagen</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Image Container */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageContainer}
            onPress={handleImagePress}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: image || 'https://via.placeholder.com/400x400?text=Sin+imagen' }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <TouchableOpacity
            style={[styles.navButton, styles.leftButton]}
            onPress={goToPrevious}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.rightButton]}
            onPress={goToNext}
          >
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {onShare && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onShare}
          >
            <Ionicons name="share-outline" size={20} color="white" />
          </TouchableOpacity>
        )}
        {onFavorite && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleFavoritePress}
            >
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorited ? '#EF4444' : 'white'}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Image Counter */}
      {images.length > 1 && (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
      )}

      {/* Dot Indicators */}
      {images.length > 1 && (
        <View style={styles.dotContainer}>
          {images.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
              onPress={() => goToSlide(index)}
            />
          ))}
        </View>
      )}

      {/* Swipe Hint (only show on first image) */}
      {images.length > 1 && currentIndex === 0 && (
        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>Desliza para ver más fotos</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 8,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftButton: {
    left: 8,
  },
  rightButton: {
    right: 8,
  },
  actionButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  dotContainer: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: 'white',
    transform: [{ scale: 1.25 }],
  },
  swipeHint: {
    position: 'absolute',
    bottom: 64,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  swipeHintText: {
    color: 'white',
    fontSize: 12,
  },
}); 