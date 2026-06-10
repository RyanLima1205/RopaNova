import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const accountTypes = [
  {
    id: 'particular',
    icon: '🧍',
    title: 'Usuario Particular',
    subtitle: 'Uso personal',
    description: 'Ideal para personas que desean comprar y vender ropa de forma casual.',
  },
  {
    id: 'virtual',
    icon: '🛍️',
    title: 'Tienda Virtual',
    subtitle: 'Negocio sin local físico',
    description: 'Crea tu boutique en línea, publica productos y gestiona tus ventas desde cualquier lugar.',
  },
  {
    id: 'fisica',
    icon: '🏪',
    title: 'Tienda Física',
    subtitle: 'Negocio con local comercial',
    description: 'Vende a través de RopaNova y destaca tu tienda física mostrando dirección, horarios y contacto.',
  },
];

const AccountTypeSelectionScreen: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
  const [selectedType, setSelectedType] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const canContinue = selectedType && acceptTerms;

  const handleContinue = () => {
    if (canContinue) {
      navigation.navigate('Register', { accountType: selectedType });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
          <Text style={styles.title}>¿Qué tipo de cuenta deseas crear?</Text>
          <Text style={styles.description}>Selecciona la opción que más se adapta a ti. Tu experiencia será personalizada según tu tipo de cuenta.</Text>
          <View style={styles.typeList}>
            {accountTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeCard, selectedType === type.id && styles.typeCardSelected]}
                onPress={() => setSelectedType(type.id)}
                activeOpacity={0.8}
              >
                {selectedType === type.id && (
                  <View style={styles.checkMark}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </View>
                )}
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={styles.typeTitle}>{type.title}</Text>
                <Text style={styles.typeSubtitle}>{type.subtitle}</Text>
                <Text style={styles.typeDesc}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.termsRow} onPress={() => setAcceptTerms(!acceptTerms)}>
            <Ionicons name={acceptTerms ? 'checkbox' : 'square-outline'} size={20} color={acceptTerms ? '#059669' : '#64748b'} />
            <Text style={styles.termsText}>Acepto los <Text style={styles.termsLink}>Términos de Servicio</Text> y la <Text style={styles.termsLink}>Política de Privacidad</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.continueBtnText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 16, marginTop: 48 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  logoBg: { backgroundColor: '#059669', padding: 8, borderRadius: 8 },
  brand: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginLeft: 8 },
  subtitle: { color: '#64748b', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 8 },
  description: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  typeList: { flexDirection: 'column', gap: 16, marginBottom: 16 },
  typeCard: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: 'transparent', position: 'relative' },
  typeCardSelected: { borderColor: '#059669', backgroundColor: '#e0f2fe' },
  checkMark: { position: 'absolute', top: 12, right: 12, backgroundColor: '#059669', borderRadius: 12, padding: 2 },
  typeIcon: { fontSize: 36, marginBottom: 8 },
  typeTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  typeSubtitle: { color: '#059669', fontWeight: '500', marginBottom: 6 },
  typeDesc: { color: '#64748b', fontSize: 13, textAlign: 'center', marginBottom: 2 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  termsText: { color: '#64748b', fontSize: 13, marginLeft: 8 },
  termsLink: { color: '#059669', textDecorationLine: 'underline' },
  continueBtn: { backgroundColor: '#059669', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  continueBtnDisabled: { backgroundColor: '#cbd5e1' },
  continueBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default AccountTypeSelectionScreen; 