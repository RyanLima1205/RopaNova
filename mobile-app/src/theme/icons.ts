import { brandColors, semanticColors } from './colors'

export const iconColors = {
  active: brandColors.primaryUI,
  inactive: brandColors.textSecondary,
  error: semanticColors.error,
  success: semanticColors.success,
} as const

export const iconSizes = {
  navigation: 24,
  action: 22,
} as const
