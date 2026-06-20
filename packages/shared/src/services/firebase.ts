import { initializeApp, FirebaseApp } from 'firebase/app'
import { getDatabase, Database } from 'firebase/database'
import { getAuth, initializeAuth, Auth } from 'firebase/auth'

export interface FirebaseConfig {
  apiKey: string
  authDomain?: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
  databaseURL: string
}

export interface InitOptions {
  // Optional persistence layer for Firebase Auth. Desktop/web environments use
  // browser localStorage by default (no action needed). React Native must pass in
  // getReactNativePersistence(AsyncStorage) — otherwise Auth defaults to memory and
  // every cold start creates a new anonymous user with a different UID, which
  // breaks the approval flow.
  authPersistence?: unknown
  // Required for signInWithPopup/Redirect when authPersistence is set: initializeAuth()
  // does NOT auto-wire the popup resolver that getAuth() provides, so popup sign-in throws
  // auth/argument-error without it. Desktop passes browserPopupRedirectResolver here.
  popupRedirectResolver?: unknown
}

let app: FirebaseApp | null = null
let database: Database | null = null
let auth: Auth | null = null

export function initFirebase(config: FirebaseConfig, options: InitOptions = {}) {
  if (app) return
  app = initializeApp(config)
  database = getDatabase(app)
  if (options.authPersistence) {
    // Use initializeAuth with the supplied persistence — this MUST run before any
    // getAuth(app) call elsewhere, which is why the auth instance is cached at this
    // module level rather than re-resolved per caller.
    auth = initializeAuth(app, {
      persistence: options.authPersistence as never,
      ...(options.popupRedirectResolver
        ? { popupRedirectResolver: options.popupRedirectResolver as never }
        : {}),
    })
  } else {
    auth = getAuth(app)
  }
  console.log('[Firebase] Initialized for project:', config.projectId, options.authPersistence ? '(with custom persistence)' : '')
}

export function getDb(): Database {
  if (!database) throw new Error('Firebase not initialized. Call initFirebase() first.')
  return database
}

export function getFirebaseAuth(): Auth {
  if (!auth) throw new Error('Firebase not initialized. Call initFirebase() first.')
  return auth
}
