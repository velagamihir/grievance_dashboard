import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app'
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'placeholder-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'placeholder-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:placeholder',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Clear credentials when the tab/browser session closes
setPersistence(auth, browserSessionPersistence).catch(() => {})

/**
 * Creates a new user in Firebase Auth using a separate secondary app instance.
 * This guarantees the active administrator's session is not disconnected.
 */
export async function createFirebaseUser(
  email: string,
  pass: string,
  displayName?: string
): Promise<{ uid: string; email: string; displayName?: string }> {
  const secondaryAppName = `SecondaryAuthApp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass)
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName })
    }
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email || email,
      displayName: displayName || userCredential.user.displayName || undefined,
    }
  } finally {
    try {
      await deleteApp(secondaryApp)
    } catch {
      // ignore deletion cleanup failures
    }
  }
}
