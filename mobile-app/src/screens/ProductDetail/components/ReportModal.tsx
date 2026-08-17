import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { brandColors, radii, semanticColors, spacing, typography } from '../../../theme'
import { REPORT_REASONS } from '../hooks/useReportProduct'

interface ReportModalProps {
  visible: boolean
  submitting: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
}

/** Extrait tel quel de l'ancien ProductDetailScreen — bottom sheet de signalement. */
export function ReportModal({ visible, submitting, onClose, onSubmit }: ReportModalProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customReason, setCustomReason] = useState('')

  const handleClose = () => {
    setShowCustomInput(false)
    setCustomReason('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.flexEnd}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
          <View style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.handle} />
              {showCustomInput ? (
                <>
                  <TouchableOpacity style={styles.backRow} onPress={() => setShowCustomInput(false)}>
                    <Ionicons name="arrow-back" size={18} color={brandColors.textSecondary} />
                    <Text style={styles.backText}>Volver</Text>
                  </TouchableOpacity>
                  <Text style={styles.title}>Otro motivo</Text>
                  <Text style={styles.subtitle}>Describe brevemente el problema con este anuncio.</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customReason}
                    onChangeText={setCustomReason}
                    placeholder="Escribe aquí el motivo..."
                    placeholderTextColor={brandColors.textMuted}
                    multiline
                    numberOfLines={4}
                    maxLength={300}
                    autoFocus
                  />
                  <Text style={styles.charCount}>{customReason.length}/300</Text>
                  <TouchableOpacity
                    style={[styles.submitButton, (!customReason.trim() || submitting) && styles.submitButtonDisabled]}
                    onPress={() => onSubmit(customReason.trim())}
                    disabled={!customReason.trim() || submitting}
                  >
                    <Text style={styles.submitText}>{submitting ? 'Enviando...' : 'Enviar reporte'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Reportar anuncio</Text>
                  <Text style={styles.subtitle}>¿Por qué quieres reportar este anuncio?</Text>
                  {REPORT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={styles.option}
                      onPress={() => (reason === 'Otro' ? setShowCustomInput(true) : onSubmit(reason))}
                      disabled={submitting}
                    >
                      <Text style={styles.optionText}>{reason}</Text>
                      <Ionicons
                        name={reason === 'Otro' ? 'create-outline' : 'chevron-forward'}
                        size={18}
                        color={brandColors.textMuted}
                      />
                    </TouchableOpacity>
                  ))}
                </>
              )}
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexEnd: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,24,39,0.5)' },
  sheet: {
    backgroundColor: brandColors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.section,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: brandColors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontFamily: typography.sectionTitle.fontFamily, fontSize: 18, color: brandColors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontFamily: typography.body.fontFamily, fontSize: 14, color: brandColors.textSecondary, marginBottom: spacing.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  optionText: { fontFamily: typography.body.fontFamily, fontSize: 15, color: brandColors.textPrimary },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: brandColors.surfaceSecondary,
    borderRadius: radii.medium,
  },
  cancelText: { fontFamily: typography.bodyMedium.fontFamily, fontSize: 15, color: brandColors.textSecondary },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  backText: { fontFamily: typography.body.fontFamily, fontSize: 14, color: brandColors.textSecondary },
  textInput: {
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: radii.medium,
    padding: spacing.md,
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: brandColors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: spacing.xs,
  },
  charCount: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: brandColors.textMuted, textAlign: 'right', marginBottom: spacing.lg },
  submitButton: { backgroundColor: semanticColors.error, borderRadius: radii.medium, paddingVertical: spacing.md, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { fontFamily: typography.button.fontFamily, fontSize: 15, color: brandColors.white },
})
