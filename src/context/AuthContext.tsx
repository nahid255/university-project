import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../services/firebase';
import { UserProfile } from '../types';
import {
  getCurrentUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  RegisterParams,
} from '../services/authService';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isFirebase: boolean;
  login: (email: string, pass: string, expectedPortal?: 'student' | 'admin') => Promise<UserProfile>;
  register: (params: RegisterParams) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => void;
  setDemoUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebase] = useState<boolean>(isFirebaseConfigured());

  const refreshProfile = useCallback(() => {
    const profile = getCurrentUserProfile();
    setCurrentUser(profile);
  }, []);

  useEffect(() => {
    const firestore = db;
    if (isFirebase && auth && firestore) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const snap = await getDoc(doc(firestore, 'users', firebaseUser.uid));
            if (snap.exists()) {
              const profile = snap.data() as UserProfile;
              setCurrentUser(profile);
              localStorage.setItem('campusmate_current_user_v1', JSON.stringify(profile));
            } else {
              // User exists in auth but no firestore doc yet
              const fallback: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                fullName: firebaseUser.displayName || 'University Student',
                studentId: 'ST-NEW',
                department: 'Computer Science & Engineering',
                batch: 'Batch 2024',
                role: 'student',
                createdAt: new Date().toISOString(),
              };
              setCurrentUser(fallback);
            }
          } catch (e) {
            console.error('Error fetching user profile doc', e);
            setCurrentUser(getCurrentUserProfile());
          }
        } else {
          setCurrentUser(null);
          localStorage.removeItem('campusmate_current_user_v1');
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Local persistence mode
      const saved = getCurrentUserProfile();
      setCurrentUser(saved);
      setLoading(false);
    }
  }, [isFirebase]);

  const login = async (
    email: string,
    pass: string,
    expectedPortal?: 'student' | 'admin'
  ) => {
    setLoading(true);
    try {
      const user = await loginUser(email, pass, expectedPortal);
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (params: RegisterParams) => {
    setLoading(true);
    try {
      const user = await registerUser(params);
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (user: UserProfile) => {
    if (isFirebase) {
      throw new Error('Demo account switching is disabled when live Firebase Auth is active.');
    }
    localStorage.setItem('campusmate_current_user_v1', JSON.stringify(user));
    setCurrentUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebase,
        login,
        register,
        logout,
        refreshProfile,
        setDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
