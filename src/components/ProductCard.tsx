import type React from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"

const { width } = Dimensions.get("window")
const cardWidth = (width - 48) / 2 // 16px padding on each side + 16px gap

interface ProductCardProps {
  product: {
    id: number
    title: string
    price: number
    condition: string
    location: string
    brand?: string
    size?: string
    image: string
  }
  onPress: () => void
  onFavorite?: () => void
  isFavorite?: boolean
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onFavorite, isFavorite = false }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} />
        {onFavorite && (
          <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
            <Icon name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#EF4444" : "#6B7280"} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>RD${product.price.toLocaleString()}</Text>

        <View style={styles.badges}>
          <View style={[styles.badge, product.condition === "Nuevo" ? styles.newBadge : styles.usedBadge]}>
            <Text
              style={[styles.badgeText, product.condition === "Nuevo" ? styles.newBadgeText : styles.usedBadgeText]}
            >
              {product.condition}
            </Text>
          </View>
          {product.size && (
            <View style={styles.sizeBadge}>
              <Text style={styles.sizeBadgeText}>{product.size}</Text>
            </View>
          )}
        </View>

        <Text style={styles.location} numberOfLines={1}>
          {product.location}
        </Text>
        {product.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: cardWidth * 0.75,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 18,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  newBadge: {
    backgroundColor: "#10B981",
  },
  usedBadge: {
    backgroundColor: "#6B7280",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  newBadgeText: {
    color: "white",
  },
  usedBadgeText: {
    color: "white",
  },
  sizeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  sizeBadgeText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#374151",
  },
  location: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  brand: {
    fontSize: 12,
    color: "#9CA3AF",
  },
})
