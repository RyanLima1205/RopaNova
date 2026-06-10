import { logger } from '../utils/logger'
import React, { useState } from 'react';
import { Image, ImageProps, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        <Ionicons name="image-outline" size={40} color="#9ca3af" />
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
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  fallbackText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
