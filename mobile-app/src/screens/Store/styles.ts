import { StyleSheet } from 'react-native'
import { brandColors, spacing, typography } from '../../theme'

/** Styles partagés de l'écran orchestrateur — pas de styles de composants ici. */
export const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: brandColors.background,
  },
  centeredText: {
    marginTop: spacing.md,
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: brandColors.textSecondary,
  },
  sectionBlock: {
    paddingVertical: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: 16,
    color: brandColors.textPrimary,
  },
  seeAllText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    color: brandColors.primaryUI,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: brandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  topBarLogo: {
    height: 28,
    width: 140,
  },
})
