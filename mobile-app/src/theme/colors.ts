export const brandColors = {
  // Brand — réservé au logo / marque
  primary: '#2F8AFC',

  // UI blues — boutons, icônes actives, liens, prix, focus
  primaryUI: '#1F7EF5',
  primaryDark: '#146CE0',
  primaryDeep: '#0145D8',

  // Light blues
  primaryLight: '#EAF4FF',
  primaryExtraLight: '#F5FAFF',

  black: '#000000',
  textPrimary: '#111827',
  textSecondary: '#667085',
  textMuted: '#98A2B3',

  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F3F3',

  border: '#E4E7EC',
  borderStrong: '#D0D5DD',
  white: '#FFFFFF',
} as const

export const semanticColors = {
  success: '#16A34A',
  successBackground: '#ECFDF3',

  error: '#DC2626',
  errorBackground: '#FEF2F2',

  warning: '#F59E0B',
  warningBackground: '#FFFBEB',

  info: '#146CE0',
  infoBackground: '#EAF4FF',
} as const

export const accountTypeColors = {
  virtualStore: '#7C3AED',
  virtualStoreBackground: '#F3E8FF',
} as const

export const colors = {
  ...brandColors,
  ...semanticColors,
  accountType: accountTypeColors,
} as const
