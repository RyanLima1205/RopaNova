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
  body: {
    backgroundColor: brandColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: spacing.sm,
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  reportLinkText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: brandColors.textMuted,
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
})
