import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, collection, query, where, getDocs, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
    let intervalId: any;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user from Python backend
        const fetchUser = async () => {
          try {
            const res = await fetch(`http://localhost:8000/users/${firebaseUser.uid}`);
            if (res.ok) {
              const data = await res.json();
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: data.name || firebaseUser.displayName || 'User',
                role: data.role as UserRole,
              });
            } else {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'User',
                role: null,
              });
            }
            setLoading(false);
          } catch (err) {
            console.error("Backend fetch error:", err);
            setLoading(false);
          }
        };

        await fetchUser();
        intervalId = setInterval(fetchUser, 5000); // poll for role changes
      } else {
        setUser(null);
        setLoading(false);
        if (intervalId) clearInterval(intervalId);
      }
    });

    return () => {
      unsubscribeAuth();
      if (intervalId) clearInterval(intervalId);
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
export const setUserRole = async (uid: string, email: string, name: string, role: 'admin' | 'student' | 'instructor') => {
  try {
    const res = await fetch(`http://localhost:8000/users/${uid}`);
    if (res.ok) {
      await fetch(`http://localhost:8000/users/${uid}/role?role=${role}`, { method: 'PUT' });
    } else {
      await fetch('http://localhost:8000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uid, email, name, role }),
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

export const subscribeToUsers = (callback: (users: any[]) => void) => {
  let isSubscribed = true;
  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/users');
      if (res.ok && isSubscribed) {
        const users = await res.json();
        callback(users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  fetchUsers();
  const intervalId = setInterval(fetchUsers, 5000);
  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
  };
};

// Exam Helpers
export const subscribeToExams = (callback: (exams: any[]) => void) => {
  let isSubscribed = true;
  const fetchExams = async () => {
    try {
      const res = await fetch('http://localhost:8000/exams');
      if (res.ok && isSubscribed) {
        const exams = await res.json();
        callback(exams);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };
  fetchExams();
  const intervalId = setInterval(fetchExams, 3000);
  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
  };
};

export const createExam = async (name: string, date: string, time: string, createdBy: string, questions: any[] = []) => {
  const id = "exam_" + Date.now();
  await fetch('http://localhost:8000/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id, name, date, time, instructor_id: createdBy, questions
    }),
  });
};

export const deleteExam = async (examId: string) => {
  await fetch(`http://localhost:8000/exams/${examId}`, { method: 'DELETE' });
};

export const getExamById = async (examId: string): Promise<any | null> => {
  try {
    const res = await fetch(`http://localhost:8000/exams/${examId}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
};

// Submission & Report Helpers
export const submitExam = async (examId: string, studentId: string, studentName: string, studentEmail: string, answers: any, incidents: any[], trustScore: number) => {
  try {
    const payload = {
      id: "sub_" + Date.now(),
      exam_id: examId || 'unknown_exam',
      student_id: studentId || '',
      student_name: studentName || 'Student',
      student_email: studentEmail || '',
      answers: answers || {},
      incidents: incidents || [],
      trust_score: typeof trustScore === 'number' ? trustScore : 100,
      submitted_at: new Date().toISOString(),
    };
    
    await fetch('http://localhost:8000/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return payload.id;
  } catch (err: any) {
    console.error("Failed to submit exam:", err);
    throw err;
  }
};

export const subscribeToSubmissions = (callback: (submissions: any[]) => void) => {
  let isSubscribed = true;
  const fetchSubs = async () => {
    try {
      const res = await fetch('http://localhost:8000/submissions');
      if (res.ok && isSubscribed) {
        const subs = await res.json();
        subs.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
        callback(subs);
      }
    } catch (error) {
      console.error('subscribeToSubmissions error:', error);
    }
  };
  fetchSubs();
  const intervalId = setInterval(fetchSubs, 3000);
  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
  };
};

export const subscribeToStudentSubmissions = (studentId: string, callback: (submissions: any[]) => void) => {
  let isSubscribed = true;
  const fetchSubs = async () => {
    try {
      const res = await fetch('http://localhost:8000/submissions');
      if (res.ok && isSubscribed) {
        const subs = await res.json();
        const filtered = subs.filter((s: any) => s.student_id === studentId);
        filtered.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
        callback(filtered);
      }
    } catch (error) {
      console.error('subscribeToStudentSubmissions error:', error);
    }
  };
  fetchSubs();
  const intervalId = setInterval(fetchSubs, 3000);
  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
  };
};

export const getSubmissionDetails = async (submissionId: string) => {
  try {
    const res = await fetch(`http://localhost:8000/submissions/${submissionId}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
};

// Settings Helpers
export const subscribeToSettings = (callback: (settings: any) => void) => {
  let isSubscribed = true;
  const fetchSet = async () => {
    try {
      const res = await fetch('http://localhost:8000/settings');
      if (res.ok && isSubscribed) {
        const settings = await res.json();
        callback(settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };
  fetchSet();
  const intervalId = setInterval(fetchSet, 5000);
  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
  };
};

export const updateSettings = async (settings: any, userId: string) => {
  await fetch(`http://localhost:8000/settings?user_id=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
};
