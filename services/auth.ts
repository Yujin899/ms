import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveUserProfile, fetchUserProfile, UserProfile } from "./db";

/**
 * Register a new user with a specified role.
 * Accounts are created as unverified (isVerified: false) by default.
 */
export async function registerUser(email: string, pass: string, name: string, role: "student" | "teacher") {
  if (!auth) throw new Error("Auth not initialized");
  
  const { user } = await createUserWithEmailAndPassword(auth, email, pass);
  
  const profile: UserProfile = {
    uid: user.uid,
    email: email,
    name: name,
    role: role,
    isVerified: false
  };

  await saveUserProfile(profile);
  return { user, profile };
}

/**
 * Sign in an existing user.
 */
export async function loginUser(email: string, pass: string) {
  if (!auth) throw new Error("Auth not initialized");
  const { user } = await signInWithEmailAndPassword(auth, email, pass);
  const profile = await fetchUserProfile(user.uid);
  return { user, profile };
}

/**
 * Sign out the current user.
 */
export async function logoutUser() {
  if (!auth) throw new Error("Auth not initialized");
  return await signOut(auth);
}

/**
 * Listener for auth state changes.
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}
