import {
  signInWithPopup,
  signInWithCredential,
  signInAnonymously,
  updateProfile,
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

// Desktop / web: opens a popup window for the OAuth dance.
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(getFirebaseAuth(), googleProvider)
  return result.user
}

// Native (React Native): the caller obtains a Google id_token through expo-auth-session
// and hands it here. Firebase exchanges it for an Auth session — no popup involved.
export async function signInWithGoogleIdToken(idToken: string): Promise<FirebaseUser> {
  const credential = GoogleAuthProvider.credential(idToken)
  const result = await signInWithCredential(getFirebaseAuth(), credential)
  return result.user
}

// Temporary manual sign-in for environments where Google OAuth is unavailable
// (Expo Go in particular — Google's policy blocks the embedded webview flow). Creates
// an anonymous Firebase Auth session and stamps the chosen display name onto it.
// The caller is responsible for surfacing the email separately in /team/{uid} since
// anonymous accounts can't hold an email on the Firebase Auth side.
export async function signInAnonymouslyWithDisplayName(name: string): Promise<FirebaseUser> {
  const result = await signInAnonymously(getFirebaseAuth())
  if (name) {
    await updateProfile(result.user, { displayName: name })
  }
  return result.user
}

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth())
}

export function getCurrentFirebaseUser(): FirebaseUser | null {
  return getFirebaseAuth().currentUser
}
