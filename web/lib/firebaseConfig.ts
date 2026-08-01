import { logger } from "./logger"
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const FIREBASE_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const

const FIREBASE_ENV_VALUES: Record<(typeof FIREBASE_ENV_KEYS)[number], string | undefined> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function readPublicEnv(name: (typeof FIREBASE_ENV_KEYS)[number]): string | undefined {
  const v = FIREBASE_ENV_VALUES[name]
  if (v == null || String(v).trim() === "") return undefined
  return String(v).trim()
}

/** Mêmes valeurs que mobile-app (EXPO_PUBLIC_FIREBASE_*), même projet Firebase — voir web/.env.example. */
const DEV_FIREBASE_PLACEHOLDER: FirebaseOptions = {
  apiKey: "dev-placeholder",
  authDomain: "dev-placeholder.local",
  projectId: "dev-placeholder",
  storageBucket: "dev-placeholder.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
}

function resolveFirebaseConfig(): FirebaseOptions {
  const allPresent = FIREBASE_ENV_KEYS.every((k) => readPublicEnv(k) != null)
  if (allPresent) {
    return {
      apiKey: readPublicEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
      authDomain: readPublicEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
      projectId: readPublicEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      storageBucket: readPublicEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: readPublicEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
      appId: readPublicEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
    }
  }

  if (process.env.NODE_ENV !== "production") {
    logger.warn(
      "[Firebase] NEXT_PUBLIC_FIREBASE_* variables ausentes — modo placeholder (local únicamente). " +
        "Copia web/.env.example a web/.env.local y completa los valores (mismos que mobile-app/.env).",
    )
    return DEV_FIREBASE_PLACEHOLDER
  }

  const missing = FIREBASE_ENV_KEYS.filter((k) => readPublicEnv(k) == null).join(", ")
  throw new Error(`[Firebase] Variables faltantes: ${missing}.`)
}

const firebaseConfig = resolveFirebaseConfig()

export const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
