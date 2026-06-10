import { logger } from './logger'
import * as Location from 'expo-location';

// Interface pour les coordonnées
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Interface pour la localisation avec distance
export interface LocationWithDistance {
  coordinates: Coordinates;
  distance?: number; // Distance en kilomètres
}

// Distance prédéfinies en kilomètres
export const DISTANCE_OPTIONS = [
  { id: '1', label: 'Cualquier distancia', value: 0 },
  { id: '2', label: 'Menos de 1 km', value: 1 },
  { id: '3', label: 'Menos de 5 km', value: 5 },
  { id: '4', label: 'Menos de 10 km', value: 10 },
  { id: '5', label: 'Menos de 25 km', value: 25 },
  { id: '6', label: 'Menos de 50 km', value: 50 },
];

// Centres géographiques des provinces de la République Dominicaine
export const PROVINCE_CENTERS: Record<string, Coordinates> = {
  // Région Cibao Norte
  'Santiago': { latitude: 19.4517, longitude: -70.6970 },
  'Puerto Plata': { latitude: 19.7939, longitude: -70.6871 },
  'Espaillat': { latitude: 19.6219, longitude: -70.3506 },
  
  // Région Cibao Sur
  'La Vega': { latitude: 19.2226, longitude: -70.5296 },
  'Monseñor Nouel': { latitude: 18.9167, longitude: -70.4167 },
  'Sánchez Ramírez': { latitude: 19.0500, longitude: -70.1500 },
  
  // Région Cibao Nordeste
  'Duarte': { latitude: 19.3000, longitude: -70.0000 },
  'María Trinidad Sánchez': { latitude: 19.3833, longitude: -69.8500 },
  'Samaná': { latitude: 19.2058, longitude: -69.3369 },
  'Salcedo': { latitude: 19.3770, longitude: -70.4184 },
  
  // Région Cibao Noroeste
  'Valverde': { latitude: 19.5833, longitude: -70.9833 },
  'Monte Cristi': { latitude: 19.8500, longitude: -71.6500 },
  'Dajabón': { latitude: 19.5500, longitude: -71.7167 },
  'Santiago Rodríguez': { latitude: 19.4667, longitude: -71.3333 },
  
  // Région Valdesia
  'San Cristóbal': { latitude: 18.4167, longitude: -70.1000 },
  'Peravia': { latitude: 18.3167, longitude: -70.2333 },
  'San José de Ocoa': { latitude: 18.5500, longitude: -70.5000 },
  
  // Région Enriquillo
  'Barahona': { latitude: 18.2085, longitude: -71.1005 },
  'Baoruco': { latitude: 18.4833, longitude: -71.4167 },
  'Independencia': { latitude: 18.6167, longitude: -71.7333 },
  'Pedernales': { latitude: 18.0333, longitude: -71.7667 },
  
  // Région El Valle
  'Azua': { latitude: 18.4500, longitude: -70.7333 },
  'Elías Piña': { latitude: 18.8833, longitude: -71.6833 },
  'San Juan': { latitude: 18.8000, longitude: -71.2333 },
  
  // Région Yuma
  'La Romana': { latitude: 18.4273, longitude: -68.9728 },
  'La Altagracia': { latitude: 18.5821, longitude: -68.4047 },
  'El Seibo': { latitude: 18.7667, longitude: -69.0500 },
  'Hato Mayor': { latitude: 18.7667, longitude: -69.2500 },
  
  // Région Higuamo
  'San Pedro de Macorís': { latitude: 18.4619, longitude: -69.3036 },
  'Monte Plata': { latitude: 18.8070, longitude: -69.7845 },
  
  // Région Ozama (Grande Santo Domingo)
  'Distrito Nacional': { latitude: 18.4861, longitude: -69.9312 },
  'Santo Domingo': { latitude: 18.5000, longitude: -69.9000 },
  
  // Région Del Valle (déjà incluse ci-dessus)
};

/**
 * Obtient les coordonnées du centre d'une province
 * @param provinceName Nom de la province
 * @returns Coordonnées du centre ou Santo Domingo par défaut
 */
export const getProvinceCenter = (provinceName: string): Coordinates => {
  return PROVINCE_CENTERS[provinceName] || PROVINCE_CENTERS['Distrito Nacional'];
};

