import React from 'react'
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { EnhancedSwipeGallery } from '../../../components/EnhancedSwipeGallery'

interface ProductGalleryProps {
  images: string[]
  title: string
  onBack: () => void
  onShare: () => void
  onFavorite: () => void
  favorited: boolean
}

/** Galerie produit — *Est-ce que j'aime ?* Wrap EnhancedSwipeGallery + dégradé bas. */
export function ProductGallery({ images, title, onBack, onShare, onFavorite, favorited }: ProductGalleryProps) {
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
})
