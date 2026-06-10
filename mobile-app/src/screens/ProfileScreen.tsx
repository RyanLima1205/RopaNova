import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  Animated,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native'
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import { useAuth } from '../contexts/AuthContext'
import { ProductCard } from '../components/ProductCard'
import { useFavoriteProductIds } from '../hooks/useFavoriteProductIds'
import { logger } from '../utils/logger'
import { getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeSellerReviewStats, getReviewsBySellerId } from '../services/reviewService';

const { width } = Dimensions.get('window')

type Badge = { name: string; icon: string; color: string };
const defaultUserData: {
  id: string;
  username: string;
  name: string;
  lastname: string;
  storeName: string;
  accountType: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  verified: boolean;
  stats: {
    totalSales: number;
    rating: number;
    reviewCount: number;
    followers: number;
    totalEarnings: number;
  };
  badges: Badge[];
  rewards: {
    points: number;
    level: string;
    nextLevel: string;
    pointsToNext: number;
  };
  insights: {
    monthlySavings: number;
  };
  province: string;
  city: string;
  createdAt?: string;
} = {
  id: '',
  username: '',
  name: '',
  lastname: '',
  storeName: '',
  accountType: '',
  avatar: '',
  coverImage: '',
  bio: '',
  location: '',
  verified: false,
  stats: {
    totalSales: 0,
    rating: 0,
    reviewCount: 0,
    followers: 0,
    totalEarnings: 0,
  },
  badges: [],
  rewards: {
    points: 0,
    level: '',
    nextLevel: '',
    pointsToNext: 0,
  },
  insights: {
    monthlySavings: 0,
  },
  province: '',
  city: '',
  createdAt: '',
}

// Type pour les publications de l'utilisateur
interface UserListing {
  id: string;
  title: string;
  price: string;
  condition: string;
  images: string[];
  createdAt: any;
  category: string;
  subcategory: string;
  brand: string;
  color: string[];
  talla: string[]; // Tailles extraites depuis stock[].talla
  status?: 'active' | 'sold' | 'inactive';
}

const myFavorites = [
  {
    id: 4,
    image: 'https://via.placeholder.com/200',
    title: 'Chaqueta de Cuero Vintage',
    price: 4500,
    condition: 'Usado',
    seller: 'Ana Rodríguez',
    location: 'Santiago',
  },
]

