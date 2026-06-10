import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchSuggestionsProps {
  suggestions: string[];
  visible: boolean;
  onSuggestionPress: (suggestion: string) => void;
  onClearHistory: () => void;
  history: Array<{ id: string; query: string; timestamp: number; resultCount: number }>;
  onHistoryPress: (query: string) => void;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  visible,
  onSuggestionPress,
  onClearHistory,
  history,
  onHistoryPress,
}) => {
  if (!visible) return null;

  const renderSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSuggestionPress(item)}
    >
      <Ionicons name="search-outline" size={16} color="#9ca3af" />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => onHistoryPress(item.query)}
    >
      <Ionicons name="time-outline" size={16} color="#9ca3af" />
      <View style={styles.historyContent}>
        <Text style={styles.historyQuery}>{item.query}</Text>
        <Text style={styles.historyCount}>{item.resultCount} resultados</Text>
      </View>
      <Ionicons name="arrow-up-left-box-outline" size={16} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Suggestions de recherche */}
      {suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sugerencias</Text>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `suggestion-${index}`}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Historique de recherche */}
      {history.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
            <TouchableOpacity onPress={onClearHistory} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={history.slice(0, 5)} // Limiter à 5 éléments
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Message si pas de suggestions ni d'historique */}
      {suggestions.length === 0 && history.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={32} color="#9ca3af" />
          <Text style={styles.emptyText}>Comienza a escribir para buscar</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    maxHeight: 300,
  },
  section: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyContent: {
    flex: 1,
    marginLeft: 12,
  },
  historyQuery: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  historyCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});
