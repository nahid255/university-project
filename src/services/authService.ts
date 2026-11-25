import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../data/initialData';

const USERS_STORAGE_KEY = 'campusmate_users_v1';
const CURRENT_USER_KEY = 'campusmate_current_user_v1';

// Seed initial users into localStorage if empty
const getStoredUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
};

const saveStoredUsers = (users: UserProfile[]) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users in localStorage', e);
  }
};

export interface RegisterParams {
  fullName: string;
  email: string;
  studentId: string;
  department: string;
  batch: string;
  password: string;
}

export const registerUser = async (params: RegisterParams): Promise<UserProfile> => {
  const normalizedEmail = params.email.trim().toLowerCase();

  // Basic validation
  if (!params.fullName.trim()) throw new Error('Full Name is required.');
  if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('A valid university email is required.');
  if (!params.studentId.trim()) throw new Error('Student ID is required.');
  if (!params.department.trim()) throw new Error('Department is required.');
  if (!params.batch.trim()) throw new Error('Batch / Academic year is required.');
  if (params.password.length < 6) throw new Error('Password must be at least 6 characters.');

  // If real Firebase is configured
  if (isFirebaseConfigured() && auth && db) {
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, params.password);
    const uid = userCredential.user.uid;

    const profile: UserProfile = {
      uid,
      email: normalizedEmail,
      fullName: params.fullName.trim(),
      studentId: params.studentId.trim(),
      department: params.department.trim(),
      batch: params.batch.trim(),
      role: 'student', // ALWAYS student by default
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.fullName)}`,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', uid), profile);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
    return profile;
  }

  // Local storage mode
  const users = getStoredUsers();
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email address already exists.');
  }

  const newProfile: UserProfile = {
    uid: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    fullName: params.fullName.trim(),
    studentId: params.studentId.trim(),
    department: params.department.trim(),
    batch: params.batch.trim(),
    role: 'student', // Strictly enforce student role
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.fullName)}`,
    createdAt: new Date().toISOString(),
  };

  users.push(newProfile);
  saveStoredUsers(users);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProfile));
  return newProfile;
};

export const loginUser = async (email: string, password: string): Promise<UserProfile> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Please enter your email.');
  if (!password) throw new Error('Please enter your password.');

  // Real Firebase Auth
  if (isFirebaseConfigured() && auth && db) {
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) {
      throw new Error('User profile record not found in database.');
    }
    const profile = snap.data() as UserProfile;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
    return profile;
  }

  // Local storage authentication
  const users = getStoredUsers();
  const foundUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!foundUser) {
    throw new Error('Invalid email or password. Please check your credentials or register a new account.');
  }

  // Demo accounts accept password123 or any password for seamless preview testing
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));
  return foundUser;
};

export const logoutUser = async (): Promise<void> => {
  if (isFirebaseConfigured() && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
  }
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const resetPassword = async (email: string): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please enter a valid registered email address.');
  }

  if (isFirebaseConfigured() && auth) {
    await sendPasswordResetEmail(auth, normalizedEmail);
    return;
  }

  // Local storage mode simulation
  const users = getStoredUsers();
  const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
  if (!exists) {
    throw new Error('No user account found with this email.');
  }
};

export const getCurrentUserProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'email' | 'role'>>
): Promise<UserProfile> => {
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'users', uid), updates as Record<string, unknown>);
  }

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.uid === uid);
  if (index === -1) throw new Error('User not found.');

  const updatedProfile: UserProfile = {
    ...users[index],
    ...updates,
  };

  users[index] = updatedProfile;
  saveStoredUsers(users);

  // Update current user if matching
  const current = getCurrentUserProfile();
  if (current && current.uid === uid) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedProfile));
  }

  return updatedProfile;
};
