import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Alert } from 'react-native';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

const initialPrivacySettings = {
  PrivacidadDelPerfil: {
    mostrarCorreoElectronico: false,
    mostrarTelefono: false,
    mostrarUbicacion: true,
    mostrarUltimaConexion: true,
    mostrarEstadoEnLinea: true,
    visibilidadPerfil: 'publico', // publico, seguidores, privado
  },
  PrivacidadDeMensajes: {
    permitirMensajes: true,
    permitirMensajesDe: 'todos', // todos, verificados, seguidos
    confirmacionesDeLectura: true,
    indicadoresDeEscritura: true,
    solicitudesDeMensajes: true,
  },
  PrivacidadDeActividad: {
    mostrarCompras: false,
    mostrarVentas: true,
    mostrarFavoritos: false,
    mostrarSeguidos: true,
    mostrarResenas: true,
    estadoDeActividad: true,
  },
  PrivacidadDeBusqueda: {
    buscarPorTelefono: false,
    buscarPorNombre: true,
    sugerenciasDeUsuarios: true,
    indexarPerfil: true,
  },
  PrivacidadDeDatos: {
    recopilacionDeDatos: true,
    analisisDeUso: false,
    personalizacion: true,
    compartirConTerceros: false,
  },
}

const profileVisibilityOptions = [
  { value: 'publico', label: 'Público - Todos Pueden Ver' },
  { value: 'seguidores', label: 'Seguidores - Solo Quienes Sigues' },
  { value: 'privado', label: 'Privado - Solo Tú' },
]

const allowMessagesFromOptions = [
  { value: 'todos', label: 'Todos los Usuarios' },
  { value: 'verificados', label: 'Solo Usuarios Verificados' },
  { value: 'seguidos', label: 'Solo Quienes Sigo' },
]

