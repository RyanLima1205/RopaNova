import { logger } from './utils/logger'
import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

const FIREBASE_ENV_KEYS = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
] as const;

// Accès statique requis par la règle expo/no-dynamic-env-var (process.env[var] dynamique
// n'est pas inliné par le bundler).
const FIREBASE_ENV_VALUES: Record<(typeof FIREBASE_ENV_KEYS)[number], string | undefined> = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function readPublicEnv(name: (typeof FIREBASE_ENV_KEYS)[number]): string | undefined {
  const v = FIREBASE_ENV_VALUES[name];
  if (v == null || String(v).trim() === "") return undefined;
  return String(v).trim();
}

function requirePublicEnv(name: (typeof FIREBASE_ENV_KEYS)[number]): string {
  const v = readPublicEnv(name);
  if (v == null) {
    throw new Error(
      `[Firebase] Variable manquante : ${String(name)}. ` +
        "Copie .env.example vers .env dans mobile-app/ et renseigne les EXPO_PUBLIC_FIREBASE_* " +
        "(ou configure les secrets EAS pour les builds cloud)."
    );
  }
  return v;
}

/** En __DEV__ uniquement : permet de lancer l’UI sans .env (Auth / Firestore ne fonctionneront pas). */
const DEV_FIREBASE_PLACEHOLDER: FirebaseOptions = {
  apiKey: "dev-placeholder",
  authDomain: "dev-placeholder.local",
  projectId: "dev-placeholder",
  storageBucket: "dev-placeholder.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
};

function resolveFirebaseConfig(): FirebaseOptions {
  const allPresent = FIREBASE_ENV_KEYS.every((k) => readPublicEnv(k) != null);
  if (allPresent) {
    return {
      apiKey: requirePublicEnv("EXPO_PUBLIC_FIREBASE_API_KEY"),
      authDomain: requirePublicEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
      projectId: requirePublicEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
      storageBucket: requirePublicEnv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: requirePublicEnv("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
      appId: requirePublicEnv("EXPO_PUBLIC_FIREBASE_APP_ID"),
    };
  }

  if (__DEV__) {
    logger.warn(
      "[Firebase] EXPO_PUBLIC_FIREBASE_* manquantes — mode placeholder (local uniquement). " +
        "Renseigne mobile-app/.env pour un projet Firebase réel."
    );
    return DEV_FIREBASE_PLACEHOLDER;
  }

  const missing = FIREBASE_ENV_KEYS.filter((k) => readPublicEnv(k) == null).join(", ");
  throw new Error(
    `[Firebase] Variables manquantes : ${missing}. ` +
      "Renseigne les EXPO_PUBLIC_FIREBASE_* (EAS Secrets pour les builds cloud)."
  );
}

const firebaseConfig = resolveFirebaseConfig();

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
