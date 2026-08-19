import { brandColors } from '../../../theme'
import { StorefrontTheme, StorePlan } from '../../../types/store'

/**
 * REFONTE_STOREFRONT.md, Phase 3 (simplifiée) : aucune personnalisation visuelle en V1,
 * toutes les boutiques ont le thème minimal. `theme` et `plan` sont acceptés pour ne pas
 * casser la signature attendue par la V2 (presets/accents pilotés depuis un dashboard
 * web), mais ne sont pas encore utilisés.
 */
export function resolveStoreTheme(theme: StorefrontTheme, plan: StorePlan) {
  return {
    accent: brandColors.primaryUI,
    onAccent: '#FFFFFF',
    surface: brandColors.surface,
    textPrimary: brandColors.textPrimary,
    textSecondary: brandColors.textSecondary,
    fontFamily: 'Montserrat_600SemiBold',
    radius: 8,
    cardStyle: 'flat' as const,
  }
}
