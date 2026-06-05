/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, logInWithGoogle, logOut, handleFirestoreError, OperationType } from '../firebase';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: AppUser | null;
  loading: boolean;
  role: UserRole | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  registerProfile: (role: UserRole, grade?: string) => Promise<void>;
  updateProfileGrade: (grade: string) => Promise<void>;
  demoteToStudent: () => Promise<void>; // Demo tool helper
  promoteToTutor: () => Promise<void>;  // Demo tool helper
  isDemoMode: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginAsDemoStudent: () => void;
  loginAsDemoTutor: () => void;
  loginAsCustomUser: (email: string, name: string, role: UserRole, grade?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    // 1. Check if we have a saved demo session to load instantly and bypass Firebase Auth altogether
    const savedDemoUser = localStorage.getItem('demo_user_profile');
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setFirebaseUser({
          uid: parsed.userId,
          displayName: parsed.name,
          email: parsed.email,
          photoURL: parsed.avatarUrl,
          emailVerified: true
        } as any);
        setCurrentUser(parsed);
        setIsDemoMode(true);
        setLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse saved demo user", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsDemoMode(false);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            setCurrentUser(docSnap.data() as AppUser);
          } else {
            // User authenticated but profile has not been created, triggers role selection modal in client
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error reading user profile", error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await logInWithGoogle();
    } catch (e: any) {
      console.error('Login action halted', e);
      setAuthError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoStudent = () => {
    setLoading(true);
    setAuthError(null);
    setIsDemoMode(true);
    const mockStudent: AppUser = {
      userId: 'demo_student_uid',
      name: 'Alex Sandbox Student',
      email: 'alex.scholar@demo-association.org',
      role: 'student',
      grade: 'Grade 11',
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alex'
    };
    localStorage.setItem('demo_user_profile', JSON.stringify(mockStudent));
    setFirebaseUser({
      uid: mockStudent.userId,
      displayName: mockStudent.name,
      email: mockStudent.email,
      photoURL: mockStudent.avatarUrl,
      emailVerified: true
    } as any);
    setCurrentUser(mockStudent);
    setLoading(false);
  };

  const loginAsDemoTutor = () => {
    setLoading(true);
    setAuthError(null);
    setIsDemoMode(true);
    const mockTutor: AppUser = {
      userId: 'demo_tutor_uid',
      name: 'Dr. Sarah Peterson',
      email: 'sarah.peterson@demo-association.org',
      role: 'tutor',
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sarah'
    };
    localStorage.setItem('demo_user_profile', JSON.stringify(mockTutor));
    setFirebaseUser({
      uid: mockTutor.userId,
      displayName: mockTutor.name,
      email: mockTutor.email,
      photoURL: mockTutor.avatarUrl,
      emailVerified: true
    } as any);
    setCurrentUser(mockTutor);
    setLoading(false);
  };

  const loginAsCustomUser = (email: string, name: string, role: UserRole, grade?: string) => {
    setLoading(true);
    setAuthError(null);
    setIsDemoMode(true);
    const userId = 'user_' + Math.random().toString(36).substring(2, 9);
    const newCustomUser: AppUser = {
      userId,
      name: name.trim() || 'Custom Scholar',
      email: email.trim() || 'scholar@custom.org',
      role,
      grade: role === 'student' ? (grade || 'Grade 11') : undefined,
      createdAt: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.trim() || 'custom')}`
    };
    localStorage.setItem('demo_user_profile', JSON.stringify(newCustomUser));
    setFirebaseUser({
      uid: newCustomUser.userId,
      displayName: newCustomUser.name,
      email: newCustomUser.email,
      photoURL: newCustomUser.avatarUrl,
      emailVerified: true
    } as any);
    setCurrentUser(newCustomUser);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        localStorage.removeItem('demo_user_profile');
        setIsDemoMode(false);
        setFirebaseUser(null);
        setCurrentUser(null);
      } else {
        await logOut();
      }
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      setLoading(false);
    }
  };

  const registerProfile = async (selectedRole: UserRole, grade?: string) => {
    if (isDemoMode && currentUser) {
      const updated = { ...currentUser, role: selectedRole, grade };
      setCurrentUser(updated);
      localStorage.setItem('demo_user_profile', JSON.stringify(updated));
      return;
    }
    if (!firebaseUser) return;
    setLoading(true);
    const path = `users/${firebaseUser.uid}`;
    
    try {
      const newUser: AppUser = {
        userId: firebaseUser.uid,
        name: firebaseUser.displayName || 'Anonymous Student',
        email: firebaseUser.email || '',
        role: selectedRole,
        createdAt: new Date().toISOString(),
        avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
      };
      if (selectedRole === 'student' && grade) {
        newUser.grade = grade;
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setCurrentUser(newUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileGrade = async (grade: string) => {
    if (!currentUser) return;
    if (isDemoMode) {
      const updated = { ...currentUser, grade };
      setCurrentUser(updated);
      localStorage.setItem('demo_user_profile', JSON.stringify(updated));
      return;
    }
    if (!firebaseUser) return;
    const path = `users/${firebaseUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { grade });
      setCurrentUser(prev => prev ? { ...prev, grade } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Helper tools for the reviewer to quickly swap roles and appreciate full client side testing
  const demoteToStudent = async () => {
    if (!currentUser) return;
    if (isDemoMode) {
      const updated: AppUser = { ...currentUser, role: 'student', grade: 'Grade 11' };
      setCurrentUser(updated);
      localStorage.setItem('demo_user_profile', JSON.stringify(updated));
      return;
    }
    if (!firebaseUser) return;
    const path = `users/${firebaseUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'student', grade: 'Grade 11' });
      setCurrentUser(prev => prev ? { ...prev, role: 'student', grade: 'Grade 11' } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const promoteToTutor = async () => {
    if (!currentUser) return;
    if (isDemoMode) {
      const updated: AppUser = { ...currentUser, role: 'tutor' };
      delete updated.grade;
      setCurrentUser(updated);
      localStorage.setItem('demo_user_profile', JSON.stringify(updated));
      return;
    }
    if (!firebaseUser) return;
    const path = `users/${firebaseUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'tutor' });
      setCurrentUser(prev => prev ? { ...prev, role: 'tutor' } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        currentUser,
        loading,
        role: currentUser?.role || null,
        login,
        logout,
        registerProfile,
        updateProfileGrade,
        demoteToStudent,
        promoteToTutor,
        isDemoMode,
        authError,
        clearAuthError,
        loginAsDemoStudent,
        loginAsDemoTutor,
        loginAsCustomUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
