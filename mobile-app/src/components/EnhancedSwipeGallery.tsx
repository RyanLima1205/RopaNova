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
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PinchGestureHandler, PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';

interface EnhancedSwipeGalleryProps {
  images: string[];
  title: string;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const EnhancedSwipeGallery: React.FC<EnhancedSwipeGalleryProps> = ({
  images,
  title,
  onShare,
  onFavorite,
  isFavorited = false,
}) => {
  // Filtrer les images vides et valider les URIs
  const validImages = images.filter(img => {
    if (!img || typeof img !== 'string') return false
    const trimmed = img.trim()
    return trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null' && trimmed !== 'file://'
  })
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fullscreenScrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-play functionality (only when not in fullscreen)
  useEffect(() => {
    if (images.length <= 1 || fullscreenVisible) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth, // Chaque image occupe toujours screenWidth
        animated: true,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, images.length, fullscreenVisible]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const imageWidth = screenWidth; // Chaque image occupe toujours screenWidth
    const index = Math.round(contentOffset / imageWidth);
    setCurrentIndex(index);
  };

  const handleFullscreenScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setFullscreenIndex(index);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth, // Chaque image occupe toujours screenWidth
      animated: true,
    });
  };

  const goToFullscreenSlide = (index: number) => {
    setFullscreenIndex(index);
    fullscreenScrollViewRef.current?.scrollTo({
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

  const goToFullscreenPrevious = () => {
    const newIndex = fullscreenIndex > 0 ? fullscreenIndex - 1 : images.length - 1;
    goToFullscreenSlide(newIndex);
  };

  const goToFullscreenNext = () => {
    const newIndex = fullscreenIndex < images.length - 1 ? fullscreenIndex + 1 : 0;
    goToFullscreenSlide(newIndex);
  };

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setFullscreenVisible(true);
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  const closeFullscreen = () => {
    setFullscreenVisible(false);
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    
    // Réinitialiser immédiatement les valeurs animées
    scaleValue.setValue(1);
    translateXValue.setValue(0);
    translateYValue.setValue(0);
    
    // Reset animated values
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(translateXValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(translateYValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleFavoritePress = () => {
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

  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateXValue = useRef(new Animated.Value(0)).current;
  const translateYValue = useRef(new Animated.Value(0)).current;
  
  // Pour le double-tap
  const doubleTapRef = useRef(null);
  const lastTap = useRef(0);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: scaleValue } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        // Empêcher le dézoom en temps réel
        const currentScale = event.nativeEvent.scale;
        if (currentScale < 1) {
          // Bloquer le dézoom en gardant l'échelle minimale à 1
          scaleValue.setValue(1);
        }
      }
    }
  );

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      // Réinitialiser les valeurs au début du zoom
      scaleValue.setValue(scale);
      // Désactiver immédiatement le défilement horizontal
      if (scrollViewRef.current) {
        scrollViewRef.current.setNativeProps({ scrollEnabled: false });
      }
      if (fullscreenScrollViewRef.current) {
        fullscreenScrollViewRef.current.setNativeProps({ scrollEnabled: false });
      }
    } else if (event.nativeEvent.state === State.END) {
      // Empêcher le dézoom - seulement permettre l'agrandissement
      const newScale = Math.max(1, Math.min(event.nativeEvent.scale, 3));
      
      // Si l'utilisateur essaie de dézoomer (scale < 1), on garde l'échelle actuelle
      if (event.nativeEvent.scale < 1) {
        // Ne rien faire - garder l'échelle actuelle
        return;
      }
      
      setScale(newScale);
      
      // Reset position if scale is 1
      if (newScale <= 1) {
        setTranslateX(0);
        setTranslateY(0);
        // Réactiver le défilement horizontal
        if (scrollViewRef.current) {
          scrollViewRef.current.setNativeProps({ scrollEnabled: true });
        }
        if (fullscreenScrollViewRef.current) {
          fullscreenScrollViewRef.current.setNativeProps({ scrollEnabled: true });
        }
        Animated.parallel([
          Animated.timing(translateXValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(translateYValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }
  };

  // Gestionnaire pour le glissement (pan)
  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateXValue, translationY: translateYValue } }],
    { useNativeDriver: false }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      // Réinitialiser les valeurs de translation au début du geste
      translateXValue.setValue(translateX);
      translateYValue.setValue(translateY);
    } else if (event.nativeEvent.state === State.END) {
      // Calculer les nouvelles positions
      const newTranslateX = translateX + event.nativeEvent.translationX;
      const newTranslateY = translateY + event.nativeEvent.translationY;
      
      // Limiter le déplacement pour que l'image reste visible
      const maxTranslateX = Math.max(0, (scale - 1) * screenWidth / 2);
      const maxTranslateY = Math.max(0, (scale - 1) * screenHeight / 2);
      
      const clampedTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
      const clampedTranslateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
      
      // Mettre à jour les états
      setTranslateX(clampedTranslateX);
      setTranslateY(clampedTranslateY);
      
      // Animer vers les nouvelles positions
      Animated.parallel([
        Animated.timing(translateXValue, {
          toValue: clampedTranslateX,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(translateYValue, {
          toValue: clampedTranslateY,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  // Gestionnaire pour le double-tap
  const onDoubleTap = (event: any) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      // Double-tap détecté
      if (scale > 1) {
        // Si déjà zoomé, dézoomer
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
        
        // Réinitialiser les valeurs animées
        scaleValue.setValue(1);
        translateXValue.setValue(0);
        translateYValue.setValue(0);
        
        // Réactiver le défilement horizontal
        if (scrollViewRef.current) {
          scrollViewRef.current.setNativeProps({ scrollEnabled: true });
        }
        if (fullscreenScrollViewRef.current) {
          fullscreenScrollViewRef.current.setNativeProps({ scrollEnabled: true });
        }
        
        Animated.parallel([
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(translateXValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(translateYValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        // Zoomer à 2x
        setScale(2);
        
        // Réinitialiser les valeurs animées
        scaleValue.setValue(2);
        
        // Désactiver le défilement horizontal
        if (scrollViewRef.current) {
          scrollViewRef.current.setNativeProps({ scrollEnabled: false });
        }
        if (fullscreenScrollViewRef.current) {
          fullscreenScrollViewRef.current.setNativeProps({ scrollEnabled: false });
        }
        
        Animated.timing(scaleValue, {
          toValue: 2,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    }
    lastTap.current = now;
  };

  if (validImages.length === 0) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: 'https://via.placeholder.com/400x400?text=Sin+imagen' }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <>
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
          scrollEnabled={scale <= 1} // Désactiver le défilement quand zoomé
          bounces={false} // Désactiver le rebond
          decelerationRate="fast" // Défilement plus rapide
        >
                      {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
              <TapGestureHandler
                ref={doubleTapRef}
                onActivated={onDoubleTap}
                numberOfTaps={1}
              >
                <Animated.View style={styles.tapContainer}>
                  <PanGestureHandler
                    onGestureEvent={onPanGestureEvent}
                    onHandlerStateChange={onPanHandlerStateChange}
                    enabled={scale > 1}
                  >
                    <Animated.View style={styles.panContainer}>
                      <PinchGestureHandler
                        onGestureEvent={onPinchGestureEvent}
                        onHandlerStateChange={onPinchHandlerStateChange}
                      >
                        <Animated.View style={styles.pinchContainer}>
                          <TouchableOpacity
                            style={styles.imageTouchable}
                            onPress={() => openFullscreen(index)}
                            activeOpacity={0.9}
                          >
                            <Animated.Image
                              source={{ uri: image || 'https://via.placeholder.com/400x400?text=Sin+imagen' }}
                              style={[
                                styles.image,
                                {
                                  transform: [
                                    { scale: scaleValue },
                                    { translateX: translateXValue },
                                    { translateY: translateYValue },
                                  ],
                                },
                              ]}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        </Animated.View>
                      </PinchGestureHandler>
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </TapGestureHandler>
            </View>
          ))}
        </ScrollView>

        {/* Navigation Arrows */}
        {validImages.length > 1 && (
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

        {/* Enhanced Image Counter */}
        {validImages.length > 1 && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {validImages.length}
            </Text>
          </View>
        )}

        {/* Enhanced Dot Indicators */}
        {validImages.length > 1 && (
          <View style={styles.dotContainer}>
            {validImages.map((_, index) => (
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

        {/* Swipe Hint */}
        {validImages.length > 1 && currentIndex === 0 && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>Toca para ampliar • Desliza para ver más</Text>
          </View>
        )}
      </View>

      {/* Fullscreen Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreen}
      >
        <StatusBar hidden />
        <View style={styles.fullscreenContainer}>
          {/* Fullscreen Header */}
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity
              style={styles.fullscreenCloseButton}
              onPress={closeFullscreen}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.fullscreenCounter}>
              <Text style={styles.fullscreenCounterText}>
                {fullscreenIndex + 1} / {validImages.length}
              </Text>
            </View>
            <View style={styles.fullscreenActions}>
              {onShare && (
                <TouchableOpacity
                  style={styles.fullscreenActionButton}
                  onPress={onShare}
                >
                  <Ionicons name="share-outline" size={20} color="white" />
                </TouchableOpacity>
              )}
              {onFavorite && (
                <TouchableOpacity
                  style={styles.fullscreenActionButton}
                  onPress={handleFavoritePress}
                >
                  <Ionicons
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFavorited ? '#EF4444' : 'white'}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Fullscreen Image Gallery */}
          <ScrollView
            ref={fullscreenScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleFullscreenScroll}
            scrollEventThrottle={16}
            style={styles.fullscreenScrollView}
            scrollEnabled={scale <= 1} // Désactiver le défilement quand zoomé
            bounces={false} // Désactiver le rebond
            decelerationRate="fast" // Défilement plus rapide
          >
            {validImages.map((image, index) => (
              <View key={index} style={styles.fullscreenImageContainer}>
                <TapGestureHandler
                  ref={doubleTapRef}
                  onActivated={onDoubleTap}
                  numberOfTaps={1}
                >
                  <Animated.View style={styles.fullscreenTapContainer}>
                    <PanGestureHandler
                      onGestureEvent={onPanGestureEvent}
                      onHandlerStateChange={onPanHandlerStateChange}
                      enabled={scale > 1}
                    >
                      <Animated.View style={styles.fullscreenPanContainer}>
                        <PinchGestureHandler
                          onGestureEvent={onPinchGestureEvent}
                          onHandlerStateChange={onPinchHandlerStateChange}
                        >
                          <Animated.View style={styles.fullscreenPinchContainer}>
                                                    <Animated.Image
                          source={{ uri: image || 'https://via.placeholder.com/400x400?text=Sin+imagen' }}
                          style={[
                            styles.fullscreenImage,
                            {
                              transform: [
                                { scale: scaleValue },
                                { translateX: translateXValue },
                                { translateY: translateYValue },
                              ],
                            },
                          ]}
                          resizeMode="cover"
                        />
                          </Animated.View>
                        </PinchGestureHandler>
                      </Animated.View>
                    </PanGestureHandler>
                  </Animated.View>
                </TapGestureHandler>
              </View>
            ))}
          </ScrollView>

          {/* Fullscreen Navigation */}
          {images.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.fullscreenNavButton, styles.fullscreenLeftButton]}
                onPress={goToFullscreenPrevious}
              >
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fullscreenNavButton, styles.fullscreenRightButton]}
                onPress={goToFullscreenNext}
              >
                <Ionicons name="chevron-forward" size={28} color="white" />
              </TouchableOpacity>
            </>
          )}

          {/* Fullscreen Dot Indicators */}
          {images.length > 1 && (
            <View style={styles.fullscreenDotContainer}>
              {images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.fullscreenDot,
                    index === fullscreenIndex && styles.fullscreenActiveDot,
                  ]}
                  onPress={() => goToFullscreenSlide(index)}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </>
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
  tapContainer: {
    flex: 1,
  },
  panContainer: {
    flex: 1,
  },
  pinchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTouchable: {
    flex: 1,
    width: '100%',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  swipeHintText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  // Fullscreen styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fullscreenCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullscreenCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fullscreenActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenScrollView: {
    flex: 1,
  },
  fullscreenImageContainer: {
    width: screenWidth,
    height: screenHeight,
  },
  fullscreenTapContainer: {
    flex: 1,
  },
  fullscreenPanContainer: {
    flex: 1,
  },
  fullscreenPinchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenNavButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenLeftButton: {
    left: 16,
  },
  fullscreenRightButton: {
    right: 16,
  },
  fullscreenDotContainer: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    gap: 10,
  },
  fullscreenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  fullscreenActiveDot: {
    backgroundColor: 'white',
    transform: [{ scale: 1.3 }],
  },
}); 