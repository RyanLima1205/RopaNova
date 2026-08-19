import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { brandColors } from '../theme';

interface EnhancedSwipeGalleryProps {
  images: string[];
  title: string;
  onBack?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MAX_VISIBLE_THUMBNAILS = 4;
const PINCH_MIN_SCALE = 1;
const PINCH_MAX_SCALE = 4;
const PINCH_RESET_THRESHOLD = 1.2;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const EnhancedSwipeGallery: React.FC<EnhancedSwipeGalleryProps> = ({
  images,
  title,
  onBack,
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
  // Index de l'image actuellement zoomée — seule celle-ci laisse le PanGestureHandler
  // capter le geste, pour ne jamais gêner le swipe horizontal des autres images.
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const fullscreenScrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Zoom + déplacement (pinch + pan) — uniquement dans le Modal plein écran. Un jeu de
  // valeurs par image, pour que zoomer/déplacer une photo n'affecte pas les autres.
  const fullscreenScales = useMemo(
    () => validImages.map(() => new Animated.Value(1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validImages.length],
  );
  const fullscreenTranslateX = useMemo(
    () => validImages.map(() => new Animated.Value(0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validImages.length],
  );
  const fullscreenTranslateY = useMemo(
    () => validImages.map(() => new Animated.Value(0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validImages.length],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const panRefs = useMemo(() => validImages.map(() => React.createRef<PanGestureHandler>()), [validImages.length]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pinchRefs = useMemo(() => validImages.map(() => React.createRef<PinchGestureHandler>()), [validImages.length]);

  // Valeurs numériques "live" côté JS (un Animated.Value ne se lit pas de façon synchrone).
  const currentScalesRef = useRef<number[]>(validImages.map(() => 1));
  const currentTranslateXRef = useRef<number[]>(validImages.map(() => 0));
  const currentTranslateYRef = useRef<number[]>(validImages.map(() => 0));
  // Position de départ du pan en cours (le geste ne fournit qu'un delta depuis son début).
  const panBaseXRef = useRef<number[]>(validImages.map(() => 0));
  const panBaseYRef = useRef<number[]>(validImages.map(() => 0));

  const resetZoom = (index: number) => {
    fullscreenScales[index]?.setValue(1);
    fullscreenTranslateX[index]?.setValue(0);
    fullscreenTranslateY[index]?.setValue(0);
    currentScalesRef.current[index] = 1;
    currentTranslateXRef.current[index] = 0;
    currentTranslateYRef.current[index] = 0;
  };

  // Réinitialise le zoom/déplacement de l'image qu'on vient de quitter au changement de photo.
  const previousFullscreenIndexRef = useRef(fullscreenIndex);
  useEffect(() => {
    const previousIndex = previousFullscreenIndexRef.current;
    if (previousIndex !== fullscreenIndex) {
      resetZoom(previousIndex);
      setZoomedIndex((current) => (current === previousIndex ? null : current));
    }
    previousFullscreenIndexRef.current = fullscreenIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreenIndex]);

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

  // Se déclenche une seule fois quand le scroll s'arrête — plus de scintillement du compteur.
  const handleMomentumScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth); // Chaque image occupe toujours screenWidth
    setCurrentIndex(index);
  };

  const handleFullscreenMomentumScrollEnd = (event: any) => {
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
    // Départ toujours dézoomé, même si cette image avait été zoomée lors d'une session précédente.
    resetZoom(index);
    setZoomedIndex(null);
    setFullscreenIndex(index);
    setFullscreenVisible(true);
  };

  const closeFullscreen = () => {
    setFullscreenVisible(false);
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

  // --- Pinch + pan (zoom plein écran uniquement) ---

  /** Fin de pinch OU de pan : sous le seuil, on revient à 1/0/0 ; sinon on garde l'état. */
  const finishFullscreenGesture = (index: number) => {
    const finalScale = currentScalesRef.current[index] ?? 1;

    if (finalScale < PINCH_RESET_THRESHOLD) {
      Animated.spring(fullscreenScales[index], { toValue: 1, useNativeDriver: true }).start();
      Animated.spring(fullscreenTranslateX[index], { toValue: 0, useNativeDriver: true }).start();
      Animated.spring(fullscreenTranslateY[index], { toValue: 0, useNativeDriver: true }).start();
      currentScalesRef.current[index] = 1;
      currentTranslateXRef.current[index] = 0;
      currentTranslateYRef.current[index] = 0;
      fullscreenScrollViewRef.current?.setNativeProps({ scrollEnabled: true });
      setZoomedIndex((current) => (current === index ? null : current));
    }
    // Sinon : on reste zoomé/déplacé (scrollEnabled reste désactivé pour éviter le conflit
    // swipe/zoom) jusqu'à ce que l'utilisateur re-pince en dessous du seuil.
  };

  // Fonction JS ordinaire (pas Animated.event) : le native driver ne supporte pas
  // l'imbrication PanGestureHandler + PinchGestureHandler avec Animated.event.
  const onFullscreenPinchGestureEvent = (index: number) => (event: any) => {
    const { scale: gestureScale, focalX, focalY } = event.nativeEvent;
    const clampedScale = clamp(gestureScale, PINCH_MIN_SCALE, PINCH_MAX_SCALE);
    currentScalesRef.current[index] = clampedScale;
    fullscreenScales[index].setValue(clampedScale);

    // Le point sous les doigts reste fixe pendant qu'on zoome autour de lui.
    const focalOffsetX = (focalX - screenWidth / 2) * (clampedScale - 1);
    const focalOffsetY = (focalY - screenHeight / 2) * (clampedScale - 1);
    fullscreenTranslateX[index].setValue(focalOffsetX);
    fullscreenTranslateY[index].setValue(focalOffsetY);
    currentTranslateXRef.current[index] = focalOffsetX;
    currentTranslateYRef.current[index] = focalOffsetY;
  };

  const onFullscreenPinchHandlerStateChange = (index: number) => (event: any) => {
    const { state } = event.nativeEvent;

    if (state === State.BEGAN) {
      fullscreenScrollViewRef.current?.setNativeProps({ scrollEnabled: false });
      setZoomedIndex(index);
      return;
    }

    if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      finishFullscreenGesture(index);
    }
  };

  const onFullscreenPanGestureEvent = (index: number) => (event: any) => {
    // Seulement actif si l'image est zoomée.
    if (currentScalesRef.current[index] <= 1) return;

    const { translationX, translationY } = event.nativeEvent;
    const scale = currentScalesRef.current[index];
    const maxTranslateX = (screenWidth * (scale - 1)) / 2;
    const maxTranslateY = (screenHeight * (scale - 1)) / 2;

    const nextX = clamp(panBaseXRef.current[index] + translationX, -maxTranslateX, maxTranslateX);
    const nextY = clamp(panBaseYRef.current[index] + translationY, -maxTranslateY, maxTranslateY);

    fullscreenTranslateX[index].setValue(nextX);
    fullscreenTranslateY[index].setValue(nextY);
    currentTranslateXRef.current[index] = nextX;
    currentTranslateYRef.current[index] = nextY;
  };

  const onFullscreenPanHandlerStateChange = (index: number) => (event: any) => {
    const { state } = event.nativeEvent;

    if (state === State.BEGAN) {
      panBaseXRef.current[index] = currentTranslateXRef.current[index];
      panBaseYRef.current[index] = currentTranslateYRef.current[index];
      return;
    }

    if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      finishFullscreenGesture(index);
    }
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
        {/* Main Image Container — swipe horizontal uniquement, pas de pinch-to-zoom */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          style={styles.scrollView}
          decelerationRate="fast"
        >
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <TouchableOpacity
                style={styles.imageTouchable}
                onPress={() => openFullscreen(index)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: image || 'https://via.placeholder.com/400x400?text=Sin+imagen' }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </TouchableOpacity>
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

        {/* Back Button */}
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
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
      </View>

      {/* Thumbnail Strip */}
      {validImages.length > 1 && (
        <View style={styles.thumbnailStrip}>
          {validImages.slice(0, MAX_VISIBLE_THUMBNAILS).map((image, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.thumbnail,
                index === currentIndex && styles.thumbnailActive,
              ]}
              onPress={() => goToSlide(index)}
            >
              <Image source={{ uri: image }} style={styles.thumbnailImage} />
            </TouchableOpacity>
          ))}
          {validImages.length > MAX_VISIBLE_THUMBNAILS && (
            <TouchableOpacity
              style={styles.thumbnailMore}
              onPress={() => openFullscreen(MAX_VISIBLE_THUMBNAILS)}
            >
              <Text style={styles.thumbnailMoreCount}>+{validImages.length - MAX_VISIBLE_THUMBNAILS}</Text>
              <Text style={styles.thumbnailMoreLabel}>Ver todas</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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

          {/* Fullscreen Image Gallery — swipe horizontal + pinch/pan zoom par image */}
          <ScrollView
            ref={fullscreenScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleFullscreenMomentumScrollEnd}
            style={styles.fullscreenScrollView}
            decelerationRate="fast"
          >
            {validImages.map((image, index) => {
              const clampedScale = fullscreenScales[index].interpolate({
                inputRange: [PINCH_MIN_SCALE, PINCH_MAX_SCALE],
                outputRange: [PINCH_MIN_SCALE, PINCH_MAX_SCALE],
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });

              return (
                <View key={index} style={styles.fullscreenImageContainer}>
                  <PanGestureHandler
                    ref={panRefs[index]}
                    simultaneousHandlers={[pinchRefs[index]]}
                    enabled={zoomedIndex === index}
                    onGestureEvent={onFullscreenPanGestureEvent(index)}
                    onHandlerStateChange={onFullscreenPanHandlerStateChange(index)}
                  >
                    <PinchGestureHandler
                      ref={pinchRefs[index]}
                      simultaneousHandlers={[panRefs[index]]}
                      onGestureEvent={onFullscreenPinchGestureEvent(index)}
                      onHandlerStateChange={onFullscreenPinchHandlerStateChange(index)}
                    >
                      <Animated.View
                        style={[
                          styles.fullscreenPinchContainer,
                          {
                            transform: [
                              { scale: clampedScale },
                              { translateX: fullscreenTranslateX[index] },
                              { translateY: fullscreenTranslateY[index] },
                            ],
                          },
                        ]}
                      >
                        <Image
                          source={{ uri: image || 'https://via.placeholder.com/400x400?text=Sin+imagen' }}
                          style={styles.fullscreenImage}
                          resizeMode="contain"
                        />
                      </Animated.View>
                    </PinchGestureHandler>
                  </PanGestureHandler>
                </View>
              );
            })}
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
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    bottom: 16,
    right: 16,
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
  thumbnailStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: brandColors.surface,
    overflow: 'visible',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: brandColors.primaryUI,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailMore: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: brandColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailMoreCount: {
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.primaryUI,
  },
  thumbnailMoreLabel: {
    fontSize: 10,
    color: brandColors.primaryUI,
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
  fullscreenPinchContainer: {
    flex: 1,
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
