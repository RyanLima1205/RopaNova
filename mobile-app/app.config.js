/**
 * Config Expo dynamique (G0-4) : sur les builds EAS, refuse un build sans variables
 * Firebase injectées via secrets projet — jamais de clés dans le dépôt ni dans eas.json.
 * La base statique reste dans app.json.
 */
const FIREBASE_EXPO_KEYS = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
];

module.exports = ({ config }) => {
  if (process.env.EAS_BUILD === "true") {
    const missing = FIREBASE_EXPO_KEYS.filter((k) => !String(process.env[k] ?? "").trim());
    if (missing.length > 0) {
      throw new Error(
        `[G0-4] Build EAS sans variables Firebase. Définis les secrets de projet Expo (mêmes noms que .env.example). ` +
          `Manquantes : ${missing.join(", ")}. ` +
          `https://docs.expo.dev/build-reference/variables/`
      );
    }
  }
  return config;
};
