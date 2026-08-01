import { logger } from '../utils/logger'
import React, { useState } from 'react';
import { Image, ImageProps, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brandColors, radii, typography } from '../theme';

interface SafeImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallbackText?: string;
  style?: any;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  uri,
  fallbackText = 'Sin Imagen',
  style,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    logger.log('Erreur image:', uri);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    // logger.log("✅ SafeImage chargé avec succès:", uri);
    setIsLoading(false);
  };

  if (hasError || !uri || uri === '') {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Ionicons name="image-outline" size={40} color={brandColors.textMuted} />
        <Text style={styles.fallbackText}>{fallbackText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: brandColors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.small,
  },
  fallbackText: {
    color: brandColors.textMuted,
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
