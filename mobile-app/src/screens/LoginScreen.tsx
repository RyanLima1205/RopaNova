import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen: React.FC = ({ navigation }: any) => {
  const { login, loading, loginAsGuest, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (e) {
      setError("Email ou mot de passe incorrect");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Correo requerido', 'Ingresa tu correo electrónico para recuperar la contraseña.');
      return;
    }
    Alert.alert(
      'Recuperar contraseña',
      `¿Enviar enlace de restablecimiento a ${trimmed}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => {
            (async () => {
              try {
                await sendPasswordReset(trimmed);
                Alert.alert('Listo', 'Revisa tu correo (y la carpeta de spam) para restablecer la contraseña.');
              } catch {
                Alert.alert(
                  'Error',
                  'No se pudo enviar el correo. Verifica la dirección o inténtalo más tarde.',
                );
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Bouton 'Pasar' en haut à gauche */}
      <View style={{ position: 'absolute', top: 60, right: 16, zIndex: 10 }}>
        <TouchableOpacity
          style={{ paddingVertical: 6, paddingHorizontal: 8 }}
          onPress={loginAsGuest}
        >
          <Text style={{ color: '#059669', fontSize: 15, textDecorationLine: 'underline', fontWeight: '400' }}>Pasar</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.title}>¡Bienvenido de vuelta!</Text>
        <Text style={styles.description}>Inicia sesión en tu cuenta de Ropa Nova</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tu contraseña"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <TouchableOpacity>
                <Ionicons name="checkbox-outline" size={16} color="#059669" />
              </TouchableOpacity>
              <Text style={styles.rememberText}>Recordarme</Text>
            </View>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isSubmitting || loading}>
            {isSubmitting || loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AccountTypeSelection')}>
            <Text style={styles.footerLink}>Regístrate aquí</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 4 },
  description: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  form: { marginBottom: 12 },
  label: { color: '#334155', fontWeight: '500', marginBottom: 4, marginTop: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 12 },
  inputIcon: { marginLeft: 12 },
  input: { flex: 1, padding: 12, fontSize: 16, color: '#1e293b', backgroundColor: 'transparent' },
  eyeIcon: { padding: 8 },
  error: { color: '#dc2626', marginBottom: 8, textAlign: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { color: '#64748b', fontSize: 13, marginLeft: 4 },
  forgotText: { color: '#059669', fontSize: 13, fontWeight: '500' },
  button: { backgroundColor: '#059669', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  footerTextContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  footerText: { color: '#64748b', fontSize: 14 },
  footerLink: { color: '#059669', fontWeight: 'bold', fontSize: 14, marginLeft: 4 },
});

export default LoginScreen; 