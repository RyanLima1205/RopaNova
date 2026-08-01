// firebase/auth web types don't expose initializeAuth / getReactNativePersistence,
// but the React Native build (resolved by Metro at runtime) does.
// export {} makes this a module so declare module below is an augmentation (additive),
// not an ambient replacement that would wipe all existing firebase/auth exports.
export {}

declare module 'firebase/auth' {
  import { FirebaseApp } from 'firebase/app'
  export function initializeAuth(app: FirebaseApp, deps?: { persistence?: Persistence | Persistence[] }): Auth
  export function getReactNativePersistence(storage: object): Persistence
}
