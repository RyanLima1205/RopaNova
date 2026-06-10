import React, { useState, useRef } from 'react'
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

interface ImageGalleryProps {
  images: string[]
  title: string
  onShare: () => void
  onFavorite: () => void
  isFavorited: boolean
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  title,
  onShare,
  onFavorite,
  isFavorited,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x
    const index = Math.round(contentOffset / width)
    setCurrentIndex(index)
  }

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    })
  }

  return (
    <View style={styles.container}>
      {/* Main Image ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.imageScrollView}
      >
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
          </View>
        ))}
      </ScrollView>

      {/* Image Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {images.length}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={onFavorite}>
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorited ? '#ef4444' : 'white'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Thumbnail Indicators */}
      <View style={styles.thumbnailsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailsContent}
        >
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.thumbnail,
                currentIndex === index && styles.thumbnailActive,
              ]}
              onPress={() => scrollToIndex(index)}
            >
              <Image source={{ uri: image }} style={styles.thumbnailImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  imageScrollView: {
    height: 400,
  },
  imageContainer: {
    width,
    height: 400,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  counterContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  thumbnailsContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
  },
  thumbnailsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#059669',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
}) 