import { initializeApp, FirebaseApp } from 'firebase/app'
import { getDatabase, Database } from 'firebase/database'
import { getAuth, Auth } from 'firebase/auth'

export interface FirebaseConfig {
  apiKey: string
  authDomain?: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
  databaseURL: string
}

let app: FirebaseApp | null = null
let database: Database | null = null
let auth: Auth | null = null

export function initFirebase(config: FirebaseConfig) {
  if (app) return
  app = initializeApp(config)
  database = getDatabase(app)
  auth = getAuth(app)
  console.log('[Firebase] Initialized for project:', config.projectId)
}

export function getDb(): Database {
  if (!database) throw new Error('Firebase not initialized. Call initFirebase() first.')
  return database
}

export function getFirebaseAuth(): Auth {
  if (!auth) throw new Error('Firebase not initialized. Call initFirebase() first.')
  return auth
}