/**
 * Obtient la liste de toutes les provinces triées alphabétiquement
 * @returns Liste des noms de provinces
 */
export const getAllProvinces = (): string[] => {
  return Object.keys(PROVINCE_CENTERS).sort();
};

/**
 * Calcule la distance entre deux points géographiques en utilisant la formule de Haversine
 * @param lat1 Latitude du premier point
 * @param lon1 Longitude du premier point
 * @param lat2 Latitude du deuxième point
 * @param lon2 Longitude du deuxième point
 * @returns Distance en kilomètres
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Arrondir à 2 décimales
};

/**
 * Demande la permission de géolocalisation et obtient la position actuelle
 * @returns Coordonnées de l'utilisateur ou null si refusé
 */
export const getCurrentLocation = async (): Promise<Coordinates | null> => {
  try {
    // Demander la permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      logger.log('Permission de géolocalisation refusée');
      return null;
    }

    // Obtenir la position actuelle
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    logger.error('Erreur lors de la récupération de la position:', error);
    return null;
  }
};

/**
 * Formate la distance pour l'affichage
 * @param distance Distance en kilomètres
 * @returns Chaîne formatée
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} km`;
  } else {
    return `${Math.round(distance)} km`;
  }
};

/**
 * Convertit une adresse en coordonnées (géocodage inverse)
 * @param address Adresse à géocoder
 * @returns Coordonnées ou null si échec
 */
export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  try {
    const results = await Location.geocodeAsync(address);
    if (results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
    }
    return null;
  } catch (error) {
    logger.error('Erreur lors du géocodage:', error);
    return null;
  }
};

/**
 * Convertit des coordonnées en adresse (géocodage inverse)
 * @param coordinates Coordonnées à convertir
 * @returns Adresse ou null si échec
 */
export const reverseGeocode = async (coordinates: Coordinates): Promise<string | null> => {
  try {
    const results = await Location.reverseGeocodeAsync(coordinates);
    if (results.length > 0) {
      const result = results[0];
      const parts = [result.city, result.region, result.country].filter(Boolean);
      return parts.join(', ');
    }
    return null;
  } catch (error) {
    logger.error('Erreur lors du géocodage inverse:', error);
    return null;
  }
};

/**
 * Extrait les coordonnées d'un produit à partir du vendeur
 * Utilise la géolocalisation du profil du vendeur selon son type de compte
 * @param product Produit avec informations du vendeur
 * @returns Coordonnées ou null si non disponibles
 */
export const extractProductCoordinates = (product: any): Coordinates | null => {
  const seller = product.seller;
  if (!seller) return null;
  
  // Tienda Física : Utiliser geoPoint exact (adresse du magasin)
  if (seller.accountType === 'fisica' && seller.geoPoint) {
    return {
      latitude: seller.geoPoint.latitude,
      longitude: seller.geoPoint.longitude,
    };
  }
  
  // Vendedor Virtual : Utiliser le centre de la province
  if (seller.province) {
    return getProvinceCenter(seller.province);
  }
  
  // Legacy : Si le produit a des coordonnées directes
  if (product.latitude && product.longitude) {
    return {
      latitude: parseFloat(product.latitude),
      longitude: parseFloat(product.longitude),
    };
  }
  
  // Legacy : Si le vendeur a un geoPoint (anciennes données)
  if (seller.geoPoint) {
    return {
      latitude: seller.geoPoint.latitude,
      longitude: seller.geoPoint.longitude,
    };
  }

  // Aucune coordonnée disponible
  return null;
};

/**
 * Vérifie si un produit est dans la distance spécifiée
 * @param product Produit à vérifier
 * @param userLocation Position de l'utilisateur
 * @param maxDistance Distance maximale en kilomètres
 * @returns true si le produit est dans la distance
 */
export const isProductWithinDistance = (
  product: any,
  userLocation: Coordinates,
  maxDistance: number
): boolean => {
  if (maxDistance === 0) return true; // Aucune limite de distance

  const productCoordinates = extractProductCoordinates(product);
  if (!productCoordinates) return false;

  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    productCoordinates.latitude,
    productCoordinates.longitude
  );

  return distance <= maxDistance;
};
