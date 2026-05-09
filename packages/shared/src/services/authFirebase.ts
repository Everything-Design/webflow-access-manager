import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase'

export function onAuthChanged(callback: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(getFirebaseAuth(), callback)
}

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(getFirebaseAuth(), googleProvider)
  return result.user
}

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth())
}

export function getCurrentFirebaseUser(): FirebaseUser | null {
  return getFirebaseAuth().currentUser
}
