import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { ClassRoutine, ExamSchedule, Assignment, DayOfWeek } from '../types';
import { INITIAL_ROUTINES, INITIAL_EXAMS, INITIAL_ASSIGNMENTS } from '../data/initialData';

const ROUTINES_STORAGE_KEY = 'campusmate_routines_v1';
const EXAMS_STORAGE_KEY = 'campusmate_exams_v1';
const ASSIGNMENTS_STORAGE_KEY = 'campusmate_assignments_v1';

// Routine helpers
export const getRoutines = async (): Promise<ClassRoutine[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'routines'));
      const list: ClassRoutine[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ClassRoutine));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Error fetching routines from Firebase:', e);
    }
  }

  const raw = localStorage.getItem(ROUTINES_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(INITIAL_ROUTINES));
    return INITIAL_ROUTINES;
  }
  return JSON.parse(raw);
};

export const saveRoutines = (routines: ClassRoutine[]) => {
  localStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
};

export const createRoutine = async (routine: Omit<ClassRoutine, 'id'>): Promise<ClassRoutine> => {
  const id = `rt-${Date.now()}`;
  const newRoutine: ClassRoutine = { ...routine, id };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'routines', id), newRoutine);
  }

  const current = await getRoutines();
  current.push(newRoutine);
  saveRoutines(current);
  return newRoutine;
};

export const updateRoutine = async (id: string, updates: Partial<ClassRoutine>): Promise<ClassRoutine> => {
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'routines', id), updates as Record<string, unknown>);
  }

  const current = await getRoutines();
  const idx = current.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Routine item not found');
  current[idx] = { ...current[idx], ...updates };
  saveRoutines(current);
  return current[idx];
};

export const deleteRoutine = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'routines', id));
  }

  const current = await getRoutines();
  const filtered = current.filter((r) => r.id !== id);
  saveRoutines(filtered);
};

// Exam helpers
export const getExams = async (): Promise<ExamSchedule[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'exams'));
      const list: ExamSchedule[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ExamSchedule));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Error fetching exams from Firebase:', e);
    }
  }

  const raw = localStorage.getItem(EXAMS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(INITIAL_EXAMS));
    return INITIAL_EXAMS;
  }
  return JSON.parse(raw);
};

export const saveExams = (exams: ExamSchedule[]) => {
  localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
};

export const createExam = async (exam: Omit<ExamSchedule, 'id'>): Promise<ExamSchedule> => {
  const id = `ex-${Date.now()}`;
  const newExam: ExamSchedule = { ...exam, id };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'exams', id), newExam);
  }

  const current = await getExams();
  current.push(newExam);
  saveExams(current);
  return newExam;
};

export const updateExam = async (id: string, updates: Partial<ExamSchedule>): Promise<ExamSchedule> => {
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'exams', id), updates as Record<string, unknown>);
  }

  const current = await getExams();
  const idx = current.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Exam not found');
  current[idx] = { ...current[idx], ...updates };
  saveExams(current);
  return current[idx];
};

export const deleteExam = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'exams', id));
  }

  const current = await getExams();
  const filtered = current.filter((e) => e.id !== id);
  saveExams(filtered);
};

// Assignment helpers with automatic overdue recalculation
export const calculateAssignmentStatus = (asg: Assignment): Assignment => {
  if (asg.status === 'completed') return asg;
  const deadlineDate = new Date(asg.deadline);
  const now = new Date();
  if (deadlineDate < now) {
    return { ...asg, status: 'overdue' };
  }
  return asg;
};

export const getAssignments = async (userId: string): Promise<Assignment[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'assignments'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: Assignment[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Assignment));
      if (list.length > 0) {
        return list.map(calculateAssignmentStatus);
      }
    } catch (e) {
      console.warn('Error fetching assignments from Firebase:', e);
    }
  }

  const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
  let allAssignments: Assignment[] = [];
  if (!raw) {
    allAssignments = INITIAL_ASSIGNMENTS;
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));
  } else {
    allAssignments = JSON.parse(raw);
  }

  // Filter only student's own assignments
  const userAssignments = allAssignments.filter((a) => a.userId === userId);
  return userAssignments.map(calculateAssignmentStatus);
};

export const saveAssignmentsToStorage = (assignments: Assignment[]) => {
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
};

export const createAssignment = async (
  assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Assignment> => {
  const id = `asg-${Date.now()}`;
  const nowIso = new Date().toISOString();
  let newAsg: Assignment = {
    ...assignment,
    id,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  newAsg = calculateAssignmentStatus(newAsg);

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'assignments', id), newAsg);
  }

  const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
  const all: Assignment[] = raw ? JSON.parse(raw) : INITIAL_ASSIGNMENTS;
  all.push(newAsg);
  saveAssignmentsToStorage(all);
  return newAsg;
};

export const updateAssignment = async (
  id: string,
  updates: Partial<Assignment>
): Promise<Assignment> => {
  const nowIso = new Date().toISOString();
  const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
  const all: Assignment[] = raw ? JSON.parse(raw) : INITIAL_ASSIGNMENTS;
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('Assignment not found');

  let updated = { ...all[idx], ...updates, updatedAt: nowIso };
  updated = calculateAssignmentStatus(updated);

  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'assignments', id), updated as Record<string, unknown>);
  }

  all[idx] = updated;
  saveAssignmentsToStorage(all);
  return updated;
};

export const deleteAssignment = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'assignments', id));
  }

  const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
  const all: Assignment[] = raw ? JSON.parse(raw) : INITIAL_ASSIGNMENTS;
  const filtered = all.filter((a) => a.id !== id);
  saveAssignmentsToStorage(filtered);
};
