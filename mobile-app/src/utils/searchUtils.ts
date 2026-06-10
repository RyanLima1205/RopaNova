import { Product } from '../types';

// Types pour les options de tri
export type SortOption = {
  id: string;
  label: string;
  key: keyof Product;
  direction: 'asc' | 'desc';
};

// Types pour les filtres avancés
export type AdvancedFilters = {
  sizes: string[];
  colors: string[];
  brands: string[];
  locations: string[];
  priceRange: { min: number; max: number };
  conditions: string[];
  mainCategory?: string;
  subCategory?: string;
  distance?: {
    enabled: boolean;
    maxDistance: number; // en kilomètres
    userLocation?: {
      latitude: number;
      longitude: number;
    };
  };
};

// Types pour l'historique de recherche
export type SearchHistoryItem = {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
};

// Types pour les recherches sauvegardées
export type SavedSearch = {
  id: string;
  name: string;
  query: string;
  filters: AdvancedFilters;
  sortOption: SortOption;
  createdAt: number;
};

// Options de tri disponibles
export const SORT_OPTIONS: SortOption[] = [
  { id: 'relevance', label: 'Relevancia', key: 'title', direction: 'asc' },
  { id: 'price-asc', label: 'Precio: Menor a Mayor', key: 'price', direction: 'asc' },
  { id: 'price-desc', label: 'Precio: Mayor a Menor', key: 'price', direction: 'desc' },
  { id: 'date-desc', label: 'Más Recientes', key: 'createdAt', direction: 'desc' },
  { id: 'date-asc', label: 'Más Antiguos', key: 'createdAt', direction: 'asc' },
  { id: 'popularity', label: 'Más Populares', key: 'views', direction: 'desc' },
];

// Fonction pour normaliser les mots (gérer pluriels/singuliers)
const normalizeWord = (word: string): string => {
  // Vérification de sécurité
  if (!word || typeof word !== 'string') {
    return '';
  }
  
  // Supprimer les accents
  const normalized = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Règles de base pour les pluriels espagnols
  const pluralRules = [
    { from: /s$/, to: '' },           // maletas -> maleta
    { from: /es$/, to: '' },          // zapatos -> zapato
    { from: /ces$/, to: 'z' },        // luces -> luz
    { from: /ones$/, to: 'ón' },      // corazones -> corazón
    { from: /anes$/, to: 'án' },      // pantalanes -> pantalán
  ];
  
  let result = normalized.toLowerCase();
  
  // Appliquer les règles de pluriel
  for (const rule of pluralRules) {
    if (rule.from.test(result)) {
      result = result.replace(rule.from, rule.to);
      break;
    }
  }
  
  return result;
};

// Fonction de recherche intelligente avec gestion des pluriels
export const intelligentSearch = (products: Product[], query: string): Product[] => {
  if (!query.trim()) return products;

  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  const normalizedSearchTerms = searchTerms.map(normalizeWord);
  
  return products.filter(product => {
    const searchableText = [
      product.title || '',
      product.brand || '',
      product.description || '',
      product.category || '',
      product.subcategory || '',
      // Ajouter d'autres champs si nécessaire
    ].join(' ').toLowerCase();

    // Recherche exacte
    if (searchableText.includes(query.toLowerCase())) {
      return true;
    }

    // Recherche par mots-clés individuels (exacte)
    const matchesAllTerms = searchTerms.every(term => 
      searchableText.includes(term)
    );

    if (matchesAllTerms) {
      return true;
    }

    // Recherche avec normalisation (pluriels/singuliers)
    const normalizedSearchableText = searchableText.split(' ').map(normalizeWord).join(' ');
    const matchesNormalized = normalizedSearchTerms.every(term => 
      normalizedSearchableText.includes(term)
    );

    if (matchesNormalized) {
      return true;
    }

    // Recherche floue (tolérance aux fautes de frappe)
    const fuzzyMatch = searchTerms.some(term => {
      if (!term || term.length < 2) return false; // Réduit de 3 à 2 pour "maleta"
      
      // Recherche de sous-chaînes avec tolérance
      return searchableText.split(' ').some(word => {
        if (!word) return false;
        
        const normalizedWord = normalizeWord(word);
        const normalizedTerm = normalizeWord(term);
        
        return word.includes(term) || 
               normalizedWord.includes(normalizedTerm) ||
               levenshteinDistance(word, term) <= 2 ||
               levenshteinDistance(normalizedWord, normalizedTerm) <= 1;
      });
    });

    return fuzzyMatch;
  });
};

// Fonction de distance de Levenshtein pour la recherche floue
const levenshteinDistance = (str1: string, str2: string): number => {
  // Vérifications de sécurité
  if (!str1 || !str2) return Infinity;
  if (typeof str1 !== 'string' || typeof str2 !== 'string') return Infinity;
  
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
};

// Fonction de tri des produits
export const sortProducts = (products: Product[], sortOption: SortOption): Product[] => {
  return [...products].sort((a, b) => {
    const aValue = a[sortOption.key];
    const bValue = b[sortOption.key];

    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;

    let comparison = 0;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    }

    return sortOption.direction === 'asc' ? comparison : -comparison;
  });
};

