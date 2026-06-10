import { logger } from '../utils/logger'
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { AdvancedFilters as AdvancedFiltersType } from '../utils/searchUtils';
import { 
  getCurrentLocation, 
  DISTANCE_OPTIONS, 
  formatDistance,
  Coordinates 
} from '../utils/locationUtils';
import { categories } from '../data/categories';

// Couleurs définies dans SellScreen
const colorOptions = [
  { name: 'Negro', value: 'negro', color: '#000000' },
  { name: 'Blanco', value: 'blanco', color: '#FFFFFF' },
  { name: 'Gris', value: 'gris', color: '#808080' },
  { name: 'Azul', value: 'azul', color: '#0066CC' },
  { name: 'Azul Marino', value: 'azul-marino', color: '#001f3f' },
  { name: 'Rojo', value: 'rojo', color: '#FF4136' },
  { name: 'Rosa', value: 'rosa', color: '#FF69B4' },
  { name: 'Verde', value: 'verde', color: '#2ECC40' },
  { name: 'Amarillo', value: 'amarillo', color: '#FFDC00' },
  { name: 'Naranja', value: 'naranja', color: '#FF851B' },
  { name: 'Morado', value: 'morado', color: '#B10DC9' },
  { name: 'Marrón', value: 'marron', color: '#8B4513' },
];