// Merge profond pour garantir que chaque sous-objet existe
function deepMerge(target: any, source: any) {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export const PrivacySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, changePassword } = useAuth();
  const [settings, setSettings] = useState(initialPrivacySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  // Sauvegarde automatique à la sortie de la page (avant navigation)
  const savePrivacySettings = useCallback(async () => {
    if (!user?.id || user.id === 'guest') return;
    setIsSaving(true);
    try {
      const db = getFirestore(app);
      const docRef = doc(db, 'users', user.id);
      await setDoc(docRef, { privacySettings: settings }, { merge: true });
    } catch (e) {
      // Optionnel: afficher une alerte d'erreur
    }
    setIsSaving(false);
  }, [settings, user]);

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      setIsLoading(true);
      if (!user?.id || user.id === 'guest') {
        setIsLoading(false);
        return;
      }
      try {
        const db = getFirestore(app);
        const docRef = doc(db, 'users', user.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().privacySettings) {
          setSettings(deepMerge({ ...initialPrivacySettings }, docSnap.data().privacySettings));
        } else {
          setSettings(initialPrivacySettings);
        }
      } catch (e) {
        setSettings(initialPrivacySettings);
      }
      setIsLoading(false);
    };
    fetchPrivacySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', savePrivacySettings);
    return unsubscribe;
  }, [navigation, savePrivacySettings]);

  const updateSetting = (category: keyof typeof initialPrivacySettings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true);
    if (!user?.id || user.id === 'guest') {
      setIsSaving(false);
      return;
    }
    try {
      const db = getFirestore(app);
      const docRef = doc(db, 'users', user.id);
      await setDoc(docRef, { privacySettings: settings }, { merge: true });
      if (Platform.OS === 'web') {
        alert('Configuración de Privacidad Guardada con Exito.');
      } else {
        Alert.alert('Éxito', 'Configuración de privacidad guardada con éxito.');
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        alert('Error al Guardar la Configuración de Privacidad.');
      } else {
        Alert.alert('Error', 'Error al Guardar la Configuración de Privacidad.');
      }
    }
    setIsSaving(false);
  }

  const handleChangePassword = async () => {
    if (!user?.id || user.id === 'guest') return;
    if (!newPwd || newPwd.length < 6) {
      Alert.alert('Contraseña', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Contraseña', 'La confirmación no coincide.');
      return;
    }
    setChangingPwd(true);
    try {
      await changePassword(currentPwd, newPwd);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      Alert.alert('Éxito', 'Tu contraseña ha sido actualizada.');
    } catch {
      Alert.alert(
        'Error',
        'No se pudo cambiar la contraseña. Verifica la contraseña actual o vuelve a iniciar sesión e inténtalo de nuevo.',
      );
    }
    setChangingPwd(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color="#059669" />
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
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', position: 'absolute', left: 0, right: 0 }}>
          <Text style={styles.headerTitle}>Privacidad y Seguridad</Text>
          </View>
        </View>

        {/* Alerte intro */}
        <View style={styles.alertBox}>
          <Ionicons name="shield-checkmark" size={18} color="#059669" style={{ marginRight: 8 }} />
          <Text style={styles.alertText}>Tu privacidad es importante. Controla qué información compartes y con quién. Les changements sont appliqués immédiatement.</Text>
        </View>

        {user?.id && user.id !== 'guest' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
            <Text style={styles.label}>Contraseña actual</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={currentPwd}
              onChangeText={setCurrentPwd}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.label}>Confirmar nueva contraseña</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              placeholder="Repite la nueva contraseña"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              style={[styles.savePwdButton, changingPwd && styles.savePwdButtonDisabled]}
              onPress={handleChangePassword}
              disabled={changingPwd}
            >
              {changingPwd ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.savePwdButtonText}>Actualizar contraseña</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Profil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad del Perfil</Text>
          <Text style={styles.label}>Visibilidad del Perfil</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectRow} contentContainerStyle={{gap: 8}}>
            {profileVisibilityOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.selectOption, settings.PrivacidadDelPerfil.visibilidadPerfil === opt.value && styles.selectOptionActive]}
                onPress={() => updateSetting('PrivacidadDelPerfil', 'visibilidadPerfil', opt.value)}
              >
                <Text style={[styles.selectOptionText, settings.PrivacidadDelPerfil.visibilidadPerfil === opt.value && styles.selectOptionTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mostrar Correo Electrónico</Text>
            <Switch
              value={settings.PrivacidadDelPerfil.mostrarCorreoElectronico}
              onValueChange={(v) => updateSetting('PrivacidadDelPerfil', 'mostrarCorreoElectronico', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mostrar Teléfono</Text>
            <Switch
              value={settings.PrivacidadDelPerfil.mostrarTelefono}
              onValueChange={(v) => updateSetting('PrivacidadDelPerfil', 'mostrarTelefono', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mostrar Ubicación</Text>
            <Switch
              value={settings.PrivacidadDelPerfil.mostrarUbicacion}
              onValueChange={(v) => updateSetting('PrivacidadDelPerfil', 'mostrarUbicacion', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mostrar Ultima Conexión</Text>
            <Switch
              value={settings.PrivacidadDelPerfil.mostrarUltimaConexion}
              onValueChange={(v) => updateSetting('PrivacidadDelPerfil', 'mostrarUltimaConexion', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Estado en Línea</Text>
            <Switch
              value={settings.PrivacidadDelPerfil.mostrarEstadoEnLinea}
              onValueChange={(v) => updateSetting('PrivacidadDelPerfil', 'mostrarEstadoEnLinea', v)}
            />
          </View>
        </View>

        {/* Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad de Mensajes</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Permitir Mensajes</Text>
            <Switch
              value={settings.PrivacidadDeMensajes.permitirMensajes}
              onValueChange={(v) => updateSetting('PrivacidadDeMensajes', 'permitirMensajes', v)}
            />
          </View>
          {settings.PrivacidadDeMensajes.permitirMensajes && (
            <>
              <Text style={styles.label}>Permitir Mensajes de</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectRow} contentContainerStyle={{gap: 8}}>
                {allowMessagesFromOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.selectOption, settings.PrivacidadDeMensajes.permitirMensajesDe === opt.value && styles.selectOptionActive]}
                    onPress={() => updateSetting('PrivacidadDeMensajes', 'permitirMensajesDe', opt.value)}
                  >
                    <Text style={[styles.selectOptionText, settings.PrivacidadDeMensajes.permitirMensajesDe === opt.value && styles.selectOptionTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Confirmaciones de lectura</Text>
                <Switch
                  value={settings.PrivacidadDeMensajes.confirmacionesDeLectura}
                  onValueChange={(v) => updateSetting('PrivacidadDeMensajes', 'confirmacionesDeLectura', v)}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Indicadores de Escritura</Text>
                <Switch
                  value={settings.PrivacidadDeMensajes.indicadoresDeEscritura}
                  onValueChange={(v) => updateSetting('PrivacidadDeMensajes', 'indicadoresDeEscritura', v)}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Solicitudes de Mensaje</Text>
                <Switch
                  value={settings.PrivacidadDeMensajes.solicitudesDeMensajes}
                  onValueChange={(v) => updateSetting('PrivacidadDeMensajes', 'solicitudesDeMensajes', v)}
                />
              </View>
            </>
          )}
        </View>

        {/* Activité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad de Actividad</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mostrar Compras</Text>
            <Switch
              value={settings.PrivacidadDeActividad.mostrarCompras}
              onValueChange={(v) => updateSetting('PrivacidadDeActividad', 'mostrarCompras', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mostrar Ventas</Text>
            <Switch
              value={settings.PrivacidadDeActividad.mostrarVentas}
              onValueChange={(v) => updateSetting('PrivacidadDeActividad', 'mostrarVentas', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mostrar Favoritos</Text>
            <Switch
              value={settings.PrivacidadDeActividad.mostrarFavoritos}
              onValueChange={(v) => updateSetting('PrivacidadDeActividad', 'mostrarFavoritos', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mostrar Seguidos</Text>
            <Switch
              value={settings.PrivacidadDeActividad.mostrarSeguidos}
              onValueChange={(v) => updateSetting('PrivacidadDeActividad', 'mostrarSeguidos', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mostrar Reseñas</Text>
            <Switch
              value={settings.PrivacidadDeActividad.mostrarResenas}
              onValueChange={(v) => updateSetting('PrivacidadDeActividad', 'mostrarResenas', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Estado de Actividad</Text>
            <Switch
              value={settings.PrivacidadDeActividad.estadoDeActividad}
              onValueChange={(v) => updateSetting('PrivacidadDeActividad', 'estadoDeActividad', v)}
            />
          </View>
        </View>

        {/* Recherche */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad de Búsqueda</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Búsqueda por Teléfono</Text>
            <Switch
              value={settings.PrivacidadDeBusqueda.buscarPorTelefono}
              onValueChange={(v) => updateSetting('PrivacidadDeBusqueda', 'buscarPorTelefono', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Búsqueda por Nombre</Text>
            <Switch
              value={settings.PrivacidadDeBusqueda.buscarPorNombre}
              onValueChange={(v) => updateSetting('PrivacidadDeBusqueda', 'buscarPorNombre', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Sugerencias de Usuarios</Text>
            <Switch
              value={settings.PrivacidadDeBusqueda.sugerenciasDeUsuarios}
              onValueChange={(v) => updateSetting('PrivacidadDeBusqueda', 'sugerenciasDeUsuarios', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Indexar Perfil</Text>
            <Switch
              value={settings.PrivacidadDeBusqueda.indexarPerfil}
              onValueChange={(v) => updateSetting('PrivacidadDeBusqueda', 'indexarPerfil', v)}
            />
          </View>
        </View>

        {/* Données */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad de Datos</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Recopilación de Datos</Text>
            <Switch
              value={settings.PrivacidadDeDatos.recopilacionDeDatos}
              onValueChange={(v) => updateSetting('PrivacidadDeDatos', 'recopilacionDeDatos', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Análisis de Uso</Text>
            <Switch
              value={settings.PrivacidadDeDatos.analisisDeUso}
              onValueChange={(v) => updateSetting('PrivacidadDeDatos', 'analisisDeUso', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Personalización</Text>
            <Switch
              value={settings.PrivacidadDeDatos.personalizacion}
              onValueChange={(v) => updateSetting('PrivacidadDeDatos', 'personalizacion', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Compartir con Terceros</Text>
            <Switch
              value={settings.PrivacidadDeDatos.compartirConTerceros}
              onValueChange={(v) => updateSetting('PrivacidadDeDatos', 'compartirConTerceros', v)}
            />
          </View>
        </View>

        {/* Conseils */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consejos de Privacidad</Text>
          <View style={styles.tipBoxBlue}>
            <Text style={styles.tipTitle}>💡 Perfil Público vs Privado</Text>
            <Text style={styles.tipText}>Un perfil público te ayuda a vender más, pero considera qué información personal compartes.</Text>
          </View>
          <View style={styles.tipBoxGreen}>
            <Text style={styles.tipTitle}>🔒 Verificación Recomendada</Text>
            <Text style={styles.tipText}>Los usuarios verificados generan más confianza y tienen mejor tasa de ventas.</Text>
          </View>
          <View style={styles.tipBoxYellow}>
            <Text style={styles.tipTitle}>⚠️ Información Sensible</Text>
            <Text style={styles.tipText}>Nunca compartas información bancaria o documentos de identidad por mensajes privados.</Text>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  saveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', borderRadius: 8, padding: 8 },
  saveText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', borderRadius: 10, padding: 12, marginBottom: 16 },
  alertText: { color: '#059669', fontSize: 13, flex: 1 },
  section: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  sectionTitle: { fontWeight: 'bold', color: '#059669', fontSize: 15, marginBottom: 10 },
  label: { color: '#6b7280', fontSize: 13, marginBottom: 6 },
  selectRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  selectOption: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  selectOptionActive: { backgroundColor: '#059669' },
  selectOptionText: { color: '#374151', fontSize: 13 },
  selectOptionTextActive: { color: 'white', fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  switchLabel: { fontWeight: 'bold', color: '#111827', fontSize: 14 },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  savePwdButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  savePwdButtonDisabled: { opacity: 0.7 },
  savePwdButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  tipBoxBlue: { backgroundColor: '#dbeafe', borderRadius: 8, padding: 12, marginBottom: 8 },
  tipBoxGreen: { backgroundColor: '#bbf7d0', borderRadius: 8, padding: 12, marginBottom: 8 },
  tipBoxYellow: { backgroundColor: '#fef9c3', borderRadius: 8, padding: 12, marginBottom: 8 },
  tipTitle: { fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  tipText: { color: '#374151', fontSize: 13 },
}) 