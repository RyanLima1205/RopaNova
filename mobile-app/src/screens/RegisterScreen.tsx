import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Platform, ScrollView, Modal, Pressable, KeyboardAvoidingView, Dimensions, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getFirestore, collection, query, where, getDocs, GeoPoint } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const DOMINICAN_PROVINCES = [
  'Azua', 'Baoruco', 'Barahona', 'Dajabón', 'Duarte', 'Elías Piña', 'El Seibo', 'Espaillat', 
  'Hato Mayor', 'Hermanas Mirabal', 'Independencia', 'La Altagracia', 'La Romana', 'La Vega', 
  'María Trinidad Sánchez', 'Monseñor Nouel', 'Monte Cristi', 'Monte Plata', 'Pedernales', 
  'Peravia', 'Puerto Plata', 'Samaná', 'San Cristóbal', 'San José de Ocoa', 'San Juan', 
  'San Pedro de Macorís', 'Sánchez Ramírez', 'Santiago', 'Santiago Rodríguez', 'Santo Domingo', 
  'Valverde'
];

// Municipalités par province
const DOMINICAN_MUNICIPALITIES = {
  'Azua': [
    'Azua de Compostela', 'Estebanía', 'Guayabal', 'Las Charcas', 'Las Yayas de Viajama', 'Padre Las Casas', 'Peralta', 'Pueblo Viejo', 'Sabana Yegua', 'Tábara Arriba'
  ],
  'Baoruco': [
    'Neiba', 'Galván', 'Los Ríos', 'Tamayo', 'Villa Jaragua'
  ],
  'Barahona': [
    'Santa Cruz de Barahona', 'Cabral', 'El Peñón', 'Enriquillo', 'Fundación', 'Jaquimeyes', 'La Ciénaga', 'Las Salinas', 'Paraíso', 'Polo', 'Vicente Noble'
  ],
  'Dajabón': [
    'Dajabón', 'El Pino', 'Loma de Cabrera', 'Partido', 'Restauración'
  ],
  'Duarte': [
    'San Francisco de Macorís', 'Arenoso', 'Castillo', 'Eugenio María de Hostos', 'Las Guáranas', 'Pimentel', 'Villa Riva'
  ],
  'Elías Piña': [
    'Comendador', 'Bánica', 'El Llano', 'Hondo Valle', 'Juan Santiago', 'Pedro Santana'
  ],
  'El Seibo': [
    'Santa Cruz de El Seibo', 'Miches'
  ],
  'Espaillat': [
    'Moca', 'Cayetano Germosén', 'Gaspar Hernández', 'Jamao al Norte'
  ],
  'Hato Mayor': [
    'Hato Mayor del Rey', 'El Valle', 'Sabana de la Mar'
  ],
  'Hermanas Mirabal': [
    'Salcedo', 'Tenares', 'Villa Tapia'
  ],
  'Independencia': [
    'Jimaní', 'Cristóbal', 'Duvergé', 'La Descubierta', 'Mella', 'Postrer Río'
  ],
  'La Altagracia': [
    'Higüey', 'San Rafael del Yuma', 'La Otra Banda', 'Verón', 'Bávaro', 'Punta Cana'
  ],
  'La Romana': [
    'La Romana', 'Guaymate', 'Villa Hermosa'
  ],
  'La Vega': [
    'Concepción de La Vega', 'Constanza', 'Jarabacoa', 'Jima Abajo'
  ],
  'María Trinidad Sánchez': [
    'Nagua', 'Cabrera', 'El Factor', 'Río San Juan'
  ],
  'Monseñor Nouel': [
    'Bonao', 'Maimón', 'Piedra Blanca'
  ],
  'Monte Cristi': [
    'San Fernando de Monte Cristi', 'Castañuela', 'Guayubín', 'Las Matas de Santa Cruz', 'Pepillo Salcedo', 'Villa Vásquez'
  ],
  'Monte Plata': [
    'Monte Plata', 'Bayaguana', 'Peralvillo', 'Sabana Grande de Boyá', 'Yamasá'
  ],
  'Pedernales': [
    'Pedernales', 'Oviedo'
  ],
  'Peravia': [
    'Baní', 'Nizao', 'Matanzas', 'Paya', 'Sabana Buey', 'Villa Fundación', 'Villa Sombrero'
  ],
  'Puerto Plata': [
    'Puerto Plata', 'Altamira', 'Guananico', 'Imbert', 'Los Hidalgos', 'Luperón', 'Sosúa', 'Villa Isabela', 'Villa Montellano'
  ],
  'Samaná': [
    'Santa Bárbara de Samaná', 'Las Terrenas', 'Sánchez'
  ],
  'San Cristóbal': [
    'San Cristóbal', 'Bajos de Haina', 'Cambita Garabitos', 'Los Cacaos', 'Sabana Grande de Palenque', 'San Gregorio de Nigua', 'Villa Altagracia', 'Yaguate'
  ],
  'San José de Ocoa': [
    'San José de Ocoa', 'Rancho Arriba', 'Sabana Larga'
  ],
  'San Juan': [
    'San Juan de la Maguana', 'Bohechío', 'El Cercado', 'Juan de Herrera', 'Las Matas de Farfán', 'Vallejuelo'
  ],
  'San Pedro de Macorís': [
    'San Pedro de Macorís', 'Consuelo', 'Guayacanes', 'Quisqueya', 'Ramón Santana'
  ],
  'Sánchez Ramírez': [
    'Cotuí', 'Cevicos', 'Fantino', 'La Mata'
  ],
  'Santiago': [
    'Santiago de los Caballeros', 'Bisonó', 'Jánico', 'Licey al Medio', 'Puñal', 'Sabana Iglesia', 'San José de las Matas', 'Tamboril', 'Villa González', 'Villa Bisonó'
  ],
  'Santiago Rodríguez': [
    'San Ignacio de Sabaneta', 'Monción', 'Villa Los Almácigos'
  ],
  'Santo Domingo': [
    'Santo Domingo Este', 'Santo Domingo Norte', 'Santo Domingo Oeste', 'Boca Chica', 'Los Alcarrizos', 'Pedregal', 'San Antonio de Guerra', 'Distrito Nacional'
  ],
  'Valverde': [
    'Mao', 'Esperanza', 'Laguna Salada'
  ]
};

