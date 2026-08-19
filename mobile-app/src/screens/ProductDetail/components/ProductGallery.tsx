import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { EnhancedSwipeGallery } from '../../../components/EnhancedSwipeGallery'
import { semanticColors } from '../../../theme'

interface ProductGalleryProps {
  images: string[]
  title: string
  onBack: () => void
  onShare: () => void
  onFavorite: () => void
  favorited: boolean
}

/**
 * Galerie produit — *Est-ce que j'aime ?* Wrap EnhancedSwipeGallery + dégradé bas.
 * Le bouton favori lui-même vit dans EnhancedSwipeGallery (composant partagé, hors de
 * src/screens/ProductDetail/) : le bounce est donc un cœur en surimpression qui apparaît
 * au moment où `favorited` passe à true, plutôt qu'une animation du bouton d'origine.
 */
export function ProductGallery({ images, title, onBack, onShare, onFavorite, favorited }: ProductGalleryProps) {
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(0)).current
  const wasFavorited = useRef(favorited)

  useEffect(() => {
    if (favorited && !wasFavorited.current) {
      scale.setValue(1)
      opacity.setValue(1)
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.3, damping: 3, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, damping: 3, useNativeDriver: true }),
      ]).start()
      Animated.timing(opacity, { toValue: 0, duration: 500, delay: 350, useNativeDriver: true }).start()
    }
    wasFavorited.current = favorited
  }, [favorited, scale, opacity])

  return (
    <View style={styles.wrap}>
      <EnhancedSwipeGallery
        images={images}
        title={title}
        onBack={onBack}
        onShare={onShare}
        onFavorite={onFavorite}
        isFavorited={favorited}
      />
      <LinearGradient
        colors={['transparent', 'rgba(17,24,39,0.16)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.favoriteBurst, { opacity, transform: [{ scale }] }]}
        pointerEvents="none"
      >
        <Ionicons name="heart" size={72} color={semanticColors.error} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  favoriteBurst: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