// Tailles par type de produit
const sizesByType = {
  // Vêtements généraux
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  
  // Pantalons (tailles américaines)
  pants: ['26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '38', '40', '42', '44'],
  
  // Chaussures (tailles américaines)
  shoes: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13'],
  
  // Chaussures enfants
  kidsShoes: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
  
  // Vêtements bébé (par mois)
  baby: ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'],
  
  // Vêtements enfants (par âge)
  kids: ['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12', '14', '16'],
  
  // Livres (pas de taille)
  books: ['Único'],
  
  // Taille unique pour accessoires
  oneSize: ['Única'],
};

// Mapping des sous-catégories aux types de tailles
const subcategoryToSizeType: Record<string, keyof typeof sizesByType> = {
  // Pantalons
  'Pantalones': 'pants',
  
  // Chaussures
  'Zapatos': 'shoes',
  'Zapatos Infantiles': 'kidsShoes',
  
  // Vêtements bébé
  'Ropa de Bebé (0-24 meses)': 'baby',
  
  // Vêtements enfants
  'Ropa de Niña (2-12 años)': 'kids',
  'Ropa de Niño (2-12 años)': 'kids',
  
  // Livres
  'Universitarios': 'books',
  'Novelas Románticas': 'books',
  'Negocios': 'books',
  'Autoayuda y Motivación': 'books',
  'Cocina': 'books',
  'Salud y Bienestar': 'books',
  'Religiosos': 'books',
  'Historia Dominicana': 'books',
  'Idiomas': 'books',
  'Infantiles': 'books',
  
  // Accessoires et articles à taille unique
  'Accesorios': 'oneSize',
  'Accesorios Infantiles': 'oneSize',
  'Gorras': 'oneSize',
  'Juguetes y Juegos': 'oneSize',
  'Disfraces': 'oneSize',
  'Artículos Deportivos Infantiles': 'oneSize',
  
  // Tous les autres vêtements (y compris Deportivas) utilisent les tailles standard
};

// Fonction pour obtenir les tailles selon la sous-catégorie
const getSizesForSubcategory = (subCategory?: string): string[] => {
  if (!subCategory) {
    return sizesByType.clothing; // Par défaut, tailles de vêtements
  }
  
  const sizeType = subcategoryToSizeType[subCategory];
  if (sizeType) {
    return sizesByType[sizeType];
  }
  
  // Par défaut, retourner les tailles de vêtements
  return sizesByType.clothing;
};

interface AdvancedFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedFiltersType) => void;
  currentFilters: AdvancedFiltersType;
  availableOptions: {
    sizes: string[];
    colors: string[];
    brands: string[];
    locations: string[];
    conditions: string[];
  };
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
  availableOptions,
}) => {
  const [filters, setFilters] = useState<AdvancedFiltersType>(currentFilters);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: AdvancedFiltersType = {
      sizes: [],
      colors: [],
      brands: [],
      locations: [],
      priceRange: { min: 0, max: 50000 },
      conditions: [],
      mainCategory: undefined,
      subCategory: undefined,
      distance: {
        enabled: false,
        maxDistance: 10,
      },
    };
    setFilters(resetFilters);
    setLocationError(null);
    setShowBrandDropdown(false);
  };



  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const renderFilterSection = (
    title: string,
    items: string[],
    selectedItems: string[],
    onToggle: (item: string) => void
  ) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.chipsContainer}>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterChip,
              selectedItems.includes(item) && styles.filterChipActive,
            ]}
            onPress={() => onToggle(item)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedItems.includes(item) && styles.filterChipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filtros Avanzados</Text>
          <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
            <Text style={styles.resetText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <TouchableWithoutFeedback onPress={() => setShowBrandDropdown(false)}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                 {/* Prix Range */}
                 <View style={styles.filterSection}>
                   <Text style={styles.filterTitle}>Rango de Precio</Text>
                   
                   <View style={styles.priceRangeContainer}>
                     <View style={styles.priceInputs}>
                       <View style={styles.priceInput}>
                         <Text style={styles.priceLabel}>Mínimo (RD$)</Text>
                         <TextInput
                           style={styles.priceTextInput}
                           value={filters.priceRange.min === 0 ? '' : filters.priceRange.min.toString()}
                           onChangeText={(text) => {
                             const value = parseInt(text) || 0;
                             setFilters(prev => ({
                               ...prev,
                               priceRange: { ...prev.priceRange, min: value }
                             }));
                           }}
                           placeholder="0"
                           keyboardType="numeric"
                         />
                       </View>
                       <View style={styles.priceInput}>
                         <Text style={styles.priceLabel}>Máximo (RD$)</Text>
                         <TextInput
                           style={styles.priceTextInput}
                           value={filters.priceRange.max === 50000 ? '' : filters.priceRange.max.toString()}
                           onChangeText={(text) => {
                             const value = parseInt(text) || 50000;
                             setFilters(prev => ({
                               ...prev,
                               priceRange: { ...prev.priceRange, max: value }
                             }));
                           }}
                           placeholder="50000"
                           keyboardType="numeric"
                         />
                       </View>
                     </View>
                   </View>
                 </View>

          {/* Catégories principales */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Categoría Principal</Text>
            <View style={styles.chipsContainer}>
              {categories.filter(cat => cat.name !== 'Todo').map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterChip,
                    filters.mainCategory === category.name && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setFilters(prev => ({
                      ...prev,
                      mainCategory: prev.mainCategory === category.name ? undefined : category.name,
                      subCategory: undefined, // Reset subcategory when main category changes
                      sizes: [], // Reset sizes when main category changes
                    }));
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.mainCategory === category.name && styles.filterChipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sous-catégories */}
          {filters.mainCategory && categories.find(cat => cat.name === filters.mainCategory)?.subcategories && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Subcategoría</Text>
              <View style={styles.chipsContainer}>
                {categories.find(cat => cat.name === filters.mainCategory)?.subcategories?.map((subCategory) => (
                  <TouchableOpacity
                    key={subCategory.id}
                    style={[
                      styles.filterChip,
                      filters.subCategory === subCategory.name && styles.filterChipActive,
                    ]}
                    onPress={() => {
                      const availableSizes = getSizesForSubcategory(subCategory.name);
                      const autoSelectSize = availableSizes.length === 1 ? availableSizes : [];
                      
                      setFilters(prev => ({
                        ...prev,
                        subCategory: prev.subCategory === subCategory.name ? undefined : subCategory.name,
                        sizes: autoSelectSize, // Auto-select if only one size, reset otherwise
                      }));
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.subCategory === subCategory.name && styles.filterChipTextActive,
                      ]}
                    >
                      {subCategory.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Taille - Masqué pour les livres */}
          {filters.mainCategory !== 'Libro' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Talla</Text>
              <View style={styles.chipsContainer}>
                {getSizesForSubcategory(filters.subCategory).map((size) => {
                  const availableSizes = getSizesForSubcategory(filters.subCategory);
                  const isSingleSize = availableSizes.length === 1;
                  
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.filterChip,
                        filters.sizes.includes(size) && styles.filterChipActive,
                        isSingleSize && styles.filterChipDisabled,
                      ]}
                      onPress={() => {
                        // Si taille unique, ne pas permettre la désélection
                        if (isSingleSize) {
                          return;
                        }
                        
                        setFilters(prev => ({ 
                          ...prev, 
                          sizes: toggleArrayItem(prev.sizes, size) 
                        }));
                      }}
                      disabled={isSingleSize}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.sizes.includes(size) && styles.filterChipTextActive,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Couleur - Masqué pour les livres */}
          {filters.mainCategory !== 'Libro' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Color</Text>
              <View style={styles.chipsContainer}>
                {colorOptions.map((colorOption) => (
                  <TouchableOpacity
                    key={colorOption.value}
                    style={[
                      styles.colorChip,
                      filters.colors.includes(colorOption.value) && styles.colorChipActive,
                    ]}
                    onPress={() => {
                      setFilters(prev => ({ 
                        ...prev, 
                        colors: toggleArrayItem(prev.colors, colorOption.value) 
                      }));
                    }}
                  >
                    <View style={[styles.colorIndicator, { backgroundColor: colorOption.color }]} />
                    <Text
                      style={[
                        styles.colorChipText,
                        filters.colors.includes(colorOption.value) && styles.colorChipTextActive,
                      ]}
                    >
                      {colorOption.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Marque - Masqué pour les livres */}
          {filters.mainCategory !== 'Libro' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Marca</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowBrandDropdown(!showBrandDropdown)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {filters.brands.length === 0 
                      ? 'Todas las marcas' 
                      : filters.brands.length === 1 
                        ? filters.brands[0]
                        : `${filters.brands.length} marcas seleccionadas`
                    }
                  </Text>
                  <Ionicons
                    name={showBrandDropdown ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
                
                {showBrandDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                      {/* Option "Todas las marcas" */}
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFilters(prev => ({ 
                            ...prev, 
                            brands: [] // Vide le tableau pour "Todas las marcas"
                          }));
                        }}
                      >
                        <View style={styles.dropdownItemContent}>
                          <Text style={styles.dropdownItemText}>Todas las marcas</Text>
                          {filters.brands.length === 0 && (
                            <Ionicons name="checkmark" size={20} color="#059669" />
                          )}
                        </View>
                      </TouchableOpacity>
                      
                      {/* Séparateur */}
                      <View style={styles.dropdownSeparator} />
                      
                      {/* Liste des marques */}
                      {availableOptions.brands.map((brand) => (
                        <TouchableOpacity
                          key={brand}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setFilters(prev => ({ 
                              ...prev, 
                              brands: toggleArrayItem(prev.brands, brand) 
                            }));
                          }}
                        >
                          <View style={styles.dropdownItemContent}>
                            <Text style={styles.dropdownItemText}>{brand}</Text>
                            {filters.brands.includes(brand) && (
                              <Ionicons name="checkmark" size={20} color="#059669" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          )}


          {/* Condition */}
          {renderFilterSection(
            'Condición',
            availableOptions.conditions,
            filters.conditions,
            (item) => setFilters(prev => ({ ...prev, conditions: toggleArrayItem(prev.conditions, item) }))
          )}

          {/* Filtre de Distance */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Distancia</Text>
            
            <View style={styles.distanceChipsContainer}>
              {DISTANCE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.distanceChip,
                    filters.distance?.maxDistance === option.value && styles.distanceChipActive,
                  ]}
                  onPress={async () => {
                    if (option.value === 0) {
                      // "Cualquier distancia" - désactiver le filtre et effacer l'erreur
                      setLocationError(null);
                      setFilters(prev => ({
                        ...prev,
                        distance: {
                          enabled: false,
                          maxDistance: 0,
                        },
                      }));
                    } else {
                      // Autres distances - vérifier si on a déjà la localisation
                      if (filters.distance?.userLocation) {
                        // Localisation déjà disponible
                        setLocationError(null);
                        setFilters(prev => ({
                          ...prev,
                          distance: {
                            ...prev.distance,
                            enabled: true,
                            maxDistance: option.value,
                          },
                        }));
                      } else {
                        // Demander la localisation
                        try {
                          const location = await getCurrentLocation();
                          if (location) {
                            setLocationError(null);
                            setFilters(prev => ({
                              ...prev,
                              distance: {
                                enabled: true,
                                maxDistance: option.value,
                                userLocation: location,
                              },
                            }));
                          } else {
                            setLocationError('Para usar este filtro, necesitas activar la ubicación en Configuración > Privacidad > Servicios de ubicación.');
                          }
                        } catch (error) {
                          logger.error('Error getting location:', error);
                          setLocationError('Para usar este filtro, necesitas activar la ubicación en Configuración > Privacidad > Servicios de ubicación.');
                        }
                      }
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.distanceChipText,
                      filters.distance?.maxDistance === option.value && styles.distanceChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Message d'erreur pour la géolocalisation */}
            {locationError && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{locationError}</Text>
              </View>
            )}

          </View>
        </ScrollView>
        </TouchableWithoutFeedback>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  resetText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterChipDisabled: {
    opacity: 0.7,
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  priceRangeContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  priceInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  priceTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  // Styles pour les couleurs
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 8,
  },
  colorChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  colorChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  colorChipTextActive: {
    color: '#ffffff',
  },
  // Styles pour la liste déroulante des marques
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  // Styles pour le filtre de distance
  distanceChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  distanceChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  distanceChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  distanceChipTextActive: {
    color: '#ffffff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    lineHeight: 16,
  },
});
