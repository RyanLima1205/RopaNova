import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { brandColors, semanticColors, spacing, typography } from '../theme';

const LoginScreen: React.FC = ({ navigation }: any) => {
  const { login, loading, loginAsGuest, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (e) {
      setError("Correo o contraseña incorrectos");
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
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.primaryExtraLight} />
      {/* Bouton 'Pasar' en haut à gauche */}
      <View style={{ position: 'absolute', top: 60, right: 16, zIndex: 10 }}>
        <TouchableOpacity
          style={{ paddingVertical: 6, paddingHorizontal: 8 }}
          onPress={loginAsGuest}
        >
          <Text style={styles.skipText}>Pasar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Logo variant="horizontal" size="md" tagline />
        <Text style={styles.subtitle}>Tu boutique virtual dominicana</Text>
      </View>
      <Card style={styles.card}>
        <Text style={styles.title}>¡Bienvenido de vuelta!</Text>
        <Text style={styles.description}>Inicia sesión en tu cuenta de Ropa Nova</Text>
        <View style={styles.form}>
          <Input
            label="Correo electrónico"
            placeholder="tu@email.com"
            leftIcon="mail-outline"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Contraseña"
            placeholder="Tu contraseña"
            leftIcon="lock-closed-outline"
            secureToggle
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.forgotContainer} onPress={handleForgotPassword}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            disabled={isSubmitting || loading}
            loading={isSubmitting || loading}
          />
        </View>
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AccountTypeSelection')}>
            <Text style={styles.footerLink}>Regístrate aquí</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brandColors.primaryExtraLight, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  subtitle: { color: brandColors.textSecondary, fontFamily: typography.body.fontFamily, fontSize: 14, marginTop: spacing.xs },
  skipText: { color: brandColors.primaryUI, fontFamily: typography.bodyMedium.fontFamily, fontSize: 15, textDecorationLine: 'underline' },
  card: { marginHorizontal: spacing.lg, padding: spacing.xxl },
  title: { fontFamily: typography.screenTitle.fontFamily, fontSize: typography.screenTitle.fontSize, color: brandColors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  description: { color: brandColors.textSecondary, fontFamily: typography.body.fontFamily, fontSize: 14, textAlign: 'center', marginBottom: spacing.lg },
  form: { marginBottom: spacing.md },
  error: { color: semanticColors.error, fontFamily: typography.caption.fontFamily, marginBottom: spacing.sm, textAlign: 'center' },
  forgotContainer: { alignItems: 'flex-end', marginBottom: spacing.md },
  forgotText: { color: brandColors.primaryUI, fontFamily: typography.bodyMedium.fontFamily, fontSize: 13 },
  footerTextContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  footerText: { color: brandColors.textSecondary, fontFamily: typography.body.fontFamily, fontSize: 14 },
  footerLink: { color: brandColors.primaryUI, fontFamily: typography.bodyMedium.fontFamily, fontSize: 14, marginLeft: spacing.xs },
});

export default LoginScreen; 