const GENDERS = [
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Femenino', value: 'Femenino' },
  { label: 'Otro', value: 'Otro' },
];

const forbiddenUsernames = ['admin', 'support', 'root', 'administrator', 'moderator'];
const usernameRegex = /^[a-z0-9._-]{3,20}$/;

// Coordonnées de la République dominicaine
const DOMINICAN_REPUBLIC_REGION = {
  latitude: 18.735693,
  longitude: -70.162651,
  latitudeDelta: 2.5,
  longitudeDelta: 2.5,
};

const RegisterScreen: React.FC = ({ navigation, route }: any) => {
  const { register, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDateError, setBirthDateError] = useState('');
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [tempProvince, setTempProvince] = useState<string | null>(null);
  const [showMunicipalityPicker, setShowMunicipalityPicker] = useState(false);
  const [tempMunicipality, setTempMunicipality] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [savedLocation, setSavedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    title: string;
    subtitle: string;
    latitude: number;
    longitude: number;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Helper pour afficher la date au format DD/MM/YYYY
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}/${mm}/${yyyy}`;
  };

  // Validation de la date de naissance (pas dans le futur, au moins 13 ans)
  const validateBirthDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    const now = new Date();
    if (date > now) return 'La fecha no puede ser en el futuro.';
    // Vérifie l'âge minimum (13 ans)
    const minAge = 13;
    const minDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
    if (date > minDate) return 'Debes tener al menos 13 años.';
    return '';
  };

  const accountType = route?.params?.accountType || '';

  const [form, setForm] = useState({
    name: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    gender: '', // sera stocké en majuscule initiale
    birthDate: '',
    province: '',
    city: '',
    streetAddress: '', // Nombre de la calle y número
    accountType: accountType,
    storeName: '', // Nombre de la tienda
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    // Si la province change, réinitialiser la municipalité
    if (field === 'province') {
      setForm((prev) => ({ ...prev, city: '' }));
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (form.password !== form.confirmPassword) {
        setPasswordError('Las contraseñas no coinciden.');
        return;
      } else {
        setPasswordError('');
      }
    }
    setStep((s) => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleOpenMap = () => {
    setShowMapModal(true);
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleConfirmLocation = async () => {
    if (selectedLocation) {
      try {
        // Reverse geocoding pour obtenir l'adresse
        const response = await Location.reverseGeocodeAsync({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        });
        
        if (response.length > 0) {
          const address = response[0];
          // Construire l'adresse complète
          const streetAddress = [
            address.street,
            address.streetNumber,
            address.district,
            address.subregion
          ].filter(Boolean).join(', ');
          
          // Mettre à jour le formulaire avec les informations de localisation
          if (address.region) {
            setForm(prev => ({ ...prev, province: address.region || '' }));
          }
          if (address.city) {
            setForm(prev => ({ ...prev, city: address.city || '' }));
          }
          if (streetAddress) {
            setForm(prev => ({ ...prev, streetAddress: streetAddress }));
          }
        }
        
        setShowMapModal(false);
        setSavedLocation(selectedLocation);
        setSelectedLocation(null);
        setSearchQuery('');
        setSearchResults([]);
      } catch (error) {
        Alert.alert('Error', 'No se pudo obtener la dirección de la ubicación seleccionada.');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Recherche géocodage pour trouver les adresses
      const results = await Location.geocodeAsync(searchQuery + ', República Dominicana');
      
      if (results.length > 0) {
        const searchResultsData = results.map((result, index) => ({
          title: searchQuery,
          subtitle: `Resultado ${index + 1}`,
          latitude: result.latitude,
          longitude: result.longitude,
        }));
        
        setSearchResults(searchResultsData);
        
        // Si un seul résultat, le sélectionner automatiquement
        if (results.length === 1) {
          const location = results[0];
          setSelectedLocation({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }
      } else {
        setSearchResults([]);
        Alert.alert('No encontrado', 'No se encontraron resultados para esta búsqueda.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al buscar la ubicación.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: {
    title: string;
    subtitle: string;
    latitude: number;
    longitude: number;
  }) => {
    setSelectedLocation({
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setSearchResults([]);
  };

  const handleRegister = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      if (form.password !== form.confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        setIsSubmitting(false);
        return;
      }
      await register(
        form.name,
        form.email,
        form.password,
        {
          lastname: form.lastname,
          username: form.username,
          gender: form.gender,
          birthDate: form.birthDate,
          province: form.province,
          city: form.city,
          accountType: form.accountType,
          storeName: form.storeName, // Nombre de la tienda
          // Adresse et coordonnées géographiques seulement pour Tienda Física
          ...(form.accountType === 'fisica' ? {
            streetAddress: form.streetAddress, // Adresse de la calle y número
            ...(savedLocation ? {
              geoPoint: new GeoPoint(savedLocation.latitude, savedLocation.longitude),
            } : {}),
          } : {}),
        }
      );
      
      // Message de succès en espagnol
      Alert.alert(
        '¡Cuenta creada exitosamente! 🎉',
        'Tu cuenta ha sido creada correctamente. Ya puedes comenzar a usar RopaNova.',
        [
          {
            text: '¡Perfecto!',
            onPress: () => {
              // Navigation vers l'écran principal ou connexion
              navigation.navigate('Login');
            }
          }
        ]
      );
    } catch (e) {
      setError("Erreur lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation et unicité du username
  const validateUsername = async (value: string) => {
    setCheckingUsername(true);
    if (!usernameRegex.test(value)) {
      setUsernameError('El nombre de usuario debe tener entre 3 y 20 caracteres, solo minúsculas, cifras, ".", "_", "-".');
      setCheckingUsername(false);
      return false;
    }
    if (forbiddenUsernames.includes(value)) {
      setUsernameError('Este nombre de usuario no está permitido.');
      setCheckingUsername(false);
      return false;
    }
    if (value) {
      try {
        const db = getFirestore(app);
        const q = query(collection(db, 'users'), where('username', '==', value));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBg}>
              <Ionicons name="shirt-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.brand}>Ropa Nova</Text>
          </View>
          <Text style={styles.subtitle}>Tu boutique virtual dominicana</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.stepText}>Paso {step} de 3</Text>
          <ScrollView 
            contentContainerStyle={{paddingBottom: 100}} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Información Básica</Text>
            {/* Champ Nombre de la tienda - seulement pour Tienda Virtual/Física */}
            {(form.accountType === 'virtual' || form.accountType === 'fisica') && (
              <>
                <Text style={styles.label}>Nombre de la Tienda</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Nombre de tu tienda" 
                  value={form.storeName} 
                  onChangeText={v => handleChange('storeName', v)} 
                />
              </>
            )}
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} placeholder="Nombre" value={form.name} onChangeText={v => handleChange('name', v)} />
            <Text style={styles.label}>Apellido</Text>
            <TextInput style={styles.input} placeholder="Apellido" value={form.lastname} onChangeText={v => handleChange('lastname', v)} />
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} placeholder="Correo electrónico" value={form.email} onChangeText={v => handleChange('email', v)} keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.label}>Contraseña</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Contraseña" 
              value={form.password} 
              onChangeText={v => handleChange('password', v)} 
              secureTextEntry 
              returnKeyType="next"
              blurOnSubmit={false}
            />
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Confirmar contraseña" 
              value={form.confirmPassword} 
              onChangeText={v => handleChange('confirmPassword', v)} 
              secureTextEntry 
              returnKeyType="next"
              blurOnSubmit={false}
            />
            {passwordError ? <Text style={{ color: '#dc2626', marginTop: 4, marginBottom: 8, textAlign: 'left' }}>{passwordError}</Text> : null}
            <Text style={styles.label}>Nombre de usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de usuario"
              value={form.username}
              onChangeText={async (v) => {
                // Force la minuscule
                const lower = v.replace(/[^a-z0-9._-]/g, '').toLowerCase();
                handleChange('username', lower);
                await validateUsername(lower);
              }}
              autoCapitalize="none"
            />
            {checkingUsername && <ActivityIndicator size="small" color="#059669" style={{ marginBottom: 8 }} />}
            {usernameError && <Text style={{ color: '#dc2626', marginBottom: 8 }}>{usernameError}</Text>}
          </View>
        )}
        {step === 2 && (
          <View>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="calendar-outline" size={48} color="#059669" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>Información Personal</Text>
              <Text style={{ color: '#64748b', fontSize: 14 }}>Cuéntanos un poco sobre ti</Text>
            </View>
            <Text style={styles.label}>Género</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: form.gender === g.value ? '#059669' : '#cbd5e1',
                    backgroundColor: form.gender === g.value ? '#e0f2fe' : '#fff',
                  }}
                  onPress={() => handleChange('gender', g.value)}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: form.gender === g.value ? '#059669' : '#cbd5e1',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 6,
                      backgroundColor: '#fff',
                    }}
                  >
                    {form.gender === g.value && (
                      <View style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#059669',
                      }} />
                    )}
                  </View>
                  <Text style={{ color: '#1e293b', fontWeight: '500' }}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Fecha de nacimiento</Text>
            <TouchableOpacity onPress={() => {
              if (Platform.OS === 'ios') {
                setTempDate(form.birthDate ? new Date(form.birthDate) : new Date(2000, 0, 1));
              }
              setShowDatePicker(true);
            }} activeOpacity={0.8}>
              <TextInput
                style={[styles.input, { color: form.birthDate ? '#1e293b' : '#64748b' }]}
                placeholder="DD/MM/AAAA"
                value={formatDisplayDate(form.birthDate)}
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
            {/* Modal personnalisée pour iOS */}
            {Platform.OS === 'ios' && (
              <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setShowDatePicker(false)} />
                <View style={{ 
                  position: 'absolute', 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  backgroundColor: '#fff', 
                  borderTopLeftRadius: 16, 
                  borderTopRightRadius: 16, 
                  padding: 16,
                  minHeight: 300
                }}>
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 16,
                    paddingHorizontal: 8
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>Selecciona fecha</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Ionicons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ 
                    backgroundColor: '#f8fafc', 
                    borderRadius: 12, 
                    padding: 16,
                    marginBottom: 16
                  }}>
                    <DateTimePicker
                      value={tempDate || new Date(2000, 0, 1)}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                      locale="es-ES"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) setTempDate(selectedDate);
                      }}
                      style={{ 
                        backgroundColor: 'transparent',
                        height: 200
                      }}
                      textColor="#1e293b"
                    />
                  </View>
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: '#059669', 
                      borderRadius: 8, 
                      padding: 14, 
                      alignItems: 'center',
                      marginBottom: 8
                    }}
                    onPress={() => {
                      setShowDatePicker(false);
                      if (tempDate) {
                        const yyyy = tempDate.getFullYear();
                        const mm = String(tempDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(tempDate.getDate()).padStart(2, '0');
                        const iso = `${yyyy}-${mm}-${dd}`;
                        const error = validateBirthDate(iso);
                        setBirthDateError(error);
                        if (!error) {
                          handleChange('birthDate', iso);
                        } else {
                          handleChange('birthDate', '');
                        }
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Confirmar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: 8, 
                      padding: 14, 
                      alignItems: 'center'
                    }}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 16 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            )}
            {/* Picker natif Android */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={form.birthDate ? new Date(form.birthDate) : new Date(2000, 0, 1)}
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
                    const error = validateBirthDate(iso);
                    setBirthDateError(error);
                    if (!error) {
                      handleChange('birthDate', iso);
                    } else {
                      handleChange('birthDate', '');
                    }
                  } else {
                    setShowDatePicker(false); // Annulé
                  }
                }}
              />
            )}
           {birthDateError ? <Text style={{ color: '#dc2626', marginTop: 4, marginBottom: 8, textAlign: 'left' }}>{birthDateError}</Text> : null}
          </View>
        )}
        {step === 3 && (
          <View>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="location-outline" size={48} color="#059669" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>Ubicación</Text>
              <Text style={{ color: '#64748b', fontSize: 14 }}>¿Dónde te encuentras?</Text>
            </View>
            {/* Section carte et adresse seulement pour Tienda Física */}
            {form.accountType === 'fisica' && (
              <>
                <TouchableOpacity style={styles.detectBtn} onPress={handleOpenMap}>
                  <Ionicons name="map-outline" size={18} color="#059669" />
                  <Text style={styles.detectBtnText}>Seleccionar ubicación en mapa</Text>
                </TouchableOpacity>
                {locationError ? <Text style={styles.error}>{locationError}</Text> : null}

                {/* Mini-carte avec l'emplacement sélectionné */}
                {savedLocation && (
                  <View style={styles.miniMapContainer}>
                    <Text style={styles.miniMapTitle}>Ubicación seleccionada</Text>
                    <MapView
                      style={styles.miniMap}
                      region={{
                        latitude: savedLocation.latitude,
                        longitude: savedLocation.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      rotateEnabled={false}
                      pitchEnabled={false}
                    >
                      <Marker
                        coordinate={savedLocation}
                        title="Tu tienda"
                        description="Ubicación seleccionada"
                      />
                    </MapView>
                    <TouchableOpacity 
                      style={styles.changeLocationButton}
                      onPress={handleOpenMap}
                    >
                      <Ionicons name="create-outline" size={16} color="#059669" />
                      <Text style={styles.changeLocationText}>Cambiar ubicación</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
            <Text style={styles.label}>Provincia</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 12, padding: 14 }}
              onPress={() => {
                setTempProvince(form.province || '');
                setShowProvincePicker(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: form.province ? '#1e293b' : '#64748b', fontSize: 16 }}>
                {form.province || 'Selecciona provincia'}
              </Text>
            </TouchableOpacity>
            {/* Modal personnalisée pour le picker de province */}
            {showProvincePicker && (
              <Modal
                visible={showProvincePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowProvincePicker(false)}
              >
                <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setShowProvincePicker(false)} />
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '60%' }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1e293b', marginBottom: 12, textAlign: 'center' }}>Selecciona provincia</Text>
                  <ScrollView style={{ maxHeight: 250, marginBottom: 12 }}>
                    {["", ...DOMINICAN_PROVINCES].map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor: tempProvince === p ? '#e0f2fe' : '#fff',
                          marginBottom: 2,
                        }}
                        onPress={() => setTempProvince(p)}
                      >
                        <Text style={{ color: tempProvince === p ? '#059669' : '#1e293b', fontSize: 16 }}>
                          {p || 'Selecciona provincia'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={{ backgroundColor: '#059669', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 4 }}
                    onPress={() => {
                      setShowProvincePicker(false);
                      if (tempProvince !== null) {
                        handleChange('province', tempProvince);
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Valider</Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            )}
            <Text style={styles.label}>Ciudad/Municipio</Text>
            <TouchableOpacity
              style={{ 
                backgroundColor: '#f3f4f6', 
                borderRadius: 8, 
                marginBottom: 12, 
                padding: 14,
                opacity: form.province ? 1 : 0.5
              }}
              onPress={() => {
                if (form.province) {
                  setTempMunicipality(form.city || '');
                  setShowMunicipalityPicker(true);
                }
              }}
              disabled={!form.province}
              activeOpacity={0.8}
            >
              <Text style={{ 
                color: form.city ? '#1e293b' : '#64748b', 
                fontSize: 16 
              }}>
                {form.city || (form.province ? 'Selecciona municipio' : 'Primero selecciona una provincia')}
              </Text>
            </TouchableOpacity>
            
            {/* Modal pour le picker de municipalité */}
            {showMunicipalityPicker && form.province && (
              <Modal
                visible={showMunicipalityPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMunicipalityPicker(false)}
              >
                <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setShowMunicipalityPicker(false)} />
                <View style={{ 
                  position: 'absolute', 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  backgroundColor: '#fff', 
                  borderTopLeftRadius: 16, 
                  borderTopRightRadius: 16, 
                  padding: 16, 
                  maxHeight: '60%' 
                }}>
                  <Text style={{ 
                    fontWeight: 'bold', 
                    fontSize: 18, 
                    color: '#1e293b', 
                    marginBottom: 12, 
                    textAlign: 'center' 
                  }}>
                    Municipios de {form.province}
                  </Text>
                  <ScrollView style={{ maxHeight: 250, marginBottom: 12 }}>
                    {["", ...(DOMINICAN_MUNICIPALITIES[form.province as keyof typeof DOMINICAN_MUNICIPALITIES] || [])].map((municipality) => (
                      <TouchableOpacity
                        key={municipality}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor: tempMunicipality === municipality ? '#e0f2fe' : '#fff',
                          marginBottom: 2,
                        }}
                        onPress={() => setTempMunicipality(municipality)}
                      >
                        <Text style={{ 
                          color: tempMunicipality === municipality ? '#059669' : '#1e293b', 
                          fontSize: 16 
                        }}>
                          {municipality || 'Selecciona municipio'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: '#059669', 
                      borderRadius: 8, 
                      padding: 14, 
                      alignItems: 'center', 
                      marginTop: 4 
                    }}
                    onPress={() => {
                      setShowMunicipalityPicker(false);
                      if (tempMunicipality !== null) {
                        handleChange('city', tempMunicipality);
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            )}

            {/* Champ pour le nom de rue et numéro seulement pour Tienda Física */}
            {form.accountType === 'fisica' && (
              <>
                <Text style={styles.label}>Indica el nombre de la calle y número</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Calle 27 de Febrero #123, Zona Colonial"
                  value={form.streetAddress}
                  onChangeText={(value) => handleChange('streetAddress', value)}
                  multiline={true}
                  numberOfLines={2}
                />
              </>
            )}
          </View>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-start' }}>
            <TouchableOpacity style={styles.navBtn} onPress={() => {
              if (step === 1) {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.navigate('AccountTypeSelection');
              } else {
                prevStep();
              }
            }}>
              <Ionicons name="arrow-back" size={18} color="#1e293b" />
              <Text style={styles.navBtnText}>Volver</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
            {step < 3 ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={nextStep}
                disabled={!!usernameError || checkingUsername}
              >
                <Text style={styles.primaryBtnText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={isSubmitting || loading || !!usernameError || checkingUsername}>
                {isSubmitting || loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Crear Cuenta</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de la carte */}
        <Modal
          visible={showMapModal}
          animationType="slide"
          onRequestClose={() => setShowMapModal(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.mapHeader}>
              <TouchableOpacity 
                style={styles.mapCloseButton}
                onPress={() => setShowMapModal(false)}
              >
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
              <Text style={styles.mapTitle}>Selecciona la ubicación de tu tienda</Text>
              <View style={{ width: 24 }} />
            </View>
            
            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar dirección, calle o nombre del negocio..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#64748b" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Résultats de recherche */}
            {searchResults.length > 0 && (
              <View style={styles.searchResultsContainer}>
                <ScrollView style={styles.searchResultsList}>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectSearchResult(result)}
                    >
                      <Ionicons name="location" size={16} color="#059669" />
                      <View style={styles.searchResultText}>
                        <Text style={styles.searchResultTitle}>{result.title}</Text>
                        <Text style={styles.searchResultSubtitle}>{result.subtitle}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#64748b" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <MapView
              style={styles.map}
              initialRegion={DOMINICAN_REPUBLIC_REGION}
              onPress={handleMapPress}
            >
              {selectedLocation && (
                <Marker
                  coordinate={selectedLocation}
                  title="Ubicación seleccionada"
                  description="Esta será la ubicación de tu tienda"
                />
              )}
            </MapView>
            
            <View style={styles.mapFooter}>
              <Text style={styles.mapInstructions}>
                {selectedLocation 
                  ? `Ubicación seleccionada: ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
                  : 'Busca una dirección o toca en el mapa para seleccionar la ubicación'
                }
              </Text>
              <TouchableOpacity
                style={[
                  styles.confirmLocationButton,
                  !selectedLocation && styles.confirmLocationButtonDisabled
                ]}
                onPress={handleConfirmLocation}
                disabled={!selectedLocation}
              >
                <Text style={styles.confirmLocationButtonText}>
                  Confirmar ubicación
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 16 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  logoBg: { backgroundColor: '#059669', padding: 8, borderRadius: 8 },
  brand: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginLeft: 8 },
  subtitle: { color: '#64748b', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  progressBarBg: { backgroundColor: '#e5e7eb', borderRadius: 8, height: 8, marginBottom: 8 },
  progressBar: { backgroundColor: '#059669', borderRadius: 8, height: 8 },
  stepText: { color: '#64748b', fontSize: 13, textAlign: 'right', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16, color: '#1e293b' },
  pickerLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { color: '#334155', fontWeight: '500', marginRight: 8, minWidth: 70 },
  picker: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8 },
  detectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2fe', borderRadius: 8, padding: 10, marginBottom: 12 },
  detectBtnText: { color: '#059669', fontWeight: '500', marginLeft: 8 },
  error: { color: '#dc2626', marginBottom: 8, textAlign: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  navBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', marginRight: 8 },
  navBtnText: { color: '#1e293b', fontWeight: 'bold', fontSize: 15, marginHorizontal: 4 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18, backgroundColor: '#059669', borderRadius: 8, borderWidth: 1, borderColor: '#059669' },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginHorizontal: 4 },
  submitBtn: { backgroundColor: '#059669', borderRadius: 8, padding: 14, alignItems: 'center', flex: 1 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  footerTextContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  footerText: { color: '#64748b', fontSize: 14 },
  footerLink: { color: '#059669', fontWeight: 'bold', fontSize: 14, marginLeft: 4 },
  // Styles pour la carte
  mapHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb' 
  },
  mapCloseButton: { 
    padding: 8 
  },
  mapTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    flex: 1, 
    textAlign: 'center' 
  },
  map: { 
    flex: 1 
  },
  mapFooter: { 
    padding: 16, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb' 
  },
  mapInstructions: { 
    fontSize: 14, 
    color: '#64748b', 
    textAlign: 'center', 
    marginBottom: 16 
  },
  confirmLocationButton: { 
    backgroundColor: '#059669', 
    borderRadius: 8, 
    padding: 14, 
    alignItems: 'center' 
  },
  confirmLocationButtonDisabled: { 
    backgroundColor: '#e5e7eb' 
  },
  confirmLocationButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  // Styles pour la barre de recherche
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  searchResultsContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchResultText: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  // Styles pour la mini-carte
  miniMapContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  miniMapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  miniMap: {
    height: 150,
    width: '100%',
  },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  changeLocationText: {
    color: '#059669',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default RegisterScreen; 