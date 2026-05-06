import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase'

export function onAuthChanged(callback: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(getFirebaseAuth(), callback)
}

// ─── Email/Password ───

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<FirebaseUser> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  await updateProfile(credential.user, { displayName })
  return credential.user
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
  return credential.user
}

// ─── Google Sign-In ───

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(getFirebaseAuth(), googleProvider)
  return result.user
}

// ─── Common ───

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth())
}

export function getCurrentFirebaseUser(): FirebaseUser | null {
  return getFirebaseAuth().currentUser
}
