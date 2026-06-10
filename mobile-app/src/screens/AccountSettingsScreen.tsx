import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import { useAuth } from '../contexts/AuthContext'
import { getFirestore, doc, getDoc, setDoc, query, where, collection, getDocs } from 'firebase/firestore'
import { app } from '../firebaseConfig'
import { logger } from '../utils/logger'
import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal, Pressable } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { GeoPoint } from 'firebase/firestore';

const defaultUserData = {
  name: '',
  username: '',
  email: '',
  phone: '',
  bio: '',
  location: '',
  province: '',
  city: '',
  avatar: '',
  coverImage: '',
  birthDate: '',
  gender: '',
  verified: false,
  memberSince: '',
  privacy: {
    showEmail: false,
    showPhone: false,
    showLastSeen: true,
    allowMessages: true,
  },
  lastname: '',
  storeName: '',
  accountType: '',
  streetAddress: '',
  geoPoint: null as { latitude: number; longitude: number } | null,
  createdAt: null as any,
  usernameLastChanged: null as string | { toDate: () => Date } | null,
  usernameHistory: [] as string[],
};

const dominicanProvinces = [
  'Distrito Nacional', 'Santiago', 'La Altagracia', 'Puerto Plata', 'La Romana',
  'San Pedro de Macorís', 'Duarte', 'La Vega', 'Espaillat', 'Monseñor Nouel',
  'Hermanas Mirabal', 'Samaná', 'María Trinidad Sánchez', 'Valverde', 'Monte Cristi',
  'Dajabón', 'Santiago Rodríguez', 'Elías Piña', 'San Juan', 'Azua', 'Peravia',
  'San José de Ocoa', 'Independencia', 'Baoruco', 'Barahona', 'Pedernales',
  'Monte Plata', 'Hato Mayor', 'El Seibo', 'San Cristóbal',
]

// Liste des usernames interdits
const forbiddenUsernames = ['admin', 'support', 'root', 'administrator', 'moderator'];

// Regex pour valider les caractères autorisés (lettres, chiffres, tirets, underscores)
const usernameRegex = /^[a-z0-9._-]{3,20}$/;

/** Lit lat/lng depuis un Firestore GeoPoint ou un objet plain. */
function readGeoCoords(geo: unknown): { latitude: number; longitude: number } | null {
  if (geo == null || typeof geo !== 'object') return null;
  const g = geo as { latitude?: number; longitude?: number };
  const lat = typeof g.latitude === 'number' ? g.latitude : NaN;
  const lng = typeof g.longitude === 'number' ? g.longitude : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { latitude: lat, longitude: lng };
  return null;
}

type AccountSettingsNavigationProp = StackNavigationProp<RootStackParamList, 'AccountSettings'>

