import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface CameraComponentProps {
  isVisible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
  maxPhotos?: number;
}

export const CameraComponent: React.FC<CameraComponentProps> = ({
  isVisible,
  onClose,
  onCapture,
  maxPhotos = 10,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a tu galería para seleccionar fotos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onCapture(result.assets[0].uri);
        handleClose();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal visible={isVisible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>Agregar Fotos</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.mainContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="camera-outline" size={64} color="#6B7280" />
            </View>
            
            <Text style={styles.subtitle}>Selecciona fotos de tu producto</Text>
            <Text style={styles.description}>
              Toma fotos claras y bien iluminadas para mostrar mejor tu producto
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={pickImageFromGallery}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="refresh" size={20} color="white" />
                    <Text style={styles.buttonText}>Cargando...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="images-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Seleccionar de Galería</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleClose}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Consejos para mejores fotos:</Text>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.tipText}>Buena iluminación natural</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.tipText}>Fondo limpio y simple</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.tipText}>Múltiples ángulos del producto</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.tipText}>Máximo {maxPhotos} fotos</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#6B7280',
  },
  tipsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
  },
}); 