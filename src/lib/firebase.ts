import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, collection, query, getDocs, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { useState, useEffect } from 'react';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export type UserRole = 'admin' | 'student' | null;

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

// Hook to listen to auth state and fetch user role
export function useAppAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user document from Firestore in real-time
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: data.name || firebaseUser.displayName || 'User',
              role: data.role as UserRole,
            });
          } else {
            // User exists in Auth but not in Firestore (needs role assignment)
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              role: null, // Indicates they haven't picked a role yet
            });
          }
          setLoading(false);
        }, (err) => {
          console.error("Firestore listener error:", err);
          setLoading(false);
        });

      } else {
        setUser(null);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return { user, loading };
}

// Login Helper
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Set Role Helper (Called after new account creation)
export const setUserRole = async (uid: string, email: string, name: string, role: 'admin' | 'student') => {
  const userDocRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      await updateDoc(userDocRef, { role });
    } else {
      await setDoc(userDocRef, {
        email,
        name,
        role,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

// Exam Helpers
export const subscribeToExams = (callback: (exams: any[]) => void) => {
  const q = query(collection(db, 'exams'));
  return onSnapshot(q, (snapshot) => {
    const exams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(exams);
  }, (error) => {
    console.error("Error fetching exams:", error);
  });
};

export const createExam = async (name: string, date: string, time: string, createdBy: string) => {
  await addDoc(collection(db, 'exams'), {
    name,
    date,
    time,
    createdBy,
    createdAt: serverTimestamp()
  });
};

export const deleteExam = async (examId: string) => {
  await deleteDoc(doc(db, 'exams', examId));
};

// Settings Helpers
export const subscribeToSettings = (callback: (settings: any) => void) => {
  const docRef = doc(db, 'settings', 'admin');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error fetching settings:", error);
  });
};

export const updateSettings = async (settings: any) => {
  const docRef = doc(db, 'settings', 'admin');
  const snap = await getDoc(docRef);
  
  const payload = { ...settings, updatedAt: serverTimestamp() };
  if (snap.exists()) {
    await updateDoc(docRef, payload);
  } else {
    await setDoc(docRef, payload);
  }
};