// Fonction utilitaire pour formater la date Firestore en 'Mois Année' espagnol
function formatCreatedAtES(createdAt: any): string {
  if (!createdAt) return '';
  let dateObj;
  if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    dateObj = new Date(createdAt);
  } else if (createdAt.toDate) {
    dateObj = createdAt.toDate();
  } else {
    return '';
  }
  const moisES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${moisES[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

export const AccountSettingsScreen: React.FC = () => {
  const navigation = useNavigation<AccountSettingsNavigationProp>()
  const { user, logout, deleteFirebaseAccount } = useAuth();
  const [userData, setUserData] = useState(defaultUserData)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [canEditUsername, setCanEditUsername] = useState(true);
  const [usernameInfoVisible, setUsernameInfoVisible] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [countryCode, setCountryCode] = useState('+1');
  const [showCountryCodePicker, setShowCountryCodePicker] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [savedLocation, setSavedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const countryCodes = [
    { code: '+1', label: '🇩🇴 RD' },
    { code: '+1', label: '🇺🇸 USA' },
    { code: '+52', label: '🇲🇽 MX' },
    { code: '+33', label: '🇫🇷 FR' },
    { code: '+34', label: '🇪🇸 ES' },
    // Ajoute d'autres pays si besoin
  ];
  
  const DOMINICAN_REPUBLIC_REGION = {
    latitude: 18.4861,
    longitude: -69.9312,
    latitudeDelta: 2.0,
    longitudeDelta: 2.0,
  };
  // Helper pour afficher la date au format DD/MM/YYYY
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}/${mm}/${yyyy}`;
  };
  // Ajout d'un état pour stocker les données originales
  const [originalUserData, setOriginalUserData] = useState(defaultUserData);

  // Fonctions pour la carte
  const handleOpenMap = () => {
    if (!isEditing) return;
    const coords = readGeoCoords(userData.geoPoint) ?? savedLocation;
    setShowMapModal(true);
    if (coords) {
      setSelectedLocation(coords);
      setSavedLocation(coords);
    } else {
      setSelectedLocation(null);
      setSavedLocation(null);
    }
  };

  const handleMapPress = (event: any) => {
    setSelectedLocation(event.nativeEvent.coordinate);
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;

    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      });

      if (results.length > 0) {
        const address = results[0];
        updateUserData('province', address.region || '');
        updateUserData('city', address.city || '');
        updateUserData('streetAddress', `${address.street || ''} ${address.streetNumber || ''}`.trim());
      }
    } catch (error) {
      logger.error('Erreur lors de la géocodification inverse:', error);
    }

    // Toujours persister les coords dans le state (et Firestore au Guardar) — sinon la carte modale reprend l’ancien geoPoint.
    const gp = new GeoPoint(selectedLocation.latitude, selectedLocation.longitude);
    updateUserData('geoPoint', gp);
    setSavedLocation({ ...selectedLocation });
    setShowMapModal(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      setSearchResults(results);
    } catch (error) {
      logger.error('Erreur lors de la recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    setSelectedLocation({
      latitude: result.latitude,
      longitude: result.longitude
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  React.useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      if (!user?.id || user.id === 'guest') {
        setUserData(defaultUserData);
        setOriginalUserData(defaultUserData);
        setSavedLocation(null);
        setLoading(false);
        return;
      }
      try {
        const db = getFirestore(app);
        const docRef = doc(db, 'users', user.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const merged = { ...defaultUserData, ...data };
          setUserData(merged);
          setOriginalUserData(merged);
          setSavedLocation(readGeoCoords(merged.geoPoint));
        } else {
          setUserData(defaultUserData);
          setOriginalUserData(defaultUserData);
          setSavedLocation(null);
        }
      } catch (e) {
        setUserData(defaultUserData);
        setOriginalUserData(defaultUserData);
        setSavedLocation(null);
        logger.log('Erreur chargement Firestore:', e);
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user?.id]);

  // Calcul du délai de 30 jours pour le changement de username
  React.useEffect(() => {
    if (!userData.usernameLastChanged) {
      setCanEditUsername(true);
      return;
    }
    const last = typeof userData.usernameLastChanged === 'string' ? new Date(userData.usernameLastChanged) : userData.usernameLastChanged.toDate ? userData.usernameLastChanged.toDate() : new Date();
    const now = new Date();
    const diff = now.getTime() - last.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    setCanEditUsername(days >= 30);
  }, [userData.usernameLastChanged]);

  // Validation du username côté front
  const validateUsername = async (value: string) => {
    setCheckingUsername(true);
    if (!usernameRegex.test(value)) {
      setUsernameError('El nombre de usuario debe tener entre 3 y 20 caracteres, y puede tener letras, cifras, ".", "_", "-".');
      setCheckingUsername(false);
      return false;
    }
    if (forbiddenUsernames.includes(value.toLowerCase())) {
      setUsernameError('Este nombre de usuario no está permitido.');
      setCheckingUsername(false);
      return false;
    }
    // Vérification d'unicité Firestore (hors utilisateur courant)
    if (value && value !== originalUserData.username) {
      try {
        const db = getFirestore(app);
        const q = query(collection(db, 'users'), where('username', '==', value));
        const querySnapshot = await getDocs(q);
        let usernameTaken = false;
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id !== user?.id) {
            usernameTaken = true;
          }
        });
        if (usernameTaken) {
          setUsernameError('Por favor, introduce un nombre de usuario válido.');
          setCheckingUsername(false);
          return false;
        }
      } catch (e) {
        // Optionnel : gestion d'erreur réseau
      }
    }
    setUsernameError(null);
    setCheckingUsername(false);
    return true;
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (!user?.id || user.id === 'guest') {
      setIsSaving(false);
      return;
    }
    const valid = await validateUsername(userData.username);
    if (!valid) {
      setIsSaving(false);
      return;
    }
    try {
      const db = getFirestore(app);
      // Vérification d'unicité du username (hors utilisateur courant)
      const q = query(collection(db, 'users'), where('username', '==', userData.username));
      const querySnapshot = await getDocs(q);
      let usernameTaken = false;
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id !== user.id) {
          usernameTaken = true;
        }
      });
      if (usernameTaken) {
        setUsernameError('Este nombre de usuario ya está en uso.');
        setIsSaving(false);
        return;
      }
      // Gestion de l'historique et de la date de changement
      let newUserData = { ...userData };
      if (userData.username !== defaultUserData.username) {
        // Ajoute l'ancien username à l'historique si différent
        if (userData.username && userData.username !== defaultUserData.username) {
          newUserData.usernameHistory = Array.isArray(userData.usernameHistory)
            ? [...userData.usernameHistory, userData.username]
            : [userData.username];
        }
        newUserData.usernameLastChanged = new Date().toISOString();
      }
      // Ajout du code pays au numéro de téléphone (format E.164)
      if (userData.phone) {
        newUserData.phone = countryCode + userData.phone.replace(/\D/g, '');
      }
      await setDoc(doc(db, 'users', user.id), newUserData, { merge: true });
      setOriginalUserData({ ...newUserData });
      setUserData({ ...newUserData });
      setSavedLocation(readGeoCoords(newUserData.geoPoint));
      setShowMapModal(false);
      setIsEditing(false);
      if (Platform.OS === 'web') {
        alert('¡Perfil actualizado exitosamente!');
      } else {
        Alert.alert('¡Éxito!', '¡Perfil actualizado exitosamente!');
      }
    } catch (e) {
      logger.log('Erreur sauvegarde Firestore:', e);
      if (Platform.OS === 'web') {
        alert('Error al guardar el perfil');
      } else {
        Alert.alert('Error', 'Error al guardar el perfil');
      }
    }
    setIsSaving(false);
  }

  const handleCancel = () => {
    setShowMapModal(false);
    setUserData(originalUserData);
    setSavedLocation(readGeoCoords(originalUserData.geoPoint));
    setSelectedLocation(null);
    setIsEditing(false);
  }

  const updateUserData = (field: string, value: any) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
  }

  const updatePrivacyData = (field: string, value: boolean) => {
    setUserData((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: value },
    }))
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Cargando datos del usuario...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Información Personal</Text>
          <View style={styles.headerActions}>
            {isEditing ? (
              <>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isSaving}>
                  <Ionicons name="close" size={18} color="#ef4444" />
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.saveText}>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={20} color="#059669" />
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Avatar et infos */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-circle-outline" size={80} color="#059669" />
          </View>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <View style={styles.nameRow}>
            {(userData.accountType === 'fisica' || userData.accountType === 'virtual') && userData.storeName ? (
              <Text style={styles.name}>{userData.storeName}</Text>
            ) : (
                <Text style={styles.name}>{userData.name} {userData.lastname}</Text>
            )}
              {userData.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                </View>
              )}
            </View>
            <Text style={styles.username}>@{userData.username}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="calendar-outline" size={14} color="#059669" />
                <Text style={styles.badgeText}>
                  {userData.createdAt
                    ? `Miembro desde ${formatCreatedAtES(userData.createdAt)}`
                    : 'Miembro desde'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Infos de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          {(userData.accountType === 'fisica' || userData.accountType === 'virtual') && (
            <TextInput
              style={styles.input}
              value={userData.storeName}
              onChangeText={(v) => updateUserData('storeName', v)}
              editable={isEditing}
              placeholder="Nombre de la Tienda"
            />
          )}
          <TextInput
            style={styles.input}
            value={userData.name}
            onChangeText={(v) => updateUserData('name', v)}
            editable={isEditing}
            placeholder="Nombre Completo"
          />
          <TextInput
            style={styles.input}
            value={userData.lastname || ''}
            onChangeText={(v) => updateUserData('lastname', v)}
            editable={isEditing}
            placeholder="Apellido"
          />
          <TextInput
            style={[styles.input, !canEditUsername && isEditing ? { backgroundColor: '#e5e7eb', color: '#9ca3af' } : null]}
            value={userData.username}
            onChangeText={async (v) => {
              const lower = v.replace(/[^a-z0-9._-]/g, '').toLowerCase();
              updateUserData('username', lower);
              await validateUsername(lower);
            }}
            editable={isEditing && canEditUsername}
            placeholder="Nombre de Usuario"
            autoCapitalize="none"
            onFocus={() => setUsernameInfoVisible(true)}
            onBlur={() => setUsernameInfoVisible(false)}
          />
          {isEditing && canEditUsername && usernameInfoVisible && (
            <Text style={{ color: '#111', marginBottom: 8 }}>
              Si cambias tu nombre de usuario, no podrás volver a cambiarlo durante 30 días.
            </Text>
          )}
          {isEditing && checkingUsername && (
            <ActivityIndicator size="small" color="#059669" style={{ marginBottom: 8 }} />
          )}
          {isEditing && !canEditUsername && (
            <Text style={{ color: 'red', marginBottom: 8 }}>
              Solo puedes cambiar tu nombre de usuario una vez cada 30 días.
            </Text>
          )}
          {isEditing && usernameError && (
            <Text style={{ color: 'red', marginBottom: 8 }}>{usernameError}</Text>
          )}
          <TextInput
            style={[styles.input, { height: 70 }]}
            value={userData.bio}
            onChangeText={(v) => updateUserData('bio', v)}
            editable={isEditing}
            placeholder="Biografía"
            multiline
          />
          {/* Champ genre remplacé par un sélecteur */}
          <TouchableOpacity
            onPress={() => {
              if (isEditing) setShowGenderPicker(true);
            }}
            activeOpacity={0.8}
          >
          <TextInput
            style={styles.input}
            value={userData.gender}
              editable={false}
            placeholder="Género"
              pointerEvents="none"
          />
          </TouchableOpacity>
          {/* Modal pour choisir le genre */}
          {showGenderPicker && (
            <Modal
              visible={showGenderPicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowGenderPicker(false)}
            >
              <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setShowGenderPicker(false)} />
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Selecciona tu género</Text>
                {['Masculino', 'Femenino', 'Otro'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={{ padding: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' }}
                    onPress={() => {
                      updateUserData('gender', option);
                      setShowGenderPicker(false);
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{option}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={{ backgroundColor: '#e5e7eb', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 }}
                  onPress={() => setShowGenderPicker(false)}
                >
                  <Text style={{ color: '#111', fontWeight: 'bold', fontSize: 16 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          )}
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'ios') {
                setTempDate(userData.birthDate ? new Date(userData.birthDate) : new Date(2000, 0, 1));
              }
              if (isEditing) setShowDatePicker(true);
            }}
            activeOpacity={0.8}
          >
          <TextInput
            style={styles.input}
              value={formatDisplayDate(userData.birthDate)}
              editable={false}
            placeholder="Fecha de Nacimiento"
              pointerEvents="none"
          />
          </TouchableOpacity>
          {/* Modal personnalisée pour iOS */}
          {Platform.OS === 'ios' && showDatePicker && (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setShowDatePicker(false)} />
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
                <DateTimePicker
                  value={tempDate || new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  locale="es"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setTempDate(selectedDate);
                  }}
                  style={{ backgroundColor: '#fff' }}
                />
                <TouchableOpacity
                  style={{ backgroundColor: '#059669', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 }}
                  onPress={() => {
                    setShowDatePicker(false);
                    if (tempDate) {
                      const yyyy = tempDate.getFullYear();
                      const mm = String(tempDate.getMonth() + 1).padStart(2, '0');
                      const dd = String(tempDate.getDate()).padStart(2, '0');
                      const iso = `${yyyy}-${mm}-${dd}`;
                      updateUserData('birthDate', iso);
                    }
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Valider</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          )}
          {/* Picker natif Android */}
          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={userData.birthDate ? new Date(userData.birthDate) : new Date(2000, 0, 1)}
              mode="date"
              display="default"
              maximumDate={new Date()}
              locale="es"
              onChange={(event, selectedDate) => {
                if (event.type === 'set' && selectedDate) {
                  setShowDatePicker(false);
                  const yyyy = selectedDate.getFullYear();
                  const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const dd = String(selectedDate.getDate()).padStart(2, '0');
                  const iso = `${yyyy}-${mm}-${dd}`;
                  updateUserData('birthDate', iso);
                } else {
                  setShowDatePicker(false); // Annulé
                }
              }}
            />
          )}
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          <TextInput
            style={[styles.input, isEditing ? { backgroundColor: '#e5e7eb', color: '#9ca3af' } : null]}
            value={userData.email}
            onChangeText={(v) => updateUserData('email', v)}
            editable={false}
            placeholder="Correo Electrónico"
            keyboardType="email-address"
          />
          {/* Champ téléphone avec code pays */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#f3f4f6',
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: Platform.OS === 'ios' ? 12 : 8,
                marginRight: 6,
                minWidth: 60,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => isEditing && setShowCountryCodePicker(true)}
              activeOpacity={isEditing ? 0.7 : 1}
              disabled={!isEditing}
            >
              <Text style={{ fontSize: 15 }}>{countryCodes.find(c => c.code === countryCode)?.label || countryCode} {countryCode}</Text>
            </TouchableOpacity>
          <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={userData.phone}
            onChangeText={(v) => updateUserData('phone', v)}
            editable={isEditing}
            placeholder="Teléfono"
            keyboardType="phone-pad"
          />
          </View>
          {/* Modal de sélection du code pays */}
          {showCountryCodePicker && (
            <Modal
              visible={showCountryCodePicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCountryCodePicker(false)}
            >
              <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setShowCountryCodePicker(false)} />
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '60%' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1e293b', marginBottom: 12, textAlign: 'center' }}>Selecciona código de país</Text>
                <ScrollView style={{ maxHeight: 250, marginBottom: 12 }}>
                  {countryCodes.map((c) => (
                    <TouchableOpacity
                      key={c.code + c.label}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        borderRadius: 8,
                        backgroundColor: countryCode === c.code ? '#e0f2fe' : '#fff',
                        marginBottom: 2,
                      }}
                      onPress={() => {
                        setCountryCode(c.code);
                        setShowCountryCodePicker(false);
                      }}
                    >
                      <Text style={{ color: countryCode === c.code ? '#059669' : '#1e293b', fontSize: 16 }}>{c.label} {c.code}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={{ backgroundColor: '#059669', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 4 }}
                  onPress={() => setShowCountryCodePicker(false)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Valider</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          )}
        </View>

        {/* Localisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          {userData.accountType === 'fisica' && (
            <>
              {isEditing && (
                <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap} activeOpacity={0.7}>
                  <Ionicons name="map-outline" size={20} color="#059669" />
                  <Text style={styles.mapButtonText}>
                    {userData.geoPoint ? 'Cambiar ubicación en mapa' : 'Seleccionar ubicación en mapa'}
                  </Text>
                </TouchableOpacity>
              )}

              {(savedLocation || userData.geoPoint) && (
                <View style={styles.miniMapContainer} pointerEvents="none">
                  <MapView
                    key={`mini-${savedLocation?.latitude ?? userData.geoPoint?.latitude}-${savedLocation?.longitude ?? userData.geoPoint?.longitude}`}
                    style={styles.miniMap}
                    initialRegion={{
                      latitude: savedLocation?.latitude || userData.geoPoint?.latitude || 18.4861,
                      longitude: savedLocation?.longitude || userData.geoPoint?.longitude || -69.9312,
                      latitudeDelta: 0.008,
                      longitudeDelta: 0.008,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    toolbarEnabled={false}
                    pointerEvents="none"
                  >
                    <Marker
                      coordinate={{
                        latitude: savedLocation?.latitude || userData.geoPoint?.latitude || 18.4861,
                        longitude: savedLocation?.longitude || userData.geoPoint?.longitude || -69.9312,
                      }}
                    />
                  </MapView>
                </View>
              )}
            </>
          )}
          <TextInput
            style={styles.input}
            value={userData.province}
            onChangeText={(v) => updateUserData('province', v)}
            editable={isEditing}
            placeholder="Provincia"
          />
          <TextInput
            style={styles.input}
            value={userData.city}
            onChangeText={(v) => updateUserData('city', v)}
            editable={isEditing}
            placeholder="Ciudad/Municipio"
          />
          {userData.accountType === 'fisica' && (
            <TextInput
              style={styles.input}
              value={userData.streetAddress}
              onChangeText={(v) => updateUserData('streetAddress', v)}
              editable={isEditing}
              placeholder="Indica el nombre de la calle y número"
            />
          )}
        </View>

        {/* Confidentialité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Privacidad</Text>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Mostrar correo electrónico</Text>
              <Text style={styles.switchDesc}>Otros usuarios pueden ver tu email</Text>
            </View>
            <Switch
              value={userData.privacy.showEmail}
              onValueChange={(v) => updatePrivacyData('showEmail', v)}
              disabled={!isEditing}
            />
          </View>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Mostrar teléfono</Text>
              <Text style={styles.switchDesc}>Otros usuarios pueden ver tu teléfono</Text>
            </View>
            <Switch
              value={userData.privacy.showPhone}
              onValueChange={(v) => updatePrivacyData('showPhone', v)}
              disabled={!isEditing}
            />
          </View>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Mostrar última conexión</Text>
              <Text style={styles.switchDesc}>Mostrar cuándo estuviste activo por última vez</Text>
            </View>
            <Switch
              value={userData.privacy.showLastSeen}
              onValueChange={(v) => updatePrivacyData('showLastSeen', v)}
              disabled={!isEditing}
            />
          </View>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Permitir mensajes</Text>
              <Text style={styles.switchDesc}>Otros usuarios pueden enviarte mensajes</Text>
            </View>
            <Switch
              value={userData.privacy.allowMessages}
              onValueChange={(v) => updatePrivacyData('allowMessages', v)}
              disabled={!isEditing}
            />
          </View>
        </View>

        {/* Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          <TouchableOpacity style={styles.securityButton} onPress={() => navigation.navigate('PrivacySettings')}>
            <Ionicons name="key-outline" size={18} color="#059669" style={{ marginRight: 8 }} />
            <Text style={styles.securityText}>Cambiar Contraseña</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.securityButton} onPress={() => navigation.navigate('PrivacySettings')}>
            <Ionicons name="star-outline" size={18} color="#059669" style={{ marginRight: 8 }} />
            <Text style={styles.securityText}>Verificar Identidad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.securityButton} onPress={() => navigation.navigate('PrivacySettings')}>
            <Ionicons name="eye-outline" size={18} color="#059669" style={{ marginRight: 8 }} />
            <Text style={styles.securityText}>Sesiones Activas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#b91c1c' }}
            onPress={() => {
              if (!user?.id || user.id === 'guest') {
                Alert.alert('Cuenta', 'Inicia sesión con correo y contraseña para eliminar la cuenta.');
                return;
              }
              setDeletePassword('');
              setDeleteModalVisible(true);
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#b91c1c" style={{ marginRight: 8 }} />
            <Text style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: 14 }}>Eliminar cuenta</Text>
          </TouchableOpacity>
          {/* Bouton de déconnexion rouge */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#dc2626' }}
            onPress={async () => {
              await logout();
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#dc2626" style={{ marginRight: 8 }} />
            <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 14 }}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de la carte */}
      {showMapModal && (
        <Modal
          visible={showMapModal}
          animationType="slide"
          onRequestClose={() => setShowMapModal(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.mapHeader}>
              <TouchableOpacity onPress={() => setShowMapModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.mapHeaderTitle}>Selecciona ubicación</Text>
              <TouchableOpacity onPress={handleConfirmLocation} disabled={!selectedLocation}>
                <Text style={[styles.mapHeaderButton, !selectedLocation && styles.mapHeaderButtonDisabled]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar dirección o lugar..."
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                  <Ionicons name="search" size={20} color="#059669" />
                </TouchableOpacity>
                {searchQuery.length > 0 && (
                  <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Résultats de recherche */}
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectSearchResult(result)}
                    >
                      <Ionicons name="location" size={16} color="#059669" />
                      <Text style={styles.searchResultText}>
                        {result.name || `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Carte — région centrée sur la position actuelle (évite de rouvrir sur la carte « zoom RD » avec l’ancienne épingle). */}
            <MapView
              key={
                selectedLocation
                  ? `map-${selectedLocation.latitude}-${selectedLocation.longitude}`
                  : 'map-none'
              }
              style={{ flex: 1 }}
              initialRegion={
                selectedLocation
                  ? {
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                      latitudeDelta: 0.06,
                      longitudeDelta: 0.06,
                    }
                  : DOMINICAN_REPUBLIC_REGION
              }
              onPress={handleMapPress}
            >
              {selectedLocation && (
                <Marker
                  coordinate={selectedLocation}
                  pinColor="#059669"
                />
              )}
            </MapView>
          </SafeAreaView>
        </Modal>
      )}

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingAccount) setDeleteModalVisible(false);
        }}
      >
        <View style={styles.deleteModalBackdrop}>
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>Eliminar cuenta</Text>
            <Text style={styles.deleteModalDesc}>
              Se eliminará el acceso con tu correo (Firebase Authentication). Los datos ya guardados (anuncios, mensajes, etc.) pueden seguir existiendo; contacta soporte si quieres un borrado completo de datos.
            </Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Contraseña actual"
              placeholderTextColor="#9ca3af"
              editable={!deletingAccount}
            />
            <TouchableOpacity
              style={styles.deleteConfirmButton}
              disabled={deletingAccount}
              onPress={async () => {
                if (!deletePassword.trim()) {
                  Alert.alert('Contraseña', 'Ingresa tu contraseña actual.');
                  return;
                }
                setDeletingAccount(true);
                try {
                  await deleteFirebaseAccount(deletePassword);
                  setDeleteModalVisible(false);
                  Alert.alert('Cuenta eliminada', 'Tu acceso ha sido eliminado.');
                } catch {
                  Alert.alert(
                    'Error',
                    'No se pudo eliminar. Verifica la contraseña o cierra sesión y vuelve a entrar antes de intentar otra vez.',
                  );
                }
                setDeletingAccount(false);
              }}
            >
              {deletingAccount ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteConfirmText}>Eliminar definitivamente</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteCancelButton}
              disabled={deletingAccount}
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text style={styles.deleteCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2f1', borderRadius: 8, padding: 6, marginLeft: 4 },
  editText: { color: '#059669', fontWeight: 'bold', marginLeft: 3, fontSize: 13 },
  cancelButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 8, padding: 6, marginRight: 4 },
  cancelText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 3, fontSize: 13 },
  saveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', borderRadius: 8, padding: 6 },
  saveText: { color: '#fff', fontWeight: 'bold', marginLeft: 3, fontSize: 13 },
  profileSection: { alignItems: 'center', marginBottom: 16 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e0f2f1', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
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
  storeName: { fontSize: 16, fontWeight: '600', color: '#059669', marginTop: 4, marginBottom: 2 },
  username: { color: '#6b7280', fontSize: 13, marginBottom: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2f1', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4 },
  badgeText: { color: '#059669', fontSize: 11, marginLeft: 3 },
  section: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  sectionTitle: { fontWeight: 'bold', color: '#059669', fontSize: 15, marginBottom: 10 },
  input: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8, fontSize: 15, marginBottom: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  switchLabel: { fontWeight: 'bold', color: '#111827', fontSize: 14 },
  switchDesc: { color: '#6b7280', fontSize: 12 },
  securityButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2f1', borderRadius: 8, padding: 12, marginBottom: 10 },
  securityText: { color: '#059669', fontWeight: 'bold', fontSize: 14 },
  mapButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2f1', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#059669' },
  mapButtonText: { color: '#059669', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  miniMapContainer: { height: 120, borderRadius: 8, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  miniMap: { flex: 1 },
  mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  mapHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  mapHeaderButton: { color: '#059669', fontWeight: 'bold', fontSize: 16 },
  mapHeaderButtonDisabled: { color: '#9ca3af' },
  searchContainer: { padding: 16, backgroundColor: '#fff' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  searchButton: { padding: 8 },
  clearButton: { padding: 8 },
  searchResults: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchResultText: { marginLeft: 12, fontSize: 16, color: '#111827' },
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  deleteModalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  deleteModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  deleteModalDesc: { fontSize: 14, color: '#4b5563', marginBottom: 12 },
  deleteConfirmButton: {
    backgroundColor: '#b91c1c',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  deleteCancelButton: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  deleteCancelText: { color: '#059669', fontWeight: '600', fontSize: 15 },
}) 