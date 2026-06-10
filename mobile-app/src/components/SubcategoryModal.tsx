import React from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Category, Subcategory } from '../types'

interface SubcategoryModalProps {
  visible: boolean
  category: Category | null
  onClose: () => void
  onSelectSubcategory: (subcategory: Subcategory) => void
}

export const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  visible,
  category,
  onClose,
  onSelectSubcategory,
}) => {
  const renderSubcategory = ({ item }: { item: Subcategory }) => (
    <TouchableOpacity
      style={styles.subcategoryItem}
      onPress={() => {
        onSelectSubcategory(item)
        onClose()
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.subcategoryText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </TouchableOpacity>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {category?.name || 'Categoría'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Subcategories */}
        {category?.subcategories && category.subcategories.length > 0 ? (
          <FlatList
            data={category.subcategories}
            renderItem={renderSubcategory}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="folder-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>
              No hay subcategorías disponibles
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  listContainer: {
    paddingBottom: 20,
  },
  subcategoryItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subcategoryText: {
    fontSize: 16,
    color: '#111827',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
}) 