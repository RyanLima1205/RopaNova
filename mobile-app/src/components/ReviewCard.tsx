import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '../types';

interface ReviewCardProps {
  review: Review;
  isSeller?: boolean;
  showProduct?: boolean;
  onResponseSubmit?: (reviewId: string, responseText: string) => void;
}

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({
  rating,
  size = 'sm',
}) => {
  const sizeMap = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={sizeMap[size]}
          color={star <= rating ? '#FBBF24' : '#D1D5DB'}
        />
      ))}
    </View>
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isSeller = false,
  showProduct = false,
  onResponseSubmit,
}) => {
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [responseText, setResponseText] = useState('');

  const handleSubmitResponse = () => {
    if (!responseText.trim()) {
      Alert.alert('Error', 'Por favor ingresa una respuesta');
      return;
    }

    if (onResponseSubmit) {
      onResponseSubmit(review.id, responseText);
      setResponseText('');
      setShowResponseInput(false);
    }
  };

  const formatDate = (date: string) => {
    return date;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.buyerInfo}>
          <Image
            source={{ uri: review.buyerAvatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.buyerDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.buyerName}>{review.buyerName}</Text>
              {review.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              )}
            </View>
            <Text style={styles.date}>{formatDate(review.date)}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <StarRating rating={review.rating} size="md" />
          <Text style={styles.ratingText}>{review.rating}/5</Text>
        </View>
      </View>

      {/* Product Info */}
      {showProduct && (
        <View style={styles.productInfo}>
          <Text style={styles.productTitle}>{review.productTitle}</Text>
        </View>
      )}

      {/* Comment */}
      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
          {review.photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.photo}
            />
          ))}
        </ScrollView>
      )}

      {/* Helpful Button */}
      <View style={styles.helpfulContainer}>
        <TouchableOpacity style={styles.helpfulButton}>
          <Ionicons name="thumbs-up-outline" size={16} color="#6B7280" />
          <Text style={styles.helpfulText}>Útil ({review.helpful})</Text>
        </TouchableOpacity>
      </View>

      {/* Seller Response */}
      {review.sellerResponse && (
        <View style={styles.sellerResponse}>
          <View style={styles.responseHeader}>
            <Image
              source={{ uri: review.sellerAvatar || 'https://via.placeholder.com/32' }}
              style={styles.sellerAvatar}
            />
            <View style={styles.responseInfo}>
              <Text style={styles.sellerName}>Respuesta del vendedor</Text>
              <Text style={styles.responseDate}>{review.sellerResponseDate}</Text>
            </View>
          </View>
          <Text style={styles.responseText}>{review.sellerResponse}</Text>
        </View>
      )}

      {/* Response Input (for sellers) */}
      {isSeller && !review.sellerResponse && (
        <View style={styles.responseInputContainer}>
          {!showResponseInput ? (
            <TouchableOpacity
              style={styles.addResponseButton}
              onPress={() => setShowResponseInput(true)}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#3B82F6" />
              <Text style={styles.addResponseText}>Responder</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.responseInput}
                placeholder="Escribe tu respuesta..."
                value={responseText}
                onChangeText={setResponseText}
                multiline
                numberOfLines={3}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowResponseInput(false);
                    setResponseText('');
                  }}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitResponse}
                >
                  <Text style={styles.submitText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  buyerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  productInfo: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  comment: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  photosContainer: {
    marginBottom: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  helpfulContainer: {
    marginBottom: 12,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpfulText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sellerResponse: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  responseInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  responseDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  responseText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  responseInputContainer: {
    marginTop: 12,
  },
  addResponseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  addResponseText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 14,
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  submitText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
}); 