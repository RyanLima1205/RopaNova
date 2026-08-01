// Noms de police réels enregistrés par @expo-google-fonts/* via expo-font.
// Chargés dans App.tsx (useFonts). Ne pas utiliser d'autres chaînes ici.
export const fontFamilies = {
  bebasNeue: 'BebasNeue_400Regular',
  montserratRegular: 'Montserrat_400Regular',
  montserratMedium: 'Montserrat_500Medium',
  montserratSemiBold: 'Montserrat_600SemiBold',
  montserratBold: 'Montserrat_700Bold',
} as const

export const typography = {
  display: {
    fontFamily: fontFamilies.bebasNeue,
    fontSize: 36,
    lineHeight: 40,
  },

  screenTitle: {
    fontFamily: fontFamilies.montserratBold,
    fontSize: 24,
    lineHeight: 30,
  },

  sectionTitle: {
    fontFamily: fontFamilies.montserratBold,
    fontSize: 20,
    lineHeight: 26,
  },

  cardTitle: {
    fontFamily: fontFamilies.montserratSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },

  body: {
    fontFamily: fontFamilies.montserratRegular,
    fontSize: 14,
    lineHeight: 20,
  },

  bodyMedium: {
    fontFamily: fontFamilies.montserratMedium,
    fontSize: 14,
    lineHeight: 20,
  },

  caption: {
    fontFamily: fontFamilies.montserratRegular,
    fontSize: 12,
    lineHeight: 16,
  },

  button: {
    fontFamily: fontFamilies.montserratSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
} as const
