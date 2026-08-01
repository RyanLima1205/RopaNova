export { brandColors, semanticColors, accountTypeColors, colors } from './colors'
export { typography, fontFamilies } from './typography'
export { spacing, screenPadding } from './spacing'
export { radii } from './radii'
export { shadows } from './shadows'
export { iconColors, iconSizes } from './icons'

import { colors } from './colors'
import { typography } from './typography'
import { spacing, screenPadding } from './spacing'
import { radii } from './radii'
import { shadows } from './shadows'
import { iconColors, iconSizes } from './icons'

export const theme = {
  colors,
  typography,
  spacing,
  screenPadding,
  radii,
  shadows,
  iconColors,
  iconSizes,
} as const

export type Theme = typeof theme