// Fonction utilitaire pour formater la date createdAt (supporte string ou Firestore Timestamp)
function formatCreatedAt(createdAt?: any) {
  if (!createdAt) return '';
  let date: Date;
  // Si c'est un objet Firestore Timestamp
  if (typeof createdAt === 'object' && createdAt.seconds) {
    date = new Date(createdAt.seconds * 1000);
  } else {
    // Sinon, string ou Date
    date = new Date(createdAt);
  }
  if (isNaN(date.getTime())) return '';
  const monthsEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${monthsEs[date.getMonth()]} ${date.getFullYear()}`;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { favoriteProductIds } = useFavoriteProductIds()
  const route = useRoute()
  const viewUserIdParam = (route.params as { viewUserId?: string } | undefined)?.viewUserId?.trim()
  const { user, logout } = useAuth();
  const profileUserId = viewUserIdParam || user?.id || ''
  const isOwnProfile = !viewUserIdParam || viewUserIdParam === user?.id
  const [userData, setUserData] = useState(defaultUserData);
  const [loading, setLoading] = useState(true);
  const [myListings, setMyListings] = useState<UserListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reduction: string;
  } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastAnimation = new Animated.Value(0);
  const [avatarCache, setAvatarCache] = useState<{[key: string]: string}>({});
  const [coverCache, setCoverCache] = useState<{[key: string]: string}>({});
  const [cacheLoading, setCacheLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedProductToDelete, setSelectedProductToDelete] = useState<UserListing | null>(null);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
  const [selectedProductForActions, setSelectedProductForActions] = useState<UserListing | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sellerReviewStats, setSellerReviewStats] = useState({ averageRating: 0, reviewCount: 0 });
  /** Évite de redemander Firestore au 1er focus (le useEffect [profileUserId] suffit). Au focus suivant ex. retour depuis AccountSettings → refetch. */
  const skipOwnProfileFirestoreRefetchRef = useRef(true);

  useEffect(() => {
    skipOwnProfileFirestoreRefetchRef.current = true;
  }, [profileUserId]);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      if (!profileUserId) {
        setUserData(defaultUserData);
        setLoading(false);
        return;
      }
      try {
        const db = getFirestore(app);
        const docRef = doc(db, 'users', profileUserId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userDataFromFirestore = { ...defaultUserData, ...docSnap.data(), id: profileUserId };
          setUserData(userDataFromFirestore);
          
          // Charger l'avatar avec cache si disponible
          if (userDataFromFirestore.avatar && userDataFromFirestore.avatar.trim() !== '') {
            await getCachedAvatar(profileUserId, userDataFromFirestore.avatar);
          }
          
          // Charger la couverture avec cache si disponible
          if (userDataFromFirestore.coverImage && userDataFromFirestore.coverImage.trim() !== '') {
            await getCachedCover(profileUserId, userDataFromFirestore.coverImage);
          }
        } else {
          setUserData(defaultUserData);
        }
      } catch (e) {
        setUserData(defaultUserData);
      }
      setLoading(false);
    };
    fetchUserData();
  }, [profileUserId]);

  const fetchSellerReviewStats = useCallback(async () => {
    if (!profileUserId) {
      setSellerReviewStats({ averageRating: 0, reviewCount: 0 });
      return;
    }
    try {
      const rows = await getReviewsBySellerId(profileUserId);
      const stats = computeSellerReviewStats(rows);
      setSellerReviewStats({
        averageRating: stats.averageRating,
        reviewCount: stats.reviewCount,
      });
    } catch {
      setSellerReviewStats({ averageRating: 0, reviewCount: 0 });
    }
  }, [profileUserId]);

  useEffect(() => {
    fetchSellerReviewStats();
  }, [fetchSellerReviewStats]);

  // Charger le cache au démarrage
  useEffect(() => {
    loadAvatarCache();
    loadCoverCache();
    // Nettoyer le cache une fois par jour
    cleanAvatarCache();
  }, []);

  // Fonction pour récupérer les publications de l'utilisateur
  const fetchUserListings = async (isRefresh = false) => {
    if (!profileUserId) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setListingsLoading(true);
    }
    try {
      const db = getFirestore(app);
      const q = query(collection(db, 'products'), where('userId', '==', profileUserId));
      const querySnapshot = await getDocs(q);
      
      const listings: UserListing[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logger.log('Données brutes du produit dans ProfileScreen:', data);
        logger.log('Champ stock:', data.stock);
        logger.log('Champ talla:', data.talla);
        logger.log('Champ color:', data.color);
        logger.log('Tous les champs disponibles:', Object.keys(data));
        
        // Extraire les tailles depuis stock
        let tallas: string[] = [];
        if (data.stock && Array.isArray(data.stock)) {
          tallas = data.stock.map((item: any) => item.talla).filter(Boolean);
        }
        
        const listing = {
          id: doc.id,
          title: data.titulo || data.title || '',
          price: data.precio || data.price || '',
          condition: data.condicionGeneral || data.condition || '',
          images: data.images || [],
          createdAt: data.createdAt,
          category: data.categoria || data.category || '',
          subcategory: data.subcategoria || data.subcategory || '',
          brand: data.marca || data.brand || '',
          color: data.color || [],
          talla: tallas,
          status: data.status || 'active',
        };
        
        logger.log('Listing traité:', listing);
        listings.push(listing);
      });
      
      // Trier par date de création (plus récent en premier)
      listings.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      logger.log('Listings traités:', listings);
      setMyListings(listings);
    } catch (error) {
      logger.error('Erreur lors de la récupération des publications:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setListingsLoading(false);
      }
    }
  };

  // Recharger les annonces + le doc utilisateur (profil perso) à chaque retour sur l’écran
  useFocusEffect(
    useCallback(() => {
      if (!profileUserId) return;

      let cancelled = false;
      fetchUserListings();
      fetchSellerReviewStats();

      if (isOwnProfile) {
        if (skipOwnProfileFirestoreRefetchRef.current) {
          skipOwnProfileFirestoreRefetchRef.current = false;
        } else {
          (async () => {
            try {
              const db = getFirestore(app);
              const docSnap = await getDoc(doc(db, 'users', profileUserId));
              if (cancelled) return;
              if (docSnap.exists()) {
                const userDataFromFirestore = {
                  ...defaultUserData,
                  ...docSnap.data(),
                  id: profileUserId,
                };
                setUserData(userDataFromFirestore);
                if (
                  userDataFromFirestore.avatar &&
                  userDataFromFirestore.avatar.trim() !== ''
                ) {
                  await getCachedAvatar(profileUserId, userDataFromFirestore.avatar);
                }
                if (
                  userDataFromFirestore.coverImage &&
                  userDataFromFirestore.coverImage.trim() !== ''
                ) {
                  await getCachedCover(profileUserId, userDataFromFirestore.coverImage);
                }
              } else {
                setUserData(defaultUserData);
              }
            } catch {
              if (!cancelled) setUserData(defaultUserData);
            }
          })();
        }
      }

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch focus ; getCached* stables par rendu
    }, [profileUserId, isOwnProfile, fetchSellerReviewStats])
  );

  // Fonction de rafraîchissement
  const onRefresh = async () => {
    logger.log('🔄 Rafraîchissement du profil...');
    await Promise.all([fetchUserListings(true), fetchSellerReviewStats()]);
  };

  // Fonction pour afficher les options de capture photo de profil
  const handleImageSource = () => {
    Alert.alert(
      'Cambiar foto de perfil',
      'Elige cómo quieres cambiar tu foto de perfil:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: '📷 Tomar foto nueva', 
          onPress: () => handleTakePhoto('avatar') 
        },
        { 
          text: '🖼️ Seleccionar de galería', 
          onPress: () => handlePickFromGallery('avatar') 
        }
      ]
    );
  };

  // Fonction pour afficher les options de capture photo de couverture
  const handleCoverImageSource = () => {
    Alert.alert(
      'Cambiar foto de portada',
      'Elige cómo quieres cambiar tu foto de portada:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: '📷 Tomar foto nueva', 
          onPress: () => handleTakePhoto('cover') 
        },
        { 
          text: '🖼️ Seleccionar de galería', 
          onPress: () => handlePickFromGallery('cover') 
        }
      ]
    );
  };

  // Fonction pour prendre une photo avec la caméra
  const handleTakePhoto = async (type: 'avatar' | 'cover') => {
    try {
      // Demander les permissions de caméra
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu cámara para tomar una foto'
        );
        return;
      }

      // Ouvrir la caméra avec aspect ratio approprié
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9], // Carré pour avatar, 16:9 pour couverture
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImageToFirebase(result.assets[0].uri, type);
      }
    } catch (error) {
      logger.error('Erreur lors de la prise de photo:', error);
      Alert.alert(
        'Error',
        'No se pudo tomar la foto. Inténtalo de nuevo.'
      );
    }
  };

  // Fonction pour sélectionner depuis la galerie
  const handlePickFromGallery = async (type: 'avatar' | 'cover') => {
    try {
      // Demander les permissions de galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu galería para seleccionar una foto'
        );
        return;
      }

      // Ouvrir la galerie avec aspect ratio approprié
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9], // Carré pour avatar, 16:9 pour couverture
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImageToFirebase(result.assets[0].uri, type);
      }
    } catch (error) {
      logger.error('Erreur lors de la sélection depuis la galerie:', error);
      Alert.alert(
        'Error',
        'No se pudo seleccionar la foto. Inténtalo de nuevo.'
      );
    }
  };

  // Fonction de compression intelligente
  const compressImage = async (imageUri: string, type: 'avatar' | 'cover') => {
    try {
      setCompressionProgress(0);
      
      logger.log('Début de la compression...');
      logger.log('Image originale:', imageUri);
      logger.log('Type d\'image:', type);
      
      // Dimensions appropriées selon le type
      const dimensions = type === 'avatar' 
        ? { width: 400, height: 400 }  // Carré pour avatar
        : { width: 1200, height: 675 }; // 16:9 pour couverture
      
      // Compression intelligente avec ImageManipulator
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { 
            resize: dimensions
          },
        ],
        { 
          compress: 0.7, // Compression 70% (bon équilibre qualité/taille)
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );
      
      setCompressionProgress(100);
      
      logger.log('Compression terminée');
      logger.log('Image compressée:', result.uri);
      
      // Calculer la réduction de taille
      const originalSize = await getFileSize(imageUri);
      const compressedSize = await getFileSize(result.uri);
      const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      // Stocker les statistiques de compression
      setCompressionStats({
        originalSize,
        compressedSize,
        reduction
      });
      
      logger.log(`Taille originale: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
      logger.log(`Taille compressée: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
      logger.log(`Réduction: ${reduction}%`);
      
      return result.uri;
    } catch (error) {
      logger.error('Erreur lors de la compression:', error);
      // En cas d'erreur, retourner l'image originale
      return imageUri;
    }
  };

  // Fonction pour charger le cache depuis AsyncStorage
  const loadAvatarCache = async () => {
    try {
      const cached = await AsyncStorage.getItem('avatarCache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setAvatarCache(parsedCache);
        logger.log('Cache d\'avatars chargé:', Object.keys(parsedCache).length, 'avatars');
      }
    } catch (error) {
      logger.error('Erreur lors du chargement du cache:', error);
    }
  };

  // Fonction pour charger le cache de couverture depuis AsyncStorage
  const loadCoverCache = async () => {
    try {
      const cached = await AsyncStorage.getItem('coverCache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setCoverCache(parsedCache);
        logger.log('Cache de couvertures chargé:', Object.keys(parsedCache).length, 'couvertures');
      }
    } catch (error) {
      logger.error('Erreur lors du chargement du cache de couverture:', error);
    }
  };

  // Fonction pour sauvegarder le cache dans AsyncStorage
  const saveAvatarCache = async (cache: {[key: string]: string}) => {
    try {
      await AsyncStorage.setItem('avatarCache', JSON.stringify(cache));
      logger.log('Cache d\'avatars sauvegardé');
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du cache:', error);
    }
  };

  // Fonction pour sauvegarder le cache de couverture dans AsyncStorage
  const saveCoverCache = async (cache: {[key: string]: string}) => {
    try {
      await AsyncStorage.setItem('coverCache', JSON.stringify(cache));
      logger.log('Cache de couvertures sauvegardé');
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du cache de couverture:', error);
    }
  };

  // Fonction pour obtenir un avatar avec cache
  const getCachedAvatar = async (userId: string, avatarUrl: string): Promise<string> => {
    try {
      // Vérifier si l'URL est valide
      if (!avatarUrl || avatarUrl.trim() === '') {
        logger.log('URL d\'avatar invalide, utilisation de l\'avatar par défaut');
        // Retourner la taille par défaut pour les comptes privés
        return 'https://via.placeholder.com/80x80/4ade80/ffffff?text=Avatar';
      }

      // 1. Vérifier le cache en mémoire
      if (avatarCache[userId] && avatarCache[userId] === avatarUrl) {
        logger.log('Avatar trouvé en cache mémoire:', userId);
        return avatarCache[userId];
      }

      // 2. Vérifier le cache local (AsyncStorage)
      const cacheKey = `avatar_${userId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const cachedData = JSON.parse(cached);
        if (cachedData.url === avatarUrl) {
          logger.log('Avatar trouvé en cache local:', userId);
          // Mettre à jour le cache en mémoire
          setAvatarCache(prev => ({
            ...prev,
            [userId]: cachedData.localUri
          }));
          return cachedData.localUri;
        }
      }

      // 3. Télécharger et mettre en cache
      logger.log('Téléchargement de l\'avatar:', userId);
      setCacheLoading(true);
      
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      
      // Convertir le blob en URI locale (simulation)
      // En réalité, nous utiliserions expo-file-system pour sauvegarder localement
      const localUri = avatarUrl; // Pour l'instant, on utilise l'URL originale
      
      // Mettre en cache
      const cacheData = {
        url: avatarUrl,
        localUri: localUri,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Mettre à jour le cache en mémoire
      setAvatarCache(prev => ({
        ...prev,
        [userId]: localUri
      }));
      
      setCacheLoading(false);
      logger.log('Avatar mis en cache:', userId);
      
      return localUri;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'avatar:', error);
      setCacheLoading(false);
      return avatarUrl; // Retourner l'URL originale en cas d'erreur
    }
  };

  // Fonction pour obtenir une couverture avec cache
  const getCachedCover = async (userId: string, coverUrl: string): Promise<string> => {
    try {
      // Vérifier si l'URL est valide
      if (!coverUrl || coverUrl.trim() === '') {
        logger.log('URL de couverture invalide, utilisation de la couverture par défaut');
        return 'https://via.placeholder.com/1200x675/4ade80/ffffff?text=Portada';
      }

      // 1. Vérifier le cache en mémoire
      if (coverCache[userId] && coverCache[userId] === coverUrl) {
        logger.log('Couverture trouvée en cache mémoire:', userId);
        return coverCache[userId];
      }

      // 2. Vérifier le cache local (AsyncStorage)
      const cacheKey = `cover_${userId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const cachedData = JSON.parse(cached);
        if (cachedData.url === coverUrl) {
          logger.log('Couverture trouvée en cache local:', userId);
          // Mettre à jour le cache en mémoire
          setCoverCache(prev => ({
            ...prev,
            [userId]: cachedData.localUri
          }));
          return cachedData.localUri;
        }
      }

      // 3. Télécharger et mettre en cache
      logger.log('Téléchargement de la couverture:', userId);
      setCacheLoading(true);
      
      const response = await fetch(coverUrl);
      const blob = await response.blob();
      
      // Convertir le blob en URI locale (simulation)
      const localUri = coverUrl; // Pour l'instant, on utilise l'URL originale
      
      // Mettre en cache
      const cacheData = {
        url: coverUrl,
        localUri: localUri,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Mettre à jour le cache en mémoire
      setCoverCache(prev => ({
        ...prev,
        [userId]: localUri
      }));
      
      setCacheLoading(false);
      logger.log('Couverture mise en cache:', userId);
      
      return localUri;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la couverture:', error);
      setCacheLoading(false);
      return coverUrl; // Retourner l'URL originale en cas d'erreur
    }
  };

  // Fonction pour nettoyer le cache (supprimer les anciens avatars et couvertures)
  const cleanAvatarCache = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const avatarKeys = keys.filter(key => key.startsWith('avatar_'));
      const coverKeys = keys.filter(key => key.startsWith('cover_'));
      
      // Supprimer les avatars et couvertures de plus de 7 jours
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      for (const key of [...avatarKeys, ...coverKeys]) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const data = JSON.parse(cached);
          if (data.timestamp < oneWeekAgo) {
            await AsyncStorage.removeItem(key);
            logger.log('Image supprimée du cache:', key);
          }
        }
      }
      
      logger.log('Nettoyage du cache terminé');
    } catch (error) {
      logger.error('Erreur lors du nettoyage du cache:', error);
    }
  };

  // Fonction pour afficher le toast de notification
  const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Animation d'entrée
    Animated.timing(toastAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Masquer automatiquement après 3 secondes
    setTimeout(() => {
      // Animation de sortie
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowToast(false);
      });
    }, 3000);
  };

  // Fonction utilitaire pour obtenir la taille d'un fichier
  const getFileSize = async (uri: string): Promise<number> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch (error) {
      logger.error('Erreur lors du calcul de la taille:', error);
      return 0;
    }
  };

  // Fonction commune pour upload vers Firebase avec compression
  const uploadImageToFirebase = async (imageUri: string, type: 'avatar' | 'cover') => {
    try {
      if (type === 'avatar') {
        setUploadingAvatar(true);
      } else {
        setUploadingCover(true);
      }
      setCompressionProgress(0);

      logger.log('Image sélectionnée:', imageUri);

      // 1. Compression intelligente avec dimensions appropriées
      setCompressionProgress(25);
      const compressedUri = await compressImage(imageUri, type);
      setCompressionProgress(50);
      
      // 2. Convertir l'image compressée en blob
      setCompressionProgress(75);
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      setCompressionProgress(90);
      
      // 3. Upload vers Firebase Storage
      const storage = getStorage(app);
      const fileName = type === 'avatar'
        ? `avatars/${user?.id}/${Date.now()}.jpg`
        : `covers/${user?.id}/${Date.now()}.jpg`;
      const imageRef = ref(storage, fileName);
      
      logger.log('Upload vers Firebase Storage...');
      await uploadBytes(imageRef, blob);
      setCompressionProgress(100);
      
      // 4. Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(imageRef);
      logger.log('URL de téléchargement:', downloadURL);

      // 5. Mettre à jour dans Firestore
      const db = getFirestore(app);
      const updateData = type === 'avatar' ? { avatar: downloadURL } : { coverImage: downloadURL };
      await updateDoc(doc(db, 'users', user?.id || ''), updateData);

      // 6. Mettre à jour l'état local
      setUserData(prev => ({
        ...prev,
        ...updateData
      }));

      // 7. Mettre à jour le cache
      if (user?.id && downloadURL && downloadURL.trim() !== '') {
        const cacheKey = type === 'avatar' ? `avatar_${user.id}` : `cover_${user.id}`;
        const cacheData = {
          url: downloadURL,
          localUri: downloadURL,
          timestamp: Date.now()
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        
        // Mettre à jour le cache en mémoire
        if (type === 'avatar') {
          setAvatarCache(prev => ({
            ...prev,
            [user.id]: downloadURL
          }));
        } else {
          setCoverCache(prev => ({
            ...prev,
            [user.id]: downloadURL
          }));
        }
        
        logger.log(`Nouvelle ${type} mise en cache:`, user.id);
      }

      // Afficher le toast de succès avec les statistiques
      const stats = compressionStats;
      const cacheCount = type === 'avatar' ? Object.keys(avatarCache).length : Object.keys(coverCache).length;
      const imageType = type === 'avatar' ? 'perfil' : 'portada';
      
      if (stats) {
        showToastNotification(
          `✅ Foto de ${imageType} actualizada • Reducida ${stats.reduction}% • Cache: ${cacheCount} ${type}s`,
          'success'
        );
      } else {
        showToastNotification(`✅ Foto de ${imageType} actualizada • Cache: ${cacheCount} ${type}s`, 'success');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'upload:', error);
      const imageType = type === 'avatar' ? 'perfil' : 'portada';
      showToastNotification(`❌ Error al actualizar la foto de ${imageType}`, 'error');
    } finally {
      if (type === 'avatar') {
        setUploadingAvatar(false);
      } else {
        setUploadingCover(false);
      }
      setCompressionProgress(0);
      setCompressionStats(null);
    }
  };

  // Fonction pour gérer le long press sur une publication
  const handleLongPressProduct = (product: UserListing) => {
    logger.log('handleLongPressProduct appelé avec:', product.title);
    setSelectedProductForActions(product);
    setIsActionMenuVisible(true);
  };

  // Fonction pour supprimer une publication
  const handleDeleteProduct = async () => {
    if (!selectedProductForActions) return;
    
    try {
      const db = getFirestore(app);
      await deleteDoc(doc(db, 'products', selectedProductForActions.id));
      
      // Mettre à jour la liste locale
      setMyListings(prev => prev.filter(item => item.id !== selectedProductForActions.id));
      
      // Fermer les modals
      setIsDeleteModalVisible(false);
      setIsActionMenuVisible(false);
      setSelectedProductForActions(null);
      
      // Afficher le toast de succès
      showToastNotification(`✅ "${selectedProductForActions.title}" eliminado`, 'success');
    } catch (error) {
      logger.error('Erreur lors de la suppression:', error);
      showToastNotification('❌ Error al eliminar la publicación', 'error');
    }
  };

  // Fonction pour modifier une publication
  const handleEditProduct = () => {
    if (!selectedProductForActions) return;
    
    logger.log('handleEditProduct appelé avec:', selectedProductForActions);
    
    // Fermer le menu d'actions
    setIsActionMenuVisible(false);
    
    // Naviguer vers l'écran de modification
    try {
      // Essayer d'abord avec navigate, puis avec push si ça ne marche pas
      (navigation as any).navigate('SellScreen', { 
        editMode: true, 
        productId: selectedProductForActions.id,
        productData: selectedProductForActions 
      });
      logger.log('Navigation vers SellScreen réussie');
    } catch (error) {
      logger.error('Erreur avec navigate, essai avec push:', error);
      try {
        (navigation as any).push('SellScreen', { 
          editMode: true, 
          productId: selectedProductForActions.id,
          productData: selectedProductForActions 
        });
        logger.log('Navigation avec push vers SellScreen réussie');
      } catch (pushError) {
        logger.error('Erreur avec push aussi:', pushError);
        Alert.alert('Error', 'No se pudo abrir la pantalla de edición');
      }
    }
  };

  // Fonction pour partager une publication
  const handleShareProduct = () => {
    if (!selectedProductForActions) return;
    
    // Fermer le menu d'actions
    setIsActionMenuVisible(false);
    
    // Générer le lien de partage
    const shareUrl = `https://ropanova.com/product/${selectedProductForActions.id}`;
    const shareMessage = `¡Mira este producto en RopaNova!\n\n${selectedProductForActions.title}\nPrecio: RD$${(Number(selectedProductForActions.price) || 0).toLocaleString()}\n\n${shareUrl}`;
    
    // Utiliser l'API de partage native
    if (navigator.share) {
      navigator.share({
        title: selectedProductForActions.title,
        text: shareMessage,
        url: shareUrl,
      });
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API de partage
      Alert.alert(
        'Compartir enlace',
        `Enlace: ${shareUrl}`,
        [
          { text: 'Copiar', onPress: () => {
            // Ici on pourrait copier dans le presse-papiers
            showToastNotification('✅ Enlace copiado', 'success');
          }},
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  // Fonction pour ouvrir le modal de suppression
  const handleOpenDeleteModal = () => {
    setIsActionMenuVisible(false);
    setSelectedProductToDelete(selectedProductForActions);
    setIsDeleteModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#059669', fontSize: 16 }}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isOwnProfile ? 'Mi Perfil' : 'Perfil'}</Text>
        <View style={styles.headerActions}>
          {isOwnProfile && (
            <>
              <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('DashboardScreen')}>
                <Ionicons name="bar-chart" size={22} color="#059669" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('SettingsScreen')}>
                <Ionicons name="settings-outline" size={22} color="#111827" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Toast Notification */}
      {showToast && (
        <Animated.View 
          style={[
            styles.toastContainer,
            toastType === 'success' ? styles.toastSuccess : styles.toastError,
            {
              transform: [{
                translateY: toastAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                })
              }],
              opacity: toastAnimation,
            }
          ]}
        >
          <Ionicons 
            name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={20} 
            color="white" 
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}



      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#059669']} // Android
            tintColor="#059669" // iOS
            title="Actualizando perfil..." // iOS
            titleColor="#059669" // iOS
          />
        }
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image 
            source={{ 
              uri: userData.coverImage && userData.coverImage.trim() !== '' 
                ? userData.coverImage 
                : 'https://via.placeholder.com/1200x675/4ade80/ffffff?text=Portada'
            }} 
            style={styles.coverImage}
            onLoadStart={() => setCacheLoading(true)}
            onLoadEnd={() => setCacheLoading(false)}
          />
          {/* Badge vérifié style Instagram sur la couverture */}
          {/* Supprimé - déplacé sur la photo de profil */}
          {isOwnProfile && (
          <TouchableOpacity 
            style={[styles.coverEditButton, uploadingCover && styles.coverEditButtonDisabled]}
            onPress={handleCoverImageSource}
            disabled={uploadingCover}
          >
            {uploadingCover ? (
              <View style={styles.uploadingIndicator}>
                <Ionicons 
                  name="sync" 
                  size={18} 
                  color="#059669" 
                  style={[
                    styles.rotatingIcon,
                    { transform: [{ rotate: `${compressionProgress * 3.6}deg` }] }
                  ]}
                />
              </View>
            ) : (
              <Ionicons name="camera-outline" size={18} color="#059669" />
            )}
          </TouchableOpacity>
          )}
        </View>
        {/* Avatar, nom, badges */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: userData.avatar && userData.avatar.trim() !== '' 
                    ? userData.avatar 
                    : (userData.accountType === 'fisica' || userData.accountType === 'virtual')
                      ? 'https://via.placeholder.com/160x160/4ade80/ffffff?text=Avatar'
                      : 'https://via.placeholder.com/80x80/4ade80/ffffff?text=Avatar'
                }} 
                style={[
                  styles.avatar,
                  (userData.accountType === 'fisica' || userData.accountType === 'virtual') 
                    ? styles.avatarSquare 
                    : styles.avatarRound
                ]}
                onLoadStart={() => setCacheLoading(true)}
                onLoadEnd={() => setCacheLoading(false)}
              />
              {cacheLoading && (
                <View style={[
                  styles.cacheLoadingOverlay,
                  {
                    borderRadius: (userData.accountType === 'fisica' || userData.accountType === 'virtual') ? 0 : 40,
                    width: (userData.accountType === 'fisica' || userData.accountType === 'virtual') ? 160 : 80,
                    height: (userData.accountType === 'fisica' || userData.accountType === 'virtual') ? 160 : 80
                  }
                ]}>
                  <Ionicons name="cloud-download" size={18} color="#059669" />
                </View>
              )}
              {isOwnProfile && (
              <TouchableOpacity 
                style={[styles.avatarEditButton, uploadingAvatar && styles.avatarEditButtonDisabled]}
                onPress={handleImageSource}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <View style={styles.uploadingIndicator}>
                    <Ionicons 
                      name="sync" 
                      size={18} 
                      color="#059669" 
                      style={[
                        styles.rotatingIcon,
                        { transform: [{ rotate: `${compressionProgress * 3.6}deg` }] }
                      ]}
                    />
                  </View>
                ) : (
                  <Ionicons name="pencil" size={18} color="#059669" />
                )}
              </TouchableOpacity>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 16, marginTop: 80 }}>
              <View style={styles.nameContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>
                    {userData.accountType === 'fisica' || userData.accountType === 'virtual' 
                      ? userData.storeName || `${userData.name} ${userData.lastname}`
                      : `${userData.name} ${userData.lastname}`
                    }
                  </Text>
                  {userData.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={12} color="#ffffff" />
                    </View>
                  )}
                </View>
                <Text style={styles.username} numberOfLines={1}>@{userData.username.replace(/^@/, '')}</Text>
              </View>
              <View style={styles.badgesRow}>
                {/* Autres badges */}
                {(userData.badges as Badge[]).slice(0, 3).map((badge, idx) => (
                  <View key={idx} style={[styles.badge, { backgroundColor: badge.color + '22' }]}> 
                    <Ionicons name={badge.icon as any} size={12} color={badge.color} style={{ marginRight: 3 }} />
                    <Text style={{ color: badge.color, fontSize: 11 }}>{badge.name}</Text>
                  </View>
                ))}
                {userData.badges.length > 3 && (
                  <View style={[styles.badge, { backgroundColor: '#e5e7eb' }]}> 
                    <Text style={{ color: '#374151', fontSize: 11 }}>+{userData.badges.length - 3} más</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <Text style={styles.bio}>{userData.bio}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.infoText}>
              {userData.province && userData.city
                ? `${userData.province}, ${userData.city}`
                : userData.location}
            </Text>
          </View>
          {userData.createdAt ? (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#6b7280" />
              <Text style={styles.infoText}>
                Miembro desde {formatCreatedAt(userData.createdAt)}
              </Text>
            </View>
          ) : null}
          {/* Badge type de boutique et Verificado */}
          <View style={styles.verificationBadgesRow}>
            {userData.accountType === 'fisica' && (
              <View style={[styles.badge, { backgroundColor: '#05966922' }]}> 
                <Ionicons name="storefront" size={12} color="#059669" style={{ marginRight: 3 }} />
                <Text style={{ color: '#059669', fontSize: 11 }}>Tienda Física</Text>
              </View>
            )}
            {userData.accountType === 'virtual' && (
              <View style={[styles.badge, { backgroundColor: '#8b5cf622' }]}> 
                <Ionicons name="globe" size={12} color="#8b5cf6" style={{ marginRight: 3 }} />
                <Text style={{ color: '#8b5cf6', fontSize: 11 }}>Tienda Virtual</Text>
              </View>
            )}
            {userData.verified && (
              <View style={[styles.badge, { backgroundColor: '#3b82f622' }]}> 
                <Ionicons name="checkmark" size={12} color="#3b82f6" style={{ marginRight: 3 }} />
                <Text style={{ color: '#3b82f6', fontSize: 11 }}>Verificado</Text>
              </View>
            )}
          </View>
        </View>
        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => {
              if (profileUserId) {
                navigation.navigate('SellerReviews', { sellerId: profileUserId })
              }
            }}
          >
            <View style={styles.statCardContent}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.statCardValue}>
                {sellerReviewStats.reviewCount > 0
                  ? `${sellerReviewStats.averageRating.toFixed(1)}/5`
                  : '—'}
              </Text>
              <Text style={styles.statCardLabel}>
                {sellerReviewStats.reviewCount}{' '}
                {sellerReviewStats.reviewCount === 1 ? 'reseña' : 'reseñas'}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <View style={styles.statCardContent}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.statCardValue}>{userData.stats.followers.toLocaleString()}</Text>
              <Text style={styles.statCardLabel}>Seguidores</Text>
            </View>
          </View>
        </View>

        {/* Section Produits du Vendeur */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Anuncios del Vendedor</Text>
            <Text style={styles.productCount}>{myListings.length} productos</Text>
          </View>
          
          {listingsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando productos...</Text>
            </View>
          ) : myListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No hay productos disponibles</Text>
              <Text style={styles.emptySubtext}>Este vendedor aún no ha publicado productos</Text>
            </View>
          ) : (
            <View style={styles.productsGridContainer}>
              {myListings.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  variant="compact"
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  onLongPress={isOwnProfile ? () => handleLongPressProduct(item) : undefined}
                  showPrice={true}
                  showCondition={true}
                  showBrand={true}
                  showRating={false}
                  showLocation={false}
                  showDate={true}
                  isFavorited={favoriteProductIds.includes(item.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* SUPPRESSION DE LA BARRE DE NAVIGATION INFÉRIEURE */}
        {/* <View style={styles.bottomNav}> ... </View> supprimé */}
      </ScrollView>

      {/* Menu d'actions (long press) */}
      <Modal
        visible={isActionMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsActionMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsActionMenuVisible(false)}
        >
          <View style={styles.actionMenuContent}>
            <View style={styles.actionMenuHeader}>
              <Text style={styles.actionMenuTitle}>Opciones de publicación</Text>
              <Text style={styles.actionMenuSubtitle}>{selectedProductForActions?.title}</Text>
            </View>
            
            <View style={styles.actionMenuActions}>
              {/* Modifier */}
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => {
                  logger.log('Bouton Modificar publication pressé');
                  handleEditProduct();
                }}
              >
                <View style={styles.actionMenuIcon}>
                  <Ionicons name="create-outline" size={20} color="#3b82f6" />
                </View>
                <Text style={styles.actionMenuText}>Modificar publicación</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
              
              {/* Partager */}
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={handleShareProduct}
              >
                <View style={styles.actionMenuIcon}>
                  <Ionicons name="share-outline" size={20} color="#059669" />
                </View>
                <Text style={styles.actionMenuText}>Compartir enlace</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
              
              {/* Supprimer */}
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={handleOpenDeleteModal}
              >
                <View style={styles.actionMenuIcon}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </View>
                <Text style={[styles.actionMenuText, { color: '#ef4444' }]}>Eliminar publicación</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
              <Text style={styles.deleteModalTitle}>Eliminar publicación</Text>
            </View>
            
            <View style={styles.deleteModalBody}>
              <Text style={styles.deleteModalText}>
                ¿Estás seguro de que quieres eliminar &quot;{selectedProductToDelete?.title}&quot;?
              </Text>
              <Text style={styles.deleteModalSubtext}>
                Esta acción no se puede deshacer.
              </Text>
            </View>
            
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  setSelectedProductToDelete(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={handleDeleteProduct}
              >
                <Text style={styles.deleteModalConfirmText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerActions: { flexDirection: 'row', gap: 8 },
  content: { flex: 1 },
  coverContainer: { width: '100%', height: 240, backgroundColor: '#e0e7ef', position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverEditButton: { position: 'absolute', bottom: 8, right: 12, backgroundColor: 'white', borderRadius: 16, padding: 6, elevation: 2 },
  coverEditButtonDisabled: { opacity: 0.6, backgroundColor: '#f3f4f6' },
  instagramVerifiedBadge: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarVerifiedBadge: { 
    position: 'absolute', 
    top: 4, 
    right: 4, 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  nameContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 0,
    flex: 1,
    marginBottom: 0
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 0
  },
  verificationBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  verificationBadgeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0095f6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  nameVerifiedBadge: {
    marginLeft: 0
  },
  verifiedBadge: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    backgroundColor: '#0095f6', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginLeft: 2,
    marginBottom: 2
  },
  nameSection: {
    marginTop: 16,
    marginLeft: 16,
    marginRight: 16
  },
  instagramBadgeCircle: { 
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0095f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  profileInfo: { backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: -56 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 80, height: 80, borderWidth: 3, borderColor: 'white' },
  avatarRound: { borderRadius: 40 },
  avatarSquare: { borderRadius: 0, width: 160, height: 160 },
  avatarEditButton: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'white', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  avatarEditButtonDisabled: { opacity: 0.6, backgroundColor: '#f3f4f6' },
  uploadingIndicator: { 
    alignItems: 'center', 
    justifyContent: 'center',
    minWidth: 20,
    minHeight: 20
  },
  progressText: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#059669' 
  },
  rotatingIcon: {
    // L'animation de rotation sera gérée par la transform
  },
  cacheLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 8,
  },
  toastSuccess: {
    backgroundColor: '#059669',
  },
  toastError: {
    backgroundColor: '#ef4444',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  name: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#111827',
    flex: 0,
    marginRight: 0,
    marginBottom: 0,
    lineHeight: 20
  },
  username: { 
    color: '#6b7280', 
    fontSize: 13, 
    marginBottom: 2, 
    marginTop: 0,
    lineHeight: 13,
    paddingTop: 0,
    paddingBottom: 0
  },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 0 },
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4 },
  bio: { color: '#374151', fontSize: 13, marginTop: 8, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  infoText: { color: '#6b7280', fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 6, gap: 10 },
  statCard: { 
    flex: 1, 
    backgroundColor: 'white', 
    borderRadius: 4, 
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  statCardContent: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  statIconContainer: { 
    width: 28, 
    height: 28, 
    borderRadius: 4, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 4 
  },
  statCardValue: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#111827', 
    marginBottom: 2 
  },
  statCardLabel: { 
    fontSize: 11, 
    color: '#6b7280', 
    textAlign: 'center' 
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  rewardsBox: { backgroundColor: '#fef9c3', borderRadius: 10, margin: 16, padding: 12, borderWidth: 1, borderColor: '#fde68a' },
  progressBarBg: { height: 8, backgroundColor: '#fde68a', borderRadius: 6, marginVertical: 6, overflow: 'hidden' },
  progressBarFillRewards: { height: 8, backgroundColor: '#fbbf24', borderRadius: 6 },
  rewardsLevel: { color: '#b45309', fontWeight: 'bold', fontSize: 12, textAlign: 'right' },
  insightsBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', borderRadius: 10, marginHorizontal: 16, marginBottom: 12, padding: 10, gap: 8 },
  insightsText: { color: '#059669', fontSize: 13, flex: 1 },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingVertical: 6, paddingHorizontal: 8 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navItemActive: { flex: 1, alignItems: 'center', justifyContent: 'center', borderTopWidth: 2, borderTopColor: '#059669' },
  navText: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  productsSection: { paddingHorizontal: 8, paddingBottom: 16 }, // Réduit de 16 à 8 pour rapprocher des bords
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  productCount: { color: '#6b7280', fontSize: 13 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6b7280', fontSize: 14 },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: { color: '#6b7280', fontSize: 16, marginTop: 10 },
  emptySubtext: { color: '#9ca3af', fontSize: 13, marginTop: 4 },
  productsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Aligner les cartes en haut
    paddingHorizontal: 4, // Petit padding pour éviter que les cartes touchent les bords
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4, // Petit gap pour espacement uniforme entre les cartes
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 2, // Petit padding pour éviter que les cartes touchent les bords
  },

  // Styles pour le modal de suppression
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  deleteModalBody: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  deleteModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Styles pour le menu d'actions
  actionMenuContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 'auto',
    marginBottom: 50,
  },
  actionMenuHeader: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  actionMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionMenuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionMenuActions: {
    paddingVertical: 8,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionMenuText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },

}) 