// Fonction de filtrage avancé
export const applyAdvancedFilters = (products: Product[], filters: AdvancedFilters): Product[] => {
  return products.filter(product => {
    // Filtre par taille
    if (filters.sizes.length > 0) {
      const productSizes = product.sizes || [];
      const hasMatchingSize = filters.sizes.some(size => 
        productSizes.includes(size)
      );
      if (!hasMatchingSize) return false;
    }

    // Filtre par couleur
    if (filters.colors.length > 0) {
      const productColors = product.colors || [];
      const hasMatchingColor = filters.colors.some(color => 
        productColors.includes(color)
      );
      if (!hasMatchingColor) return false;
    }

    // Filtre par marque
    if (filters.brands.length > 0) {
      if (!product.brand || !filters.brands.includes(product.brand)) {
        return false;
      }
    }

    // Filtre par localisation
    if (filters.locations.length > 0) {
      if (!product.location || !filters.locations.includes(product.location)) {
        return false;
      }
    }

    // Filtre par prix
    if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
      return false;
    }

    // Filtre par condition
    if (filters.conditions.length > 0) {
      if (!product.condition || !filters.conditions.includes(product.condition)) {
        return false;
      }
    }

    // Filtre par catégorie principale
    if (filters.mainCategory) {
      if (!product.category || product.category !== filters.mainCategory) {
        return false;
      }
    }

    // Filtre par sous-catégorie
    if (filters.subCategory) {
      if (!product.subcategory || product.subcategory !== filters.subCategory) {
        return false;
      }
    }

    // Filtre par distance
    if (filters.distance?.enabled && filters.distance.userLocation) {
      const { isProductWithinDistance } = require('./locationUtils');
      if (!isProductWithinDistance(product, filters.distance.userLocation, filters.distance.maxDistance)) {
        return false;
      }
    }

    return true;
  });
};

// Marques prédéfinies populaires
const PREDEFINED_BRANDS = [
  'Zara', 'Nike', 'Adidas', 'Mango', 'H&M', 'Pull&Bear', 'Bershka', 'Stradivarius', 
  'Levi\'s', 'Puma', 'Reebok', 'Under Armour', 'Tommy Hilfiger', 'Guess', 'Lacoste', 
  'Gucci', 'Louis Vuitton', 'Prada', 'Chanel', 'Hermès', 'Forever 21', 'Gap', 
  'Uniqlo', 'Calvin Klein', 'Ralph Lauren', 'Versace', 'Fendi', 'Balenciaga', 
  'Givenchy', 'Burberry', 'Dolce & Gabbana', 'Michael Kors', 'Coach', 'Kate Spade',
  'Sin marca'
];

// Fonction pour extraire les options de filtres uniques
export const extractFilterOptions = (products: Product[]) => {
  const sizes = new Set<string>();
  const colors = new Set<string>();
  const brands = new Set<string>();
  const locations = new Set<string>();
  const conditions = new Set<string>();

  // Ajouter d'abord toutes les marques prédéfinies
  PREDEFINED_BRANDS.forEach(brand => brands.add(brand));

  // Ensuite ajouter les marques des produits existants
  products.forEach(product => {
    if (product.sizes) {
      product.sizes.forEach(size => sizes.add(size));
    }
    if (product.colors || product.color) {
      const productColors = product.colors || product.color || [];
      productColors.forEach(color => colors.add(color));
    }
    if (product.brand && product.brand !== 'Otra') {
      brands.add(product.brand);
    }
    if (product.location) {
      locations.add(product.location);
    }
    if (product.condition) {
      conditions.add(product.condition);
    }
  });

  return {
    sizes: Array.from(sizes).sort(),
    colors: Array.from(colors).sort(),
    brands: Array.from(brands).sort((a, b) => {
      // Mettre "Sin marca" à la fin
      if (a === 'Sin marca') return 1;
      if (b === 'Sin marca') return -1;
      return a.localeCompare(b);
    }),
    locations: Array.from(locations).sort(),
    conditions: Array.from(conditions).sort(),
  };
};

// Fonction de debounce pour la recherche en temps réel
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Fonction pour générer des suggestions de recherche
export const generateSearchSuggestions = (products: Product[], query: string): string[] => {
  if (!query.trim() || query.length < 2) return [];

  const suggestions = new Set<string>();
  const queryLower = query.toLowerCase();

  products.forEach(product => {
    // Suggestions basées sur le titre
    if (product.title.toLowerCase().includes(queryLower)) {
      suggestions.add(product.title);
    }

    // Suggestions basées sur la marque
    if (product.brand && product.brand.toLowerCase().includes(queryLower)) {
      suggestions.add(product.brand);
    }

    // Suggestions basées sur la catégorie
    if (product.category && product.category.toLowerCase().includes(queryLower)) {
      suggestions.add(product.category);
    }

    // Suggestions basées sur la sous-catégorie
    if (product.subcategory && product.subcategory.toLowerCase().includes(queryLower)) {
      suggestions.add(product.subcategory);
    }
  });

  return Array.from(suggestions).slice(0, 5); // Limiter à 5 suggestions
};
